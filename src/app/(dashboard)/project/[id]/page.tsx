'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { WireframeRenderer, HtmlWireframeRenderer } from '@/components/wireframe'
import { formatDateTime, truncate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { DocumentType, DOCUMENT_TYPE_LABELS, GeneratedDocument, Project, Transcription, Wireframe, WireframeScreen } from '@/types'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Download, Eye, Layout, Loader2, Trash2, Upload, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()
  const { t } = useI18n()

  const [project, setProject] = useState<Project | null>(null)
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [generatingType, setGeneratingType] = useState<DocumentType | null>(null)
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null)
  const [wireframe, setWireframe] = useState<Wireframe | null>(null)
  const [isGeneratingWireframe, setIsGeneratingWireframe] = useState(false)
  const [wireframePreview, setWireframePreview] = useState<WireframeScreen | null>(null)
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)

  // HTML Wireframes state
  const [htmlWireframes, setHtmlWireframes] = useState<Array<{
    screen_name: string
    screen_index: number
    html_content: string
  }>>([])
  const [availableScreens, setAvailableScreens] = useState<Array<{ index: number; name: string }>>([])
  const [selectedScreenIndexes, setSelectedScreenIndexes] = useState<number[]>([])
  const [selectedHtmlScreen, setSelectedHtmlScreen] = useState<number>(0)
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false)
  const [generatingScreens, setGeneratingScreens] = useState<Record<number, 'pending' | 'generating' | 'done' | 'error'>>({})

  const fetchData = useCallback(async () => {
    const [projectRes, transcriptionsRes, documentsRes, wireframeRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('transcriptions').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
      supabase.from('documents').select('*').eq('project_id', projectId).order('generated_at', { ascending: false }),
      supabase.from('wireframes').select('*').eq('project_id', projectId).maybeSingle(),
    ])

    if (projectRes.data) setProject(projectRes.data)
    if (transcriptionsRes.data) setTranscriptions(transcriptionsRes.data)
    if (documentsRes.data) setDocuments(documentsRes.data)
    if (wireframeRes.data) setWireframe(wireframeRes.data)
    setIsLoading(false)
  }, [projectId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch available screens and existing wireframes
  const fetchScreensAndWireframes = useCallback(async () => {
    try {
      const response = await fetch(`/api/wireframe-html?project_id=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableScreens(data.screens || [])
        setHtmlWireframes((data.wireframes || []).map((w: { screen_name: string; screen_index: number; html_content: string }) => ({
          screen_name: w.screen_name,
          screen_index: w.screen_index,
          html_content: w.html_content
        })))
      }
    } catch (error) {
      console.error('Error fetching screens:', error)
    }
  }, [projectId])

  useEffect(() => {
    fetchScreensAndWireframes()
  }, [fetchScreensAndWireframes])

  // Generate HTML wireframes for selected screens (all in parallel with individual progress)
  const handleGenerateHtmlWireframes = async () => {
    if (!hasScreensPrompts) {
      toast.error(t('wireframe.noScreensPrompts'))
      return
    }

    if (selectedScreenIndexes.length === 0) {
      toast.error('Sélectionnez au moins un écran')
      return
    }

    setIsGeneratingHtml(true)

    // Initialize all selected screens as "generating"
    const initialStatus: Record<number, 'pending' | 'generating' | 'done' | 'error'> = {}
    selectedScreenIndexes.forEach(idx => {
      initialStatus[idx] = 'generating'
    })
    setGeneratingScreens(initialStatus)

    // Generate all screens in parallel
    const generateScreen = async (screenIndex: number) => {
      try {
        const response = await fetch('/api/wireframe-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            screen_index: screenIndex
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setGeneratingScreens(prev => ({ ...prev, [screenIndex]: 'error' }))
          return null
        }

        // Update status to done
        setGeneratingScreens(prev => ({ ...prev, [screenIndex]: 'done' }))

        // Update wireframes state
        if (data.wireframe) {
          setHtmlWireframes(prev => {
            const newWireframes = prev.filter(w => w.screen_index !== screenIndex)
            newWireframes.push({
              screen_name: data.wireframe.screen_name,
              screen_index: data.wireframe.screen_index,
              html_content: data.wireframe.html_content
            })
            return newWireframes.sort((a, b) => a.screen_index - b.screen_index)
          })
          return data.wireframe
        }
        return null
      } catch (error) {
        console.error(`Error generating screen ${screenIndex}:`, error)
        setGeneratingScreens(prev => ({ ...prev, [screenIndex]: 'error' }))
        return null
      }
    }

    // Run all generations in parallel
    const results = await Promise.all(selectedScreenIndexes.map(generateScreen))
    const successCount = results.filter(r => r !== null).length

    if (successCount > 0) {
      toast.success(`${successCount} maquette(s) générée(s)`)
      // Select the first successful screen
      const firstSuccess = results.find(r => r !== null)
      if (firstSuccess) {
        setSelectedHtmlScreen(firstSuccess.screen_index)
      }
    } else {
      toast.error('Aucune maquette générée')
    }

    setSelectedScreenIndexes([])
    setIsGeneratingHtml(false)
    // Keep generating screens status visible for a moment then clear
    setTimeout(() => setGeneratingScreens({}), 2000)
  }

  // Toggle screen selection
  const toggleScreenSelection = (index: number) => {
    setSelectedScreenIndexes(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // Select/deselect all screens
  const toggleAllScreens = () => {
    if (selectedScreenIndexes.length === availableScreens.length) {
      setSelectedScreenIndexes([])
    } else {
      setSelectedScreenIndexes(availableScreens.map(s => s.index))
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('error.upload'))
        }
        successCount++
      } catch (error) {
        errorCount++
        console.error(`Error upload ${file.name}:`, error)
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} ${t('project.uploadSuccess')}`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} ${t('project.uploadError')}`)
    }

    fetchData()
    setIsUploading(false)
  }, [projectId, fetchData, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  })

  const handleDeleteTranscription = async (id: string) => {
    const { error } = await supabase.from('transcriptions').delete().eq('id', id)
    if (error) {
      toast.error(t('error.delete'))
    } else {
      toast.success(t('project.deleted'))
      fetchData()
    }
  }

  const handleGenerate = async (type: DocumentType) => {
    if (transcriptions.length === 0) {
      toast.error(t('project.generateError'))
      return
    }

    setGeneratingType(type)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, document_type: type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('error.generate'))
      }

      toast.success(t('project.generateSuccess'))
      fetchData()
      // Refresh screens list if we generated screens_prompts
      if (type === 'screens_prompts') {
        fetchScreensAndWireframes()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error.generate'))
    }
    setGeneratingType(null)
  }

  const handleDownload = async (doc: GeneratedDocument, format: 'md' | 'docx') => {
    try {
      const response = await fetch(`/api/export?id=${doc.id}&format=${format}`)

      if (!response.ok) {
        throw new Error(t('error.export'))
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${DOCUMENT_TYPE_LABELS[doc.type].label}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error(t('error.export'))
    }
  }

  const hasScreensPrompts = documents.some(doc => doc.type === 'screens_prompts')

  const handleGenerateWireframe = async () => {
    if (!hasScreensPrompts) {
      toast.error(t('wireframe.noScreensPrompts'))
      return
    }

    setIsGeneratingWireframe(true)

    try {
      const response = await fetch('/api/wireframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('wireframe.error'))
      }

      toast.success(t('wireframe.success'))
      setWireframe(data.wireframe)
      setCurrentScreenIndex(0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('wireframe.error'))
    }
    setIsGeneratingWireframe(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">{t('project.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('project.backToProjects')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Transcriptions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('project.transcriptions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {isDragActive
                        ? t('project.dropzoneActive')
                        : t('project.dropzone')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{t('project.dropzoneHint')}</p>
                  </>
                )}
              </div>

              {transcriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('project.noTranscriptions')}
                </p>
              ) : (
                <div className="space-y-2">
                  {transcriptions.map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{tr.filename}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(tr.uploaded_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTranscription(tr.id)}
                        className="p-1 text-gray-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('project.documents')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleGenerate(type)}
                    disabled={generatingType !== null || transcriptions.length === 0}
                    isLoading={generatingType === type}
                    className="justify-start gap-2"
                  >
                    <span>{DOCUMENT_TYPE_LABELS[type].icon}</span>
                    <span className="truncate">{t(`docType.${type}`)}</span>
                  </Button>
                ))}
              </div>

              {documents.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('project.noDocuments')}
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{DOCUMENT_TYPE_LABELS[doc.type].icon}</span>
                          <span className="font-medium text-gray-900">
                            {t(`docType.${doc.type}`)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(doc.generated_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {truncate(doc.content, 150)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.view')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc, 'md')}
                          className="gap-1"
                        >
                          <Download className="w-4 h-4" />
                          MD
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc, 'docx')}
                          className="gap-1"
                        >
                          <Download className="w-4 h-4" />
                          DOCX
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wireframe Section - HTML/Tailwind */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  {t('wireframe.title')}
                </CardTitle>
                <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-medium rounded-full">
                  HTML + Tailwind
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!hasScreensPrompts ? (
              <p className="text-center text-amber-600 bg-amber-50 p-4 rounded-lg">
                {t('wireframe.noScreensPrompts')}
              </p>
            ) : availableScreens.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement des écrans...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Screen selection */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Sélectionner les écrans à générer</h4>
                    <button
                      onClick={toggleAllScreens}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedScreenIndexes.length === availableScreens.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableScreens.map((screen) => {
                      const isSelected = selectedScreenIndexes.includes(screen.index)
                      const hasWireframe = htmlWireframes.some(w => w.screen_index === screen.index)
                      const generationStatus = generatingScreens[screen.index]
                      const isGenerating = generationStatus === 'generating'
                      const isDone = generationStatus === 'done'
                      const isError = generationStatus === 'error'

                      return (
                        <label
                          key={screen.index}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            isGenerating
                              ? 'border-blue-400 bg-blue-50 cursor-wait'
                              : isDone
                              ? 'border-green-500 bg-green-50 cursor-default'
                              : isError
                              ? 'border-red-500 bg-red-50 cursor-default'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 cursor-pointer'
                              : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          {/* Status indicator or checkbox */}
                          {isGenerating ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                          ) : isDone ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : isError ? (
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                              <X className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScreenSelection(screen.index)}
                              disabled={isGeneratingHtml}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{screen.name}</p>
                            {isGenerating ? (
                              <p className="text-xs text-blue-600">Génération en cours...</p>
                            ) : isDone ? (
                              <p className="text-xs text-green-600">Générée avec succès</p>
                            ) : isError ? (
                              <p className="text-xs text-red-600">Erreur de génération</p>
                            ) : hasWireframe ? (
                              <p className="text-xs text-green-600">Maquette existante</p>
                            ) : null}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {selectedScreenIndexes.length} écran(s) sélectionné(s)
                    </p>
                    <Button
                      onClick={handleGenerateHtmlWireframes}
                      disabled={isGeneratingHtml || selectedScreenIndexes.length === 0}
                      isLoading={isGeneratingHtml}
                    >
                      {isGeneratingHtml
                        ? `Génération en cours...`
                        : `Générer ${selectedScreenIndexes.length} maquette(s)`}
                    </Button>
                  </div>
                </div>

                {/* Generated wireframes preview */}
                {htmlWireframes.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Maquettes générées</h4>
                    {/* Screen tabs */}
                    <div className="flex gap-2 flex-wrap">
                      {htmlWireframes.map((wf) => (
                        <button
                          key={wf.screen_index}
                          onClick={() => setSelectedHtmlScreen(wf.screen_index)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            selectedHtmlScreen === wf.screen_index
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {wf.screen_name}
                        </button>
                      ))}
                    </div>

                    {/* HTML Wireframe preview */}
                    {htmlWireframes.find(w => w.screen_index === selectedHtmlScreen) && (
                      <div className="flex justify-center py-4">
                        <HtmlWireframeRenderer
                          htmlContent={htmlWireframes.find(w => w.screen_index === selectedHtmlScreen)!.html_content}
                          screenName={htmlWireframes.find(w => w.screen_index === selectedHtmlScreen)!.screen_name}
                          isLoading={isGeneratingHtml}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <span>{DOCUMENT_TYPE_LABELS[previewDoc.type].icon}</span>
                {t(`docType.${previewDoc.type}`)}
              </CardTitle>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="overflow-auto flex-1">
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-base font-medium text-gray-800 mb-2 mt-3">{children}</h4>,
                    p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                    pre: ({ children }) => <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-3 text-sm">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                    hr: () => <hr className="my-6 border-gray-300" />,
                    table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 mb-3">{children}</table>,
                    th: ({ children }) => <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>,
                    td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
                  }}
                >
                  {previewDoc.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
