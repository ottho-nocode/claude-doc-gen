import { createClient } from '@/lib/supabase/server'
import { markdownToDocx } from '@/lib/parsers/export-docx'
import { DOCUMENT_TYPE_LABELS, DocumentType } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('id')
    const format = searchParams.get('format') as 'md' | 'docx'

    if (!documentId || !format) {
      return NextResponse.json({ error: 'id et format requis' }, { status: 400 })
    }

    // Get document with project info
    const { data: document } = await supabase
      .from('documents')
      .select('*, projects(user_id, name)')
      .eq('id', documentId)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    // Check ownership through project
    const project = document.projects as { user_id: string; name: string }
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    const filename = `${DOCUMENT_TYPE_LABELS[document.type as DocumentType].label}`

    if (format === 'docx') {
      const buffer = await markdownToDocx(document.content, filename)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}.docx"`,
        },
      })
    }

    // MD format
    return new NextResponse(document.content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}.md"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
