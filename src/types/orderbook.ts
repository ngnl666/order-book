export interface Quote {
  price: number
  size: number
  total: number
  percentage: number
  originalPrice: string
  originalSize: string
}

export interface OrderBookData {
  asks: Quote[]
  bids: Quote[]
  seqNum: number
  timestamp: number
}

export interface OrderBookMessage {
  topic: string
  data: {
    asks: [string, string][]
    bids: [string, string][]
    seqNum: number
    prevSeqNum?: number
    type: 'snapshot' | 'delta'
    symbol: string
    timestamp: number
  }
}

export interface TradeHistoryMessage {
  topic: string
  data: TradeData[]
}

export interface TradeData {
  symbol: string
  side: 'BUY' | 'SELL'
  size: number
  price: number
  timestamp: number
  tradeId: string
}

export interface PriceChangeState {
  current: number
  previous: number | null
  direction: 'up' | 'down' | 'same'
  originalPrice: string | null
}

export interface QuoteWithAnimation {
  quote: Quote
  priceKey: string
  flashPrice: boolean
  flashSize: 'increase' | 'decrease' | null
  isNew: boolean
}
