import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'

function removeModuleType(): Plugin {
  return {
    name: 'remove-module-type',
    apply: 'build',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module"/g, '<script defer')
        .replace(/ crossorigin/g, '')
    },
  }
}

function dynamicProxy(): Plugin {
  return {
    name: 'dynamic-proxy',
    configureServer(server) {
      server.middlewares.use('/svws-proxy', (req, res, next) => {
        const targetBase = req.headers['x-proxy-target'] as string | undefined
        if (!targetBase) return next()

        const targetUrl = new URL(req.url ?? '/', targetBase)
        const headers: Record<string, string | string[]> = {}
        for (const [k, v] of Object.entries(req.headers)) {
          if (k === 'x-proxy-target' || k === 'host') continue
          if (v !== undefined) headers[k] = v as string | string[]
        }
        headers['host'] = targetUrl.host

        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'https:' ? '443' : '80'),
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers,
          rejectUnauthorized: false,
        }

        const transport = targetUrl.protocol === 'https:' ? https : http
        const proxyReq = transport.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode!, proxyRes.headers as Record<string, string | string[]>)
          proxyRes.pipe(res)
        })
        proxyReq.on('error', () => { res.writeHead(502); res.end('Proxy error') })
        req.pipe(proxyReq)
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), removeModuleType(), dynamicProxy()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  },
  test: {
    environment: 'node',
  },
})
