import { motion } from "framer-motion";
import { ArrowRight, Check, Mic, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setIsNavigating(true);
    navigate("/talk");
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-48">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
          {/* Left Side - Full width and center contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold leading-tight mb-6">
              Meet Omploy — Your AI Workforce
              <span className="px-3 text-primary-400">One Voice Away</span>
            </h1>
            <p className="text-l text-gray-400 mb-8">
              Talk, delegate, and automate your daily digital life with your own
              AI assistant.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Get Started Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                disabled={isNavigating}
                className={`px-5 py-3 bg-primary-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-primary-600 transition-colors ${
                  isNavigating ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isNavigating ? (
                  <motion.div
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <>
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* See It in Action */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-3 bg-gray-800 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>See It in Action</span>
              </motion.button>
            </div>

            <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-2 lg:space-y-0">
              {[
                "Voice & Chat-based interaction",
                "Personalized tasks & support",
                "Built-in agent system",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm text-gray-400"
                >
                  <Check className="w-5 h-5 text-primary-400 mr-2" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Full width and centered mic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full flex justify-center"
          >
            <div className="relative w-80 h-80">
              <div className="w-full h-full rounded-full bg-primary-500/20 animate-glow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Mic className="w-28 h-28 text-primary-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
