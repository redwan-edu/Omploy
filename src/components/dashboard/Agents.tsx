import { motion } from "framer-motion";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";
import { Agent } from "../../types";

export const TotalAgents = () => {
  const [agents] = useState<Agent[]>([
    {
      id: "1",
      name: "General Assistant",
      description:
        "Handles everyday tasks and general queries with a friendly approach",
      isActive: true,
      avatar: "",
    },
    {
      id: "2",
      name: "Email Manager",
      description:
        "Specializes in email organization, drafting, and response management",
      isActive: false,
      avatar: "",
    },
    {
      id: "3",
      name: "Calendar Assistant",
      description:
        "Manages your schedule, sets up meetings, and sends reminders",
      isActive: true,
      avatar: "",
    },
  ]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4">Your AI Agents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-medium text-white-400">Alice</h3>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  agent.isActive ? "bg-primary-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    agent.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <h3 className="text-l font-medium text-white-400">{agent.name}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {agent.description}
            </p>
            <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Edit Instructions
            </button>
          </motion.div>
        ))}

        {/* Add New Agent Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center hover:border-primary-500 transition-colors"
        >
          <Plus className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-gray-400">Add New Agent</span>
        </motion.button>
      </div>
    </section>
  );
};
