export function formatNumber(value: number | string): string {
  if (typeof value === 'string') {
    const numValue = parseFloat(value)

    const parts = value.split('.')
    const decimalPart = parts.length > 1 ? parts[1] : ''

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPart.length,
      maximumFractionDigits: decimalPart.length,
    }).format(numValue)
  }

  const valueStr = value.toString()
  const decimalIndex = valueStr.indexOf('.')

  let minFractionDigits = 0

  if (decimalIndex !== -1) {
    minFractionDigits = valueStr.length - decimalIndex - 1
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: 20,
  }).format(value)
}
