<template>
  <div class="min-h-screen bg-[var(--color-dark)]">
    <!-- Header -->
    <header class="bg-[var(--color-dark-card)] border-b border-[var(--color-dark-border)]">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <img
            src="https://cdn.prod.website-files.com/69973777525e04c50e11a1e5/699a32f364e0274382500fb0_logo_white.svg"
            alt="Satellital Patrol"
            class="h-7"
          />
          <span class="text-[var(--color-dark-border)] text-lg font-light">/</span>
          <span class="text-[var(--color-text-secondary)] text-sm font-medium">Leads</span>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-download"
            variant="outline"
            color="neutral"
            @click="exportToCsv"
          >
            Exportar CSV
          </UButton>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            @click="logout"
          >
            Salir
          </UButton>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[var(--color-text-muted)] text-sm mb-1">Total Leads</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ leads.length }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-users" class="text-sky-400 text-xl" />
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[var(--color-text-muted)] text-sm mb-1">Empresas</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ uniqueCompanies }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-building-2" class="text-emerald-400 text-xl" />
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[var(--color-text-muted)] text-sm mb-1">Ciudades</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ uniqueCities }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-map-pin" class="text-violet-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6 max-w-md">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Buscar por nombre, email, empresa..."
          size="xl"
          variant="outline"
        />
      </div>

      <!-- Error -->
      <div v-if="leadsError" class="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
        {{ leadsError }}
      </div>

      <!-- Table -->
      <div class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl overflow-hidden">
        <div v-if="leadsLoading" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader" class="animate-spin text-2xl text-[var(--color-text-muted)]" />
        </div>

        <div v-else-if="filteredLeads.length === 0" class="text-center py-16">
          <UIcon name="i-lucide-inbox" class="text-4xl text-[var(--color-text-muted)] mb-3" />
          <p class="text-[var(--color-text-muted)]">No se encontraron leads.</p>
        </div>

        <UTable
          v-else
          :data="filteredLeads"
          :columns="columns"
          @select="openDetail"
        />
      </div>

      <!-- Lead Detail Modal -->
      <UModal v-model:open="showDetail">
        <template #content>
          <div v-if="selectedLead" class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl">
            <!-- Modal Header -->
            <div class="px-6 py-5 border-b border-[var(--color-dark-border)]">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                {{ selectedLead.fullName }}
              </h3>
              <p class="text-sm text-[var(--color-text-muted)] mt-0.5">{{ selectedLead.email }}</p>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-5 space-y-4">
              <div v-for="field in detailFields" :key="field.key" class="flex items-start gap-3">
                <dt class="text-sm text-[var(--color-text-muted)] min-w-[120px] shrink-0">{{ field.label }}</dt>
                <dd class="text-sm text-[var(--color-text-primary)]">
                  {{ (selectedLead as any)[field.key] || '-' }}
                </dd>
              </div>
            </div>

            <!-- UTM Tags -->
            <div
              v-if="selectedLead.utmSource || selectedLead.utmMedium || selectedLead.utmCampaign"
              class="px-6 py-4 border-t border-[var(--color-dark-border)]"
            >
              <p class="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">UTM Tags</p>
              <div class="flex flex-wrap gap-2">
                <UBadge v-if="selectedLead.utmSource" color="primary" variant="subtle" size="sm">
                  source: {{ selectedLead.utmSource }}
                </UBadge>
                <UBadge v-if="selectedLead.utmMedium" color="sky" variant="subtle" size="sm">
                  medium: {{ selectedLead.utmMedium }}
                </UBadge>
                <UBadge v-if="selectedLead.utmCampaign" color="emerald" variant="subtle" size="sm">
                  campaign: {{ selectedLead.utmCampaign }}
                </UBadge>
                <UBadge v-if="selectedLead.utmTerm" color="violet" variant="subtle" size="sm">
                  term: {{ selectedLead.utmTerm }}
                </UBadge>
                <UBadge v-if="selectedLead.utmContent" color="amber" variant="subtle" size="sm">
                  content: {{ selectedLead.utmContent }}
                </UBadge>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-[var(--color-dark-border)] flex justify-end">
              <UButton variant="outline" color="neutral" @click="showDetail = false">
                Cerrar
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Lead } from '~/composables/useLeads'

const { logout } = useAuth()
const { leads, loading: leadsLoading, error: leadsError, fetchLeads, exportToCsv } = useLeads()

const search = ref('')
const showDetail = ref(false)
const selectedLead = ref<Lead | null>(null)

const columns = [
  { accessorKey: 'fullName', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Telefono' },
  { accessorKey: 'company', header: 'Empresa' },
  { accessorKey: 'city', header: 'Ciudad' },
  { accessorKey: 'utmSource', header: 'UTM Source' },
  { accessorKey: 'utmMedium', header: 'UTM Medium' },
  { accessorKey: 'utmCampaign', header: 'UTM Campaign' },
  { accessorKey: 'createdAt', header: 'Fecha' }
]

const detailFields = [
  { key: 'phone', label: 'Telefono' },
  { key: 'company', label: 'Empresa' },
  { key: 'city', label: 'Ciudad' },
  { key: 'message', label: 'Mensaje' }
]

const uniqueCompanies = computed(() =>
  new Set(leads.value.map(l => l.company).filter(Boolean)).size
)

const uniqueCities = computed(() =>
  new Set(leads.value.map(l => l.city).filter(Boolean)).size
)

const filteredLeads = computed(() => {
  if (!search.value) return leads.value
  const s = search.value.toLowerCase()
  return leads.value.filter(l =>
    l.fullName.toLowerCase().includes(s) ||
    l.email.toLowerCase().includes(s) ||
    l.company.toLowerCase().includes(s) ||
    l.city.toLowerCase().includes(s)
  )
})

const openDetail = (lead: Lead) => {
  selectedLead.value = lead
  showDetail.value = true
}

onMounted(() => {
  fetchLeads()
})
</script>
