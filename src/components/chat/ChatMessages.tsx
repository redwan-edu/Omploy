import { AnimatePresence, motion } from "framer-motion";
import { Message } from "../../types";
import { Pause, Play } from "lucide-react";

export const ChatMessages = ({
  messages,
  isLoading,
  messagesEndRef,
  isPlaying,
  toggleVoicePlayback,
}: any) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-4">
    <AnimatePresence>
      {messages.map((m: Message) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              m.role === "user"
                ? "bg-primary-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm flex-1">{m.content}</p>
              {m.voice_url && (
                <button
                  onClick={() => toggleVoicePlayback(m.id, m.voice_url!)}
                  className="ml-2 p-1 rounded-full hover:bg-gray-600 transition-colors"
                >
                  {isPlaying === m.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            <p className="text-xs opacity-70 mt-1">
              {new Date(m.created_at).toLocaleTimeString()}
            </p>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
    {isLoading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-start"
      >
        <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </motion.div>
    )}
    <div ref={messagesEndRef} />
  </div>
);
