export const WS_CONFIG = {
  // Connection settings
  connection: {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_BASE_DELAY: 1000,
    MAX_RECONNECT_DELAY: 30000,
    CONNECTION_TIMEOUT: 10000,
  },

  // BTSE WS endpoints
  endpoints: {
    orderBook: 'wss://ws.btse.com/ws/oss/futures',
    tradeHistory: 'wss://ws.btse.com/ws/futures',
  },

  // Channel subscription formats
  channels: {
    orderBookChannel: (symbol: string) => `update:${symbol}_0`,
    tradeHistoryChannel: (symbol: string) => `tradeHistoryApi:${symbol}`,
  },
}
