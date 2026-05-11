import { onRequest } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

const leadsApiKey = defineString('LEADS_API_KEY')
const allowedOrigin = defineString('ALLOWED_ORIGIN', { default: '*' })

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// In-memory rate limiting per IP
const ipMap = new Map<string, { count: number; reset: number }>()

export const receiveLead = onRequest(
  { cors: [allowedOrigin.value()] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // API key check
    const apiKey = req.headers['x-api-key']
    if (apiKey !== leadsApiKey.value()) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Rate limiting
    const ip = req.ip || 'unknown'
    const now = Date.now()
    const entry = ipMap.get(ip) || { count: 0, reset: now + 60_000 }
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000 }
    entry.count++
    ipMap.set(ip, entry)
    if (entry.count > 10) {
      res.status(429).json({ error: 'Too many requests' })
      return
    }

    // Body size check
    if (JSON.stringify(req.body).length > 10_000) {
      res.status(413).json({ error: 'Payload too large' })
      return
    }

    const body = req.body

    // Validate email (support both casings)
    const email = sanitize(body.email || body.Email, 254)
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }

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
      res.status(201).json({ success: true, id: docRef.id })
    } catch (error) {
      console.error('Firestore write error:', error)
      res.status(500).json({ error: 'Failed to save lead' })
    }
  }
)
