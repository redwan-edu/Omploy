import { Navbar } from "../components/layout/Navbar";
import { IntegrationManager } from "../components/integrations/IntegrationManager";
import { AgentManager } from "../components/dashboard/AgentManager";
import { NewsBriefing } from "../components/news/NewsBriefing";
import { useState } from "react";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("agents");

  const tabs = [
    { id: "agents", label: "AI Agents" },
    { id: "integrations", label: "Integrations" },
    { id: "news", label: "News Briefing" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-28 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Manage your AI agents, integrations, and automation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "agents" && <AgentManager />}
          {activeTab === "integrations" && <IntegrationManager />}
          {activeTab === "news" && <NewsBriefing />}
        </div>
      </div>
    </div>
  );
};
