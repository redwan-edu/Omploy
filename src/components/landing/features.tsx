import { motion } from "framer-motion";
import { Mic, Brain, RefreshCw, Clock } from "lucide-react";

const features = [
  {
    icon: <Mic className="w-8 h-8 text-primary-400" />,
    title: "Talk or Type",
    description: "Interact naturally via voice or text",
  },
  {
    icon: <Brain className="w-8 h-8 text-primary-400" />,
    title: "Smart Agents",
    description: "Specialized AI assistants for different jobs",
  },
  {
    icon: <RefreshCw className="w-8 h-8 text-primary-400" />,
    title: "Connect Everything",
    description: "Integrate with Gmail, WhatsApp, Calendar, etc.",
  },
  {
    icon: <Clock className="w-8 h-8 text-primary-400" />,
    title: "Never Miss a Beat",
    description: "Proactive reminders, summaries, and nudges",
  },
];

export const Features = () => (
  <section className="py-20 bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-6 bg-gray-800 rounded-xl"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
