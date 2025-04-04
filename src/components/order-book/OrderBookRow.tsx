import { memo } from 'react'
import { cn } from '../../utils/cn'
import { formatNumber } from '../../utils/formatters'
import { QuoteWithAnimation } from '../../types/orderbook'

interface OrderBookRowProps {
  data: QuoteWithAnimation
  type: 'ask' | 'bid'
  barColor: string
}

function OrderBookRow({ data, type, barColor }: OrderBookRowProps) {
  const { quote, priceKey, flashPrice, flashSize, isNew } = data
  const { size, total, percentage, originalPrice, originalSize } = quote

  const rowClasses = cn(
    'grid grid-cols-3 py-1 relative group cursor-pointer',
    flashPrice && (type === 'ask' ? 'animate-flash-red' : 'animate-flash-green'),
    isNew && (type === 'ask' ? 'bg-highlight-red' : 'bg-highlight-green')
  )

  const priceClasses = cn(
    'text-left pl-4 z-10',
    type === 'ask' ? 'text-price-sell' : 'text-price-buy'
  )

  const sizeClasses = cn(
    'text-right z-10',
    flashSize === 'increase' && 'animate-flash-green',
    flashSize === 'decrease' && 'animate-flash-red'
  )

  const totalClasses = 'text-right pr-4 z-10'

  const backgroundStyle = {
    width: `${Math.max(percentage, 0)}%`,
    backgroundColor: barColor,
    right: 0,
  }

  return (
    <div className={rowClasses}>
      {/* Background bar */}
      <div className='absolute top-0 bottom-0 z-0' style={backgroundStyle} />

      {/* Hover background */}
      <div className='absolute top-0 bottom-0 left-0 right-0 z-0 h-full bg-row-hover opacity-0 group-hover:opacity-100 transition-opacity' />

      {/* Price */}
      <div className={priceClasses} data-price={priceKey}>
        {formatNumber(originalPrice)}
      </div>

      {/* Size */}
      <div className={sizeClasses} data-size={size}>
        {formatNumber(originalSize)}
      </div>

      {/* Total */}
      <div className={totalClasses} data-total={total}>
        {formatNumber(total)}
      </div>
    </div>
  )
}

export default memo(OrderBookRow)
