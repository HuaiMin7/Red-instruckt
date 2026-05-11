import type { KeyBindings, OutputFormat, ToolbarSettingsAdapter, ToolsConfig } from '../types'
import { OUTPUT_FORMAT_OPTIONS } from '../types'
import { TOOLBAR_CSS } from './styles'

export type ToolbarMode = 'idle' | 'annotating' | 'frozen'

interface ToolbarCallbacks {
  onToggleAnnotate: (active: boolean) => void
  onFreezeAnimations: (frozen: boolean) => void
  onScreenshot: () => void
  onCopy: () => void
  onClearPage?: () => void
  onClearAll?: () => void
  onMinimize?: (minimized: boolean) => void
}

// ── Inline SVG icons (24x24, 2px stroke) ─────────────────────

const ICONS = {
  annotate: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
  freeze: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  minimize: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`,
  screenshot: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.21 16.96l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.21l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  logo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
} as const

export class Toolbar {
  private host!: HTMLElement
  private shadow!: ShadowRoot
  private toolbarEl!: HTMLDivElement
  private fab!: HTMLButtonElement
  private fabBadge: HTMLSpanElement | null = null
  private annotateBtn!: HTMLButtonElement
  private freezeBtn!: HTMLButtonElement
  private copyBtn!: HTMLButtonElement
  private annotateActive = false
  private freezeActive = false
  private minimized = false
  private totalCount = 0
  private dragging = false
  private dragOffset = { x: 0, y: 0 }

  private settingsBtn: HTMLButtonElement | null = null
  private settingsPanel: HTMLDivElement | null = null
  private settingsOpen = false

  private keys: KeyBindings

  private readonly tools: ToolsConfig

  private readonly settings: ToolbarSettingsAdapter | null

  constructor(
    private readonly position: string,
    private readonly callbacks: ToolbarCallbacks,
    keys?: KeyBindings,
    tools?: ToolsConfig,
    settings?: ToolbarSettingsAdapter,
  ) {
    this.keys = keys ?? {}
    this.tools = tools ?? {}
    this.settings = settings ?? null
    this.build()
    this.setupDrag()
  }

  /** Whether a built-in tool should be shown (default true if not specified). */
  private show(id: keyof ToolsConfig): boolean {
    const v = this.tools[id]
    return v !== false
  }

  private build(): void {
    this.host = document.createElement('div')
    this.host.setAttribute('data-instruckt', 'toolbar')
    this.shadow = this.host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = TOOLBAR_CSS
    this.shadow.appendChild(style)

    // Full toolbar
    this.toolbarEl = document.createElement('div')
    this.toolbarEl.className = 'toolbar'

    // Visible drag handle at the top of the toolbar
    const dragHandle = document.createElement('div')
    dragHandle.className = 'drag-handle'
    dragHandle.setAttribute('aria-label', 'Drag to reposition toolbar')
    dragHandle.innerHTML = `<svg width="16" height="6" viewBox="0 0 16 6" fill="currentColor">
      <circle cx="4" cy="1.5" r="1.2"/><circle cx="8" cy="1.5" r="1.2"/><circle cx="12" cy="1.5" r="1.2"/>
      <circle cx="4" cy="4.5" r="1.2"/><circle cx="8" cy="4.5" r="1.2"/><circle cx="12" cy="4.5" r="1.2"/>
    </svg>`
    this.toolbarEl.appendChild(dragHandle)

    const k = this.keys
    this.annotateBtn = this.makeBtn(ICONS.annotate, `Annotate elements (${(k.annotate ?? 'A').toUpperCase()})`, () => {
      const next = !this.annotateActive
      this.setAnnotateActive(next)
      this.callbacks.onToggleAnnotate(next)
    })

    this.freezeBtn = this.makeBtn(ICONS.freeze, `Freeze page (${(k.freeze ?? 'F').toUpperCase()})`, () => {
      const next = !this.freezeActive
      this.setFreezeActive(next)
      this.callbacks.onFreezeAnimations(next)
    })

    const screenshotBtn = this.makeBtn(ICONS.screenshot, `Screenshot region (${(k.screenshot ?? 'C').toUpperCase()})`, () => {
      this.callbacks.onScreenshot()
    })

    this.copyBtn = this.makeBtn(ICONS.copy, 'Copy annotations as markdown', () => {
      this.callbacks.onCopy()
      this.copyBtn.innerHTML = ICONS.check
      setTimeout(() => { this.copyBtn.innerHTML = ICONS.copy }, 1200)
    })

    const clearWrap = document.createElement('div')
    clearWrap.className = 'clear-wrap'

    const clearBtn = this.makeBtn(ICONS.clear, `Clear this page (${(k.clearPage ?? 'X').toUpperCase()})`, () => {
      this.callbacks.onClearPage?.()
    })
    clearBtn.classList.add('danger-btn')

    const clearAllBtn = this.makeBtn(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
      'Delete all instructions.',
      () => this.callbacks.onClearAll?.(),
    )
    clearAllBtn.classList.add('danger-btn', 'clear-all-btn')

    clearWrap.appendChild(clearBtn)
    clearWrap.appendChild(clearAllBtn)

    this.settingsBtn = this.makeBtn(ICONS.settings, 'Settings', () => this.toggleSettings())
    this.settingsBtn.classList.add('settings-btn')

    const minimizeBtn = this.makeBtn(ICONS.minimize, 'Minimize toolbar', () => {
      this.setMinimized(true)
    })
    minimizeBtn.classList.add('minimize-btn')

    const mkDiv = () => { const d = document.createElement('div'); d.className = 'divider'; return d }
    const toAppend: (HTMLButtonElement | HTMLDivElement)[] = []
    const add = (el: HTMLButtonElement | HTMLDivElement) => {
      if (toAppend.length > 0) toAppend.push(mkDiv())
      toAppend.push(el)
    }
    if (this.show('annotate')) add(this.annotateBtn)
    if (this.show('screenshot')) add(screenshotBtn)
    if (this.show('freeze')) add(this.freezeBtn)
    if (this.show('copy')) add(this.copyBtn)
    if (this.show('clear_page') || this.show('clear_all')) add(clearWrap)
    if (this.show('settings')) add(this.settingsBtn)
    if (this.show('minimize')) add(minimizeBtn)
    this.toolbarEl.append(...toAppend)
    this.shadow.appendChild(this.toolbarEl)

    // Settings panel — populated below; new sections can be appended later.
    this.settingsPanel = document.createElement('div')
    this.settingsPanel.className = 'settings-panel'
    this.settingsPanel.setAttribute('role', 'dialog')
    this.settingsPanel.setAttribute('aria-label', 'Settings')
    this.settingsPanel.innerHTML = `
      <div class="panel-head">
        <div class="panel-title">Settings</div>
        <button class="panel-close" aria-label="Close settings">${ICONS.close}</button>
      </div>
      <div class="panel-body"></div>
    `
    this.settingsPanel.style.display = 'none'
    this.shadow.appendChild(this.settingsPanel)

    this.settingsPanel.querySelector('.panel-close')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.closeSettings()
    })

    this.buildSettingsBody()

    // Floating action button (minimized state)
    this.fab = document.createElement('button')
    this.fab.className = 'fab'
    this.fab.title = 'Open instruckt toolbar'
    this.fab.setAttribute('aria-label', 'Open instruckt toolbar')
    this.fab.innerHTML = ICONS.logo
    this.fab.style.display = 'none'
    this.fab.addEventListener('click', (e) => {
      e.stopPropagation()
      this.setMinimized(false)
    })
    this.shadow.appendChild(this.fab)

    // Prevent toolbar clicks from reaching page handlers (e.g. Alpine @click.outside)
    // Shadow DOM stopPropagation only works within the shadow tree — clicks still
    // re-dispatch from the host element into the regular DOM.
    this.host.addEventListener('click', (e) => e.stopPropagation())
    this.host.addEventListener('mousedown', (e) => e.stopPropagation())
    this.host.addEventListener('pointerdown', (e) => e.stopPropagation())

    this.applyPosition()
    this.loadSavedPosition()
    const root = document.getElementById('instruckt-root') ?? document.body
    root.appendChild(this.host)
  }

  private makeBtn(iconHtml: string, tooltip: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.setAttribute('data-tooltip', tooltip)
    btn.setAttribute('aria-label', tooltip)
    btn.innerHTML = iconHtml
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick()
    })
    return btn
  }

  private applyPosition(): void {
    const m = '16px'
    Object.assign(this.host.style, {
      position: 'fixed',
      zIndex: '2147483646',
      bottom: this.position.includes('bottom') ? m : 'auto',
      top: this.position.includes('top') ? m : 'auto',
      right: this.position.includes('right') ? m : 'auto',
      left: this.position.includes('left') ? m : 'auto',
    })
  }

  private static readonly POSITION_KEY = 'instruckt:toolbar-pos'

  private savePosition(): void {
    const { left, right, top, bottom } = this.host.style
    try {
      localStorage.setItem(Toolbar.POSITION_KEY, JSON.stringify({ left, right, top, bottom }))
    } catch {}
  }

  private loadSavedPosition(): void {
    try {
      const raw = localStorage.getItem(Toolbar.POSITION_KEY)
      if (!raw) return
      const { left, right, top, bottom } = JSON.parse(raw)
      Object.assign(this.host.style, { left, right, top, bottom })
    } catch {}
  }

  private setupDrag(): void {
    this.shadow.addEventListener('mousedown', (evt) => {
      const e = evt as MouseEvent
      const target = e.target as Element
      // Don't start drag from buttons, fab, or inside the settings panel
      if (target.closest('.btn') || target.closest('.fab') || target.closest('.settings-panel')) return
      this.dragging = true
      const rect = this.host.getBoundingClientRect()
      this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.dragging) return
      Object.assign(this.host.style, {
        left: `${e.clientX - this.dragOffset.x}px`,
        bottom: `${window.innerHeight - (e.clientY - this.dragOffset.y) - this.host.offsetHeight}px`,
        top: 'auto',
        right: 'auto',
      })
    })

    document.addEventListener('mouseup', () => {
      if (this.dragging) this.savePosition()
      this.dragging = false
    })
  }

  private setMinimized(min: boolean): void {
    this.minimized = min
    this.toolbarEl.style.display = min ? 'none' : ''
    this.fab.style.display = min ? '' : 'none'
    if (min) this.closeSettings()
    this.updateFabBadge()
    this.callbacks.onMinimize?.(min)
  }

  // ── Settings panel ────────────────────────────────────────────

  private buildSettingsBody(): void {
    if (!this.settingsPanel) return
    const body = this.settingsPanel.querySelector('.panel-body') as HTMLDivElement | null
    if (!body) return

    // ── Output format ───────────────────────────────────────────
    const section = document.createElement('div')
    section.className = 'settings-section'
    section.innerHTML = `
      <div class="settings-section-head">
        <div class="settings-section-title">Output format</div>
        <div class="settings-section-help">Used when copying annotations as Markdown for AI agents.</div>
      </div>
    `

    const grid = document.createElement('div')
    grid.className = 'format-options'

    const current: OutputFormat = this.settings?.getOutputFormat() ?? 'standard'

    for (const opt of OUTPUT_FORMAT_OPTIONS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'format-option'
      btn.dataset.value = opt.id
      if (opt.id === current) btn.classList.add('active')
      btn.innerHTML = `
        <span class="name">${opt.label}</span>
        <span class="desc">${opt.desc}</span>
      `
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.selectOutputFormat(opt.id)
      })
      grid.appendChild(btn)
    }

    section.appendChild(grid)
    body.appendChild(section)
  }

  private selectOutputFormat(fmt: OutputFormat): void {
    if (!this.settingsPanel) return
    this.settings?.setOutputFormat(fmt)
    const options = this.settingsPanel.querySelectorAll<HTMLButtonElement>('.format-option')
    options.forEach((el) => {
      el.classList.toggle('active', el.dataset.value === fmt)
    })
  }

  private toggleSettings(): void {
    if (this.settingsOpen) this.closeSettings()
    else this.openSettings()
  }

  private openSettings(): void {
    if (!this.settingsPanel || !this.settingsBtn) return
    this.settingsOpen = true
    this.settingsBtn.classList.add('active')
    this.settingsPanel.style.display = 'block'
    this.positionSettingsPanel()
    document.addEventListener('mousedown', this.boundOutsideClick, true)
  }

  private closeSettings(): void {
    if (!this.settingsPanel) return
    this.settingsOpen = false
    this.settingsBtn?.classList.remove('active')
    this.settingsPanel.style.display = 'none'
    document.removeEventListener('mousedown', this.boundOutsideClick, true)
  }

  private boundOutsideClick = (e: MouseEvent): void => {
    // Shadow DOM retargets the event to the host when crossing boundaries.
    // If the click is outside the toolbar host entirely, close the panel.
    if (!this.host.contains(e.target as Node)) {
      this.closeSettings()
    }
  }

  private positionSettingsPanel(): void {
    if (!this.settingsPanel || !this.settingsBtn) return
    // Measure (offscreen) so we know panel size, then place next to toolbar.
    Object.assign(this.settingsPanel.style, { display: 'block', left: '-9999px', top: '0px' })
    const panelRect = this.settingsPanel.getBoundingClientRect()
    const w = panelRect.width
    const h = panelRect.height
    const tb = this.toolbarEl.getBoundingClientRect()
    const anchor = this.settingsBtn.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 8
    const gap = 8

    let left: number
    if (tb.left - gap - w >= pad) {
      left = tb.left - gap - w
    } else if (tb.right + gap + w + pad <= vw) {
      left = tb.right + gap
    } else {
      left = Math.max(pad, Math.min(tb.left, vw - w - pad))
    }
    let top = anchor.top + anchor.height / 2 - h / 2
    top = Math.max(pad, Math.min(top, vh - h - pad))

    Object.assign(this.settingsPanel.style, { left: `${left}px`, top: `${top}px` })
  }

  private updateFabBadge(): void {
    if (this.totalCount > 0 && this.minimized) {
      if (!this.fabBadge) {
        this.fabBadge = document.createElement('span')
        this.fabBadge.className = 'fab-badge'
        this.fab.appendChild(this.fabBadge)
      }
      this.fabBadge.textContent = this.totalCount > 99 ? '99+' : String(this.totalCount)
    } else {
      this.fabBadge?.remove()
      this.fabBadge = null
    }
  }

  isMinimized(): boolean {
    return this.minimized
  }

  /** Programmatically minimize without firing callback */
  minimize(): void {
    this.minimized = true
    this.toolbarEl.style.display = 'none'
    this.fab.style.display = ''
    this.updateFabBadge()
  }

  setAnnotateActive(active: boolean): void {
    this.annotateActive = active
    this.annotateBtn.classList.toggle('active', active)
    document.body.classList.toggle('ik-annotating', active)
  }

  setFreezeActive(active: boolean): void {
    this.freezeActive = active
    this.freezeBtn.classList.toggle('active', active)
  }

  // Keep for compatibility — resolves visual mode from instruckt.ts
  setMode(mode: ToolbarMode): void {
    this.setAnnotateActive(mode === 'annotating')
  }

  setAnnotationCount(count: number): void {
    let badge = this.annotateBtn.querySelector('.badge')
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span')
        badge.className = 'badge'
        this.annotateBtn.appendChild(badge)
      }
      badge.textContent = count > 99 ? '99+' : String(count)
    } else {
      badge?.remove()
    }
  }

  setTotalCount(count: number): void {
    this.totalCount = count
    this.updateFabBadge()
  }

  destroy(): void {
    document.removeEventListener('mousedown', this.boundOutsideClick, true)
    this.host.remove()
    document.body.classList.remove('ik-annotating')
  }
}
