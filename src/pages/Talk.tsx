import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Settings } from "lucide-react";
import clsx from "clsx";
import { Navbar } from "../components/layout/Navbar";
import { EnhancedVoiceChatInterface } from "../components/chat/EnhancedVoiceChatInterface";
import { agentsApi } from "../services/supabaseApi";
import { useNavigate, useParams } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
}

export const Talk: React.FC = () => {
  const { agentId } = useParams<{ agentId?: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    loadAgents();
  }, [agentId]);

  const loadAgents = async () => {
    try {
      const response = await agentsApi.getAll();
      const activeAgents = response.data.filter(
        (agent: Agent) => agent.is_active
      );
      setAgents(activeAgents);

      if (agentId) {
        const matchedAgent = activeAgents.find((a) => a.id === agentId);
        if (matchedAgent) {
          setSelectedAgent(matchedAgent);
          return;
        }
      }
      // Select first active agent by default
      if (activeAgents.length > 0) {
        setSelectedAgent(activeAgents[0]);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentConversationId(undefined); // Reset conversation when switching agents
    navigate(`/talk/${agent.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl mx-auto overflow-y-auto px-4 pt-28 w-full gap-6">
        {/* Agent Selection Sidebar */}
        <div className="w-64 rounded-xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-semibold mb-4">Select Agent</h2>
          {agents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentChange(agent)}
                  className={clsx(
                    "w-full px-6 py-3 rounded-lg text-left transition-all flex items-center justify-between",
                    selectedAgent?.id === agent.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  <div className="flex-1">
                    <span className="text-lg font-semibold block">{agent.name}</span>
                    <span className="text-sm opacity-75 capitalize">
                      {agent.type.replace("_", " ")}
                    </span>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              <p className="mb-4">No active agents found</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                Create Agent
              </button>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          {selectedAgent ? (
            <>
              {/* Agent Header */}
              <div className="bg-gray-800 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4 ps-2">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div className="ps-3">
                    <h3 className="text-xl font-semibold">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {selectedAgent.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedAgent.description}
                    </p>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-white pe-2 transition-colors"
                  onClick={() => navigate(`/profile/${selectedAgent.id}`)}
                  title="Edit agent settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Interface */}
              <div className="h-[500px]">
                <EnhancedVoiceChatInterface
                  agentId={selectedAgent.id}
                  conversationId={currentConversationId}
                  onNewConversation={handleNewConversation}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-6"
              >
                <Mic className="w-16 h-16 text-gray-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-gray-400 mb-2">
                Select an agent to start talking
              </h2>
              <p className="text-gray-500">
                Choose an AI assistant from the left sidebar to begin your conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};