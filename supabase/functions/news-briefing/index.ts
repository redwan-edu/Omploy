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

    const { action, category = 'general' } = await req.json()

    switch (action) {
      case 'fetch_news':
        // Fetch news from News API
        const newsResponse = await fetch(
          `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=10&apiKey=${Deno.env.get('NEWS_API_KEY')}`
        )

        const newsData = await newsResponse.json()
        
        if (!newsResponse.ok) {
          throw new Error(newsData.message || 'Failed to fetch news')
        }

        // Process articles with n8n for AI summaries
        const processedArticles = []
        for (const article of newsData.articles || []) {
          // Trigger n8n workflow for news analysis
          const analysisResponse = await fetch(`${Deno.env.get('N8N_WEBHOOK_BASE_URL')}/webhook/news-analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`
            },
            body: JSON.stringify({
              article,
              user_id: user.id
            })
          })

          const analysis = await analysisResponse.json()
          
          // Store in database
          const { data: storedArticle } = await supabaseClient
            .from('news_articles')
            .upsert({
              title: article.title,
              description: article.description,
              url: article.url,
              source: article.source.name,
              published_at: article.publishedAt,
              category,
              ai_summary: analysis.summary || article.description
            })
            .select()
            .single()

          processedArticles.push(storedArticle)
        }

        return new Response(JSON.stringify({ articles: processedArticles }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'generate_briefing':
        // Get recent articles
        const { data: articles } = await supabaseClient
          .from('news_articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(5)

        // Generate briefing with n8n
        const briefingResponse = await fetch(`${Deno.env.get('N8N_WEBHOOK_BASE_URL')}/webhook/news-briefing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`
          },
          body: JSON.stringify({
            articles,
            user_id: user.id
          })
        })

        const briefing = await briefingResponse.json()
        const briefingText = briefing.briefing || 'Here are today\'s top news stories...'

        // Generate voice briefing
        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': Deno.env.get('ELEVEN_LABS_API_KEY')!
          },
          body: JSON.stringify({
            text: briefingText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        })

        const audioBuffer = await ttsResponse.arrayBuffer()
        const audioFileName = `briefings/${user.id}/${Date.now()}.mp3`
        
        await supabaseClient.storage
          .from('voice-responses')
          .upload(audioFileName, audioBuffer, {
            contentType: 'audio/mpeg'
          })

        const { data: urlData } = supabaseClient.storage
          .from('voice-responses')
          .getPublicUrl(audioFileName)

        // Log the briefing
        await supabaseClient
          .from('assistant_logs')
          .insert({
            user_id: user.id,
            action_type: 'news_briefing',
            query: 'Generate news briefing',
            response: briefingText,
            success: true,
            processing_time_ms: Date.now() - Date.now(),
            tokens_used: Math.ceil(briefingText.length / 4)
          })

        return new Response(JSON.stringify({
          briefing_text: briefingText,
          voice_url: urlData.publicUrl,
          articles
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
    console.error('Error in news-briefing function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})