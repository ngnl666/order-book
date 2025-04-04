# Order Book

## Preview
[Order Book](https://order-book-steel.vercel.app/)

## Project Structure

```
order-book/
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public/
├── src/
│   ├── App.tsx
│   ├── assets/
│   ├── components/
│   │   └── order-book/
│   │       ├── LastPrice.tsx
│   │       ├── OrderBook.tsx
│   │       ├── OrderBookHeader.tsx
│   │       ├── OrderBookRow.tsx
│   │       └── index.ts
│   ├── config/
│   │   └── websocket.ts
│   ├── hooks/
│   │   ├── useOrderBook.ts
│   │   └── useWebSocket.ts
│   ├── index.css
│   ├── main.tsx
│   ├── theme.css
│   ├── types/
│   │   └── orderbook.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── formatters.ts
│   │   └── orderBookProcessor.ts
│   └── vite-env.d.ts         
├── tsconfig.app.json        
├── tsconfig.json             
├── tsconfig.node.json        
└── vite.config.ts
```

## Tech Stack

- React19
- TypeScript
- Tailwind CSS
- Vite
- eslint + prettier

## Install Dependencies

```bash
npm install
```

## Development

```bash
npm run dev
```

## Features

- Real-time Order Book Display - Shows up to 8 quotes for both buy and sell sides
- Price Change Color Indication - Displays different colors based on price movements
- Cumulative Quantity Calculation - Automatically calculates the cumulative order quantities
- Percentage Visualization - Displays the percentage of each quote relative to the total volume
- Dynamic Data Updates - Seamlessly handles WebSocket data streams
- Highlight Animation Effects - Visual feedback for new quotes and quantity changes
- Hover Interaction Effects - Enhanced user interface interactions
- Number Formatting - Uses commas as thousands separators for large numbers
- Automatic Reconnection - Handles WebSocket connection interruptions
- Efficient Data Processing - Optimized incremental update processing logic
