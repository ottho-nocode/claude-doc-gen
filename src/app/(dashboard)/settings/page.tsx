'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { PLAN_LIMITS, Profile, UserPlan } from '@/types'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) {
          setProfile(data)
          setFullName(data.full_name || '')
        }
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      toast.error(t('error.save'))
    } else {
      toast.success(t('settings.saved'))
      setProfile({ ...profile, full_name: fullName })
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('settings.title')}</h1>

      <div className="space-y-8">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <Input
              label={t('auth.fullName')}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Button onClick={handleSave} isLoading={isSaving}>
              {t('common.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.subscription')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {t('settings.currentPlan')}: <span className="text-primary-600 capitalize">{profile?.plan}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {t('settings.creditsRemaining')}:{' '}
                  {profile?.credits_remaining === -1
                    ? t('common.unlimited')
                    : profile?.credits_remaining}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {(Object.keys(PLAN_LIMITS) as UserPlan[]).map((plan) => (
                <div
                  key={plan}
                  className={`p-4 rounded-lg border-2 ${
                    profile?.plan === plan
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 capitalize mb-2">{plan}</h3>
                  <ul className="space-y-1">
                    {PLAN_LIMITS[plan].features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {profile?.plan !== plan && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => toast.error(t('settings.contactForChange'))}
                    >
                      {plan === 'free' ? t('settings.downgrade') : t('settings.upgrade')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
