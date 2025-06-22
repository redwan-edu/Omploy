import { supabase } from '../hooks/supabase';

class VoiceService {
  private readonly elevenLabsApiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
  private readonly voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default voice ID

  async textToSpeech(text: string, voiceId?: string): Promise<string> {
    if (!this.elevenLabsApiKey) {
      throw new Error('Eleven Labs API key not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  async uploadVoiceResponse(audioBlob: Blob, conversationId: string): Promise<string> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const fileName = `voice/${conversationId}/${Date.now()}.mp3`;
    
    const { data, error } = await supabase.storage
      .from('voice-responses')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg'
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('voice-responses')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    });
  }

  async speechToText(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-input.wav');

    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: formData
    });

    if (error) throw error;
    return { text: data.text, confidence: data.confidence || 0.95 };
  }
}

export const voiceService = new VoiceService();