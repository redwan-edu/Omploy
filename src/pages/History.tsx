import React, { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

interface Conversation {
  id: string;
  agentName: string;
  agentAvatar: string;
  timestamp: Date;
  preview: string;
  duration: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    agentName: "General Assistant",
    agentAvatar:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg",
    timestamp: new Date("2024-03-15T10:30:00"),
    preview:
      "We discussed project deadlines and prioritized upcoming tasks. I helped create a schedule for the content audit and website redesign.",
    duration: "15m",
  },
  {
    id: "2",
    agentName: "Creative Writer",
    agentAvatar:
      "https://images.pexels.com/photos/5083215/pexels-photo-5083215.jpeg",
    timestamp: new Date("2024-03-14T15:45:00"),
    preview:
      "Brainstormed ideas for the new blog post series. We outlined three potential topics and created a content calendar.",
    duration: "25m",
  },
  {
    id: "3",
    agentName: "Technical Expert",
    agentAvatar:
      "https://images.pexels.com/photos/8438923/pexels-photo-8438923.jpeg",
    timestamp: new Date("2024-03-14T09:15:00"),
    preview:
      "Debugged the authentication flow and implemented error handling. Discussed best practices for state management.",
    duration: "45m",
  },
];

export const History: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Interaction History</h1>
          <p className="text-gray-400 mt-2">
            Browse and search your past conversations with AI agents
          </p>
        </div>

        {/* Filters */}
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
            <div className="space-y-4">
              {mockConversations.map((conversation) => (
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
                    <img
                      src={conversation.agentAvatar}
                      alt={conversation.agentName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-medium truncate">
                          {conversation.agentName}
                        </h3>
                        <span className="text-gray-400 text-sm flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {conversation.duration}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {conversation.preview}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(conversation.timestamp)} at{" "}
                        {formatTime(conversation.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-gray-800 rounded-xl">
                {/* Conversation Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <img
                        src={selectedConversation.agentAvatar}
                        alt={selectedConversation.agentName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-white">
                          {selectedConversation.agentName}
                        </h2>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(selectedConversation.timestamp)} at{" "}
                          {formatTime(selectedConversation.timestamp)}
                          <span className="mx-2">•</span>
                          <Clock className="w-4 h-4 mr-1" />
                          {selectedConversation.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conversation Content */}
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 bg-gray-700 rounded-lg p-4">
                        <p className="text-white">
                          {selectedConversation.preview}
                        </p>
                      </div>
                    </div>
                    {/* Add more messages here */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a Conversation
                </h3>
                <p className="text-gray-400">
                  Choose a conversation from the list to view its details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
