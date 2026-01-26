'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('auth.nameRequired')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired')
    }

    if (formData.password.length < 6) {
      newErrors.password = t('auth.passwordMinLength')
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success(t('auth.registerSuccess'))
    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">DocGen</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
          <p className="text-gray-600 mt-2">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.fullName')}
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                error={errors.fullName}
                required
              />
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('auth.registerButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 mt-6">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
