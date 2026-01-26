'use client'

import { createClient } from '@/lib/supabase/client'
import { useI18n, Locale } from '@/lib/i18n'
import { Profile } from '@/types'
import { FileText, Globe, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale, setLocale, localeNames } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) setProfile(data)
      }
    }
    fetchProfile()
  }, [supabase])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(t('error.logout'))
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/projects" className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">DocGen</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full">
                <span className="text-sm font-medium text-primary-700">
                  {profile.credits_remaining === -1 ? t('common.unlimited') : `${profile.credits_remaining} ${t('common.credits')}`}
                </span>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {locale.toUpperCase()}
                </span>
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {(Object.keys(localeNames) as Locale[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLocale(lang)
                        setIsLangMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                        locale === lang ? 'text-primary-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {localeNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    {t('navbar.settings')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
