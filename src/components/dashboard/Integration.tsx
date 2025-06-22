import { useEffect, useState } from "react";
import { Music2, Calendar, Slack } from "lucide-react";
import { Mail, MessageSquare, ListTodo } from "lucide-react";
import { fetchIntegration } from "../../supabase";
import { motion } from "framer-motion";

export interface Integration {
  id: string;
  name: string;
  is_connected: boolean;
}

const iconMap: Record<string, JSX.Element> = {
  Gmail: <Mail className="w-8 h-8" />,
  WhatsApp: <MessageSquare className="w-8 h-8" />,
  TodoList: <ListTodo className="w-8 h-8" />,
  Spotify: <Music2 className="w-8 h-8" />,
  Calendar: <Calendar className="w-8 h-8" />,
  Slack: <Slack className="w-8 h-8" />,
};

export const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    const loadIntegrations = async () => {
      const integs = await fetchIntegration();
      if (integs) setIntegrations(integs);
    };
    loadIntegrations();
  }, []);

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4">Integrations</h2>
      <div className="relative">
        <div className="flex space-x-2 overflow-x-auto pb-4">
          {integrations.map((integration) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 flex flex-col items-center min-w-[200px]"
            >
              <div className="mb-4">
                {iconMap[integration.name] || (
                  <div className="mb-4 w-8 h-8 bg-gray-600 rounded" />
                )}
              </div>
              <h3 className="text-white font-medium mb-2">
                {integration.name}
              </h3>
              <button
                className={`px-4 py-1 rounded-full text-sm ${
                  integration.is_connected
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {integration.is_connected ? "Connected" : "Connect"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
