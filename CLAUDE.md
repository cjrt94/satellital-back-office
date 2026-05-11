# Satellital Back Office

Back office para gestión de leads de **Satellital Patrol** (empresa peruana de monitoreo GPS y seguridad vehicular).

## Stack

- **Frontend**: Nuxt 3.17 (SPA, `ssr: false`) + Nuxt UI 3.1 + Tailwind CSS 4
- **Backend**: Nitro server routes (dentro de Nuxt)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth con custom claims (`admin: true`)
- **Hosting**: Vercel (deploy manual con `vercel --prod`)
- **Web pública**: Webflow en `https://www.satellitalpatrol.com`

## Estructura del proyecto

```
├── app.vue                    # Root component (solo UApp + NuxtPage)
├── app.config.ts              # Nuxt UI theme (primary: sky)
├── nuxt.config.ts             # Config principal (SPA, fonts, runtimeConfig)
├── pages/
│   ├── index.vue              # Dashboard de leads (tabla, stats, modal detalle, export CSV)
│   └── login.vue              # Login con email/password
├── composables/
│   ├── useAuth.ts             # Login, logout, estado de auth
│   └── useLeads.ts            # Fetch leads, export CSV
├── middleware/
│   └── auth.global.ts         # Protege rutas, redirige a /login si no autenticado
├── plugins/
│   └── firebase.client.ts     # Inicializa Firebase + onAuthStateChanged
├── server/api/
│   ├── leads.post.ts          # API para recibir leads (POST)
│   └── leads.options.ts       # Handler CORS preflight (OPTIONS)
├── scripts/
│   └── set-admin-claim.ts     # Asignar admin claim a usuario
├── types/
│   └── nuxt.d.ts              # Type augmentation para $firebase*
├── assets/css/
│   └── main.css               # Tailwind + Nuxt UI imports + CSS vars
├── public/
│   └── favicon.svg            # Isotipo de Satellital
├── firestore.rules            # Reglas de Firestore (solo admin puede leer leads)
├── webflow-snippet.js         # Script para capturar leads desde Webflow
└── .env.example               # Template de variables de entorno
```

## Variables de entorno

### Local (`.env`)
```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=satellital-7f48b
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
LEADS_API_KEY=...
ALLOWED_ORIGIN=https://www.satellitalpatrol.com
```

### Vercel (producción)
Configuradas via `vercel env add`:
- `FIREBASE_SERVICE_ACCOUNT` — JSON del service account en una sola línea
- `LEADS_API_KEY` — clave para autenticar requests al API de leads
- `ALLOWED_ORIGIN` — actualmente `*`

## Firebase

- **Proyecto**: `satellital-7f48b`
- **Firestore collection**: `leads`
- **Auth**: Email/password con custom claim `admin: true`
- **Service account file**: `service-account.json` (en `.gitignore`, NO subir a git)

### Firestore Rules
Solo usuarios con `admin: true` pueden leer leads. Solo el Admin SDK (server) puede escribir.

### Agregar admin
```bash
npx tsx scripts/set-admin-claim.ts usuario@email.com
```

## API de leads

### `POST /api/leads`

Recibe leads desde el formulario de Webflow.

**Headers requeridos:**
- `Content-Type: application/json`
- `x-api-key: <LEADS_API_KEY>`

**Body:**
```json
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "company": "...",
  "city": "...",
  "message": "...",
  "utm_source": "...",
  "utm_medium": "...",
  "utm_campaign": "..."
}
```

**Protecciones:**
1. API Key obligatoria
2. Validación de origin/referer (solo dominios permitidos)
3. Rate limiting: 10 req/min por IP
4. Validación de email
5. Sanitización de inputs
6. Límite de payload (10KB)

## Webflow

El snippet `webflow-snippet.js` se pega en Webflow > Project Settings > Custom Code (head o footer).

**Requisitos en Webflow:**
- El div wrapper del form debe tener `id="satellital-form"`
- El snippet usa `DOMContentLoaded` para esperar al DOM
- Captura UTM params de la URL y los persiste en `sessionStorage`

## Deploy

```bash
# Build y deploy a Vercel
vercel --prod

# Deploy solo Firestore rules
npx firebase deploy --only firestore:rules
```

## Desarrollo local

```bash
npm run dev          # Inicia en http://localhost:3000
```

Requiere `.env` con las variables de Firebase y `service-account.json` en la raíz.

## Notas importantes

- El proyecto está en un volumen externo macOS (`/Volumes/Projects/`). Vite genera rutas feas en dev (`/_nuxt/Volumes/...`) pero funcionan correctamente. En producción las rutas son normales.
- La auth se inicializa en el plugin `firebase.client.ts` (NO en `app.vue` onMounted) para evitar deadlock con el middleware.
- Nuxt UI v3 usa TanStack Table: el evento `@select` de UTable pasa `row` (no el dato directo), acceder datos con `row.original`.
- El CSS debe importar `@import "tailwindcss" theme(static)` y `@import "@nuxt/ui"` para que los componentes de UI se rendericen correctamente.
