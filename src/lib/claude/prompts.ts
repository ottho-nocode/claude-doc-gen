import { DocumentType } from '@/types'

export const PROMPTS: Record<DocumentType, string> = {
  user_stories: `Tu es un expert en méthodologie Agile. À partir de la transcription de réunion client fournie, génère des User Stories complètes au format standard.

Pour chaque User Story, utilise le format suivant:
## US-[numéro]: [Titre court]

**En tant que** [type d'utilisateur]
**Je veux** [action/fonctionnalité]
**Afin de** [bénéfice/objectif]

### Critères d'acceptation
- [ ] [Critère 1]
- [ ] [Critère 2]
- [ ] [Critère 3]

### Priorité: [Haute/Moyenne/Basse]

---

Génère toutes les User Stories pertinentes identifiées dans la transcription. Assure-toi que chaque story est indépendante, négociable, de valeur, estimable, petite et testable (INVEST).`,

  user_flows: `Tu es un expert UX/UI et en conception de parcours utilisateur. À partir de la transcription de réunion client fournie, génère des diagrammes de flux utilisateur au format Mermaid.

Pour chaque parcours utilisateur majeur identifié, crée un diagramme flowchart Mermaid:

## [Nom du parcours]

\`\`\`mermaid
flowchart TD
    A[Point de départ] --> B{Décision}
    B -->|Oui| C[Action 1]
    B -->|Non| D[Action 2]
    C --> E[Fin]
    D --> E
\`\`\`

### Description
[Brève description du parcours et de son objectif]

### Points d'attention
- [Point important 1]
- [Point important 2]

---

Identifie tous les parcours utilisateurs clés mentionnés dans la transcription et crée un diagramme Mermaid pour chacun.`,

  cahier_charges: `Tu es un expert en rédaction de spécifications techniques. À partir de la transcription de réunion client fournie, génère un cahier des charges complet et structuré.

Utilise la structure suivante:

# Cahier des Charges - [Nom du Projet]

## 1. Contexte et Objectifs
### 1.1 Contexte
[Description du contexte du projet]

### 1.2 Objectifs
- [Objectif 1]
- [Objectif 2]

## 2. Périmètre du Projet
### 2.1 Dans le périmètre
- [Élément inclus 1]
- [Élément inclus 2]

### 2.2 Hors périmètre
- [Élément exclu 1]

## 3. Spécifications Fonctionnelles
### 3.1 [Module/Fonctionnalité 1]
**Description:** [Description détaillée]
**Règles de gestion:**
- [Règle 1]
- [Règle 2]

## 4. Exigences Non-Fonctionnelles
### 4.1 Performance
[Exigences de performance]

### 4.2 Sécurité
[Exigences de sécurité]

### 4.3 Compatibilité
[Exigences de compatibilité]

## 5. Contraintes Techniques
[Liste des contraintes identifiées]

## 6. Livrables Attendus
[Liste des livrables]

---

Complète chaque section avec les informations pertinentes extraites de la transcription.`,

  screens_prompts: `Tu es un expert en design d'interfaces utilisateur. À partir de la transcription de réunion client fournie, génère des descriptions détaillées d'écrans (prompts écrans) pour guider le développement UI.

Pour chaque écran identifié, utilise le format suivant:

## Écran: [Nom de l'écran]

### URL
\`/chemin/vers/ecran\`

### Description
[Description générale de l'écran et son objectif]

### Composants UI
| Composant | Type | Description | Actions |
|-----------|------|-------------|---------|
| [Nom] | [Button/Input/Card/...] | [Description] | [onClick/onChange/...] |

### Layout
- **Structure:** [Grid/Flex/Stack]
- **Responsive:** [Comportement mobile/tablet/desktop]

### États
- **État initial:** [Description]
- **État chargement:** [Description]
- **État erreur:** [Description]
- **État vide:** [Description]

### Données affichées
- [Donnée 1]: [Type et source]
- [Donnée 2]: [Type et source]

### Interactions utilisateur
1. [Interaction 1 et son résultat]
2. [Interaction 2 et son résultat]

---

Identifie tous les écrans mentionnés ou nécessaires d'après la transcription et génère une description complète pour chacun.`,

  chiffrage: `Tu es un expert en chiffrage de projets digitaux. À partir de la transcription de réunion client fournie, génère une estimation détaillée des coûts de développement au format JSON structuré.

RÈGLES STRICTES:
1. Identifie toutes les fonctionnalités mentionnées et regroupe-les en sections logiques
2. Pour chaque fonctionnalité, estime le nombre de jours de développement et un coefficient de complexité (1 = simple, 1.5 = moyen, 2 = complexe, 3 = très complexe)
3. Identifie les rôles utilisateurs mentionnés dans le projet
4. Sois réaliste dans tes estimations — ne sous-estime pas
5. Inclue les phases classiques : Design, Développement Front, Développement Back, Tests, Intégration, Déploiement

FORMAT DE SORTIE (JSON STRICT — pas de texte avant/après, pas de blocs markdown):
{
  "sections": [
    {
      "name": "Nom de la section",
      "features": [
        {
          "name": "Nom de la fonctionnalité",
          "role": "Rôle concerné ou Tous",
          "days": 1.5,
          "complexity": 1,
          "comment": "Détail optionnel"
        }
      ]
    }
  ],
  "roles": [
    {
      "name": "Nom du rôle",
      "description": "Description courte du rôle"
    }
  ]
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans aucun texte explicatif avant ou après, sans backticks markdown.
- "days" est le nombre de jours-homme estimé (peut être décimal : 0.5, 1, 1.5, 2, etc.)
- "complexity" est un multiplicateur : 1, 1.5, 2 ou 3
- Le total de jours réels par feature = days × complexity (le calcul sera fait côté code)
- Génère des estimations RÉALISTES et COMPLÈTES basées sur la transcription.`
}

export function buildPrompt(
  type: DocumentType,
  projectName: string,
  transcriptions: string[],
  options?: { tjm?: number }
): string {
  const systemPrompt = PROMPTS[type]
  const transcriptionsText = transcriptions.join('\n\n---\n\n')

  const tjmContext = type === 'chiffrage' && options?.tjm
    ? `\n\nNote: Le TJM (Taux Journalier Moyen) est de ${options.tjm}€/jour. Les calculs de prix seront faits côté code, tu dois uniquement estimer les jours et la complexité.`
    : ''

  return `${systemPrompt}

---

## Projet: ${projectName}

## Transcription(s) de réunion:

${transcriptionsText}

---
${tjmContext}
Génère maintenant la documentation demandée en français, de manière complète et professionnelle.`
}

// Wireframe Generation Prompt
export const WIREFRAME_PROMPT = `Tu es un expert UX/UI spécialisé dans la création de wireframes haute-fidélité. À partir de la description d'écrans fournie, génère une structure JSON de wireframes détaillés et professionnels.

RÈGLES STRICTES:
1. Utilise UNIQUEMENT ces types d'éléments:
   - header: Barre d'en-tête avec logo/titre
   - nav: Navigation (menu, liens)
   - button: Bouton d'action
   - input: Champ de saisie
   - text: Bloc de texte
   - image: Zone d'image
   - card: Carte contenant d'autres éléments
   - list: Liste d'éléments répétitifs
   - container: Conteneur générique
   - form: Formulaire groupant inputs
   - table: Tableau de données
   - modal: Fenêtre modale
   - tabs: Onglets de navigation
   - sidebar: Barre latérale
   - avatar: Photo de profil circulaire
   - badge: Badge/étiquette colorée
   - icon: Icône (specify name: home, search, settings, user, bell, menu, plus, edit, trash, check, x, arrow-left, arrow-right, mail, phone, calendar, star, heart, share, download, upload)
   - divider: Séparateur horizontal
   - progress: Barre de progression
   - toggle: Interrupteur on/off
   - checkbox: Case à cocher
   - radio: Bouton radio
   - select: Liste déroulante
   - textarea: Zone de texte multiligne

2. Chaque élément DOIT avoir un "id" unique (format: "el_1", "el_2", etc.)

3. HAUTE FIDÉLITÉ signifie:
   - Textes réalistes et contextuels (pas de "Lorem ipsum")
   - Labels descriptifs pour chaque élément
   - Couleurs via props.color: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "dark" | "light"
   - Tailles via props.size: "xs" | "sm" | "md" | "lg" | "xl"

4. Organise logiquement: header en haut, nav, puis contenu principal

5. Utilise "children" pour imbriquer les éléments

6. Pour les listes, utilise "items" avec des données réalistes:
   "items": [
     { "title": "Titre item", "subtitle": "Description", "image": true },
     ...
   ]

FORMAT DE SORTIE (JSON STRICT - pas de texte avant/après):
{
  "screens": [
    {
      "id": "screen_1",
      "name": "Nom de l'écran",
      "description": "Description courte de l'écran",
      "route": "/chemin-url",
      "theme": "light",
      "elements": [
        {
          "id": "el_1",
          "type": "header",
          "label": "MonApp",
          "props": { "color": "primary" },
          "children": [
            {
              "id": "el_2",
              "type": "button",
              "label": "Connexion",
              "props": { "variant": "outline", "size": "sm" }
            }
          ]
        },
        {
          "id": "el_3",
          "type": "container",
          "props": { "padding": "lg" },
          "children": [
            {
              "id": "el_4",
              "type": "text",
              "label": "Bienvenue sur notre plateforme",
              "props": { "size": "xl", "weight": "bold" }
            },
            {
              "id": "el_5",
              "type": "text",
              "label": "Gérez vos projets efficacement",
              "props": { "size": "md", "color": "secondary" }
            },
            {
              "id": "el_6",
              "type": "form",
              "children": [
                {
                  "id": "el_7",
                  "type": "input",
                  "label": "Email",
                  "placeholder": "votre@email.com",
                  "props": { "type": "email" }
                },
                {
                  "id": "el_8",
                  "type": "input",
                  "label": "Mot de passe",
                  "placeholder": "••••••••",
                  "props": { "type": "password" }
                },
                {
                  "id": "el_9",
                  "type": "button",
                  "label": "Se connecter",
                  "props": { "variant": "primary", "size": "lg", "fullWidth": true }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans aucun texte explicatif avant ou après.
- Génère des contenus RÉALISTES et CONTEXTUELS basés sur la description fournie.
- Chaque écran doit être complet et professionnel.

DESCRIPTION DES ÉCRANS À CONVERTIR EN WIREFRAMES:
`

export function buildWireframePrompt(screensPromptsContent: string): string {
  return WIREFRAME_PROMPT + screensPromptsContent
}
