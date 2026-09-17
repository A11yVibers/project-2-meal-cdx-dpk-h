export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  return new Date(year, month - 1, day || 1)
}

export function startOfWeek(weekOffset = 0) {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset)
  monday.setDate(monday.getDate() + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekDays(weekOffset = 0) {
  const monday = startOfWeek(weekOffset)
  return DAY_LABELS.map((label, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return { label, date, dateKey: toDateKey(date) }
  })
}

export function getCurrentWeekLabel(weekOffset = 0) {
  const monday = startOfWeek(weekOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const options = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString(undefined, options)} – ${sunday.toLocaleDateString(undefined, options)}`
}

