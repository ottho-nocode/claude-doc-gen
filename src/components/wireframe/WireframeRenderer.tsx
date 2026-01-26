'use client'

import { WireframeElement, WireframeScreen } from '@/types'
import { useRef } from 'react'
import { toPng, toSvg } from 'html-to-image'
import {
  Download, Image as ImageIcon, Menu, Search, User, Home, Settings,
  Bell, Plus, Edit, Trash2, Check, X, ArrowLeft, ArrowRight,
  Mail, Phone, Calendar, Star, Heart, Share2, Upload,
  ChevronDown
} from 'lucide-react'

interface WireframeRendererProps {
  screen: WireframeScreen
}

// Color palette for high-fidelity wireframes
const colors = {
  primary: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50' },
  secondary: { bg: 'bg-gray-600', text: 'text-gray-600', border: 'border-gray-600', light: 'bg-gray-50' },
  success: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', light: 'bg-green-50' },
  warning: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', light: 'bg-amber-50' },
  danger: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-600', light: 'bg-red-50' },
  info: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', light: 'bg-cyan-50' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-900', border: 'border-gray-900', light: 'bg-gray-100' },
  light: { bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-200', light: 'bg-gray-50' },
}

const iconMap: Record<string, React.ElementType> = {
  home: Home, search: Search, settings: Settings, user: User, bell: Bell,
  menu: Menu, plus: Plus, edit: Edit, trash: Trash2, check: Check,
  x: X, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, mail: Mail,
  phone: Phone, calendar: Calendar, star: Star, heart: Heart, share: Share2,
  download: Download, upload: Upload,
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
}

// High-fidelity wireframe element renderer
const WireframeNode = ({ element }: { element: WireframeElement }) => {
  const color = element.props?.color as keyof typeof colors || 'primary'
  const size = element.props?.size as keyof typeof sizeClasses || 'md'
  const colorScheme = colors[color] || colors.primary

  switch (element.type) {
    case 'header':
      return (
        <div className={`${colorScheme.bg} text-white p-4 mb-4 flex items-center justify-between rounded-t-lg`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">{element.label?.charAt(0) || 'A'}</span>
            </div>
            <span className="font-semibold">{element.label || 'App'}</span>
          </div>
          {element.children && element.children.length > 0 ? (
            <div className="flex gap-2">
              {element.children.map((child) => (
                <WireframeNode key={child.id} element={child} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <Bell className="w-5 h-5 opacity-80" />
              <div className="w-8 h-8 bg-white/20 rounded-full" />
            </div>
          )}
        </div>
      )

    case 'nav':
      return (
        <div className="bg-white border-b border-gray-200 p-3 mb-4 flex gap-4 items-center overflow-x-auto">
          {element.children ? (
            element.children.map((child) => (
              <WireframeNode key={child.id} element={child} />
            ))
          ) : (
            ['Accueil', 'Produits', 'Services', 'Contact'].map((item, i) => (
              <span
                key={i}
                className={`text-sm whitespace-nowrap ${i === 0 ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {item}
              </span>
            ))
          )}
        </div>
      )

    case 'button':
      const variant = element.props?.variant || 'primary'
      const fullWidth = element.props?.fullWidth
      const btnSize = element.props?.size || 'md'

      const btnClasses = {
        primary: `${colorScheme.bg} text-white hover:opacity-90`,
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        outline: `bg-transparent ${colorScheme.text} border-2 ${colorScheme.border}`,
        ghost: `bg-transparent ${colorScheme.text} hover:bg-gray-100`,
      }

      const btnSizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
      }

      return (
        <button
          className={`
            ${btnClasses[variant as keyof typeof btnClasses] || btnClasses.primary}
            ${btnSizeClasses[btnSize as keyof typeof btnSizeClasses] || btnSizeClasses.md}
            ${fullWidth ? 'w-full' : ''}
            rounded-lg font-medium transition-all inline-flex items-center justify-center gap-2
          `}
        >
          {element.label || 'Button'}
        </button>
      )

    case 'input':
      return (
        <div className="mb-3">
          {element.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
            </label>
          )}
          <input
            type={element.props?.type || 'text'}
            placeholder={element.placeholder || ''}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            readOnly
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="mb-3">
          {element.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
            </label>
          )}
          <textarea
            placeholder={element.placeholder || ''}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none"
            readOnly
          />
        </div>
      )

    case 'select':
      return (
        <div className="mb-3">
          {element.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
            </label>
          )}
          <div className="relative">
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none pr-10">
              <option>{element.placeholder || 'Sélectionner...'}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white flex items-center justify-center">
            {element.props?.checked && <Check className="w-3 h-3 text-blue-600" />}
          </div>
          <span className="text-sm text-gray-700">{element.label || 'Option'}</span>
        </label>
      )

    case 'radio':
      return (
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full bg-white flex items-center justify-center">
            {element.props?.checked && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
          </div>
          <span className="text-sm text-gray-700">{element.label || 'Option'}</span>
        </label>
      )

    case 'toggle':
      const isOn = element.props?.checked
      return (
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isOn ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isOn ? 'translate-x-4' : ''}`} />
          </div>
          {element.label && <span className="text-sm text-gray-700">{element.label}</span>}
        </div>
      )

    case 'text':
      const weight = element.props?.weight || 'normal'
      const weightClasses = {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      }
      return (
        <p className={`${sizeClasses[size]} ${colorScheme.text} ${weightClasses[weight as keyof typeof weightClasses]} mb-2`}>
          {element.label || 'Text content'}
        </p>
      )

    case 'image':
      const imgHeight = element.props?.height === 'lg' ? 'h-48' : element.props?.height === 'xl' ? 'h-64' : 'h-32'
      return (
        <div className={`bg-gradient-to-br from-gray-100 to-gray-200 ${imgHeight} rounded-lg mb-3 flex items-center justify-center`}>
          <ImageIcon className="w-10 h-10 text-gray-400" />
        </div>
      )

    case 'avatar':
      const avatarSize = element.props?.size || 'md'
      const avatarSizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' }
      return (
        <div className={`${avatarSizes[avatarSize as keyof typeof avatarSizes]} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold`}>
          {element.label?.charAt(0) || <User className="w-1/2 h-1/2" />}
        </div>
      )

    case 'badge':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorScheme.bg} text-white`}>
          {element.label || 'Badge'}
        </span>
      )

    case 'icon':
      const IconComponent = iconMap[element.label || 'home'] || Home
      const iconSizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6', xl: 'w-8 h-8' }
      return <IconComponent className={`${iconSizes[size as keyof typeof iconSizes]} ${colorScheme.text}`} />

    case 'divider':
      return <hr className="my-4 border-gray-200" />

    case 'progress':
      const progress = element.props?.value || 60
      return (
        <div className="mb-3">
          {element.label && <p className="text-sm text-gray-600 mb-1">{element.label}</p>}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${colorScheme.bg} rounded-full`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )

    case 'card':
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
          {element.children?.map((child) => (
            <WireframeNode key={child.id} element={child} />
          ))}
        </div>
      )

    case 'container':
      const padding = element.props?.padding || 'md'
      const paddingClasses = { sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' }
      return (
        <div className={`${paddingClasses[padding as keyof typeof paddingClasses] || 'p-4'} mb-2`}>
          {element.children?.map((child) => (
            <WireframeNode key={child.id} element={child} />
          ))}
        </div>
      )

    case 'list':
      const items = element.items || [
        { title: 'Item 1', subtitle: 'Description de l\'élément' },
        { title: 'Item 2', subtitle: 'Description de l\'élément' },
        { title: 'Item 3', subtitle: 'Description de l\'élément' },
      ]
      return (
        <div className="space-y-2 mb-4">
          {items.map((item: { title: string; subtitle?: string; image?: boolean }, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              {item.image && (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                {item.subtitle && <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      )

    case 'form':
      return (
        <div className="bg-white rounded-xl p-4 mb-3 space-y-1">
          {element.children?.map((child) => (
            <WireframeNode key={child.id} element={child} />
          ))}
        </div>
      )

    case 'table':
      return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="flex bg-gray-50 border-b border-gray-200 p-3 gap-4">
            {['Nom', 'Email', 'Statut', 'Actions'].map((h, i) => (
              <div key={i} className="flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex p-3 gap-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <div className="flex-1 text-sm text-gray-900">Jean Dupont</div>
              <div className="flex-1 text-sm text-gray-500">jean@email.com</div>
              <div className="flex-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Actif</span>
              </div>
              <div className="flex-1 flex gap-2">
                <Edit className="w-4 h-4 text-gray-400" />
                <Trash2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )

    case 'modal':
      return (
        <div className="bg-white rounded-2xl shadow-2xl p-5 mb-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{element.label || 'Modal Title'}</h3>
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {element.children?.map((child) => (
            <WireframeNode key={child.id} element={child} />
          ))}
        </div>
      )

    case 'tabs':
      const tabItems = (element.items || ['Tab 1', 'Tab 2', 'Tab 3']) as Array<string | { label?: string }>
      return (
        <div className="mb-4">
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {tabItems.map((tab, i: number) => (
              <button
                key={i}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  i === 0
                    ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {typeof tab === 'string' ? tab : (tab.label || `Tab ${i + 1}`)}
              </button>
            ))}
          </div>
          {element.children?.map((child) => (
            <WireframeNode key={child.id} element={child} />
          ))}
        </div>
      )

    case 'sidebar':
      return (
        <div className="bg-gray-900 text-white p-3 rounded-xl w-16 flex flex-col gap-2">
          {[Home, Search, Bell, Settings, User].map((Icon, i) => (
            <button
              key={i}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                i === 0 ? 'bg-blue-600' : 'hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )

    default:
      return (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-2">
          <span className="text-sm text-gray-500">{element.type}: {element.label}</span>
        </div>
      )
  }
}

export function WireframeRenderer({ screen }: WireframeRendererProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleExport = async (format: 'png' | 'svg') => {
    if (!ref.current) return

    try {
      const exportFn = format === 'png' ? toPng : toSvg
      const dataUrl = await exportFn(ref.current, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        cacheBust: true,
      })

      const link = document.createElement('a')
      link.download = `${screen.name.replace(/\s+/g, '-').toLowerCase()}.${format}`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Wireframe Preview */}
      <div
        ref={ref}
        className="bg-slate-50 p-2 rounded-2xl shadow-lg mx-auto border border-gray-200"
        style={{ width: '390px', minHeight: '700px' }}
      >
        {/* Phone frame */}
        <div className="bg-white rounded-[20px] overflow-hidden shadow-inner" style={{ minHeight: '680px' }}>
          {/* Status bar */}
          <div className="bg-gray-900 text-white px-4 py-1.5 flex justify-between items-center text-xs">
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-2 border border-white rounded-sm">
                <div className="w-3/4 h-full bg-white rounded-sm" />
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div className="bg-slate-50" style={{ minHeight: '650px' }}>
            {screen.elements.map((element) => (
              <WireframeNode key={element.id} element={element} />
            ))}
          </div>
        </div>
      </div>

      {/* Screen info */}
      <div className="text-center mt-4">
        <h3 className="font-semibold text-gray-900">{screen.name}</h3>
        <p className="text-sm text-gray-500">{screen.route}</p>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={() => handleExport('png')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          PNG
        </button>
        <button
          onClick={() => handleExport('svg')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          SVG
        </button>
      </div>
    </div>
  )
}
