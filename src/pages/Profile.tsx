import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../components/layout/Navbar";
import { CheckCircle } from "lucide-react";
import { supabase } from "../hooks/supabase";
import { Agent } from "../types";
import { useParams } from "react-router-dom";
import clsx from "clsx";

export const Profile = () => {
  const { agentId } = useParams();

  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadAgents();
  }, [agentId]);

  const loadAgents = async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setAgents(data);

      const found = agentId
        ? data.find((a) => a.id === agentId)
        : data.length > 0
        ? data[0]
        : null;
      setSelectedAgent(found || null);
    }

    setLoading(false);
  };

  const handleChange = (key: keyof Agent, value: any) => {
    if (!selectedAgent) return;

    const updatedAgent = { ...selectedAgent, [key]: value };
    setSelectedAgent(updatedAgent);

    setAgents((prev) =>
      prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))
    );
  };

  const toggleCapability = (capability: string) => {
    if (!selectedAgent) return;

    const hasCapability = selectedAgent.capabilities.includes(capability);
    const updatedCapabilities = hasCapability
      ? selectedAgent.capabilities.filter((c) => c !== capability)
      : [...selectedAgent.capabilities, capability];

    const updatedAgent = {
      ...selectedAgent,
      capabilities: updatedCapabilities,
    };

    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === selectedAgent.id ? updatedAgent : agent
      )
    );

    setSelectedAgent(updatedAgent); // <-- this ensures UI reflects change
  };

  const saveAgent = async () => {
    if (!selectedAgent) return;
    const { error } = await supabase
      .from("ai_agents")
      .update({
        type: selectedAgent.type,
        name: selectedAgent.name,
        description: selectedAgent.description,
        capabilities: selectedAgent.capabilities,
      })
      .eq("id", selectedAgent.id);
    if (error) {
      console.error("Error updating agent:", error.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const deleteAgent = async () => {
    if (!selectedAgent) return;
    const confirm = window.confirm(
      "Are you sure you want to delete this agent?"
    );
    if (!confirm) return;

    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", selectedAgent.id);

    if (error) {
      console.error("Error deleting agent:", error.message);
      return;
    }

    setAgents((prev) => prev.filter((agent) => agent.id !== selectedAgent.id));
    setSelectedAgent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto overflow-y-auto px-24 pt-28 w-full gap-6">
        {/* Sidebar */}
        <div className="w-64 rounded-xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
          {agents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={clsx(
                    "w-full px-6 py-2 rounded-lg text-left transition-all flex items-center justify-between",
                    selectedAgent?.id === agent.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold">{agent.name}</span>
                    <div className="text-sm text-gray-400">{agent.type}</div>
                  </div>
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

        <div className="flex-1 py-4">
          {selectedAgent ? (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 outline-none"
                  value={selectedAgent.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  value={selectedAgent.description}
                  rows={2}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Agent Type
                </label>
                <select
                  value={selectedAgent.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="email_assistant">Email Assistant</option>
                  <option value="calendar_manager">Calendar Manager</option>
                  <option value="general_assistant">General Assistant</option>
                  <option value="news_reader">News Reader</option>
                  <option value="music_assistant">Music Assistant</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-sm font-medium text-white mb-2">
                  Capabilities / Access
                </p>
                {["email", "calendar", "news", "voice"].map((capability) => (
                  <Toggle
                    key={capability}
                    name={capability}
                    checked={selectedAgent.capabilities.includes(capability)}
                    onToggle={() => toggleCapability(capability)}
                  />
                ))}
              </div>
              <div className="w-full flex justify-end gap-4 py-4">
                <button
                  onClick={saveAgent}
                  className="px-6 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Save Changes
                </button>

                <button
                  onClick={deleteAgent}
                  className="px-6 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Agent
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-gray-400 text-center py-20">
              Select an agent to view or edit its settings.
            </div>
          )}
        </div>

        {/* Save Confirmation */}

        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-20 right-8 min-w-[250px] max-w-sm bg-green-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" /> Changes saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Toggle = ({
  name,
  checked,
  onToggle,
}: {
  name: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded-lg">
    <span className="text-sm text-gray-200 capitalize">{name} access</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
        checked ? "bg-primary-500" : "bg-gray-500"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);
