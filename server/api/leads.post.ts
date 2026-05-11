import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function getDb() {
  if (!getApps().length) {
    // Try service-account.json file first, then env var
    const saPath = resolve(process.cwd(), 'service-account.json')
    let credential
    if (existsSync(saPath)) {
      credential = cert(JSON.parse(readFileSync(saPath, 'utf-8')))
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    } else {
      throw createError({ statusCode: 500, message: 'Server configuration error: no service account found' })
    }
    initializeApp({ credential })
  }
  return getFirestore()
}

// In-memory rate limiting per IP (resets every 60s)
const ipMap = new Map<string, { count: number; reset: number }>()

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default defineEventHandler(async (event) => {
  // API key check
  const apiKey = getHeader(event, 'x-api-key')
  if (apiKey !== process.env.LEADS_API_KEY) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // CORS - restrict to allowed origins
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
  })

  // Handle preflight
  if (getMethod(event) === 'OPTIONS') {
    return ''
  }

  // Rate limiting
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const entry = ipMap.get(ip) || { count: 0, reset: now + 60_000 }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000 }
  entry.count++
  ipMap.set(ip, entry)
  if (entry.count > 10) {
    throw createError({ statusCode: 429, message: 'Too many requests' })
  }

  // Body size check
  const body = await readBody(event)
  if (JSON.stringify(body).length > 10_000) {
    throw createError({ statusCode: 413, message: 'Payload too large' })
  }

  // Validate email (support both casings)
  const email = sanitize(body.email || body.Email, 254)
  if (!isValidEmail(email)) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const db = getDb()

  const lead = {
    fullName: sanitize(body.fullName || body.name || body.Name, 200),
    email,
    phone: sanitize(body.phone || body.Phone, 30),
    company: sanitize(body.company || body.Company, 200),
    city: sanitize(body.city || body.City, 100),
    message: sanitize(body.message || body.Message, 2000),
    utmSource: sanitize(body.utm_source || body.utmSource, 200),
    utmMedium: sanitize(body.utm_medium || body.utmMedium, 200),
    utmCampaign: sanitize(body.utm_campaign || body.utmCampaign, 200),
    utmTerm: sanitize(body.utm_term || body.utmTerm, 200),
    utmContent: sanitize(body.utm_content || body.utmContent, 200),
    createdAt: FieldValue.serverTimestamp()
  }

  try {
    const docRef = await db.collection('leads').add(lead)
    return { success: true, id: docRef.id }
  } catch (e) {
    console.error('Firestore write error:', e)
    throw createError({ statusCode: 500, message: 'Failed to save lead' })
  }
})
