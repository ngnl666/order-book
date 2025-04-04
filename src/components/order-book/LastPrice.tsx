import { cn } from '../../utils/cn'
import { formatNumber } from '../../utils/formatters'

interface LastPriceProps {
  price: number
  change: 'up' | 'down' | 'same'
  originalPrice?: string | null
}

export function LastPrice({ price, change, originalPrice }: LastPriceProps) {
  const containerClasses = cn(
    'py-2 flex items-center justify-between rounded',
    change === 'up' && 'bg-last-price-up-bg',
    change === 'down' && 'bg-last-price-down-bg',
    change === 'same' && 'bg-last-price-same-bg'
  )

  const priceClasses = cn(
    'font-semibold text-xl',
    change === 'up' && 'text-price-buy',
    change === 'down' && 'text-price-sell',
    change === 'same' && 'text-text-default'
  )

  const iconClasses = cn(
    'w-6 h-6 ml-2',
    change === 'up' && 'text-price-buy rotate-180',
    change === 'down' && 'text-price-sell',
    change === 'same' && 'text-text-header'
  )

  return (
    <div className={containerClasses}>
      <div className='flex items-center justify-center w-full'>
        <span className={priceClasses}>
          {originalPrice ? formatNumber(originalPrice) : formatNumber(price)}
        </span>
        {change !== 'same' && (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={iconClasses}
          >
            <path d='M12 19V5M5 12l7 7 7-7' />
          </svg>
        )}
      </div>
    </div>
  )
}
