import React, { useState, useRef, useEffect } from "react";
import {
  agentsApi,
  voiceApi,
  subscribeToMessages,
} from "../../services/supabaseApi";
import { Message } from "../../types";
import { RecordingIndicator, VoiceVisualizer } from "./VoiceVisualizer";
import { ChatInput } from "./ChatInput";

interface VoiceChatInterfaceProps {
  agentId: string;
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
}

export const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({
  agentId,
  conversationId,
  onNewConversation,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentConversationId) return;

    const subscription = subscribeToMessages(
      currentConversationId,
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.role === "assistant" && newMessage.voice_url) {
            playVoiceMessage(newMessage.id, newMessage.voice_url);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [currentConversationId]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim() || isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await agentsApi.chat(agentId, {
        message: text,
        conversation_id: currentConversationId,
      });
      if (!currentConversationId && res.data.conversation_id) {
        setCurrentConversationId(res.data.conversation_id);
        onNewConversation?.(res.data.conversation_id);
      }
    } catch (e) {
      console.error("Send error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const file = new File([blob], "input.wav", { type: "audio/wav" });
      try {
        const response = await voiceApi.speechToText(file);
        const text = response.data.text;
        if (text) {
          setInputValue(text);
        }
      } catch (e) {
        console.error("STT error", e);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      }
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playVoiceMessage = (id: string, url: string) => {
    Object.values(audioRefs.current).forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setIsPlaying(null);

    if (!audioRefs.current[id]) {
      audioRefs.current[id] = new Audio(url);
      audioRefs.current[id].onended = () => setIsPlaying(null);
    }
    audioRefs.current[id].play();
    setIsPlaying(id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl">
      {isRecording && <RecordingIndicator />}
      <VoiceVisualizer isListening={isRecording} onMicClick={toggleRecording} />

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSend={sendMessage}
        isLoading={isLoading}
        toggleRecording={toggleRecording}
        isRecording={isRecording}
        isPlaying={isPlaying}
        audioRefs={audioRefs}
      />
    </div>
  );
};
