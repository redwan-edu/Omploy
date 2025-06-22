import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...requestData } = await req.json()

    switch (action) {
      case 'connect':
        // Generate OAuth2 URL for Gmail
        const scopes = [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify'
        ].join(' ')

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&` +
          `redirect_uri=${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `state=${user.id}&` +
          `access_type=offline&` +
          `prompt=consent`

        return new Response(JSON.stringify({ auth_url: authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'fetch_emails':
        // Get Gmail integration
        const { data: integration } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .single()

        if (!integration?.access_token) {
          return new Response(JSON.stringify({ error: 'Gmail not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Fetch emails from Gmail API
        const gmailResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`
            }
          }
        )

        const gmailData = await gmailResponse.json()
        
        // Process emails with n8n for AI analysis
        const processedEmails = []
        for (const message of gmailData.messages || []) {
          const emailDetail = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`
              }
            }
          )
          
          const emailData = await emailDetail.json()
          
          // Trigger n8n workflow for email analysis
          const analysisResponse = await fetch(`${Deno.env.get('N8N_WEBHOOK_BASE_URL')}/webhook/email-analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`
            },
            body: JSON.stringify({
              email_data: emailData,
              user_id: user.id
            })
          })

          const analysis = await analysisResponse.json()
          
          // Store in database
          const { data: storedEmail } = await supabaseClient
            .from('emails')
            .upsert({
              user_id: user.id,
              external_id: message.id,
              subject: emailData.payload?.headers?.find((h: any) => h.name === 'Subject')?.value,
              sender_email: emailData.payload?.headers?.find((h: any) => h.name === 'From')?.value,
              body_text: emailData.snippet,
              ai_summary: analysis.summary,
              ai_sentiment: analysis.sentiment,
              is_important: analysis.is_important,
              received_at: new Date(parseInt(emailData.internalDate))
            })
            .select()
            .single()

          processedEmails.push(storedEmail)
        }

        return new Response(JSON.stringify({ emails: processedEmails }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'send_email':
        const { to, subject, body } = requestData
        
        // Get Gmail integration
        const { data: gmailIntegration } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .single()

        if (!gmailIntegration?.access_token) {
          return new Response(JSON.stringify({ error: 'Gmail not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create email message
        const emailMessage = [
          `To: ${to}`,
          `Subject: ${subject}`,
          '',
          body
        ].join('\n')

        const encodedMessage = btoa(emailMessage).replace(/\+/g, '-').replace(/\//g, '_')

        // Send email via Gmail API
        const sendResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gmailIntegration.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              raw: encodedMessage
            })
          }
        )

        const sendResult = await sendResponse.json()

        // Generate voice confirmation
        const confirmationText = `Email sent successfully to ${to} with subject "${subject}"`
        
        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': Deno.env.get('ELEVEN_LABS_API_KEY')!
          },
          body: JSON.stringify({
            text: confirmationText,
            model_id: 'eleven_monolingual_v1'
          })
        })

        const audioBuffer = await ttsResponse.arrayBuffer()
        const audioFileName = `confirmations/${user.id}/${Date.now()}.mp3`
        
        const { data: uploadData } = await supabaseClient.storage
          .from('voice-responses')
          .upload(audioFileName, audioBuffer, {
            contentType: 'audio/mpeg'
          })

        const { data: urlData } = supabaseClient.storage
          .from('voice-responses')
          .getPublicUrl(audioFileName)

        return new Response(JSON.stringify({
          success: true,
          message_id: sendResult.id,
          confirmation_text: confirmationText,
          voice_url: urlData.publicUrl
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('Error in gmail-integration function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})