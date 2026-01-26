import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v0 } from 'v0-sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, screen_index = 0 } = body

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    // Vérifier les crédits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits_remaining <= 0) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 403 })
    }

    // Récupérer le document screens_prompts
    const { data: screensDoc, error: docError } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', project_id)
      .eq('type', 'screens_prompts')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (docError || !screensDoc) {
      return NextResponse.json(
        { error: 'Document Prompts Écrans non trouvé. Générez-le d\'abord.' },
        { status: 404 }
      )
    }

    // Parser les écrans depuis le document
    const screens = parseScreensFromContent(screensDoc.content)

    if (screens.length === 0) {
      return NextResponse.json(
        { error: 'Aucun écran trouvé dans le document' },
        { status: 400 }
      )
    }

    // Sélectionner l'écran à générer
    const screenToGenerate = screens[screen_index] || screens[0]

    // Créer le prompt pour v0
    const v0Prompt = buildV0Prompt(screenToGenerate)

    // Appeler v0 API
    const chat = await v0.chats.create({
      message: v0Prompt,
    })

    // Décrémenter les crédits
    await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id)

    // Sauvegarder le résultat
    const wireframeData = {
      project_id,
      screen_name: screenToGenerate.name,
      screen_index,
      v0_chat_id: chat.id,
      v0_demo_url: chat.demo,
      generated_at: new Date().toISOString(),
    }

    // Upsert dans la table wireframes_v0
    const { data: savedWireframe, error: saveError } = await supabase
      .from('wireframes_v0')
      .upsert(wireframeData, { onConflict: 'project_id,screen_index' })
      .select()
      .single()

    if (saveError) {
      console.error('Save error:', saveError)
      // On continue même si la sauvegarde échoue
    }

    return NextResponse.json({
      success: true,
      wireframe: {
        screen_name: screenToGenerate.name,
        screen_index,
        chat_id: chat.id,
        demo_url: chat.demo,
        total_screens: screens.length,
      },
      screens: screens.map((s, i) => ({ index: i, name: s.name })),
    })
  } catch (error) {
    console.error('v0 Wireframe generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur de génération' },
      { status: 500 }
    )
  }
}

// GET pour récupérer les wireframes existants
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    const { data: wireframes, error } = await supabase
      .from('wireframes_v0')
      .select('*')
      .eq('project_id', project_id)
      .order('screen_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wireframes: wireframes || [] })
  } catch (error) {
    console.error('Get wireframes error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

interface ParsedScreen {
  name: string
  description: string
  elements: string[]
}

function parseScreensFromContent(content: string): ParsedScreen[] {
  const screens: ParsedScreen[] = []

  // Pattern pour trouver les sections d'écran
  // Supporte plusieurs formats: ## Écran:, ### Écran, **Écran**, etc.
  const screenPatterns = [
    /#{1,3}\s*(?:Écran|Screen|Page)\s*(?:\d+)?[:\s]*([^\n]+)/gi,
    /\*\*(?:Écran|Screen|Page)\s*(?:\d+)?[:\s]*([^\n]+)\*\*/gi,
    /(?:Écran|Screen|Page)\s+(\d+)[:\s]*([^\n]+)/gi,
  ]

  // Diviser par sections
  const sections = content.split(/(?=#{1,3}\s*(?:Écran|Screen|Page))/i)

  for (const section of sections) {
    if (!section.trim()) continue

    // Extraire le nom de l'écran
    const nameMatch = section.match(/#{1,3}\s*(?:Écran|Screen|Page)\s*(?:\d+)?[:\s]*([^\n]+)/i)
      || section.match(/\*\*(?:Écran|Screen|Page)\s*(?:\d+)?[:\s]*([^\n]+)\*\*/i)

    if (nameMatch) {
      const name = nameMatch[1].trim().replace(/\*+/g, '')

      // Extraire la description (premier paragraphe après le titre)
      const descMatch = section.match(/(?:#{1,3}[^\n]+\n+)([^#\n][^\n]*)/i)
      const description = descMatch ? descMatch[1].trim() : ''

      // Extraire les éléments/composants mentionnés
      const elements: string[] = []
      const elementPatterns = [
        /[-*]\s+([^\n]+)/g,  // Listes à puces
        /\d+\.\s+([^\n]+)/g,  // Listes numérotées
      ]

      for (const pattern of elementPatterns) {
        let match
        while ((match = pattern.exec(section)) !== null) {
          elements.push(match[1].trim())
        }
      }

      screens.push({ name, description, elements })
    }
  }

  // Si aucun écran trouvé avec les patterns, créer un écran par défaut
  if (screens.length === 0 && content.trim()) {
    screens.push({
      name: 'Écran principal',
      description: content.substring(0, 500),
      elements: [],
    })
  }

  return screens
}

function buildV0Prompt(screen: ParsedScreen): string {
  let prompt = `Crée une interface utilisateur moderne et professionnelle pour: "${screen.name}"

Description: ${screen.description}

Exigences:
- Utilise React avec Tailwind CSS
- Design moderne, épuré et professionnel
- Responsive (mobile-first)
- Accessibilité (ARIA labels, contraste)
- Utilise des composants shadcn/ui si pertinent
`

  if (screen.elements.length > 0) {
    prompt += `
Éléments à inclure:
${screen.elements.map(e => `- ${e}`).join('\n')}
`
  }

  prompt += `
Style:
- Palette de couleurs moderne (bleu/indigo comme accent)
- Typographie claire et lisible
- Espacement généreux
- Ombres subtiles et bordures arrondies
- Icônes Lucide React pour les actions
`

  return prompt
}
