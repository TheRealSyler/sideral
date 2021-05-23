import parseMilliseconds from 'parse-ms';

export function fromNow(time: number) {
  const { days, hours, minutes, seconds } = parseMilliseconds(time - Date.now())

  // convert(years, 'y') +
  // convert(months, 'mm') +
  // convert(weeks, 'w') +
  return (convert(days, 'd') +
    convert(hours, 'h') +
    convert(minutes, 'm') +
    convert(seconds, 's')) || '0s'
}

function convert(time: number, label: string) {
  return `${time ? `${time}${label} ` : ''}`
}