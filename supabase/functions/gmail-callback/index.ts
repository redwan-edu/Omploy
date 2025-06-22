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

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // user_id
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: '${error}' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback`
      })
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Failed to get tokens')
    }

    // Save tokens to database
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    await supabaseClient
      .from('integrations')
      .upsert({
        user_id: state,
        name: 'Gmail',
        provider: 'gmail',
        is_connected: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })

    // Return success page that closes popup
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'oauth_success', provider: 'gmail' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Error in gmail-callback:', error)
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'oauth_error', error: '${error.message}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})