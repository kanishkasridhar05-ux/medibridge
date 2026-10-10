const STORAGE_KEY = 'medibridge.demo.v1'
const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1000&q=80'

export function createInitialData() {
  const now = new Date().toISOString()
  const listings = [
    { id: 'sample-listing-approved', donorUsername: 'nia.demo', name: 'Sample Vitamin D3', batch: 'DEMO-D3-2418', expiry: '2027-05-30', quantity: '12 sealed tablets', condition: 'Factory-sealed demo package', storage: 'Fictional room-temperature storage note', category: 'Over-the-counter', photo: SAMPLE_PHOTO, status: 'Approved', available: true, rejectionReason: '', createdAt: now, reviewedAt: now },
    { id: 'sample-listing-pending', donorUsername: 'nia.demo', name: 'Sample Allergy Relief', batch: 'DEMO-AR-0912', expiry: '2027-09-30', quantity: '8 sealed tablets', condition: 'Demo package, seal described as intact', storage: 'Fictional storage note, not verified', category: 'Over-the-counter', photo: SAMPLE_PHOTO, status: 'Pending', available: false, rejectionReason: '', createdAt: now },
    { id: 'sample-listing-rejected', donorUsername: 'nia.demo', name: 'Sample Prescription Medicine', batch: 'DEMO-RX-0042', expiry: '2027-02-28', quantity: '6 demo units', condition: 'Fictional package', storage: 'Not verified', category: 'Prescription', photo: SAMPLE_PHOTO, status: 'Rejected', available: false, rejectionReason: 'Prescription category is not eligible for this prototype.', createdAt: now, reviewedAt: now },
  ]
  return {
    version: 1,
    users: [
      { role: 'donor', username: 'nia.demo', name: 'Nia Sample', gender: 'Prefer not to say', age: 32, phone: '555-0101 (fictional)', address: '14 Sample Lane (fictional)', createdAt: now },
      { role: 'receiver', username: 'alex.demo', name: 'Alex Sample', createdAt: now },
    ],
    sessions: { donor: '', receiver: '', pharmacist: '' },
    listings,
    requests: [],
    events: [
      { id: 'sample-event-1', entityType: 'listing', entityId: 'sample-listing-approved', actor: 'pharmacist.demo', action: 'Submission approved', from: 'Pending', to: 'Approved', at: now, note: '' },
      { id: 'sample-event-2', entityType: 'listing', entityId: 'sample-listing-pending', actor: 'nia.demo', action: 'Submission created', from: '', to: 'Pending', at: now, note: '' },
      { id: 'sample-event-3', entityType: 'listing', entityId: 'sample-listing-rejected', actor: 'pharmacist.demo', action: 'Submission rejected', from: 'Pending', to: 'Rejected', at: now, note: 'Prescription category is not eligible for this prototype.' },
    ],
  }
}

function hasValidShape(value) {
  return value && value.version === 1 && Array.isArray(value.users) && Array.isArray(value.listings) && Array.isArray(value.requests) && Array.isArray(value.events) && value.sessions
}

export function readData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return createAndSaveInitialData()
    const parsed = JSON.parse(saved)
    if (hasValidShape(parsed)) return parsed
  } catch {
    return createInitialData()
  }
  return createAndSaveInitialData()
}

function createAndSaveInitialData() {
  const initial = createInitialData()
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)) } catch { /* Keep the demo usable if storage is unavailable. */ }
  return initial
}

export function updateData(mutator) {
  const data = readData()
  const result = mutator(data) || data
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  window.dispatchEvent(new Event('medibridge:update'))
  return result
}

export function resetData() {
  const initial = createInitialData()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  window.dispatchEvent(new Event('medibridge:update'))
}