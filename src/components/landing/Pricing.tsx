import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fetchPlans } from "../../supabase";
import { Plan } from "../../types";

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      const plans = await fetchPlans();
      if (plans) {
        const sortedPlans = plans.sort((a, b) => a.id - b.id);
        setPlans(sortedPlans);
      }
    };
    loadPlans();
  }, []);

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <span
              className={`text-sm ${
                !isYearly ? "text-white" : "text-gray-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? "bg-primary-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${isYearly ? "text-white" : "text-gray-400"}`}
            >
              Yearly (Save 20%)
            </span>
          </div>
          <p className="text-center text-yellow-400 mt-6">
            7-day free trial included on all plans. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-6 rounded-xl ${
                plan.popular
                  ? "bg-primary-500/20 border border-primary-500"
                  : "bg-gray-800"
              }`}
            >
              {plan.popular && (
                <span className="inline-block px-3 py-1 text-sm text-primary-400 bg-primary-500/20 rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isYearly ? plan.price_yearly : plan.price_monthly}
                </span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.services.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-primary-400 mr-2" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {plan.cta_text}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
