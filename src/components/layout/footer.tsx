'use client'

import { useI18n } from '@/lib/i18n'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">DocGen</span>
          </div>

          <div className="flex gap-8">
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              {t('footer.legal')}
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              {t('footer.privacy')}
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              {t('footer.contact')}
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            © 2024 DocGen. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
