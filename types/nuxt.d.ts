import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'

declare module '#app' {
  interface NuxtApp {
    $firebaseApp: FirebaseApp
    $firebaseAuth: Auth
    $firebaseDb: Firestore
  }
}

export {}
