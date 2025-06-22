import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { agentsApi, voiceApi } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  voice_url?: string;
}

interface ChatInterfaceProps {
  agentId: string;
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agentId,
  conversationId,
  onNewConversation
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socket = useSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await agentsApi.chat(agentId, {
        message: inputValue,
        conversation_id: currentConversationId
      });

      if (!currentConversationId && response.data.conversation_id) {
        setCurrentConversationId(response.data.conversation_id);
        onNewConversation?.(response.data.conversation_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate voice response if enabled
      if (response.data.response) {
        await generateVoiceResponse(response.data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoiceResponse = async (text: string) => {
    try {
      const response = await voiceApi.textToSpeech({ text });
      const audioBlob = new Blob([
        Uint8Array.from(atob(response.data.audio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error('Error generating voice response:', error);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
    } else {
      // Start listening
      setIsListening(true);
      // Implement speech recognition here
    }
  };

  const toggleSpeaking = () => {
    if (audioRef.current) {
      if (isSpeaking) {
        audioRef.current.pause();
        setIsSpeaking(false);
      } else {
        audioRef.current.play();
        setIsSpeaking(true);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
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
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full transition-colors ${
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={toggleSpeaking}
            className={`p-3 rounded-full transition-colors ${
              isSpeaking
                ? 'bg-primary-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Hidden audio element for voice responses */}
      <audio
        ref={audioRef}
        onEnded={() => setIsSpeaking(false)}
        onPlay={() => setIsSpeaking(true)}
        onPause={() => setIsSpeaking(false)}
      />
    </div>
  );
};