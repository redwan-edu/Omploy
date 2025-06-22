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
        const scopes = [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events'
        ].join(' ')

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&` +
          `redirect_uri=${Deno.env.get('SUPABASE_URL')}/functions/v1/calendar-callback&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `state=${user.id}&` +
          `access_type=offline&` +
          `prompt=consent`

        return new Response(JSON.stringify({ auth_url: authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'fetch_events':
        const { data: integration } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'google_calendar')
          .single()

        if (!integration?.access_token) {
          return new Response(JSON.stringify({ error: 'Calendar not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const timeMin = new Date().toISOString()
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`
            }
          }
        )

        const eventsData = await eventsResponse.json()
        
        // Store events in database
        const storedEvents = []
        for (const event of eventsData.items || []) {
          const { data: storedEvent } = await supabaseClient
            .from('calendar_events')
            .upsert({
              user_id: user.id,
              external_id: event.id,
              title: event.summary,
              description: event.description,
              start_time: event.start.dateTime || event.start.date,
              end_time: event.end.dateTime || event.end.date,
              location: event.location,
              attendees: event.attendees || []
            })
            .select()
            .single()

          storedEvents.push(storedEvent)
        }

        return new Response(JSON.stringify({ events: storedEvents }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'create_event':
        const { title, description, start_time, end_time, location, attendees } = requestData
        
        const { data: calendarIntegration } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'google_calendar')
          .single()

        if (!calendarIntegration?.access_token) {
          return new Response(JSON.stringify({ error: 'Calendar not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create event via Google Calendar API
        const eventData = {
          summary: title,
          description,
          start: { dateTime: start_time },
          end: { dateTime: end_time },
          location,
          attendees: attendees?.map((email: string) => ({ email }))
        }

        const createResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${calendarIntegration.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
          }
        )

        const createdEvent = await createResponse.json()

        // Store in database
        const { data: storedEvent } = await supabaseClient
          .from('calendar_events')
          .insert({
            user_id: user.id,
            external_id: createdEvent.id,
            title,
            description,
            start_time,
            end_time,
            location,
            attendees: attendees || [],
            ai_generated: true
          })
          .select()
          .single()

        // Generate voice confirmation
        const confirmationText = `Calendar event "${title}" created successfully for ${new Date(start_time).toLocaleDateString()}`
        
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
        
        await supabaseClient.storage
          .from('voice-responses')
          .upload(audioFileName, audioBuffer, {
            contentType: 'audio/mpeg'
          })

        const { data: urlData } = supabaseClient.storage
          .from('voice-responses')
          .getPublicUrl(audioFileName)

        return new Response(JSON.stringify({
          event: storedEvent,
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
    console.error('Error in calendar-integration function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})