import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  MessageSquare,
  Music,
  ListTodo,
  Slack,
} from "lucide-react";
import { integrationsApi } from "../../services/supabaseApi";
import { supabase } from "../../hooks/supabase";

interface Integration {
  id?: string;
  name: string;
  provider: string;
  is_connected: boolean;
  created_at?: string;
}

const defaultIntegrations: Integration[] = [
  { name: "Gmail", provider: "gmail", is_connected: false },
  { name: "Google Calendar", provider: "google_calendar", is_connected: false },
  { name: "WhatsApp", provider: "whatsapp", is_connected: false },
  { name: "Spotify", provider: "spotify", is_connected: false },
  { name: "Todo List", provider: "todoList", is_connected: false },
  { name: "Slack", provider: "slack", is_connected: false },
];

const integrationIcons: Record<string, JSX.Element> = {
  gmail: <Mail className="w-8 h-8" />,
  google_calendar: <Calendar className="w-8 h-8" />,
  whatsapp: <MessageSquare className="w-8 h-8" />,
  spotify: <Music className="w-8 h-8" />,
  todoList: <ListTodo className="w-8 h-8" />,
  slack: <Slack className="w-8 h-8" />,
};

export const IntegrationManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (user) {
        await loadIntegrations(user.id);
      }
    })();
  }, []);

  const loadIntegrations = async (userId: string) => {
    setLoading(true);
    try {
      const response = await integrationsApi.getAll(userId);
      const fetched: Integration[] = response.data;

      const updated = defaultIntegrations.map((item) => {
        const match = fetched.find((i) => i.provider === item.provider);
        return match ? { ...item, ...match } : { ...item, user_id: userId };
      });

      setIntegrations(updated);
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const setConnectionStatus = async (
    userId: string,
    provider: string,
    name: string,
    status: boolean
  ) => {
    const { data, error } = await supabase.from("integrations").upsert(
      {
        user_id: userId,
        provider: provider,
        name: name,
        is_connected: status,
      },
      { onConflict: "user_id,provider" }
    );

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    return data;
  };

  const toggleIntegration = async (integration: Integration) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) return;

    setConnecting(integration.provider);

    try {
      await setConnectionStatus(
        userId,
        integration.provider,
        integration.name,
        !integration.is_connected
      );
      await loadIntegrations(userId);
    } catch (error) {
      console.error(error);
    } finally {
      setConnecting(null);
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
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Integrations</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 rounded-xl p-2 max-h-[calc(100vh-120px)] custom-scrollbar">
          {integrations.map((integration) => (
            <motion.div
              key={integration.id || integration.provider}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 flex flex-col items-center min-w-[180px]"
            >
              {integrationIcons[integration.provider] || (
                <div className="mb-4 w-8 h-8 bg-gray-600 rounded" />
              )}
              <h3 className="text-white font-medium mt-2 mb-4">
                {integration.name}
              </h3>
              <button
                disabled={connecting === integration.provider}
                onClick={() => toggleIntegration(integration)}
                className={`w-full ${
                  integration.is_connected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary-500 hover:bg-primary-600"
                } text-white py-2 rounded-3xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {connecting === integration.provider
                  ? "Processing..."
                  : integration.is_connected
                  ? "Disconnect"
                  : "Connect"}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Integration Features */}
      <section className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Available Features
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">Gmail Integration</h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>AI-powered email summaries</li>
                <li>Voice email reading</li>
                <li>Smart email composition</li>
                <li>Priority email detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">
                Calendar Integration
              </h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Voice event creation</li>
                <li>Smart scheduling suggestions</li>
                <li>Meeting reminders</li>
                <li>Calendar briefings</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">
                WhatsApp Integration
              </h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Chat automation</li>
                <li>Customer support assistant</li>
                <li>Voice message summaries</li>
                <li>Scheduled responses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Spotify Integration</h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Voice music controls</li>
                <li>Smart playlist generation</li>
                <li>Daily music recommendations</li>
                <li>Event-based music themes</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">
                Todo List Integration
              </h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Task voice input</li>
                <li>Daily briefing with tasks</li>
                <li>AI-prioritized to-dos</li>
                <li>Smart reminders</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Slack Integration</h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Meeting summarization</li>
                <li>Team notification assistant</li>
                <li>Voice message responses</li>
                <li>Smart status updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
