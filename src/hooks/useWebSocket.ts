import { useCallback, useEffect, useRef, useState } from 'react'
import { OrderBookMessage, TradeHistoryMessage } from '../types/orderbook'
import { WS_CONFIG } from '../config/websocket'

const WS_CONNECTION_CONFIG = WS_CONFIG.connection

type MessageHandler<T> = (message: T) => void
type ErrorHandler = (error: Event) => void
type ConnectionStateHandler = (state: boolean) => void

interface WebSocketHookOptions {
  onConnectionChange?: ConnectionStateHandler
  onError?: ErrorHandler
}

interface OrderBookOptions extends WebSocketHookOptions {
  onOrderBookMessage: MessageHandler<OrderBookMessage>
}

interface TradeHistoryOptions extends WebSocketHookOptions {
  onTradeMessage: MessageHandler<TradeHistoryMessage>
}

const connectionRegistry = new Map<string, WebSocket>()

function useWebSocketBase(url: string, options?: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const connectRef = useRef<() => void>(() => {})
  const attemptReconnectRef = useRef<() => void>(() => {})

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      try {
        const ws = wsRef.current
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close()
        }
      } catch (err) {
        console.error('Error closing WebSocket:', err)
      }

      wsRef.current = null
      connectionRegistry.delete(url)
    }
  }, [url])

  attemptReconnectRef.current = () => {
    if (reconnectAttemptsRef.current >= WS_CONNECTION_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current = 0
      connectRef.current()
      return
    }

    const delay = Math.min(
      WS_CONNECTION_CONFIG.RECONNECT_BASE_DELAY * Math.pow(1.5, reconnectAttemptsRef.current),
      WS_CONNECTION_CONFIG.MAX_RECONNECT_DELAY
    )

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectAttemptsRef.current++
      connectRef.current()
    }, delay)
  }

  connectRef.current = () => {
    const existingConnection = connectionRegistry.get(url)
    if (
      existingConnection &&
      (existingConnection.readyState === WebSocket.OPEN ||
        existingConnection.readyState === WebSocket.CONNECTING)
    ) {
      wsRef.current = existingConnection

      if (existingConnection.readyState === WebSocket.OPEN) {
        setIsConnected(true)
        options?.onConnectionChange?.(true)
      }
      return
    }

    cleanup()
    setIsConnected(false)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      connectionRegistry.set(url, ws)

      const connectionTimeoutId = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('Connection timed out')
          ws.close()
          connectionRegistry.delete(url)
          attemptReconnectRef.current()
        }
      }, 10000)

      ws.onopen = () => {
        clearTimeout(connectionTimeoutId)
        setIsConnected(true)
        options?.onConnectionChange?.(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onclose = event => {
        clearTimeout(connectionTimeoutId)
        setIsConnected(false)
        options?.onConnectionChange?.(false)
        connectionRegistry.delete(url)

        if (event.code !== 1000 && event.code !== 1001) {
          attemptReconnectRef.current()
        }
      }

      ws.onerror = error => {
        console.error('WebSocket error:', error)
        options?.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error)
      connectionRegistry.delete(url)
      attemptReconnectRef.current()
    }
  }

  const connect = useCallback(() => {
    connectRef.current()
  }, [])

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error(`WebSocket is not open. Cannot send message.`)
      return false
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }, [])

  const subscribe = useCallback(
    (channel: string) => {
      return sendMessage({
        op: 'subscribe',
        args: [channel],
      })
    },
    [sendMessage]
  )

  const unsubscribe = useCallback(
    (channel: string) => {
      return sendMessage({
        op: 'unsubscribe',
        args: [channel],
      })
    },
    [sendMessage]
  )

  useEffect(() => {
    // Add a small delay to avoid potential race conditions during component initialization
    const initTimeout = setTimeout(() => {
      connect()
    }, 50)

    return () => {
      clearTimeout(initTimeout)
      cleanup()
    }
  }, [url, connect, cleanup])

  return {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect: connect,
    wsRef,
  }
}

export function useOrderBookWebSocket(symbol: string, options: OrderBookOptions) {
  const wsEndpoint = WS_CONFIG.endpoints.orderBook
  const { isConnected, subscribe, wsRef } = useWebSocketBase(wsEndpoint, {
    onConnectionChange: connected => {
      options.onConnectionChange?.(connected)

      if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const success = subscribe(WS_CONFIG.channels.orderBookChannel(symbol))
        if (!success) {
          console.error(`Failed to subscribe to order book updates for ${symbol}`)
        }
      }
    },
    onError: error => {
      console.error('OrderBook WebSocket error:', error)
      options.onError?.(error)
    },
  })

  useEffect(() => {
    if (!wsRef.current) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        if (message.topic?.startsWith(WS_CONFIG.channels.orderBookChannel(symbol))) {
          options.onOrderBookMessage(message as OrderBookMessage)
        }
      } catch (error) {
        console.error('Error parsing order book message:', error)
      }
    }

    wsRef.current.addEventListener('message', handleMessage)

    return () => {
      wsRef.current?.removeEventListener('message', handleMessage)
    }
  }, [wsRef, symbol, options])

  return { isConnected }
}

export function useTradeHistoryWebSocket(symbol: string, options: TradeHistoryOptions) {
  const wsEndpoint = WS_CONFIG.endpoints.tradeHistory
  const { isConnected, subscribe, wsRef } = useWebSocketBase(wsEndpoint, {
    onConnectionChange: connected => {
      options.onConnectionChange?.(connected)

      if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const success = subscribe(WS_CONFIG.channels.tradeHistoryChannel(symbol))

        if (!success) {
          console.error(`Failed to subscribe to trade history for ${symbol}`)
        }
      }
    },
    onError: error => {
      console.error('TradeHistory WebSocket error:', error)
      options.onError?.(error)
    },
  })

  useEffect(() => {
    if (!wsRef.current) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        if (message.topic === 'tradeHistoryApi') {
          options.onTradeMessage(message as TradeHistoryMessage)
        }
      } catch (error) {
        console.error('Error parsing trade history message:', error)
      }
    }

    wsRef.current.addEventListener('message', handleMessage)

    return () => {
      wsRef.current?.removeEventListener('message', handleMessage)
    }
  }, [wsRef, symbol, options])

  return { isConnected }
}
