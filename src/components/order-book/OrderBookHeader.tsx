import { cn } from '../../utils/cn'

interface OrderBookHeaderProps {
  className?: string
}

export function OrderBookHeader({ className }: OrderBookHeaderProps) {
  return (
    <div className={cn('grid grid-cols-3 py-3 text-text-header text-xs font-medium', className)}>
      <div className='text-left pl-4'>Price (USD)</div>
      <div className='text-right'>Size</div>
      <div className='text-right pr-4'>Total</div>
    </div>
  )
}
