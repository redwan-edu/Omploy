import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "../../hooks/supabase";
import { useNavigate } from "react-router-dom";
import { Agent } from "../../types";

type FormData = {
  name: string;
  description: string;
  type: string;
  personality_prompt: string;
};

export const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Failed to get user:", userError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading agents:", error.message);
    } else {
      setAgents(data);
    }

    setLoading(false);
  };

  const toggleAgent = async (agent: Agent) => {
    const { data, error } = await supabase
      .from("ai_agents")
      .update({ is_active: !agent.is_active })
      .eq("id", agent.id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling agent:", error.message);
    } else if (data) {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? data : a)));
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", agentId);

    if (error) {
      console.error("Error deleting agent:", error.message);
    } else {
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">AI Agents</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Agent</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-400 capitalize">
                  {agent.type.replace("_", " ")}
                </p>
              </div>

              <button
                onClick={() => toggleAgent(agent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  agent.is_active ? "bg-primary-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    agent.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {agent.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {agent.capabilities?.slice(0, 3).map((capability) => (
                <span
                  key={capability}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                >
                  {capability}
                </span>
              ))}
              {agent.capabilities?.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                  +{agent.capabilities.length - 3} more
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  key={agent.id}
                  onClick={() => {
                    navigate(`/talk/${agent.id}`);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Chat with agent"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit agent"
                  onClick={() => navigate(`/profile/${agent.id}`)}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => deleteAgent(agent.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete agent"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAgentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(newAgent) => {
              setAgents((prev) => [newAgent, ...prev]);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const CreateAgentModal: React.FC<{
  onClose: () => void;
  onSuccess: (agent: Agent) => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    type: "general_assistant",
    personality_prompt: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((key: keyof FormData, value: string) => {
    setFormData((prev) =>
      prev[key] === value ? prev : { ...prev, [key]: value }
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("User not authenticated");

        const payload = {
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          personality_prompt: formData.personality_prompt,
          capabilities: [],
          is_active: true,
          n8n_workflow_id: null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("ai_agents")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        onSuccess(data);
      } catch (error) {
        console.error("Error creating agent:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, onSuccess, loading]
  );

  const fields: {
    label: string;
    type: "text" | "textarea";
    key: keyof FormData;
    rows?: number;
    placeholder?: string;
  }[] = [
    { label: "Name", type: "text", key: "name" },
    { label: "Description", type: "textarea", key: "description", rows: 3 },
    {
      label: "Personality Prompt",
      type: "textarea",
      key: "personality_prompt",
      rows: 3,
      placeholder: "Describe how this agent should behave and respond...",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">Create New Agent</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ label, type, key, rows, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={rows}
                  placeholder={placeholder}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <input
                  type={type}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  required={key === "name"}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="general_assistant">General Assistant</option>
              <option value="email_assistant">Email Assistant</option>
              <option value="calendar_manager">Calendar Manager</option>
              <option value="news_reader">News Reader</option>
              <option value="music_assistant">Music Assistant</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
