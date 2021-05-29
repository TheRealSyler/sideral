import parseMilliseconds from 'parse-ms';

export function fromNow(time: number) {
  const { days, hours, minutes, seconds } = parseMilliseconds(time - Date.now())

  return (convert(days, 'd ') +
    convert(hours, 'h ') +
    convert(minutes, 'm ') +
    convert(seconds, 's')) || '0s'
}
export function displaySeconds(time: number) {
  const { days, hours, minutes, seconds } = parseMilliseconds(time * 1000)

  return (convert(days, 'd ') +
    convert(hours, 'h ') +
    convert(minutes, 'm ') +
    convert(seconds, 's')) || '0s'
}

function convert(time: number, label: string) {
  return `${time ? `${time}${label}` : ''}`
}