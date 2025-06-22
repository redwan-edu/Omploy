import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../components/layout/Navbar";
import {
  Calendar,
  ChevronDown,
  Search,
  Filter,
  Clock,
  MessageSquare,
  Trash2,
  Download,
  Volume2,
  VolumeX,
  User,
  Bot
} from "lucide-react";
import { conversationService, ConversationData, MessageData } from "../services/conversationService";

interface ConversationWithMessages extends ConversationData {
  ai_agents?: { name: string; type: string };
  messages?: MessageData[];
  lastMessage?: MessageData;
}

export const History: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationService.getUserConversations();
      
      // Sort by most recent and add last message preview
      const conversationsWithPreview = await Promise.all(
        data.map(async (conv) => {
          try {
            const messages = await conversationService.getMessages(conv.id);
            const lastMessage = messages[messages.length - 1];
            return { ...conv, lastMessage };
          } catch (error) {
            console.error(`Error loading messages for conversation ${conv.id}:`, error);
            return conv;
          }
        })
      );

      setConversations(conversationsWithPreview);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const data = await conversationService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await conversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const playVoiceMessage = (messageId: string, url: string) => {
    // Stop any currently playing audio
    Object.values(audioRefs).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingAudio(null);

    // Create or get audio element
    if (!audioRefs[messageId]) {
      audioRefs[messageId] = new Audio(url);
      audioRefs[messageId].onended = () => setPlayingAudio(null);
      audioRefs[messageId].onerror = () => setPlayingAudio(null);
    }

    // Play audio
    audioRefs[messageId].play();
    setPlayingAudio(messageId);
  };

  const toggleVoicePlayback = (messageId: string, url: string) => {
    if (playingAudio === messageId) {
      audioRefs[messageId]?.pause();
      setPlayingAudio(null);
    } else {
      playVoiceMessage(messageId, url);
    }
  };

  const exportConversation = (conversation: ConversationWithMessages) => {
    const content = messages.map(msg => 
      `[${new Date(msg.created_at).toLocaleString()}] ${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.ai_agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Conversation History</h1>
          <p className="text-gray-400 mt-2">
            Browse and search your past conversations with AI agents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Conversation List */}
          <div className="lg:col-span-1">
            {/* Search and Filter */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-4">
                  <button className="flex items-center text-gray-400 hover:text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Date
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "ring-2 ring-primary-500"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-medium truncate">
                            {conversation.ai_agents?.name || 'Unknown Agent'}
                          </h3>
                          <span className="text-gray-400 text-sm flex items-center ml-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(conversation.updated_at)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {conversation.lastMessage?.content || conversation.title}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                          <span className="capitalize">
                            {conversation.ai_agents?.type?.replace('_', ' ') || 'Assistant'}
                          </span>
                          <span>{formatDate(conversation.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                  {searchQuery && (
                    <p className="text-sm mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-gray-800 rounded-xl h-full flex flex-col">
                {/* Conversation Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-white">
                          {selectedConversation.ai_agents?.name || 'Unknown Agent'}
                        </h2>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(selectedConversation.created_at)} at{" "}
                          {formatTime(selectedConversation.created_at)}
                          <span className="mx-2">•</span>
                          <span className="capitalize">
                            {selectedConversation.ai_agents?.type?.replace('_', ' ') || 'Assistant'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => exportConversation(selectedConversation)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Export conversation"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteConversation(selectedConversation.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-start space-x-4 ${
                              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === 'user' 
                                ? 'bg-primary-500' 
                                : 'bg-gray-600'
                            }`}>
                              {message.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                              ) : (
                                <Bot className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className={`flex-1 ${
                              message.role === 'user' ? 'text-right' : ''
                            }`}>
                              <div className={`inline-block max-w-[80%] p-4 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-700 text-gray-100'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <p className="text-sm flex-1">{message.content}</p>
                                  {message.voice_url && (
                                    <button
                                      onClick={() => toggleVoicePlayback(message.id, message.voice_url!)}
                                      className="ml-2 p-1 rounded-full hover:bg-gray-600 transition-colors flex-shrink-0"
                                    >
                                      {playingAudio === message.id ? (
                                        <VolumeX className="w-4 h-4" />
                                      ) : (
                                        <Volume2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs opacity-70">
                                    {formatTime(message.created_at)}
                                  </p>
                                  {message.metadata?.fallback && (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 rounded ml-2">
                                      Fallback
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a Conversation
                </h3>
                <p className="text-gray-400">
                  Choose a conversation from the list to view its details and messages
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};