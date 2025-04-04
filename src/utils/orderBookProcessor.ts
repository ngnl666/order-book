import { OrderBookData, OrderBookMessage, Quote } from '../types/orderbook'

const MAX_LEVELS = 8

export function processOrderBookMessage(
  message: OrderBookMessage,
  currentData: OrderBookData | null
): OrderBookData {
  if (message.data.type === 'snapshot') {
    return processOrderBookSnapshot(message)
  } else if (message.data.type === 'delta') {
    if (!currentData || message.data.prevSeqNum !== currentData.seqNum) {
      throw new Error('Sequence number mismatch, need to reconnect')
    }

    return processOrderBook(message, currentData)
  }

  throw new Error(`Unknown message type: ${message.data.type}`)
}

function processOrderBookSnapshot(message: OrderBookMessage): OrderBookData {
  const { asks, bids, seqNum, timestamp } = message.data

  const processedAsks = processQuotes(asks, 'asks')
  const processedBids = processQuotes(bids, 'bids')

  return {
    asks: processedAsks.slice(0, MAX_LEVELS),
    bids: processedBids.slice(0, MAX_LEVELS),
    seqNum,
    timestamp,
  }
}

function processOrderBook(
  message: OrderBookMessage,
  currentOrderBook: OrderBookData
): OrderBookData {
  const { data } = message
  const { asks, bids, seqNum, timestamp } = data

  if (seqNum <= currentOrderBook.seqNum) {
    return currentOrderBook
  }

  const currentAsksMap = new Map(
    currentOrderBook.asks.map(quote => [quote.price.toString(), quote])
  )
  const currentBidsMap = new Map(
    currentOrderBook.bids.map(quote => [quote.price.toString(), quote])
  )

  for (const [price, size] of asks) {
    const priceKey = price.toString()
    const sizeNum = parseFloat(size)

    if (sizeNum === 0) {
      currentAsksMap.delete(priceKey)
    } else {
      currentAsksMap.set(priceKey, {
        price: parseFloat(price),
        size: sizeNum,
        total: 0,
        percentage: 0,
        originalPrice: price,
        originalSize: size,
      })
    }
  }

  for (const [price, size] of bids) {
    const priceKey = price.toString()
    const sizeNum = parseFloat(size)

    if (sizeNum === 0) {
      currentBidsMap.delete(priceKey)
    } else {
      currentBidsMap.set(priceKey, {
        price: parseFloat(price),
        size: sizeNum,
        total: 0,
        percentage: 0,
        originalPrice: price,
        originalSize: size,
      })
    }
  }

  let updatedAsks = Array.from(currentAsksMap.values()).sort((a, b) => a.price - b.price)
  let updatedBids = Array.from(currentBidsMap.values()).sort((a, b) => b.price - a.price)

  updatedAsks = calculateTotalsAndPercentages(updatedAsks)
  updatedBids = calculateTotalsAndPercentages(updatedBids)

  return {
    asks: updatedAsks.slice(0, MAX_LEVELS),
    bids: updatedBids.slice(0, MAX_LEVELS),
    seqNum,
    timestamp,
  }
}

function processQuotes(quotes: [string, string][], type: 'asks' | 'bids'): Quote[] {
  const parsedQuotes: Quote[] = quotes.map(([price, size]) => ({
    price: parseFloat(price),
    size: parseFloat(size),
    originalPrice: price,
    originalSize: size,
    total: 0,
    percentage: 0,
  }))

  if (type === 'asks') {
    parsedQuotes.sort((a, b) => a.price - b.price)
  } else {
    parsedQuotes.sort((a, b) => b.price - a.price)
  }

  return calculateTotalsAndPercentages(parsedQuotes)
}

function calculateTotalsAndPercentages(quotes: Quote[]): Quote[] {
  if (quotes.length === 0) return []

  const totalVolume = quotes.reduce((sum, quote) => sum + quote.size, 0)

  let runningTotal = 0
  const quotesWithTotals = quotes.map(quote => {
    runningTotal += quote.size
    return {
      ...quote,
      total: runningTotal,
      percentage: (runningTotal / totalVolume) * 100,
    }
  })

  return quotesWithTotals
}
