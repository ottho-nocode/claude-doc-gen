'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Button } from '@/components/ui'

interface V0WireframeRendererProps {
  demoUrl: string
  screenName: string
  chatId: string
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'

const deviceSizes: Record<DeviceType, { width: number; height: number; label: string }> = {
  mobile: { width: 390, height: 844, label: 'Mobile' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  desktop: { width: 1280, height: 800, label: 'Desktop' },
}

export function V0WireframeRenderer({ demoUrl, screenName, chatId }: V0WireframeRendererProps) {
  const [device, setDevice] = useState<DeviceType>('mobile')
  const [isLoading, setIsLoading] = useState(true)
  const [key, setKey] = useState(0) // For forcing iframe reload

  const currentSize = deviceSizes[device]

  const handleRefresh = () => {
    setIsLoading(true)
    setKey(prev => prev + 1)
  }

  const DeviceIcon = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
  }[device]

  return (
    <div className="flex flex-col items-center">
      {/* Device selector */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
        {(Object.keys(deviceSizes) as DeviceType[]).map((d) => {
          const Icon = { mobile: Smartphone, tablet: Tablet, desktop: Monitor }[d]
          return (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                device === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {deviceSizes[d].label}
            </button>
          )
        })}
      </div>

      {/* Device frame */}
      <div
        className={`relative bg-gray-900 rounded-[2rem] p-3 shadow-2xl transition-all duration-300 ${
          device === 'mobile' ? 'rounded-[2.5rem]' : device === 'tablet' ? 'rounded-[1.5rem]' : 'rounded-xl'
        }`}
        style={{
          width: currentSize.width + 24,
          height: currentSize.height + (device === 'desktop' ? 48 : 24),
        }}
      >
        {/* Notch for mobile */}
        {device === 'mobile' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10 flex items-center justify-center">
            <div className="w-16 h-4 bg-black rounded-full" />
          </div>
        )}

        {/* Camera for tablet */}
        {device === 'tablet' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full z-10" />
        )}

        {/* Browser bar for desktop */}
        {device === 'desktop' && (
          <div className="bg-gray-800 rounded-t-lg px-4 py-2 flex items-center gap-2 mb-1">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 truncate ml-2">
              {demoUrl}
            </div>
          </div>
        )}

        {/* Iframe container */}
        <div
          className={`bg-white overflow-hidden relative ${
            device === 'mobile' ? 'rounded-[2rem]' : device === 'tablet' ? 'rounded-xl' : 'rounded-b-lg'
          }`}
          style={{
            width: currentSize.width,
            height: currentSize.height - (device === 'desktop' ? 24 : 0),
          }}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement de la maquette...</p>
              </div>
            </div>
          )}

          {/* v0 iframe */}
          <iframe
            key={key}
            src={demoUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            title={`Wireframe: ${screenName}`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Home indicator for mobile */}
        {device === 'mobile' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
        )}
      </div>

      {/* Screen info and actions */}
      <div className="mt-4 text-center">
        <h3 className="font-semibold text-gray-900">{screenName}</h3>
        <p className="text-xs text-gray-500 mt-1">Chat ID: {chatId}</p>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          className="gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(demoUrl, '_blank')}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir dans v0
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`https://v0.dev/chat/${chatId}`, '_blank')}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Éditer
        </Button>
      </div>
    </div>
  )
}
