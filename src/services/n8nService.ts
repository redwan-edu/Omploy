import { supabase } from '../hooks/supabase';

export interface N8nChatRequest {
  agent_id: string;
  message: string;
  conversation_id?: string;
  user_context?: Record<string, any>;
}

export interface N8nChatResponse {
  response: string;
  conversation_id: string;
  voice_url?: string;
  metadata?: Record<string, any>;
}

class N8nService {
  private readonly baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook';

  async sendChatMessage(request: N8nChatRequest): Promise<N8nChatResponse> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', request.agent_id)
      .single();

    if (agentError || !agent) throw new Error('Agent not found');

    // Prepare payload for n8n
    const payload = {
      user_id: user.id,
      agent_id: request.agent_id,
      agent_type: agent.type,
      agent_name: agent.name,
      personality_prompt: agent.personality_prompt,
      capabilities: agent.capabilities,
      message: request.message,
      conversation_id: request.conversation_id,
      user_context: request.user_context || {},
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_N8N_API_KEY || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // If n8n doesn't respond properly, provide a fallback
      if (!result.response) {
        return {
          response: `Hello! I'm ${agent.name}. I received your message: "${request.message}". How can I help you today?`,
          conversation_id: request.conversation_id || '',
          metadata: { fallback: true }
        };
      }

      return result;
    } catch (error) {
      console.error('n8n service error:', error);
      
      // Fallback response when n8n is unavailable
      return {
        response: `Hello! I'm ${agent.name}. I received your message: "${request.message}". I'm currently experiencing some technical difficulties, but I'm here to help you. Please try again in a moment.`,
        conversation_id: request.conversation_id || '',
        metadata: { fallback: true, error: error.message }
      };
    }
  }

  async processVoiceMessage(audioBlob: Blob, agentId: string, conversationId?: string): Promise<N8nChatResponse> {
    // First convert speech to text
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-input.wav');

    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: formData
    });

    if (error) throw error;

    const transcript = data.text;
    if (!transcript) throw new Error('No speech detected');

    // Then process the text message
    return this.sendChatMessage({
      agent_id: agentId,
      message: transcript,
      conversation_id: conversationId,
      user_context: { input_method: 'voice', confidence: data.confidence }
    });
  }
}

export const n8nService = new N8nService();