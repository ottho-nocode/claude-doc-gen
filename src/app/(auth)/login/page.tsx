'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success(t('auth.loginSuccess'))
    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">DocGen</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h1>
          <p className="text-gray-600 mt-2">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('auth.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 mt-6">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  )
}
