import type { KeyBindings, OutputFormat, ToolbarSettingsAdapter, ToolsConfig } from '../types'
import { TOOLBAR_CSS } from './styles'
import { getToolbarI18n, UI_LOCALE_CYCLE, uiLocaleLabel } from './locale'
import { INSTRUCKT_VERSION } from '../version'

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

/** Cycle order for Output format row (click to advance). */
const OUTPUT_FORMAT_CYCLE: OutputFormat[] = ['compact', 'standard', 'detailed', 'forensic']

/** Preset marker colors (Figma order — first matches brand accent). */
const MARKER_SWATCH_HEX: readonly string[] = [
  '#ff2442', '#ff6b35', '#fbbf24', '#22c55e', '#06b6d4', '#3b82f6', '#1e3a8a',
]

const HELP_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="currentColor"><path d="M8.0711 4C7.25791 4 6.62055 4.23077 6.15901 4.7033C5.8141 5.04821 5.59807 5.48517 5.51091 6.01877C5.45955 6.33323 5.725 6.59341 6.04363 6.59341C6.36225 6.59341 6.60796 6.33137 6.67766 6.02047C6.72637 5.8032 6.80623 5.62056 6.91725 5.47253C7.13704 5.15385 7.49967 5 7.99418 5C8.38978 5 8.70846 5.10989 8.92824 5.32967C9.13703 5.54945 9.24693 5.84615 9.24693 6.23077C9.24693 6.51648 9.13704 6.78022 8.93923 7.03297L8.75242 7.24176C8.0711 7.84615 7.65352 8.2967 7.51066 8.6044C7.35682 8.89011 7.29088 9.24176 7.29088 9.64835C7.29088 9.75153 7.37452 9.83517 7.47769 9.83517H8.27989C8.38307 9.83517 8.46671 9.75153 8.46671 9.64835C8.46671 9.38462 8.52165 9.14286 8.64253 8.92308C8.74143 8.72528 8.89528 8.52747 9.10407 8.35165C9.62055 7.9011 9.92824 7.61539 10.0271 7.49451C10.3019 7.14286 10.4447 6.69231 10.4447 6.15385C10.4447 5.49451 10.2249 4.96703 9.78539 4.58242C9.34583 4.18681 8.7744 4 8.0711 4Z"/><path d="M7.87309 10.4287C8.10386 10.4287 8.30166 10.4946 8.4555 10.6485C8.60935 10.7913 8.68627 10.9782 8.68627 11.2089C8.68627 11.4397 8.59836 11.6265 8.44452 11.7804C8.29067 11.9232 8.09287 12.0001 7.87309 12.0001C7.65331 12.0001 7.4555 11.9232 7.30166 11.7694C7.14781 11.6155 7.07089 11.4287 7.07089 11.2089C7.07089 10.9782 7.14781 10.7913 7.30166 10.6485C7.4555 10.4946 7.65331 10.4287 7.87309 10.4287Z"/><path d="M8.00007 14.6663C4.31817 14.6663 1.3334 11.6816 1.3334 7.99968C1.3334 4.31778 4.31817 1.33301 8.00007 1.33301C11.682 1.33301 14.6667 4.31778 14.6667 7.99968C14.6667 11.6816 11.682 14.6663 8.00007 14.6663ZM13.6667 7.99968C13.6667 4.87006 11.1297 2.33301 8.00007 2.33301C4.87046 2.33301 2.3334 4.87006 2.3334 7.99968C2.3334 11.1293 4.87046 13.6663 8.00007 13.6663C11.1297 13.6663 13.6667 11.1293 13.6667 7.99968Z"/></g></svg>`

/** Settings header wordmark — design asset (Figma). */
const SETTINGS_BRAND_LOGO_SVG = `<svg width="102" height="9" viewBox="0 0 102 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.66569e-06 8.58V1.43051e-06H7.188C8.076 1.43051e-06 8.764 0.224001 9.252 0.672001C9.748 1.12 9.996 1.8 9.996 2.712C9.996 3.488 9.816 4.096 9.456 4.536C9.096 4.976 8.584 5.252 7.92 5.364L9.9 8.58H7.716L5.88 5.424H1.92V8.58H3.66569e-06ZM6.96 1.56H1.92V3.852L6.96 3.864C7.312 3.864 7.58 3.776 7.764 3.6C7.956 3.424 8.052 3.128 8.052 2.712C8.052 2.288 7.956 1.992 7.764 1.824C7.58 1.648 7.312 1.56 6.96 1.56ZM14.4255 8.64C13.3535 8.64 12.5175 8.376 11.9175 7.848C11.3175 7.312 11.0175 6.528 11.0175 5.496C11.0175 4.456 11.3175 3.672 11.9175 3.144C12.5175 2.608 13.3535 2.34 14.4255 2.34H17.4255C18.1295 2.34 18.6655 2.508 19.0335 2.844C19.4095 3.172 19.5975 3.644 19.5975 4.26C19.5975 5.516 18.8735 6.144 17.4255 6.144H12.8895C13.0575 6.888 13.5695 7.26 14.4255 7.26H19.2855V8.64H14.4255ZM14.4255 3.72C13.6015 3.72 13.0935 4.068 12.9015 4.764H17.3415C17.5015 4.764 17.6255 4.716 17.7135 4.62C17.8095 4.524 17.8575 4.392 17.8575 4.224C17.8575 3.888 17.6855 3.72 17.3415 3.72H14.4255ZM28.2874 8.58H26.5474V1.43051e-06H28.2874V8.58ZM27.9874 8.58H23.8474C22.7754 8.58 21.9394 8.316 21.3394 7.788C20.7394 7.26 20.4394 6.496 20.4394 5.496C20.4394 4.488 20.7394 3.72 21.3394 3.192C21.9394 2.664 22.7754 2.4 23.8474 2.4H27.8674V3.78H23.8474C23.3274 3.78 22.9274 3.924 22.6474 4.212C22.3754 4.492 22.2394 4.92 22.2394 5.496C22.2394 6.064 22.3754 6.492 22.6474 6.78C22.9274 7.06 23.3274 7.2 23.8474 7.2H27.9874V8.58ZM29.4291 5.772V4.392H33.1011V5.772H29.4291ZM34.238 8.58V2.4H35.978V8.58H34.238ZM34.226 1.38V0.0240011H35.99V1.38H34.226ZM37.2966 8.58V2.4H42.6846C43.3886 2.4 43.9006 2.576 44.2206 2.928C44.5486 3.272 44.7126 3.728 44.7126 4.296V8.58H42.9726V4.5C42.9726 4.02 42.7326 3.78 42.2526 3.78H39.0366V8.58H37.2966ZM45.7644 8.64V7.26H51.6444C51.9804 7.26 52.1484 7.072 52.1484 6.696C52.1484 6.328 51.9804 6.144 51.6444 6.144H47.8404C47.1284 6.144 46.5884 5.984 46.2204 5.664C45.8524 5.336 45.6684 4.868 45.6684 4.26C45.6684 3.644 45.8524 3.172 46.2204 2.844C46.5964 2.508 47.1364 2.34 47.8404 2.34H53.3124V3.72H47.9244C47.5804 3.72 47.4084 3.888 47.4084 4.224C47.4084 4.392 47.4564 4.524 47.5524 4.62C47.6484 4.716 47.7724 4.764 47.9244 4.764H51.9564C52.5804 4.764 53.0564 4.928 53.3844 5.256C53.7204 5.576 53.8884 6.044 53.8884 6.66C53.8884 7.284 53.7204 7.772 53.3844 8.124C53.0484 8.468 52.5724 8.64 51.9564 8.64H45.7644ZM58.1258 8.58C57.4298 8.58 56.9178 8.408 56.5898 8.064C56.2618 7.712 56.0978 7.252 56.0978 6.684V3.78H54.3098V2.4H56.0978V0.504001H57.8378V2.4H60.4058V3.78H57.8378V6.468C57.8378 6.956 58.0778 7.2 58.5578 7.2H60.7418V8.58H58.1258ZM61.6364 8.58V2.4H66.3644C67.0604 2.4 67.5724 2.576 67.9004 2.928C68.2284 3.272 68.3924 3.728 68.3924 4.296V5.58H66.6284V4.512C66.6284 4.032 66.3884 3.792 65.9084 3.792H63.4004V8.58H61.6364ZM71.3153 8.58C70.6113 8.58 70.0953 8.404 69.7673 8.052C69.4473 7.7 69.2873 7.244 69.2873 6.684V2.4H71.0273V6.48C71.0273 6.96 71.2673 7.2 71.7473 7.2H74.2433C74.7233 7.2 74.9633 6.96 74.9633 6.48V2.4H76.7033V6.684C76.7033 7.244 76.5393 7.7 76.2113 8.052C75.8913 8.404 75.3793 8.58 74.6753 8.58H71.3153ZM81.1286 8.64C80.0566 8.64 79.2206 8.376 78.6206 7.848C78.0206 7.312 77.7206 6.528 77.7206 5.496C77.7206 4.456 78.0206 3.672 78.6206 3.144C79.2206 2.608 80.0566 2.34 81.1286 2.34H85.1486V3.72H81.1286C80.6086 3.72 80.2086 3.864 79.9286 4.152C79.6566 4.44 79.5206 4.888 79.5206 5.496C79.5206 6.096 79.6566 6.54 79.9286 6.828C80.2086 7.116 80.6086 7.26 81.1286 7.26H85.2686V8.64H81.1286ZM86.1638 8.58V1.43051e-06H87.9038V2.4H92.0558C92.7598 2.4 93.2958 2.568 93.6638 2.904C94.0398 3.232 94.2278 3.704 94.2278 4.32C94.2278 5.328 93.7478 5.928 92.7878 6.12L94.2518 8.58H92.2958L90.8798 6.192H87.9038V8.58H86.1638ZM91.9718 3.768H87.9038V4.824H91.9718C92.1318 4.824 92.2558 4.776 92.3438 4.68C92.4398 4.584 92.4878 4.452 92.4878 4.284C92.4878 3.94 92.3158 3.768 91.9718 3.768ZM98.5438 8.58C97.8478 8.58 97.3358 8.408 97.0078 8.064C96.6798 7.712 96.5158 7.252 96.5158 6.684V3.78H94.7278V2.4H96.5158V0.504001H98.2558V2.4H100.824V3.78H98.2558V6.468C98.2558 6.956 98.4958 7.2 98.9758 7.2H101.16V8.58H98.5438Z" fill="#FF2442"/></svg>`

/** Vertical “more” control (Figma value affordance). */
const MORE_VERT_ICON = `<svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="2" r="1.4"/><circle cx="2" cy="8" r="1.4"/><circle cx="2" cy="14" r="1.4"/></svg>`

export class Toolbar {
  private host!: HTMLElement
  private shadow!: ShadowRoot
  private toolbarEl!: HTMLDivElement
  private fab!: HTMLButtonElement
  private fabBadge: HTMLSpanElement | null = null
  private annotateBtn!: HTMLButtonElement
  private freezeBtn!: HTMLButtonElement
  private copyBtn!: HTMLButtonElement
  private dragHandle!: HTMLDivElement
  private screenshotBtn: HTMLButtonElement | null = null
  private clearPageBtn!: HTMLButtonElement
  private clearAllBtn!: HTMLButtonElement
  private minimizeBtn: HTMLButtonElement | null = null
  private panelBrandEl: HTMLDivElement | null = null
  private panelVersionEl: HTMLSpanElement | null = null
  private panelCloseBtn: HTMLButtonElement | null = null
  private annotateActive = false
  private freezeActive = false
  private minimized = false
  private totalCount = 0
  private dragging = false
  private dragOffset = { x: 0, y: 0 }

  private settingsBtn: HTMLButtonElement | null = null
  private settingsPanel: HTMLDivElement | null = null
  private settingsOpen = false
  private settingsHelpCloseTimer: ReturnType<typeof setTimeout> | null = null

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
    this.dragHandle = document.createElement('div')
    this.dragHandle.className = 'drag-handle'
    this.dragHandle.innerHTML = `<svg width="16" height="6" viewBox="0 0 16 6" fill="currentColor">
      <circle cx="4" cy="1.5" r="1.2"/><circle cx="8" cy="1.5" r="1.2"/><circle cx="12" cy="1.5" r="1.2"/>
      <circle cx="4" cy="4.5" r="1.2"/><circle cx="8" cy="4.5" r="1.2"/><circle cx="12" cy="4.5" r="1.2"/>
    </svg>`
    this.toolbarEl.appendChild(this.dragHandle)

    const k = this.keys
    this.annotateBtn = this.makeBtn(ICONS.annotate, '', () => {
      const next = !this.annotateActive
      this.setAnnotateActive(next)
      this.callbacks.onToggleAnnotate(next)
    })

    this.freezeBtn = this.makeBtn(ICONS.freeze, '', () => {
      const next = !this.freezeActive
      this.setFreezeActive(next)
      this.callbacks.onFreezeAnimations(next)
    })

    this.screenshotBtn = null
    if (this.show('screenshot')) {
      this.screenshotBtn = this.makeBtn(ICONS.screenshot, '', () => {
        this.callbacks.onScreenshot()
      })
    }

    this.copyBtn = this.makeBtn(ICONS.copy, '', () => {
      this.callbacks.onCopy()
      this.copyBtn.innerHTML = ICONS.check
      setTimeout(() => { this.copyBtn.innerHTML = ICONS.copy }, 1200)
    })

    const clearWrap = document.createElement('div')
    clearWrap.className = 'clear-wrap'

    this.clearPageBtn = this.makeBtn(ICONS.clear, '', () => {
      this.callbacks.onClearPage?.()
    })
    this.clearPageBtn.classList.add('danger-btn')

    this.clearAllBtn = this.makeBtn(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
      '',
      () => this.callbacks.onClearAll?.(),
    )
    this.clearAllBtn.classList.add('danger-btn', 'clear-all-btn')

    clearWrap.appendChild(this.clearPageBtn)
    clearWrap.appendChild(this.clearAllBtn)

    this.settingsBtn = this.makeBtn(ICONS.settings, '', () => this.toggleSettings())
    this.settingsBtn.classList.add('settings-btn')

    this.minimizeBtn = null
    if (this.show('minimize')) {
      this.minimizeBtn = this.makeBtn(ICONS.minimize, '', () => {
        this.setMinimized(true)
      })
      this.minimizeBtn.classList.add('minimize-btn')
    }

    const mkDiv = () => { const d = document.createElement('div'); d.className = 'divider'; return d }
    const toAppend: (HTMLButtonElement | HTMLDivElement)[] = []
    const add = (el: HTMLButtonElement | HTMLDivElement) => {
      if (toAppend.length > 0) toAppend.push(mkDiv())
      toAppend.push(el)
    }
    if (this.show('annotate')) add(this.annotateBtn)
    if (this.show('screenshot') && this.screenshotBtn) add(this.screenshotBtn)
    if (this.show('freeze')) add(this.freezeBtn)
    if (this.show('copy')) add(this.copyBtn)
    if (this.show('clear_page') || this.show('clear_all')) add(clearWrap)
    if (this.show('settings')) add(this.settingsBtn)
    if (this.show('minimize') && this.minimizeBtn) add(this.minimizeBtn)
    this.toolbarEl.append(...toAppend)
    this.shadow.appendChild(this.toolbarEl)

    // Settings panel — populated below; new sections can be appended later.
    this.settingsPanel = document.createElement('div')
    this.settingsPanel.className = 'settings-panel'
    this.settingsPanel.setAttribute('role', 'dialog')
    this.settingsPanel.innerHTML = `
      <div class="panel-head panel-head-figma">
        <div class="panel-brand"></div>
        <div class="panel-head-actions">
          <span class="panel-version"></span>
          <button class="panel-close" type="button">${ICONS.close}</button>
        </div>
      </div>
      <div class="panel-divider" role="presentation"></div>
      <div class="panel-body"></div>
    `
    this.settingsPanel.style.display = 'none'
    this.shadow.appendChild(this.settingsPanel)

    this.panelBrandEl = this.settingsPanel.querySelector('.panel-brand')
    this.panelVersionEl = this.settingsPanel.querySelector('.panel-version')
    this.panelCloseBtn = this.settingsPanel.querySelector('.panel-close')

    this.panelCloseBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.closeSettings()
    })

    this.buildSettingsBody()

    // Floating action button (minimized state)
    this.fab = document.createElement('button')
    this.fab.className = 'fab'
    this.fab.innerHTML = ICONS.logo
    this.fab.style.display = 'none'
    this.fab.addEventListener('click', (e) => {
      e.stopPropagation()
      this.setMinimized(false)
    })
    this.shadow.appendChild(this.fab)

    this.applyToolbarI18n()

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

  /** Re-read locale from settings adapter and refresh all chrome + settings rows. */
  refreshI18n(): void {
    this.applyToolbarI18n()
    const body = this.settingsPanel?.querySelector('.panel-body') as HTMLDivElement | null
    if (body) {
      while (body.firstChild) body.removeChild(body.firstChild)
      this.buildSettingsBody()
    }
    if (this.settingsOpen) this.positionSettingsPanel()
  }

  private applyToolbarI18n(): void {
    const loc = this.settings?.getUiLocale?.() ?? 'zh-CN'
    const t = getToolbarI18n(loc, this.keys)
    this.settingsPanel?.setAttribute('aria-label', t.settingsPanelAria)
    if (this.panelBrandEl) {
      this.panelBrandEl.innerHTML = SETTINGS_BRAND_LOGO_SVG
      this.panelBrandEl.setAttribute('aria-label', t.settingsBrandName)
    }
    if (this.panelVersionEl) this.panelVersionEl.textContent = `v${INSTRUCKT_VERSION}`
    this.panelCloseBtn?.setAttribute('aria-label', t.panelCloseAria)
    this.dragHandle.setAttribute('aria-label', t.dragHandleAria)

    const setTip = (btn: HTMLButtonElement | null, tip: string) => {
      if (!btn) return
      btn.setAttribute('data-tooltip', tip)
      btn.setAttribute('aria-label', tip)
    }
    setTip(this.annotateBtn, t.annotateTooltip)
    setTip(this.freezeBtn, t.freezeTooltip)
    setTip(this.screenshotBtn, t.screenshotTooltip)
    setTip(this.copyBtn, t.copyTooltip)
    setTip(this.clearPageBtn, t.clearPageTooltip)
    setTip(this.clearAllBtn, t.clearAllTooltip)
    setTip(this.settingsBtn, t.settingsTooltip)
    setTip(this.minimizeBtn, t.minimizeTooltip)

    if (this.fab) {
      this.fab.title = t.fabTitle
      this.fab.setAttribute('aria-label', t.fabAria)
    }
  }

  private buildSettingsBody(): void {
    if (!this.settingsPanel) return
    const body = this.settingsPanel.querySelector('.panel-body') as HTMLDivElement | null
    if (!body) return

    const loc = this.settings?.getUiLocale?.() ?? 'zh-CN'
    const t = getToolbarI18n(loc, this.keys)

    const currentFmt: OutputFormat = this.settings?.getOutputFormat() ?? 'standard'
    const showAllMarkers = this.settings?.getMarkerShowAll?.() ?? false
    const showCurrentPageMarkers = this.settings?.getMarkerShowCurrentPage?.() ?? true

    // ── Output format (Agentation-style row) ────────────────────
    const sec1 = document.createElement('div')
    sec1.className = 'settings-section'
    sec1.innerHTML = `
      <div class="settings-row settings-pick-row">
        <div class="settings-label-wrap">
          <span class="settings-row-title">${this.escHtml(t.outputFormatTitle)}</span>
          <span class="settings-help-wrap">
            <button type="button" class="settings-help-btn" aria-expanded="false" aria-label="${this.escAttr(t.outputHelpAria)}" aria-describedby="instruckt-settings-help-output">${HELP_ICON}</button>
            <div id="instruckt-settings-help-output" class="settings-help-popover" role="tooltip"></div>
          </span>
        </div>
        <button type="button" class="settings-value-toggle settings-output-cycle" aria-label="${this.escAttr(t.outputCycleAria)}">
          <span class="value-name">${this.escHtml(t.formatLabel[currentFmt])}</span>
          <span class="settings-more-hit" aria-hidden="true">${MORE_VERT_ICON}</span>
        </button>
      </div>
    `
    sec1.querySelector('#instruckt-settings-help-output')!.textContent = t.outputFormatHelp
    sec1.querySelector('.settings-output-cycle')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const cur = this.settings?.getOutputFormat() ?? 'standard'
      let i = OUTPUT_FORMAT_CYCLE.indexOf(cur)
      if (i < 0) i = 0
      const next = OUTPUT_FORMAT_CYCLE[(i + 1) % OUTPUT_FORMAT_CYCLE.length]
      this.selectOutputFormat(next)
    })
    body.appendChild(sec1)

    // ── Language (Figma order: under output detail) ─────────────
    const secLang = document.createElement('div')
    secLang.className = 'settings-section'
    secLang.innerHTML = `
      <div class="settings-row settings-pick-row">
        <div class="settings-label-wrap">
          <span class="settings-row-title">${this.escHtml(t.languageTitle)}</span>
          <span class="settings-help-wrap">
            <button type="button" class="settings-help-btn" aria-expanded="false" aria-label="${this.escAttr(t.languageHelpAria)}" aria-describedby="instruckt-settings-help-locale">${HELP_ICON}</button>
            <div id="instruckt-settings-help-locale" class="settings-help-popover" role="tooltip"></div>
          </span>
        </div>
        <button type="button" class="settings-value-toggle settings-locale-cycle" aria-label="${this.escAttr(t.languageCycleAria)}">
          <span class="value-name">${this.escHtml(uiLocaleLabel(loc))}</span>
          <span class="settings-more-hit" aria-hidden="true">${MORE_VERT_ICON}</span>
        </button>
      </div>
    `
    secLang.querySelector('#instruckt-settings-help-locale')!.textContent = t.languageHelp
    secLang.querySelector('.settings-locale-cycle')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const cur = this.settings?.getUiLocale() ?? 'zh-CN'
      let i = UI_LOCALE_CYCLE.indexOf(cur)
      if (i < 0) i = 0
      const next = UI_LOCALE_CYCLE[(i + 1) % UI_LOCALE_CYCLE.length]!
      this.settings?.setUiLocale(next)
    })
    body.appendChild(secLang)

    body.appendChild(this.makeSettingsDivider())

    // ── Marker color swatches ───────────────────────────────────
    const effectiveHex = (this.settings?.getMarkerDefaultHex?.() ?? '#6366f1').toLowerCase()
    const secColor = document.createElement('div')
    secColor.className = 'settings-section settings-color-section'
    secColor.innerHTML = `<div class="settings-color-head">${this.escHtml(t.markerColorTitle)}</div>
      <div class="settings-color-swatches"></div>`
    const swatchWrap = secColor.querySelector('.settings-color-swatches')!
    for (const hex of MARKER_SWATCH_HEX) {
      const sw = document.createElement('button')
      sw.type = 'button'
      sw.className = 'settings-color-swatch'
      sw.dataset.hex = hex
      sw.style.setProperty('--swatch', hex)
      sw.setAttribute('aria-label', hex)
      sw.setAttribute('aria-pressed', hex.toLowerCase() === effectiveHex ? 'true' : 'false')
      if (hex.toLowerCase() === effectiveHex) sw.classList.add('is-selected')
      sw.addEventListener('click', (e) => {
        e.stopPropagation()
        this.settings?.setMarkerDefaultHex?.(hex)
      })
      swatchWrap.appendChild(sw)
    }
    body.appendChild(secColor)

    body.appendChild(this.makeSettingsDivider())

    // ── Marker visibility: two independent toggles (no help tooltips) ─
    const secModes = document.createElement('div')
    secModes.className = 'settings-section settings-modes-section'
    secModes.innerHTML = `
      <div class="settings-mode-row" data-mode="all">
        <button type="button" class="settings-mode-main" aria-pressed="${showAllMarkers ? 'true' : 'false'}">
          <span class="settings-check-ui" aria-hidden="true"></span>
          <span class="settings-mode-label">${this.escHtml(t.markerAll)}</span>
        </button>
      </div>
      <div class="settings-mode-row" data-mode="current-page">
        <button type="button" class="settings-mode-main" aria-pressed="${showCurrentPageMarkers ? 'true' : 'false'}">
          <span class="settings-check-ui" aria-hidden="true"></span>
          <span class="settings-mode-label">${this.escHtml(t.markerCurrentPage)}</span>
        </button>
      </div>
    `
    secModes.querySelectorAll('.settings-mode-main').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const row = (btn as HTMLElement).closest('.settings-mode-row') as HTMLElement | null
        const mode = row?.dataset.mode
        if (mode === 'all') {
          const v = this.settings?.getMarkerShowAll?.() ?? false
          this.settings?.setMarkerShowAll?.(!v)
        } else if (mode === 'current-page') {
          const v = this.settings?.getMarkerShowCurrentPage?.() ?? true
          this.settings?.setMarkerShowCurrentPage?.(!v)
        }
        this.syncMarkerDisplayModeUI()
      })
    })
    body.appendChild(secModes)

    this.bindSettingsHelpHover(body)
    this.syncMarkerDisplayModeUI()
  }

  private makeSettingsDivider(): HTMLDivElement {
    const d = document.createElement('div')
    d.className = 'settings-list-divider'
    d.setAttribute('role', 'presentation')
    return d
  }

  /** Sync marker visibility toggles with adapter (independent checkboxes). */
  syncMarkerDisplayModeUI(): void {
    if (!this.settingsPanel || !this.settings) return
    const getCur = this.settings.getMarkerShowCurrentPage
    const getAll = this.settings.getMarkerShowAll
    if (typeof getCur !== 'function' || typeof getAll !== 'function') return
    const showCur = getCur()
    const showAll = getAll()
    this.settingsPanel.querySelectorAll('.settings-mode-row').forEach((el) => {
      const row = el as HTMLElement
      const m = row.dataset.mode
      if (m === 'all') {
        row.classList.toggle('is-selected', showAll)
        row.querySelector('.settings-mode-main')?.setAttribute('aria-pressed', showAll ? 'true' : 'false')
      } else if (m === 'current-page') {
        row.classList.toggle('is-selected', showCur)
        row.querySelector('.settings-mode-main')?.setAttribute('aria-pressed', showCur ? 'true' : 'false')
      }
    })
  }

  /** Close help popovers and cancel pending hover-close. */
  private dismissSettingsHelpPopovers(): void {
    if (this.settingsHelpCloseTimer != null) {
      clearTimeout(this.settingsHelpCloseTimer)
      this.settingsHelpCloseTimer = null
    }
    const body = this.settingsPanel?.querySelector('.panel-body')
    if (!body) return
    body.querySelectorAll('.settings-help-wrap.is-help-open').forEach((el) => {
      el.classList.remove('is-help-open')
      el.querySelector('.settings-help-btn')?.setAttribute('aria-expanded', 'false')
    })
  }

  /** One help popover at a time; upward placement avoids covering rows below (stacking issues). */
  private boundDismissHelpOnBodyMouseDown = (e: MouseEvent): void => {
    const el = e.target as Element | null
    if (!el || typeof el.closest !== 'function') return
    if (!el.closest('.settings-help-wrap')) this.dismissSettingsHelpPopovers()
  }

  private bindSettingsHelpHover(body: HTMLElement): void {
    body.removeEventListener('mousedown', this.boundDismissHelpOnBodyMouseDown, true)
    body.addEventListener('mousedown', this.boundDismissHelpOnBodyMouseDown, true)

    const wraps = [...body.querySelectorAll('.settings-help-wrap')] as HTMLElement[]
    const cancelTimer = (): void => {
      if (this.settingsHelpCloseTimer != null) {
        clearTimeout(this.settingsHelpCloseTimer)
        this.settingsHelpCloseTimer = null
      }
    }

    wraps.forEach((wrap) => {
      const btn = wrap.querySelector('.settings-help-btn') as HTMLButtonElement | null
      if (!btn) return

      const open = (): void => {
        cancelTimer()
        for (const w of wraps) {
          const on = w === wrap
          w.classList.toggle('is-help-open', on)
          w.querySelector('.settings-help-btn')?.setAttribute('aria-expanded', on ? 'true' : 'false')
        }
      }

      const scheduleClose = (): void => {
        cancelTimer()
        this.settingsHelpCloseTimer = window.setTimeout(() => {
          this.settingsHelpCloseTimer = null
          if (!wrap.matches(':hover')) {
            wrap.classList.remove('is-help-open')
            btn.setAttribute('aria-expanded', 'false')
          }
        }, 200)
      }

      wrap.addEventListener('mouseenter', cancelTimer)
      wrap.addEventListener('mouseleave', scheduleClose)
      btn.addEventListener('mouseenter', open)
      btn.addEventListener('focus', open)
      btn.addEventListener('blur', () => {
        window.setTimeout(() => {
          if (!wrap.contains(document.activeElement)) {
            wrap.classList.remove('is-help-open')
            btn.setAttribute('aria-expanded', 'false')
          }
        }, 0)
      })
      btn.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Escape') {
          wrap.classList.remove('is-help-open')
          btn.setAttribute('aria-expanded', 'false')
        }
      })
    })
  }

  /** Escape for HTML attribute (title=) — newlines → spaces for single-line tooltip */
  private escAttr(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/\r?\n/g, ' ')
  }

  private escHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  private selectOutputFormat(fmt: OutputFormat): void {
    if (!this.settingsPanel) return
    this.settings?.setOutputFormat(fmt)
    const loc = this.settings?.getUiLocale?.() ?? 'zh-CN'
    const t = getToolbarI18n(loc, this.keys)
    const nameEl = this.settingsPanel.querySelector('.settings-output-cycle .value-name')
    if (nameEl) nameEl.textContent = t.formatLabel[fmt]
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
    this.dismissSettingsHelpPopovers()
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
    this.settingsPanel?.querySelector('.panel-body')?.removeEventListener('mousedown', this.boundDismissHelpOnBodyMouseDown, true)
    this.dismissSettingsHelpPopovers()
    this.host.remove()
    document.body.classList.remove('ik-annotating')
  }
}
