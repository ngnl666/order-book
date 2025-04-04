import { useCallback, useRef, useState } from 'react'
import {
  OrderBookData,
  OrderBookMessage,
  PriceChangeState,
  Quote,
  QuoteWithAnimation,
  TradeHistoryMessage,
} from '../types/orderbook'
import { processOrderBookMessage } from '../utils/orderBookProcessor'
import { useOrderBookWebSocket, useTradeHistoryWebSocket } from './useWebSocket'

interface PriceMap {
  [price: string]: {
    lastSize: number
    flashSize: 'increase' | 'decrease' | null
  }
}

function useOrderBook(symbol: string) {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null)
  const [lastPrice, setLastPrice] = useState<PriceChangeState>({
    current: 0,
    previous: null,
    direction: 'same',
    originalPrice: null,
  })
  const [error, setError] = useState<string | null>(null)

  const priceMapRef = useRef<PriceMap>({})
  const newPricesRef = useRef<Set<string>>(new Set())

  const handleOrderBookMessage = useCallback((message: OrderBookMessage) => {
    try {
      if (message.data.type === 'snapshot') {
        // For snapshot, mark all prices as new
        message.data.asks.forEach(([price]) => {
          const priceKey = price.toString()
          newPricesRef.current.add(priceKey)

          priceMapRef.current[priceKey] = {
            lastSize: 0,
            flashSize: null,
          }
        })

        message.data.bids.forEach(([price]) => {
          const priceKey = price.toString()
          newPricesRef.current.add(priceKey)

          priceMapRef.current[priceKey] = {
            lastSize: 0,
            flashSize: null,
          }
        })
      } else if (message.data.type === 'delta') {
        // For delta updates, only mark prices that weren't seen before
        message.data.asks.forEach(([price]) => {
          const priceKey = price.toString()
          if (!priceMapRef.current[priceKey]) {
            newPricesRef.current.add(priceKey)

            priceMapRef.current[priceKey] = {
              lastSize: 0,
              flashSize: null,
            }
          }
        })

        message.data.bids.forEach(([price]) => {
          const priceKey = price.toString()
          if (!priceMapRef.current[priceKey]) {
            newPricesRef.current.add(priceKey)

            priceMapRef.current[priceKey] = {
              lastSize: 0,
              flashSize: null,
            }
          }
        })
      }

      setOrderBookData(prevData => {
        try {
          return processOrderBookMessage(message, prevData)
        } catch (error) {
          console.error('Failed to process order book message:', error)
          return prevData
        }
      })
    } catch (err) {
      console.error('Error handling order book message:', err)
      setError('Failed to process order book data')
    }
  }, [])

  const handleTradeMessage = useCallback((message: TradeHistoryMessage) => {
    try {
      if (message.data && message.data.length > 0) {
        const firstTrade = message.data[0]
        const price =
          typeof firstTrade.price === 'string' ? parseFloat(firstTrade.price) : firstTrade.price

        const originalPrice =
          typeof firstTrade.price === 'string' ? firstTrade.price : firstTrade.price.toString()

        setLastPrice(prev => {
          if (price === prev.current) {
            return prev
          }

          return {
            current: price,
            originalPrice,
            previous: prev.current,
            direction: price > prev.current ? 'up' : 'down',
          }
        })
      }
    } catch (err) {
      console.error('Error processing trade history message:', err)
      setError('Failed to process trade data')
    }
  }, [])

  const handleConnectionChange = useCallback((state: boolean) => {
    if (!state) {
      setError('WebSocket connection lost. Attempting to reconnect...')
    } else {
      setError(null)
    }
  }, [])

  const handleError = useCallback((err: Event) => {
    console.error('WebSocket error:', err)
    setError('WebSocket connection error')
  }, [])

  const { isConnected: isOrderBookConnected } = useOrderBookWebSocket(symbol, {
    onOrderBookMessage: handleOrderBookMessage,
    onConnectionChange: handleConnectionChange,
    onError: handleError,
  })

  const { isConnected: isTradeConnected } = useTradeHistoryWebSocket(symbol, {
    onTradeMessage: handleTradeMessage,
    onConnectionChange: handleConnectionChange,
    onError: handleError,
  })

  const processQuotesForDisplay = useCallback((quotes: Quote[]): QuoteWithAnimation[] => {
    if (!quotes) return []

    return quotes.map(quote => {
      const priceKey = quote.price.toString()
      const isNewPrice = newPricesRef.current.has(priceKey)

      if (isNewPrice) {
        setTimeout(() => {
          newPricesRef.current.delete(priceKey)
        }, 300)
      }

      let flashSize: 'increase' | 'decrease' | null = null

      if (priceMapRef.current[priceKey]) {
        const lastSize = priceMapRef.current[priceKey].lastSize
        const currentSize = parseFloat(quote.size.toString())

        if (currentSize > lastSize) {
          flashSize = 'increase'
        } else if (currentSize < lastSize) {
          flashSize = 'decrease'
        }

        priceMapRef.current[priceKey] = {
          lastSize: currentSize,
          flashSize,
        }
      } else {
        priceMapRef.current[priceKey] = {
          lastSize: parseFloat(quote.size.toString()),
          flashSize: null,
        }
      }

      return {
        quote,
        priceKey,
        flashPrice: isNewPrice,
        flashSize,
        isNew: isNewPrice,
      }
    })
  }, [])

  const processedAsks = useCallback(() => {
    return orderBookData ? processQuotesForDisplay(orderBookData.asks) : []
  }, [orderBookData, processQuotesForDisplay])

  const processedBids = useCallback(() => {
    return orderBookData ? processQuotesForDisplay(orderBookData.bids) : []
  }, [orderBookData, processQuotesForDisplay])

  // console.log('orderBookData', orderBookData)
  // TODO

  return {
    orderBookData,
    lastPrice,
    isConnected: isOrderBookConnected && isTradeConnected,
    error,
    asks: processedAsks(),
    bids: processedBids(),
  }
}

export default useOrderBook
