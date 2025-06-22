import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";

export const ChatInput = ({
  inputValue,
  setInputValue,
  handleSend,
  isLoading,
  toggleRecording,
  isRecording,
  isPlaying,
  audioRefs,
}: any) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 border-t border-gray-700">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-colors ${
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type or speak your message..."
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={1}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => {
            const audioElements: HTMLAudioElement[] = Object.values(
              audioRefs.current
            );
            audioElements.forEach((audio) => {
              isPlaying ? audio.pause() : audio.play();
            });
          }}
          className={`p-3 rounded-full transition-colors ${
            isPlaying
              ? "bg-primary-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {isPlaying ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
