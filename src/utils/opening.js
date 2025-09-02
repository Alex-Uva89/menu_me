// src/utils/opening.js

/** Converte "HH:mm" in minuti da mezzanotte (0..1439). */
export function parseHHmm(str) {
  const [h, m] = String(str || '').split(':').map(v => parseInt(v, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/** Minuti dell'orario corrente (local time), o della data passata. */
export function minutesNow(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes()
}

/** 0=Dom ... 6=Sab (JS). */
export function dayIndex(date = new Date()) {
  return date.getDay()
}

/** Giorno precedente (0..6). */
export function dayPrev(d) {
  return (d + 6) % 7
}


/** Restituisce l'entry per un dato giorno, normalizzando il tipo del weekday. */
function entryFor(openingHours, day) {
  if (!Array.isArray(openingHours)) return null
  const d = normWeekday(day)
  if (d == null) return null
  return openingHours.find(e => normWeekday(e?.weekday) === d) || null
}

/** True se ci sono orari configurati (array non vuoto). */
export function hasSchedule(business) {
  return Array.isArray(business?.openingHours) && business.openingHours.length > 0
}

/**
 * SOLO schedule: è aperto ora?
 * - Ignora completamente `isOpen`
 * - Supporta overnight (es. 18:00→02:00)
 * - Se un giorno ha `closed:true` ma HA intervalli, consideriamo gli intervalli (override "closed").
 */
export function isOpenNowBySchedule(openingHours, date = new Date()) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return false

  const today = dayIndex(date)
  const now = minutesNow(date)
  const todayEntry = entryFor(openingHours, today)
  const prevEntry  = entryFor(openingHours, dayPrev(today))

  const checkEntry = (entry, includeOvernightOnly = false) => {
    if (!entry) return false
    const ivs = Array.isArray(entry.intervals) ? entry.intervals : []
    // se ci sono intervalli, usiamo quelli; se non ci sono ed è closed, è chiuso
    if (ivs.length === 0 && entry.closed) return false

    for (const iv of ivs) {
      const o = parseHHmm(iv.open)
      const c = parseHHmm(iv.close)
      if (o == null || c == null) continue

      if (o < c) {
        // fascia nello stesso giorno
        if (!includeOvernightOnly && now >= o && now < c) return true
      } else if (o > c) {
        // overnight
        if (!includeOvernightOnly && now >= o && now <= 1439) return true      // parte serale
        if (includeOvernightOnly && now >= 0 && now < c) return true           // dopo mezzanotte
      }
      // o === c → ignoriamo
    }
    return false
  }

  if (checkEntry(todayEntry, false)) return true
  if (checkEntry(prevEntry, true)) return true

  return false
}

/**
 * Stato finale SOLO da orari:
 * - se non ci sono orari: CHIUSO
 * - altrimenti: calcola su fasce
 */
export function isOpenComputed(business, date = new Date()) {
  if (!hasSchedule(business)) return false
  return isOpenNowBySchedule(business.openingHours, date)
}

/** Etichetta pronta. */
export function statusLabel(business, date = new Date()) {
  return isOpenComputed(business, date) ? 'Aperto' : 'Chiuso'
}

/**
 * Restituisce gli intervalli "di oggi" come array di stringhe "HH:mm–HH:mm".
 * Include (se presenti) le parti dopo mezzanotte ereditate da un intervallo overnight di ieri.
 * - Esempi: ["00:00–02:00", "12:30–15:00", "19:30–00:00"]
 */
export function todaysIntervalsStrings(openingHours, date = new Date()) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return []

  const today = dayIndex(date)
  const prev  = dayPrev(today)

  const todayEntry = entryFor(openingHours, today)
  const prevEntry  = entryFor(openingHours, prev)

  const out = []

  // 1) Post-mezzanotte ereditato da ieri (overnight prev: open > close e close > 0)
  if (prevEntry?.intervals?.length) {
    for (const iv of prevEntry.intervals) {
      const o = parseHHmm(iv.open)
      const c = parseHHmm(iv.close)
      if (o == null || c == null) continue
      if (o > c && c > 0) out.push(`00:00–${iv.close}`)
    }
  }

  // 2) Intervalli di oggi
  if (todayEntry?.intervals?.length) {
    for (const iv of todayEntry.intervals) {
      const o = parseHHmm(iv.open)
      const c = parseHHmm(iv.close)
      if (o == null || c == null) continue
      if (o < c) {
        out.push(`${iv.open}–${iv.close}`)
      } else if (o > c) {
        // overnight che parte oggi: mostriamo fino a mezzanotte
        out.push(`${iv.open}–00:00`)
      }
    }
  } else if (todayEntry?.closed && (!todayEntry?.intervals || todayEntry.intervals.length === 0)) {
    // chiuso esplicito e senza intervalli: out resta vuoto ⇒ "Oggi: Chiuso"
  }

  return out
}

/** "Oggi: ..." oppure "Oggi: Chiuso" / "Oggi: Orari non disponibili" */
export function todayLabel(business, date = new Date()) {
  if (!hasSchedule(business)) return 'Oggi: Orari non disponibili'
  const arr = todaysIntervalsStrings(business.openingHours, date)
  return arr.length ? `Oggi: ${arr.join(', ')}` : 'Oggi: Chiuso'
}


// --- DEBUG UTILS ------------------------------------------------------------

/** Nome del giorno 0..6 */
export function dayName(i) {
  return ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][((i % 7) + 7) % 7]
}

/** Coerciamo weekday a numero 0..6 (anche se arriva come stringa) */
function normWeekday(w) {
  const n = Number(w)
  if (Number.isNaN(n)) return null
  return ((n % 7) + 7) % 7
}

/** Ritorna una copia normalizzata della schedule con minuti e flag overnight */
export function normalizeSchedule(openingHours) {
  if (!Array.isArray(openingHours)) return []
  return openingHours.map(e => {
    const wd = normWeekday(e?.weekday)
    const ivs = Array.isArray(e?.intervals) ? e.intervals.map(iv => {
      const o = parseHHmm(iv?.open)
      const c = parseHHmm(iv?.close)
      return {
        open: iv?.open, close: iv?.close,
        _openMin: o, _closeMin: c,
        _overnight: (o != null && c != null && o > c),
        _typeofOpen: typeof iv?.open, _typeofClose: typeof iv?.close
      }
    }) : []
    return {
      weekday: wd,
      _weekdayRaw: e?.weekday,
      _typeofWeekday: typeof e?.weekday,
      closed: !!e?.closed,
      intervals: ivs
    }
  })
}

/**
 * Spiega “perché” ora risulta aperto/chiuso.
 * Non modifica la logica: solo introspezione.
 */
export function explainOpenNow(openingHours, date = new Date()) {
  const norm = normalizeSchedule(openingHours)
  const nowMin = minutesNow(date)
  const today = dayIndex(date)
  const prev  = (today + 6) % 7

  const todayEntry = norm.find(e => e.weekday === today) || null
  const prevEntry  = norm.find(e => e.weekday === prev)  || null

  const hit = []
  const checkEntry = (entry, includeOvernightOnly = false, label) => {
    if (!entry) return false
    const ivs = Array.isArray(entry.intervals) ? entry.intervals : []
    if (ivs.length === 0 && entry.closed) {
      hit.push({ label, reason: 'closed:true senza intervalli' })
      return false
    }
    for (const iv of ivs) {
      const { _openMin:o, _closeMin:c, _overnight:overnight } = iv
      if (o == null || c == null) {
        hit.push({ label, reason: 'orario non parsabile', iv })
        continue
      }
      if (!overnight) {
        if (!includeOvernightOnly && nowMin >= o && nowMin < c) {
          hit.push({ label, reason: 'match fascia same-day', iv })
          return true
        } else {
          hit.push({ label, reason: 'fuori fascia same-day', iv })
        }
      } else {
        if (!includeOvernightOnly && nowMin >= o && nowMin <= 1439) {
          hit.push({ label, reason: 'match fascia overnight (sera)', iv })
          return true
        }
        if (includeOvernightOnly && nowMin >= 0 && nowMin < c) {
          hit.push({ label, reason: 'match fascia overnight (post-mezzanotte)', iv })
          return true
        }
        hit.push({ label, reason: 'fuori fascia overnight', iv })
      }
    }
    return false
  }

  const openToday = checkEntry(todayEntry, false, 'OGGI')
  const openPrev  = !openToday && checkEntry(prevEntry, true, 'IERI→NOTTE')

  return {
    now: new Date(date),
    timeLocal: new Date(date).toTimeString().slice(0,5),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    minutesNow: nowMin,
    todayIndex: today, todayName: dayName(today),
    prevIndex: prev,   prevName: dayName(prev),
    normalized: norm,
    matched: openToday || openPrev,
    matchedFrom: openToday ? 'today' : (openPrev ? 'prev-night' : null),
    trace: hit
  }
}

/** Logga in console tutto il diagnostico in modo leggibile */
export function logOpeningDiagnostics(business, date = new Date()) {
  console.groupCollapsed(`[Opening] ${business?.name || '(senza nome)'} @ ${new Date(date).toLocaleString()}`)
  try {
    console.log('timeZone:', Intl.DateTimeFormat().resolvedOptions().timeZone)
    console.log('today:', dayName(dayIndex(date)), '(', dayIndex(date), ')')
    console.log('now minutes:', minutesNow(date))
    console.log('openingHours (raw):', business?.openingHours)

    const diag = explainOpenNow(business?.openingHours, date)
    console.log('— normalized schedule —')
    console.table(diag.normalized.map(e => ({
      weekday: `${e.weekday} (${dayName(e.weekday ?? 0)})`,
      _weekdayRaw: e._weekdayRaw,
      _typeofWeekday: e._typeofWeekday,
      closed: e.closed,
      intervals: (e.intervals || []).map(iv => `${iv.open}→${iv.close}`).join(' , ')
    })))

    console.log('— intervals detail —')
    diag.normalized.forEach(e => {
      console.group(`weekday ${e.weekday} (${dayName(e.weekday ?? 0)}) closed:${e.closed}`)
      e.intervals.forEach((iv, idx) => {
        console.log(`#${idx}`, {
          open: iv.open, close: iv.close,
          _typeofOpen: iv._typeofOpen, _typeofClose: iv._typeofClose,
          _openMin: iv._openMin, _closeMin: iv._closeMin,
          _overnight: iv._overnight
        })
      })
      console.groupEnd()
    })

    console.log('— runtime check trace —')
    console.table(diag.trace)

    console.log('=> matched:', diag.matched, 'from:', diag.matchedFrom)
  } finally {
    console.groupEnd()
  }
}
