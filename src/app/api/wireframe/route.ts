import { createClient } from '@/lib/supabase/server'
import { generateWithClaude } from '@/lib/claude/client'
import { buildWireframePrompt } from '@/lib/claude/prompts'
import { WireframeScreen } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id } = body as { project_id: string }

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    // Check project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
    }

    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    if (profile.credits_remaining !== -1 && profile.credits_remaining <= 0) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 403 })
    }

    // Get screens_prompts document
    const { data: screenDoc } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', project_id)
      .eq('type', 'screens_prompts')
      .single()

    if (!screenDoc) {
      return NextResponse.json(
        { error: 'Générez d\'abord les Prompts Écrans' },
        { status: 400 }
      )
    }

    // Generate wireframes via Claude
    const prompt = buildWireframePrompt(screenDoc.content)
    const wireframeJson = await generateWithClaude(prompt)

    // Parse and validate JSON
    let wireframes: { screens: WireframeScreen[] }
    try {
      // Clean potential markdown code blocks
      const cleanJson = wireframeJson
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      wireframes = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', wireframeJson)
      return NextResponse.json(
        { error: 'Erreur de parsing JSON. Réessayez.' },
        { status: 500 }
      )
    }

    // Validate structure
    if (!wireframes.screens || !Array.isArray(wireframes.screens)) {
      return NextResponse.json(
        { error: 'Structure de wireframe invalide' },
        { status: 500 }
      )
    }

    // Delete existing wireframe for this project
    await supabase
      .from('wireframes')
      .delete()
      .eq('project_id', project_id)

    // Insert new wireframe
    const { data, error: insertError } = await supabase
      .from('wireframes')
      .insert({
        project_id,
        screens: wireframes.screens,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // Decrement credits
    if (profile.credits_remaining !== -1) {
      await supabase
        .from('profiles')
        .update({ credits_remaining: profile.credits_remaining - 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true, wireframe: data })
  } catch (error) {
    console.error('Wireframe generation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 })
    }

    // Get wireframe
    const { data: wireframe } = await supabase
      .from('wireframes')
      .select('*')
      .eq('project_id', project_id)
      .single()

    if (!wireframe) {
      return NextResponse.json({ wireframe: null })
    }

    return NextResponse.json({ wireframe })
  } catch (error) {
    console.error('Get wireframe error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
