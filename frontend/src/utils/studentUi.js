// Small display helpers for the student portal

// "0901IO231034 MO ABRAR QURESHI" -> "Mo Abrar Qureshi"
export const cleanName = (raw = '') => {
    let name = String(raw || '').trim()
    name = name.replace(/^\d{2,4}[a-z]{2}\d{4,}\s+/i, '') // strip leading enrollment number
    if (name && name === name.toUpperCase()) {
      name = name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
    }
    return name
  }
  
  export const initialsOf = (raw) => {
    const parts = cleanName(raw).split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    const first = parts[0][0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
  }
  
  export const getGreeting = (date = new Date()) => {
    const h = date.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
  
  const SEM_LABELS = {
    any_internship: 'Any Internship',
    '6th_internship': '6th Sem Internship',
    '7th_internship': '7th Sem Internship',
    '8th_internship': '8th Sem Internship',
    '8th_project': '8th Sem Project'
  }
  
  export const prettySemester = (type) =>
    SEM_LABELS[type] || String(type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())