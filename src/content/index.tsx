import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ContentApp } from './ContentApp'
import contentStyles from './content.css?inline'

const HOST_ID = 'kc-capture-host'

function mount() {
  if (document.getElementById(HOST_ID)) return

  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;overflow:visible;z-index:2147483647;pointer-events:none;'

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = contentStyles
  shadow.appendChild(style)

  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
  shadow.appendChild(mountPoint)

  document.documentElement.appendChild(host)

  createRoot(mountPoint).render(
    <StrictMode>
      <ContentApp />
    </StrictMode>,
  )
}

export function onExecute() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
}
