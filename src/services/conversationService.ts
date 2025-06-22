import { supabase } from '../hooks/supabase';
import { Message } from '../types';

export interface ConversationData {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  voice_url?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

class ConversationService {
  async createConversation(agentId: string, title: string): Promise<ConversationData> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        title: title.substring(0, 100)
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversation(conversationId: string): Promise<ConversationData> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserConversations(): Promise<ConversationData[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        ai_agents(name, type)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    voiceUrl?: string,
    metadata?: Record<string, any>
  ): Promise<MessageData> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        voice_url: voiceUrl,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  async getMessages(conversationId: string): Promise<MessageData[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  subscribeToMessages(conversationId: string, callback: (message: MessageData) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new as MessageData)
      )
      .subscribe();
  }
}

export const conversationService = new ConversationService();