import { supabase } from "../hooks/supabase";

// AI Agents API using Supabase
export const agentsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data };
  },

  create: async (agentData: any) => {
    const { data, error } = await supabase
      .from("ai_agents")
      .insert(agentData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  update: async (id: string, agentData: any) => {
    const { data, error } = await supabase
      .from("ai_agents")
      .update(agentData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("ai_agents").delete().eq("id", id);

    if (error) throw error;
    return { data: { success: true } };
  },

  chat: async (agentId: string, data: any) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error("Not authenticated");

    const response = await supabase.functions.invoke("chat-agent", {
      body: {
        agent_id: agentId,
        message: data.message,
        conversation_id: data.conversation_id,
      },
    });

    if (response.error) throw response.error;
    return response;
  },

  getCapabilities: async (id: string) => {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("capabilities, type")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data };
  },
};

// Conversations API using Supabase
export const conversationsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        ai_agents(name, type),
        messages(id, content, role, created_at)
      `
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return { data };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        ai_agents(name, type),
        messages(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data };
  },

  getMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data };
  },
};

// Integrations API using Supabase Edge Functions
export const integrationsApi = {
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from("integrations")
      .select("id, name, provider, is_connected, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data };
  },

  setConnectionStatus: async (provider: string, isConnected: boolean) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("integrations")
      .update({ is_connected: isConnected })
      .eq("user_id", userId)
      .eq("provider", provider)
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  disconnect: async (provider: string) => {
    const response = await supabase.functions.invoke(
      `${provider}-integration`,
      {
        body: { action: "disconnect" },
      }
    );

    if (response.error) throw response.error;
    return response;
  },

  connectGmail: async () => {
    const response = await supabase.functions.invoke("gmail-integration", {
      body: { action: "connect" },
    });

    if (response.error) throw response.error;
    return response;
  },

  connectCalendar: async () => {
    const response = await supabase.functions.invoke("calendar-integration", {
      body: { action: "connect" },
    });

    if (response.error) throw response.error;
    return response;
  },

  fetchEmails: async () => {
    const response = await supabase.functions.invoke("gmail-integration", {
      body: { action: "fetch_emails" },
    });

    if (response.error) throw response.error;
    return response;
  },

  sendEmail: async (emailData: any) => {
    const response = await supabase.functions.invoke("gmail-integration", {
      body: { action: "send_email", ...emailData },
    });

    if (response.error) throw response.error;
    return response;
  },

  fetchCalendarEvents: async () => {
    const response = await supabase.functions.invoke("calendar-integration", {
      body: { action: "fetch_events" },
    });

    if (response.error) throw response.error;
    return response;
  },

  createCalendarEvent: async (eventData: any) => {
    const response = await supabase.functions.invoke("calendar-integration", {
      body: { action: "create_event", ...eventData },
    });

    if (response.error) throw response.error;
    return response;
  },
};

// Voice API using Supabase Edge Functions
export const voiceApi = {
  speechToText: async (audioFile: File) => {
    const formData = new FormData();
    formData.append("audio", audioFile);

    const response = await supabase.functions.invoke("voice-to-text", {
      body: formData,
    });

    if (response.error) throw response.error;
    return response;
  },

  textToSpeech: async (text: string) => {
    // This is handled automatically in chat responses
    // But can be called directly for custom TTS
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": import.meta.env.VITE_ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) throw new Error("TTS failed");

    const audioBlob = await response.blob();
    return { data: { audio: audioBlob } };
  },
};

// News API using Supabase Edge Functions
export const newsApi = {
  fetchNews: async (category = "general") => {
    const response = await supabase.functions.invoke("news-briefing", {
      body: { action: "fetch_news", category },
    });

    if (response.error) throw response.error;
    return response;
  },

  generateBriefing: async () => {
    const response = await supabase.functions.invoke("news-briefing", {
      body: { action: "generate_briefing" },
    });

    if (response.error) throw response.error;
    return response;
  },
};

// Real-time subscriptions
export const subscribeToMessages = (
  conversationId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToConversations = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`conversations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
