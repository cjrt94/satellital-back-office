import {
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth'

export const useAuth = () => {
  const { $firebaseAuth } = useNuxtApp()
  const user = useState<User | null>('auth_user', () => null)
  const loading = useState<boolean>('auth_loading', () => true)

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword($firebaseAuth, email, password)
    user.value = result.user
    return result.user
  }

  const logout = async () => {
    await signOut($firebaseAuth)
    user.value = null
    navigateTo('/login')
  }

  return { user, loading, login, logout }
}
