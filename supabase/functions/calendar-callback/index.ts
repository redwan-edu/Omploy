import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(`
        <html><body><script>
          window.opener.postMessage({ type: 'oauth_error', error: '${error}' }, '*');
          window.close();
        </script></body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state')
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/calendar-callback`
      })
    })

    const tokens = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error(tokens.error_description)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    await supabaseClient
      .from('integrations')
      .upsert({
        user_id: state,
        name: 'Calendar',
        provider: 'google_calendar',
        is_connected: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })

    return new Response(`
      <html><body><script>
        window.opener.postMessage({ type: 'oauth_success', provider: 'calendar' }, '*');
        window.close();
      </script></body></html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (error) {
    return new Response(`
      <html><body><script>
        window.opener.postMessage({ type: 'oauth_error', error: '${error.message}' }, '*');
        window.close();
      </script></body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
})