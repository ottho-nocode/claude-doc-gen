'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { Project } from '@/types'
import { FolderPlus, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(t('error.server'))
    } else {
      setProjects(data || [])
    }
    setIsLoading(false)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error(t('error.unauthorized'))
      setIsCreating(false)
      return
    }

    const { error } = await supabase
      .from('projects')
      .insert({
        name: newProject.name,
        description: newProject.description || null,
        user_id: user.id,
      })

    if (error) {
      toast.error(t('error.server'))
    } else {
      toast.success(t('projects.created'))
      setIsModalOpen(false)
      setNewProject({ name: '', description: '' })
      fetchProjects()
    }
    setIsCreating(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t('projects.deleteConfirm'))) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      toast.error(t('error.delete'))
    } else {
      toast.success(t('projects.deleted'))
      fetchProjects()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
          <p className="text-gray-600 mt-1">{t('projects.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('projects.new')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('projects.empty')}</h3>
            <p className="text-gray-600 mb-4">{t('projects.emptyDesc')}</p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('projects.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{project.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {t('projects.createdAt')} {formatDate(project.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('projects.modal.title')}</CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <Input
                  label={t('projects.modal.name')}
                  placeholder={t('projects.modal.namePlaceholder')}
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
                <Input
                  label={t('projects.modal.desc')}
                  placeholder={t('projects.modal.descPlaceholder')}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isCreating}>
                    {t('common.create')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
