'use client'

import { useState, useMemo } from 'react'
import { Smartphone, Monitor, Tablet, RefreshCw, Code, Eye, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui'

interface HtmlWireframeRendererProps {
  htmlContent: string
  screenName: string
  onRefresh?: () => void
  isLoading?: boolean
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'
type ViewMode = 'preview' | 'code'

const deviceSizes: Record<DeviceType, { width: number; height: number; label: string }> = {
  mobile: { width: 390, height: 844, label: 'Mobile' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  desktop: { width: 1280, height: 800, label: 'Desktop' },
}

export function HtmlWireframeRenderer({
  htmlContent,
  screenName,
  onRefresh,
  isLoading = false
}: HtmlWireframeRendererProps) {
  const [device, setDevice] = useState<DeviceType>('mobile')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [copied, setCopied] = useState(false)

  const currentSize = deviceSizes[device]

  // Build full HTML document with Tailwind
  const fullHtml = useMemo(() => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: #ffffff;
      min-height: 100vh;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 2px; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `.trim(), [htmlContent])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(htmlContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Controls bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4">
        {/* Device selector */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
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
                <span className="hidden sm:inline">{deviceSizes[d].label}</span>
              </button>
            )
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'code'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
        </div>
      </div>

      {/* Preview or Code view */}
      {viewMode === 'preview' ? (
        // Device frame with preview
        <div
          className={`relative bg-gray-900 shadow-2xl transition-all duration-300 ${
            device === 'mobile' ? 'rounded-[2.5rem] p-3' :
            device === 'tablet' ? 'rounded-[1.5rem] p-3' :
            'rounded-xl p-2'
          }`}
          style={{
            width: currentSize.width + (device === 'desktop' ? 16 : 24),
            height: currentSize.height + (device === 'desktop' ? 48 : 24),
          }}
        >
          {/* Notch for mobile */}
          {device === 'mobile' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-b-2xl z-10 flex items-center justify-center">
              <div className="w-20 h-5 bg-black rounded-full flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-gray-800 rounded-full" />
              </div>
            </div>
          )}

          {/* Camera for tablet */}
          {device === 'tablet' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full z-10" />
          )}

          {/* Browser bar for desktop */}
          {device === 'desktop' && (
            <div className="bg-gray-800 rounded-t-lg px-4 py-2 flex items-center gap-2 mb-0.5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 truncate ml-2">
                wireframe.app/{screenName.toLowerCase().replace(/\s+/g, '-')}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-[inherit]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Génération en cours...</p>
              </div>
            </div>
          )}

          {/* Iframe container */}
          <div
            className={`bg-white overflow-hidden ${
              device === 'mobile' ? 'rounded-[2rem]' :
              device === 'tablet' ? 'rounded-xl' :
              'rounded-b-lg'
            }`}
            style={{
              width: currentSize.width,
              height: currentSize.height - (device === 'desktop' ? 32 : 0),
            }}
          >
            <iframe
              srcDoc={fullHtml}
              className="w-full h-full border-0"
              title={`Wireframe: ${screenName}`}
              sandbox="allow-scripts"
            />
          </div>

          {/* Home indicator for mobile */}
          {device === 'mobile' && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
          )}
        </div>
      ) : (
        // Code view
        <div
          className="w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden"
          style={{ height: currentSize.height }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
            <span className="text-sm text-gray-400">HTML + Tailwind CSS</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-auto h-[calc(100%-44px)]">
            <code>{htmlContent}</code>
          </pre>
        </div>
      )}

      {/* Screen info */}
      <div className="mt-4 text-center">
        <h3 className="font-semibold text-gray-900">{screenName}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {currentSize.width} × {currentSize.height}px
        </p>
      </div>

      {/* Actions */}
      {onRefresh && (
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Régénérer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier HTML'}
          </Button>
        </div>
      )}
    </div>
  )
}
