import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Settings } from "lucide-react";
import clsx from "clsx";
import { Navbar } from "../components/layout/Navbar";
import { VoiceChatInterface } from "../components/chat/VoiceChatInterface";
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
        <div className="w-64 rounded-xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-semibold mb-4">Select Agent</h2>
          {agents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={clsx(
                    "w-full px-6 py-3 rounded-lg text-left transition-all flex items-center justify-between",
                    selectedAgent?.id === agent.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  <span className="text-l font-semibold">{agent.name}</span>
                  {selectedAgent?.id === agent.id && (
                    <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">
              No active agents
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="mt-4 block bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600"
              >
                Create Agent
              </button>
            </div>
          )}
        </div>

        {/* Main Area: Chat Interface */}
        <div className="flex-1">
          {selectedAgent ? (
            <>
              <div className="bg-gray-800 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4 ps-2">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <Mic className="w-5 h-5text-white" />
                  </div>
                  <div className="ps-3">
                    <h3 className="text-xl font-semibold">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {selectedAgent.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-white pe-2"
                  onClick={() => navigate(`/profile/${selectedAgent.id}`)}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[450px]">
                <VoiceChatInterface
                  agentId={selectedAgent.id}
                  onNewConversation={(conversationId) => {
                    console.log("New conversation started:", conversationId);
                  }}
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
                Choose an AI assistant from the left sidebar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
