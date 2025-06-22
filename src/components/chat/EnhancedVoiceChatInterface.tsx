import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { conversationService, MessageData } from "../../services/conversationService";
import { n8nService } from "../../services/n8nService";
import { voiceService } from "../../services/voiceService";

interface EnhancedVoiceChatInterfaceProps {
  agentId: string;
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
}

export const EnhancedVoiceChatInterface: React.FC<EnhancedVoiceChatInterfaceProps> = ({
  agentId,
  conversationId,
  onNewConversation,
}) => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const {
    isListening,
    transcript,
    confidence,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  // Load existing messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages();
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle speech recognition results
  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!currentConversationId) return;

    const subscription = conversationService.subscribeToMessages(
      currentConversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        
        // Auto-play voice responses
        if (newMessage.role === 'assistant' && newMessage.voice_url) {
          playVoiceMessage(newMessage.id, newMessage.voice_url);
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [currentConversationId]);

  const loadMessages = async () => {
    if (!currentConversationId) return;
    
    try {
      const messages = await conversationService.getMessages(currentConversationId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load conversation history');
    }
  };

  const createNewConversation = async (firstMessage: string) => {
    try {
      const conversation = await conversationService.createConversation(
        agentId,
        firstMessage.substring(0, 50) + '...'
      );
      setCurrentConversationId(conversation.id);
      onNewConversation?.(conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create conversation if it doesn't exist
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewConversation(text);
      }

      // Add user message to database
      await conversationService.addMessage(convId, 'user', text);

      // Clear input
      setInputValue("");

      // Send to n8n for processing
      const response = await n8nService.sendChatMessage({
        agent_id: agentId,
        message: text,
        conversation_id: convId,
        user_context: {
          input_method: 'text',
          timestamp: new Date().toISOString()
        }
      });

      // Generate voice response
      let voiceUrl: string | undefined;
      try {
        const audioUrl = await voiceService.textToSpeech(response.response);
        // Convert blob URL to stored URL
        const audioBlob = await fetch(audioUrl).then(r => r.blob());
        voiceUrl = await voiceService.uploadVoiceResponse(audioBlob, convId);
      } catch (voiceError) {
        console.error('Voice generation failed:', voiceError);
      }

      // Add assistant response to database
      await conversationService.addMessage(
        convId,
        'assistant',
        response.response,
        voiceUrl,
        response.metadata
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        setError('Speech recognition is not supported in your browser');
        return;
      }
      startListening();
    }
  }, [isListening, stopListening, startListening, isSupported]);

  const playVoiceMessage = async (messageId: string, url: string) => {
    try {
      // Stop any currently playing audio
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setIsPlaying(null);

      // Create or get audio element
      if (!audioRefs.current[messageId]) {
        audioRefs.current[messageId] = new Audio(url);
        audioRefs.current[messageId].onended = () => setIsPlaying(null);
        audioRefs.current[messageId].onerror = () => {
          console.error('Audio playback failed');
          setIsPlaying(null);
        };
      }

      // Play audio
      await audioRefs.current[messageId].play();
      setIsPlaying(messageId);
    } catch (error) {
      console.error('Error playing voice message:', error);
      setIsPlaying(null);
    }
  };

  const toggleVoicePlayback = (messageId: string, url: string) => {
    if (isPlaying === messageId) {
      audioRefs.current[messageId]?.pause();
      setIsPlaying(null);
    } else {
      playVoiceMessage(messageId, url);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl">
      {/* Error Display */}
      <AnimatePresence>
        {(error || speechError) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 m-4 rounded-lg"
          >
            {error || speechError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Recognition Indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 m-4 rounded-lg flex items-center space-x-2"
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Listening... {transcript && `"${transcript}"`}</span>
          {confidence > 0 && (
            <span className="text-xs opacity-70">({Math.round(confidence * 100)}%)</span>
          )}
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm flex-1">{message.content}</p>
                  {message.voice_url && (
                    <button
                      onClick={() => toggleVoicePlayback(message.id, message.voice_url!)}
                      className="ml-2 p-1 rounded-full hover:bg-gray-600 transition-colors"
                    >
                      {isPlaying === message.id ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-70">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                  {message.metadata?.fallback && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 rounded">
                      Fallback
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleVoiceInput}
            disabled={!isSupported}
            className={`p-3 rounded-full transition-colors ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : isSupported
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
            title={!isSupported ? "Speech recognition not supported" : ""}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or use voice..."
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};