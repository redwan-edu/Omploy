import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Start Talking",
    description: "Use chat or voice to interact",
  },
  {
    number: "02",
    title: "Choose or Switch Agents",
    description: "Select the right AI for your task",
  },
  {
    number: "03",
    title: "Sit Back & Relax",
    description: "Let it handle your reminders, messages, and tasks",
  },
];

export const HowItWorks: React.FC = () => (
  <section className="py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        How It <span className="text-primary-400">Works</span>
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative p-6 bg-gray-800 rounded-xl"
          >
            <div className="text-5xl font-bold text-primary-300 mb-4">
              {step.number}
            </div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-400">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
