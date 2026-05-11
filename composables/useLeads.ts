import {
  collection,
  query,
  orderBy,
  getDocs,
  type DocumentData
} from 'firebase/firestore'

export interface Lead {
  id: string
  fullName: string
  email: string
  phone: string
  company: string
  city: string
  message: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  createdAt: string
}

export const useLeads = () => {
  const { $firebaseDb } = useNuxtApp()
  const leads = useState<Lead[]>('leads', () => [])
  const loading = useState<boolean>('leads_loading', () => false)
  const error = useState<string>('leads_error', () => '')

  const fetchLeads = async () => {
    loading.value = true
    error.value = ''
    try {
      const q = query(collection($firebaseDb, 'leads'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      leads.value = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData
        return {
          id: doc.id,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          city: data.city || '',
          message: data.message || '',
          utmSource: data.utmSource || '',
          utmMedium: data.utmMedium || '',
          utmCampaign: data.utmCampaign || '',
          utmTerm: data.utmTerm || '',
          utmContent: data.utmContent || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
        } as Lead
      })
    } catch (e: any) {
      console.error('Failed to fetch leads:', e)
      error.value = 'Error al cargar los leads'
    } finally {
      loading.value = false
    }
  }

  const exportToCsv = () => {
    const headers = [
      'Nombre', 'Email', 'Telefono', 'Empresa', 'Ciudad', 'Mensaje',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Fecha'
    ]

    function escapeCsvField(v: string): string {
      let s = (v || '').replace(/"/g, '""')
      // Prevent CSV formula injection
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s
      }
      return `"${s}"`
    }

    const rows = leads.value.map(l => [
      l.fullName, l.email, l.phone, l.company, l.city, l.message,
      l.utmSource, l.utmMedium, l.utmCampaign, l.utmTerm, l.utmContent, l.createdAt
    ].map(escapeCsvField))

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return { leads, loading, error, fetchLeads, exportToCsv }
}
