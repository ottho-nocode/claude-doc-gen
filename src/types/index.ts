export type UserPlan = 'free' | 'pro' | 'enterprise'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: UserPlan
  credits_remaining: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Transcription {
  id: string
  project_id: string
  filename: string
  content: string
  uploaded_at: string
}

export type DocumentType = 'user_stories' | 'user_flows' | 'cahier_charges' | 'screens_prompts'

export interface GeneratedDocument {
  id: string
  project_id: string
  type: DocumentType
  content: string
  generated_at: string
}

export const PLAN_LIMITS: Record<UserPlan, { credits: number; maxProjects: number; features: string[] }> = {
  free: {
    credits: 3,
    maxProjects: 1,
    features: ['3 générations/mois', '1 projet', 'Export MD']
  },
  pro: {
    credits: 50,
    maxProjects: -1,
    features: ['50 générations/mois', 'Projets illimités', 'Export MD + DOCX']
  },
  enterprise: {
    credits: -1,
    maxProjects: -1,
    features: ['Illimité', 'API access', 'Support prioritaire']
  }
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { label: string; icon: string; description: string }> = {
  user_stories: { label: 'User Stories', icon: '📋', description: 'Stories agile' },
  user_flows: { label: 'User Flows', icon: '🔀', description: 'Diagrammes Mermaid' },
  cahier_charges: { label: 'Cahier des charges', icon: '📄', description: 'Specs techniques' },
  screens_prompts: { label: 'Prompts écrans', icon: '🖥️', description: 'UI descriptions' }
}

// Wireframe Types
export type WireframeElementType =
  | 'header'
  | 'nav'
  | 'button'
  | 'input'
  | 'text'
  | 'image'
  | 'card'
  | 'list'
  | 'container'
  | 'form'
  | 'table'
  | 'modal'
  | 'tabs'
  | 'sidebar'
  | 'avatar'
  | 'badge'
  | 'icon'
  | 'divider'
  | 'progress'
  | 'toggle'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'

export interface WireframeElement {
  id: string
  type: WireframeElementType
  label?: string
  placeholder?: string
  children?: WireframeElement[]
  items?: Array<{ title: string; subtitle?: string; image?: boolean; label?: string }>
  props?: {
    width?: 'full' | 'half' | 'third' | 'auto'
    height?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    weight?: 'normal' | 'medium' | 'semibold' | 'bold'
    padding?: 'sm' | 'md' | 'lg' | 'xl'
    fullWidth?: boolean
    checked?: boolean
    value?: number
    type?: string
    columns?: number
    rows?: number
  }
}

export interface WireframeScreen {
  id: string
  name: string
  description: string
  route?: string
  elements: WireframeElement[]
}

export interface Wireframe {
  id: string
  project_id: string
  screens: WireframeScreen[]
  generated_at: string
}
