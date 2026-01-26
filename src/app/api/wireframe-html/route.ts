import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/claude/client'

const HTML_WIREFRAME_PROMPT = `Tu es un expert UI/UX et développeur front-end senior. Génère du code HTML avec Tailwind CSS pour créer une maquette d'écran mobile-first professionnelle et réaliste.

RÈGLES STRICTES:
1. Génère UNIQUEMENT le contenu HTML (pas de <!DOCTYPE>, <html>, <head>, <body>)
2. Utilise Tailwind CSS pour tous les styles
3. Design mobile-first (max-width: 390px simulé)
4. Utilise des couleurs modernes et cohérentes
5. Inclus des données réalistes (pas de Lorem ipsum)
6. Structure claire et hiérarchique

PALETTE DE COULEURS:
- Primary: bg-blue-600, text-blue-600
- Secondary: bg-gray-100, text-gray-600
- Success: bg-green-500
- Danger: bg-red-500
- Background: bg-white, bg-gray-50

COMPOSANTS COURANTS:
- Header: sticky top-0, shadow-sm, bg-white
- Cards: rounded-xl, shadow-md, p-4
- Buttons: rounded-lg, font-medium, px-4 py-2
- Inputs: rounded-lg, border, px-3 py-2
- Lists: divide-y, divide-gray-100

ICÔNES (utilise ces SVG inline):
- Menu: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
- Back: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
- Search: <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
- Plus: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
- User: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
- Bell: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
- Check: <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
- Settings: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
- Home: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
- Heart: <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
- Star: <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>

IMAGES PLACEHOLDER:
- Avatar: <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
- Image: <div class="w-full h-40 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400">Image</div>

FORMAT DE RÉPONSE:
Réponds UNIQUEMENT avec le code HTML, sans explication ni markdown. Pas de \`\`\`html, juste le HTML pur.

DESCRIPTION DE L'ÉCRAN:`

// Helper function to parse screens from document
function parseScreensFromDocument(content: string): Array<{ index: number; name: string; content: string }> {
  const screenSections = content.split(/(?=## Écran:)/).filter(Boolean)
  return screenSections.map((section, index) => {
    const nameMatch = section.match(/## Écran: ([^\n]+)/)
    return {
      index,
      name: nameMatch ? nameMatch[1].trim() : `Écran ${index + 1}`,
      content: section
    }
  })
}

// GET: List available screens from screens_prompts document
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get screens_prompts document
    const { data: screensDoc } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', projectId)
      .eq('type', 'screens_prompts')
      .single()

    if (!screensDoc) {
      return NextResponse.json({ screens: [], hasDocument: false })
    }

    // Parse screens
    const screens = parseScreensFromDocument(screensDoc.content)

    // Get existing wireframes
    const { data: existingWireframes } = await supabase
      .from('wireframes_html')
      .select('screen_index, screen_name, html_content, generated_at')
      .eq('project_id', projectId)
      .order('screen_index', { ascending: true })

    return NextResponse.json({
      screens: screens.map(s => ({ index: s.index, name: s.name })),
      wireframes: existingWireframes || [],
      hasDocument: true
    })

  } catch (error) {
    console.error('Error fetching screens:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Generate wireframe for a single screen
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, screen_index } = body

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    if (screen_index === undefined || screen_index === null) {
      return NextResponse.json({ error: 'screen_index requis' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    if (profile && profile.credits_remaining !== -1 && profile.credits_remaining <= 0) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 403 })
    }

    // Get screens_prompts document
    const { data: screensDoc, error: screensError } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', project_id)
      .eq('type', 'screens_prompts')
      .single()

    if (screensError || !screensDoc) {
      return NextResponse.json({
        error: 'Générez d\'abord le document "Prompts écrans"'
      }, { status: 400 })
    }

    // Parse all screens
    const allScreens = parseScreensFromDocument(screensDoc.content)
    const screen = allScreens.find(s => s.index === screen_index)

    if (!screen) {
      return NextResponse.json({ error: 'Écran non trouvé' }, { status: 404 })
    }

    // Generate wireframe with Claude
    const anthropic = getAnthropicClient()
    const fullPrompt = HTML_WIREFRAME_PROMPT + '\n\n' + screen.content

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: fullPrompt }]
    })

    const htmlContent = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : ''

    // Clean up the HTML (remove any markdown code block wrappers)
    const cleanHtml = htmlContent
      .replace(/^```\w*\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

    // Save to database (upsert)
    await supabase
      .from('wireframes_html')
      .upsert({
        project_id,
        screen_name: screen.name,
        screen_index,
        html_content: cleanHtml,
        generated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,screen_index'
      })

    // Decrement credits
    if (profile && profile.credits_remaining !== -1) {
      await supabase
        .from('profiles')
        .update({ credits_remaining: profile.credits_remaining - 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      wireframe: {
        screen_name: screen.name,
        screen_index,
        html_content: cleanHtml
      }
    })

  } catch (error) {
    console.error('Wireframe HTML generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération' },
      { status: 500 }
    )
  }
}
