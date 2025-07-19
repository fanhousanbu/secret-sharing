import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['shield.svg'],
      manifest: {
        name: 'Secure Secret Sharing',
        short_name: 'SecretShare',
        description: 'A client-side tool for securely splitting files using Shamir\'s Secret Sharing.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'shield.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'shield.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },

  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
}) 