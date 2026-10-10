import { createWorker } from 'tesseract.js'

function normalizeLines(text) {
  return text
    .normalize('NFKC')
    .replace(/[：﹕]/g, ':')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[·•]/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t ]+/g, ' ').replace(/^\s*[|¦~*.,;:]+\s*/, '').trim())
}

function getLabeledValue(lines, labelPattern) {
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(labelPattern)
    if (!match) continue
    const inlineValue = match[1]?.trim().replace(/^[\s:;,.#-]+/, '')
    if (inlineValue) return inlineValue
    const nextLine = lines[index + 1]?.trim()
    if (nextLine && !/^(?:batch|lot|mfg|manuf(?:acturing)?|exp(?:iry)?|use\s*(?:before|by))\b/i.test(nextLine)) return nextLine
  }
  return ''
}

function normalizeExpiry(value) {
  const cleaned = value.trim().replace(/[.\s]+$/, '').replace(/\s*([/.-])\s*/g, '$1')
  let match = cleaned.match(/^(\d{1,2})[/. -](\d{4})$/)
  if (match) {
    const month = Number(match[1])
    if (month < 1 || month > 12) return ''
    return `${String(month).padStart(2, '0')}/${match[2]}`
  }
  match = cleaned.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day))
    if (month < 1 || month > 12 || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return ''
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }
  match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) return ''
    return cleaned
  }
  return ''
}

export function isExpiryCurrent(value, today = new Date()) {
  const normalized = normalizeExpiry(value)
  if (!normalized) return false
  const monthYear = normalized.match(/^(\d{2})\/(\d{4})$/)
  let year
  let month
  let day
  if (monthYear) {
    month = Number(monthYear[1])
    year = Number(monthYear[2])
    day = new Date(year, month, 0).getDate()
  } else if (normalized.includes('/')) {
    const [, dateDay, dateMonth, dateYear] = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    day = Number(dateDay)
    month = Number(dateMonth)
    year = Number(dateYear)
  } else {
    const [dateYear, dateMonth, dateDay] = normalized.split('-').map(Number)
    year = dateYear
    month = dateMonth
    day = dateDay
  }
  const expiry = new Date(year, month - 1, day)
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return expiry >= current
}

function getNameCandidate(line) {
  const candidate = line.replace(/^(?:medicine|product|brand|name)\s*[:#-]\s*/i, '').trim()
  if (candidate.length < 5 || /(?:batch|lot|expir|use\s*(?:before|by)|mfg|manufactur|mrp|price|\b(?:mg|ml|tablets?|capsules?)\b|[₹$€£])\s*[:#-]?/i.test(candidate)) return ''

  const withStrength = candidate.match(/^([A-Za-z][A-Za-z.'’&-]{3,}?)\s*(?:-|\s)\s*([0-9][0-9\sIiIl|Oo]{0,8})$/)
  if (withStrength) {
    const digits = withStrength[2].replace(/\s+/g, '').replace(/[iIl|]/g, '0').replace(/[oO]/g, '0')
    if (!/^\d{2,5}$/.test(digits)) return ''
    return `${withStrength[1].replace(/[.-]+$/, '')}-${digits}`
  }

  if (/^[A-Za-z][A-Za-z.'’&-]{4,}$/.test(candidate)) return candidate.replace(/[.-]+$/, '')
  return ''
}

export function extractFields(text) {
  const lines = normalizeLines(text)
  const batchLabel = /^\s*(?:b\s*a\s*t\s*c\s*h(?:\s*(?:n\s*[o0]|number))?|b\s*\.?\s*n\s*[o0]|l\s*o\s*t(?:\s*(?:n\s*[o0]|number))?)\s*[.:#-]*\s*(.*)$/i
  const expiryLabel = /^\s*(?:expiry(?:\s*date)?|exp\.?|expires|use\s*(?:before|by))\s*[:#.-]?\s*(.*)$/i
  const batchText = getLabeledValue(lines, batchLabel)
  const metadataValue = /^(?:mfg|manuf(?:acturing)?|exp(?:iry)?|use\s*(?:before|by)|mrp|price)\b/i.test(batchText)
  const dateValue = /^(?:\d{1,2}[/. -]\d{1,2}[/. -]\d{4}|\d{1,2}[/. -]\d{4}|\d{4}-\d{2}-\d{2})\b/.test(batchText)
  const batch = !metadataValue && !dateValue
    ? batchText.match(/^([A-Z0-9]+(?:[-/][A-Z0-9]+)*)/i)?.[1] || ''
    : ''
  const expiry = normalizeExpiry(getLabeledValue(lines, expiryLabel))
  const quantityText = getLabeledValue(lines, /^\s*(?:qty|quantity|count)\s*[:#.-]?\s*(.*)$/i)
  const quantity = quantityText.match(/^(\d{1,4})/)?.[1] || ''

  const openingLines = lines.filter(Boolean).slice(0, 5)
  const name = openingLines.map(getNameCandidate).find(Boolean) || ''
  return { name, batch, expiry, quantity }
}

export async function recognizeLabel(imageData, onProgress) {
  let worker
  try {
    worker = await createWorker('eng', 1, {
      logger: (message) => {
        if (message.status === 'recognizing text') onProgress?.(message.progress || 0)
      },
    })
    const result = await worker.recognize(imageData)
    const text = result.data?.text || ''
    return { text, fields: extractFields(text) }
  } catch {
    throw new Error('OCR could not start. Check your connection and try again, or enter the details manually.')
  } finally {
    if (worker) await worker.terminate()
  }
}