import useOrderBook from '../../hooks/useOrderBook'
import { OrderBookHeader } from './OrderBookHeader'
import OrderBookRow from './OrderBookRow'
import { LastPrice } from './LastPrice'

export function OrderBook() {
  const { asks, bids, lastPrice } = useOrderBook('BTCPFC')

  return (
    <div className='w-full max-w-md mx-auto bg-app-bg text-text-default rounded-lg shadow-lg overflow-hidden'>
      <div className='p-4 border-b border-gray-800'>
        <h2 className='text-lg font-semibold'>Order Book</h2>
      </div>

      <div className='asks-container'>
        <OrderBookHeader />
        <div className='h-[256px] overflow-y-auto'>
          {asks.length === 0 ? (
            <div className='h-full flex items-center justify-center'>
              <div className='text-text-header text-sm'>Loading sell orders...</div>
            </div>
          ) : (
            [...asks]
              .reverse()
              .map(ask => (
                <OrderBookRow
                  key={`ask-${ask.priceKey}-${ask.quote.total}`}
                  data={ask}
                  type='ask'
                  barColor='rgba(255, 90, 90, 0.12)'
                />
              ))
          )}
        </div>
      </div>

      <LastPrice
        price={lastPrice.current}
        change={lastPrice.direction}
        originalPrice={lastPrice.originalPrice}
      />

      <div className='bids-container'>
        <div className='h-[256px] overflow-y-auto'>
          {bids.length === 0 ? (
            <div className='h-full flex items-center justify-center'>
              <div className='text-text-header text-sm'>Loading buy orders...</div>
            </div>
          ) : (
            bids.map(bid => (
              <OrderBookRow
                key={`bid-${bid.priceKey}-${bid.quote.total}`}
                data={bid}
                type='bid'
                barColor='rgba(16, 186, 104, 0.12)'
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
