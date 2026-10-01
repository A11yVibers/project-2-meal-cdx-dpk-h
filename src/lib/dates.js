function shiftToMidnight(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function toDateKey(date) {
  const value = shiftToMidnight(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(key) {
  const [year, month, day] = String(key).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getWeekDays(weekOffset = 0) {
  const today = new Date()
  const weekday = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - weekday + weekOffset * 7)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      key: toDateKey(date),
      date,
      weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      dayLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      isToday: toDateKey(date) === toDateKey(new Date()),
    }
  })
}

export function formatWeekRange(days) {
  if (!days.length) return ''
  const first = days[0].date
  const last = days[days.length - 1].date

  if (first.getMonth() === last.getMonth()) {
    return `${first.toLocaleDateString('en-US', { month: 'long' })} ${first.getDate()}–${last.getDate()}, ${last.getFullYear()}`
  }

  return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function readableDate(key) {
  const date = fromDateKey(key)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
