import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:40px;font:16px sans-serif;color:#2B2019;"><strong>ERROR:</strong> &lt;div id="root"&gt; not found in HTML.</div>'
  throw new Error('root element missing')
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
} catch (err) {
  document.body.innerHTML = `
    <div style="padding:40px;font:16px sans-serif;color:#2B2019;">
      <strong>RENDER ERROR:</strong> ${err.message}
      <pre style="background:#f5f5f5;padding:12px;margin-top:12px;overflow:auto;max-height:300px;font-size:13px;">${err.stack}</pre>
    </div>
  `
  console.error('React render failed:', err)
}
