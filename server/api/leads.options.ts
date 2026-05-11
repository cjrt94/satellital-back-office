export default defineEventHandler((event) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || '*').split(',').map(o => o.trim())
  const origin = getHeader(event, 'origin') || ''
  const corsOrigin = allowedOrigins.includes('*') ? '*' : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Max-Age': '86400'
  })
  return ''
})
