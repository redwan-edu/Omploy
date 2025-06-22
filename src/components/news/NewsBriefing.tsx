import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RefreshCw, ExternalLink } from 'lucide-react';
import { newsApi } from '../../services/supabaseApi';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  ai_summary: string;
}

interface NewsBriefingData {
  briefing_text: string;
  voice_url: string;
  articles: NewsArticle[];
}

export const NewsBriefing: React.FC = () => {
  const [briefing, setBriefing] = useState<NewsBriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'science', label: 'Science' },
    { value: 'health', label: 'Health' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' }
  ];

  useEffect(() => {
    generateBriefing();
  }, []);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const response = await newsApi.generateBriefing();
      setBriefing(response.data);
      
      // Set up audio element
      if (audioRef.current && response.data.voice_url) {
        audioRef.current.src = response.data.voice_url;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onpause = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsByCategory = async (category: string) => {
    setLoading(true);
    setSelectedCategory(category);
    try {
      const response = await newsApi.fetchNews(category);
      // Update articles without regenerating briefing
      if (briefing) {
        setBriefing(prev => prev ? { ...prev, articles: response.data.articles } : null);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">News Briefing</h2>
        <button
          onClick={generateBriefing}
          disabled={loading}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => fetchNewsByCategory(category.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === category.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Voice Briefing */}
      {briefing && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">AI Voice Briefing</h3>
            <button
              onClick={togglePlayback}
              className="bg-primary-500 text-white p-3 rounded-full hover:bg-primary-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">
              {briefing.briefing_text}
            </p>
          </div>
          
          <audio ref={audioRef} preload="metadata" />
        </div>
      )}

      {/* News Articles */}
      {briefing?.articles && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Latest Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {briefing.articles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-lg font-semibold text-white line-clamp-2">
                      {article.title}
                    </h4>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white ml-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    <span>{article.source}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {article.ai_summary || article.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};