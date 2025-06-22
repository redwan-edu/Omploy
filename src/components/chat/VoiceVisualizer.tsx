import { Mic } from "lucide-react";
import { motion } from "framer-motion";

export const RecordingIndicator = () => (
  <div className="px-6 py-2 bg-red-500/20 border-t border-red-500/30">
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-red-400 text-sm">Recording... Tap mic to stop</span>
    </div>
  </div>
);

export const VoiceVisualizer = ({
  isListening,
  onMicClick,
}: {
  isListening: boolean;
  onMicClick?: () => void;
}) => (
  <div className="flex-1 flex items-center justify-center">
    <button
      onClick={onMicClick}
      className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition ${
        isListening
          ? "border-blue-500"
          : "border-gray-700 hover:border-primary-500"
      }`}
    >
      {isListening ? (
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-blue-500"
              animate={{ height: [20, 40, 20] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      ) : (
        <Mic className="w-12 h-12 text-gray-400" />
      )}
    </button>
  </div>
);
