import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  agent_id: string
  message: string
  conversation_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { agent_id, message, conversation_id }: ChatRequest = await req.json()

    // Get agent details
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create or get conversation
    let currentConversationId = conversation_id
    if (!currentConversationId) {
      const { data: conversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          user_id: user.id,
          agent_id: agent_id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single()

      if (convError) throw convError
      currentConversationId = conversation.id
    }

    // Save user message
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      })

    // Process with n8n AI workflow
    const n8nResponse = await fetch(`${Deno.env.get('N8N_WEBHOOK_BASE_URL')}/webhook/chat-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`
      },
      body: JSON.stringify({
        agent_type: agent.type,
        personality_prompt: agent.personality_prompt,
        user_message: message,
        conversation_context: currentConversationId
      })
    })

    const aiResponse = await n8nResponse.json()
    const responseText = aiResponse.response || `Hello! I'm ${agent.name}. I received your message: "${message}". How can I help you today?`

    // Generate voice response with Eleven Labs
    const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': Deno.env.get('ELEVEN_LABS_API_KEY')!
      },
      body: JSON.stringify({
        text: responseText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    // Upload audio to Supabase Storage
    const audioBuffer = await ttsResponse.arrayBuffer()
    const audioFileName = `voice/${currentConversationId}/${Date.now()}.mp3`
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('voice-responses')
      .upload(audioFileName, audioBuffer, {
        contentType: 'audio/mpeg'
      })

    let voiceUrl = null
    if (!uploadError) {
      const { data: urlData } = supabaseClient.storage
        .from('voice-responses')
        .getPublicUrl(audioFileName)
      voiceUrl = urlData.publicUrl
    }

    // Save AI response with voice URL
    const { data: messageData, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: responseText,
        voice_url: voiceUrl,
        metadata: { agent_type: agent.type }
      })
      .select()
      .single()

    if (messageError) throw messageError

    // Log the interaction
    await supabaseClient
      .from('assistant_logs')
      .insert({
        user_id: user.id,
        agent_id: agent_id,
        action_type: 'chat',
        query: message,
        response: responseText,
        success: true,
        processing_time_ms: Date.now() - Date.now(),
        tokens_used: Math.ceil(responseText.length / 4)
      })

    return new Response(JSON.stringify({
      conversation_id: currentConversationId,
      message: messageData,
      voice_url: voiceUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in chat-agent function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})