import { createClient } from '@/lib/supabase/server'
import { generateWithClaude } from '@/lib/claude/client'
import { buildPrompt } from '@/lib/claude/prompts'
import { DocumentType } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, document_type, tjm } = body as { project_id: string; document_type: DocumentType; tjm?: number }

    if (!project_id || !document_type) {
      return NextResponse.json({ error: 'project_id et document_type requis' }, { status: 400 })
    }

    // Check project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Projet non trouve' }, { status: 404 })
    }

    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouve' }, { status: 404 })
    }

    if (profile.credits_remaining !== -1 && profile.credits_remaining <= 0) {
      return NextResponse.json({ error: 'Credits insuffisants' }, { status: 403 })
    }

    // Get transcriptions
    const { data: transcriptions } = await supabase
      .from('transcriptions')
      .select('content')
      .eq('project_id', project_id)

    if (!transcriptions || transcriptions.length === 0) {
      return NextResponse.json({ error: 'Aucune transcription trouvee' }, { status: 400 })
    }

    // Build prompt and generate
    const prompt = buildPrompt(
      document_type,
      project.name,
      transcriptions.map((t) => t.content),
      { tjm }
    )

    const content = await generateWithClaude(prompt)

    // Delete existing document of same type
    await supabase
      .from('documents')
      .delete()
      .eq('project_id', project_id)
      .eq('type', document_type)

    // Insert new document
    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        project_id,
        type: document_type,
        content,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
    }

    // Decrement credits
    if (profile.credits_remaining !== -1) {
      await supabase
        .from('profiles')
        .update({ credits_remaining: profile.credits_remaining - 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
