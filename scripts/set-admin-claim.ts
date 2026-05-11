/**
 * Sets the 'admin' custom claim on a Firebase Auth user.
 *
 * Usage:
 *   npx tsx scripts/set-admin-claim.ts <user-email>
 *
 * Requires:
 *   - A service-account.json file in the project root
 *   - Or FIREBASE_SERVICE_ACCOUNT env var with the JSON
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/set-admin-claim.ts <user-email>')
  process.exit(1)
}

// Try loading service account from file first, then env var
let serviceAccount: any
const saPath = resolve(process.cwd(), 'service-account.json')

if (existsSync(saPath)) {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'))
  console.log('Using service-account.json')
} else {
  console.error(`Error: service-account.json not found at ${saPath}`)
  console.error('Download it from Firebase Console > Project Settings > Service Accounts > Generate new private key')
  process.exit(1)
}

const app = initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)

async function main() {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(`Admin claim set for ${email} (uid: ${user.uid})`)

  const updated = await auth.getUser(user.uid)
  console.log('Custom claims:', updated.customClaims)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
