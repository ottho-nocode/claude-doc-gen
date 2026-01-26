'use client'

import { Button } from '@/components/ui'
import { Footer } from '@/components/layout'
import { useI18n } from '@/lib/i18n'
import { ArrowRight, CheckCircle, FileText, Upload, Download, Sparkles, Globe } from 'lucide-react'
import Link from 'next/link'
import { Locale } from '@/lib/i18n'

export default function LandingPage() {
  const { t, locale, setLocale, localeNames } = useI18n()

  const planFeatures = {
    free: [t('plan.free.f1'), t('plan.free.f2'), t('plan.free.f3')],
    pro: [t('plan.pro.f1'), t('plan.pro.f2'), t('plan.pro.f3')],
    enterprise: [t('plan.enterprise.f1'), t('plan.enterprise.f2'), t('plan.enterprise.f3')],
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">DocGen</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{locale.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 hidden group-hover:block">
                  {(Object.keys(localeNames) as Locale[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLocale(lang)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                        locale === lang ? 'text-primary-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {localeNames[lang]}
                    </button>
                  ))}
                </div>
              </div>
              <Link href="/login">
                <Button variant="ghost">{t('auth.login')}</Button>
              </Link>
              <Link href="/register">
                <Button>{t('auth.register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('landing.hero.title')}
            <span className="text-primary-600"> {t('landing.hero.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline">
                {t('landing.hero.pricing')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.howItWorks')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.step1.title')}</h3>
              <p className="text-gray-600">{t('landing.step1.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.step2.title')}</h3>
              <p className="text-gray-600">{t('landing.step2.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.step3.title')}</h3>
              <p className="text-gray-600">{t('landing.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.pricing.free')}</h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.freeDesc')}</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                0€<span className="text-lg font-normal text-gray-600">{t('landing.pricing.month')}</span>
              </p>
              <ul className="space-y-3 mb-8">
                {planFeatures.free.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  {t('landing.pricing.start')}
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 border-primary-500 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                {t('landing.pricing.popular')}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.pricing.pro')}</h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.proDesc')}</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                29€<span className="text-lg font-normal text-gray-600">{t('landing.pricing.month')}</span>
              </p>
              <ul className="space-y-3 mb-8">
                {planFeatures.pro.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full">
                  {t('landing.pricing.choosePro')}
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.pricing.enterprise')}</h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.enterpriseDesc')}</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                {t('landing.pricing.quote')}
              </p>
              <ul className="space-y-3 mb-8">
                {planFeatures.enterprise.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                {t('landing.pricing.contact')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
