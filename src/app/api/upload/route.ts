import { createClient } from '@/lib/supabase/server'
import { parseDocx } from '@/lib/parsers/docx'
import { parsePdf } from '@/lib/parsers/pdf'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Fichier et projectId requis' }, { status: 400 })
    }

    // Check project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Projet non trouve' }, { status: 404 })
    }

    // Parse file content
    let content: string

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      content = await parseDocx(arrayBuffer)
    } else if (file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer()
      content = await parsePdf(arrayBuffer)
    } else {
      content = await file.text()
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 })
    }

    // Insert transcription
    const { error } = await supabase
      .from('transcriptions')
      .insert({
        project_id: projectId,
        filename: file.name,
        content,
      })

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
