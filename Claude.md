# DocGen SaaS - Spécifications Complètes

## 🎯 Objectif
Créer un SaaS qui transforme des transcriptions de réunions clients en documentation technique (user stories, user flows, cahier des charges, prompts écrans) via Claude AI.

## 🛠 Stack Technique
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth & DB**: Supabase (PostgreSQL + Auth)
- **LLM**: Claude API (Anthropic) - model claude-sonnet-4-20250514
- **Packages**: @supabase/ssr, @anthropic-ai/sdk, lucide-react, react-dropzone, react-hot-toast, mammoth (parse docx), docx (export docx)

## 📁 Structure des Dossiers
```
src/
├── app/
│   ├── page.tsx                    # Landing page marketing
│   ├── layout.tsx                  # Root layout avec Toaster
│   ├── globals.css                 # Tailwind imports
│   ├── (auth)/
│   │   ├── login/page.tsx          # Page connexion
│   │   └── register/page.tsx       # Page inscription
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout avec Navbar (vérifie auth)
│   │   ├── projects/page.tsx       # Liste des projets + création
│   │   ├── project/[id]/page.tsx   # Détail projet: upload + génération
│   │   └── settings/page.tsx       # Paramètres compte + plan
│   └── api/
│       ├── upload/route.ts         # POST: upload fichier (parse DOCX)
│       ├── generate/route.ts       # POST: génère doc via Claude
│       └── export/route.ts         # GET: export DOCX
├── components/
│   ├── ui/
│   │   ├── button.tsx              # Button avec variants + isLoading
│   │   ├── input.tsx               # Input avec label + error
│   │   ├── card.tsx                # Card, CardHeader, CardTitle, CardContent, CardFooter
│   │   └── index.ts                # Exports
│   └── layout/
│       ├── navbar.tsx              # Navigation avec profil + crédits
│       ├── footer.tsx              # Footer simple
│       └── index.ts                # Exports
├── lib/
│   ├── utils.ts                    # cn(), formatDate(), formatDateTime(), truncate()
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   ├── server.ts               # createServerClient (pour Server Components)
│   │   └── middleware.ts           # updateSession (refresh token + protection routes)
│   ├── claude/
│   │   ├── client.ts               # getAnthropicClient(), generateWithClaude()
│   │   └── prompts.ts              # PROMPTS par type + buildPrompt()
│   └── parsers/
│       ├── docx.ts                 # parseDocx() - mammoth
│       └── export-docx.ts          # markdownToDocx() - docx package
├── types/
│   └── index.ts                    # Types + PLAN_LIMITS + DOCUMENT_TYPE_LABELS
└── middleware.ts                   # Next.js middleware (appelle updateSession)
```

## 🗄 Schéma Base de Données (Supabase)
```sql
-- profiles (créé auto à l'inscription via trigger)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  credits_remaining INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- projects
projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- transcriptions (fichiers uploadés)
transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
)

-- documents (générés par IA)
documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('user_stories', 'user_flows', 'cahier_charges', 'screens_prompts')),
  content TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
)

-- RLS Policies: chaque user ne voit que ses propres données
-- Trigger: créer profile automatiquement après signup
```

## 📝 Types TypeScript
```typescript
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

export const PLAN_LIMITS = {
  free: { credits: 3, maxProjects: 1, features: ['3 générations/mois', '1 projet', 'Export MD'] },
  pro: { credits: 50, maxProjects: -1, features: ['50 générations/mois', 'Projets illimités', 'Export MD + DOCX'] },
  enterprise: { credits: -1, maxProjects: -1, features: ['Illimité', 'API access', 'Support prioritaire'] }
}

export const DOCUMENT_TYPE_LABELS = {
  user_stories: { label: 'User Stories', icon: '📋', description: 'Stories agile' },
  user_flows: { label: 'User Flows', icon: '🔀', description: 'Diagrammes Mermaid' },
  cahier_charges: { label: 'Cahier des charges', icon: '📄', description: 'Specs techniques' },
  screens_prompts: { label: 'Prompts écrans', icon: '🖥️', description: 'UI descriptions' }
}
```

## 🔐 Authentification

- Utiliser `@supabase/ssr` pour gérer les cookies
- `src/lib/supabase/client.ts`: createBrowserClient (côté client)
- `src/lib/supabase/server.ts`: createServerClient (côté serveur)
- `src/middleware.ts`: protège routes /projects, /project/*, /settings
- Redirige vers /login si pas connecté
- Redirige vers /projects si déjà connecté et sur /login ou /register

## 🎨 Pages UI

### Landing (/)
- Header avec logo + boutons Connexion/Inscription
- Hero: titre accrocheur + CTA
- Section "Comment ça marche" (3 étapes: Upload, IA génère, Télécharger)
- Section pricing (3 plans: Free, Pro, Enterprise)
- Footer simple

### Login (/login)
- Formulaire email + password
- Lien vers inscription
- Toast sur erreur/succès

### Register (/register)
- Formulaire nom + email + password + confirmation
- Lien vers connexion
- Toast sur erreur/succès

### Projects (/projects)
- Liste des projets en cards (grille)
- Bouton "Nouveau projet" ouvre modal
- Chaque card: nom, date, bouton supprimer
- Clic sur card → /project/[id]

### Project Detail (/project/[id])
- Bouton retour vers /projects
- Titre du projet
- 2 colonnes:
  - Gauche: Transcriptions
    - Zone drag & drop (react-dropzone) pour upload MD/TXT/DOCX
    - Liste des fichiers uploadés avec bouton supprimer
  - Droite: Documents générés
    - 4 boutons de génération (un par type)
    - Liste des documents générés avec:
      - Bouton "Voir" (ouvre modal preview)
      - Bouton "Download MD"
    - Si aucun doc: message "Aucun document"

### Settings (/settings)
- Section Profil: email (disabled) + nom (editable) + bouton sauvegarder
- Section Abonnement: plan actuel + crédits restants + 3 cards de plans

## 🔌 API Routes

### POST /api/upload
- Reçoit FormData avec file + projectId
- Parse DOCX avec mammoth si .docx
- Sinon lit comme texte
- Insert dans table transcriptions
- Retourne { success: true }

### POST /api/generate
- Reçoit { project_id, document_type }
- Vérifie auth + ownership du projet
- Vérifie crédits (si pas -1 et <= 0 → erreur 403)
- Récupère toutes les transcriptions du projet
- Construit prompt avec buildPrompt()
- Appelle generateWithClaude()
- Supprime ancien doc du même type (si existe)
- Insert nouveau doc
- Décrémente crédits (si pas -1)
- Retourne { success: true }

### GET /api/export
- Query params: id (document id) + format (md ou docx)
- Vérifie auth
- Récupère document
- Si format=docx: utilise markdownToDocx() et retourne buffer
- Sinon retourne content en text/markdown

## 🤖 Prompts Claude

Chaque type de document a un prompt spécifique qui guide Claude sur le format attendu:

- **user_stories**: Format agile avec "En tant que / Je veux / Afin de" + critères d'acceptation
- **user_flows**: Diagrammes Mermaid flowchart
- **cahier_charges**: Structure avec Contexte, Fonctionnalités, Exigences
- **screens_prompts**: Description d'écrans avec composants, URL, états

Le prompt final combine: instructions du type + nom du projet + toutes les transcriptions

## 📦 package.json dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "lucide-react": "^0.460.0",
    "mammoth": "^1.8.0",
    "docx": "^9.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "react-dropzone": "^14.2.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

## 🔑 Variables d'environnement (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Déploiement

1. Push sur GitHub
2. Importer sur Vercel
3. Ajouter variables d'environnement
4. Configurer Supabase:
   - Exécuter la migration SQL
   - Ajouter URL Vercel dans Authentication > URL Configuration

## ✅ Checklist

- [ ] Config: package.json, tsconfig.json, tailwind.config.ts, next.config.js, postcss.config.js
- [ ] Types: src/types/index.ts
- [ ] Utils: src/lib/utils.ts
- [ ] Supabase: client.ts, server.ts, middleware.ts
- [ ] Middleware: src/middleware.ts
- [ ] Claude: client.ts, prompts.ts
- [ ] Parsers: docx.ts, export-docx.ts
- [ ] Components UI: button, input, card
- [ ] Components Layout: navbar, footer
- [ ] App: globals.css, layout.tsx
- [ ] Pages: landing, login, register
- [ ] Dashboard: layout, projects, project/[id], settings
- [ ] API: upload, generate, export
- [ ] SQL: migration avec tables + RLS + trigger