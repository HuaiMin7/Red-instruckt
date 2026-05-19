export type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve'
export type AnnotationSeverity = 'blocking' | 'important' | 'suggestion'
export type AnnotationStatus = 'pending' | 'resolved' | 'dismissed'

/** Markdown export verbosity. Controls how much context is included. */
export type OutputFormat = 'compact' | 'standard' | 'detailed' | 'forensic'

/**
 * @deprecated Use {@link MarkerVisibility} via `markerShowCurrentPage` /
 * `markerShowAll` on config and settings. Kept for migrating saved `markerDisplayMode`.
 */
export type MarkerDisplayMode = 'current-page' | 'all'

/** Independent toggles for which markers are shown (settings panel). */
export interface MarkerVisibility {
  /** Solid pins for targets visible in the viewport (after overflow clipping). */
  showCurrentPageMarkers: boolean
  /** Ghost pins for off-screen / clipped / missing targets; enables click-to-reveal. */
  showAllMarkers: boolean
}

/** Toolbar, settings panel, and annotation popup UI language. */
export type UiLocale = 'zh-CN' | 'en' | 'ja'

export interface OutputFormatOption {
  id: OutputFormat
  label: string
  desc: string
}

export const OUTPUT_FORMAT_OPTIONS: OutputFormatOption[] = [
  { id: 'compact',  label: 'Compact',  desc: 'Quick feedback with minimal context.' },
  { id: 'standard', label: 'Standard', desc: 'Balanced detail — element, source, classes.' },
  { id: 'detailed', label: 'Detailed', desc: 'Full context with component stack and bbox.' },
  { id: 'forensic', label: 'Forensic', desc: 'Maximum detail incl. live computed styles.' },
]

/** Adapter the toolbar uses to read/write user-facing settings. */
export interface ToolbarSettingsAdapter {
  getOutputFormat: () => OutputFormat
  setOutputFormat: (fmt: OutputFormat) => void
  getMarkerShowCurrentPage: () => boolean
  setMarkerShowCurrentPage: (show: boolean) => void
  getMarkerShowAll: () => boolean
  setMarkerShowAll: (show: boolean) => void
  getUiLocale: () => UiLocale
  setUiLocale: (locale: UiLocale) => void
  /** Effective default marker pin color (hex), including preset override. */
  getMarkerDefaultHex: () => string
  setMarkerDefaultHex: (hex: string) => void
}

export interface SourceFrame {
  filePath: string
  lineNumber: number | null
  columnNumber: number | null
  componentName: string | null
}

export interface FrameworkContext {
  framework: 'livewire' | 'vue' | 'svelte' | 'react' | 'blade'
  component: string
  data?: Record<string, unknown>
  // Source location (resolved client-side in dev mode, or server-side)
  source_file?: string
  source_line?: number
  source_column?: number
  // Full component stack from element-source
  component_stack?: SourceFrame[]
  // Livewire-specific
  wire_id?: string
  class_name?: string
  render_line?: number
  // Vue-specific
  component_uid?: string
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Annotation {
  id: string
  url: string
  x: number
  y: number
  /**
   * Click position relative to the target element, expressed as 0..1 ratios
   * of the target's width/height at click time. Used by the marker
   * positioner so markers can follow their target through inner-container
   * scroll, animated layout changes, and element resizes — not just window
   * scroll. Optional for backwards compatibility with annotations created
   * before v2.1.
   */
  targetOffsetX?: number
  targetOffsetY?: number
  comment: string
  element: string
  elementPath: string
  cssClasses: string
  boundingBox: BoundingBox
  selectedText?: string
  nearbyText?: string
  screenshot?: string
  intent: AnnotationIntent
  severity: AnnotationSeverity
  status: AnnotationStatus
  framework?: FrameworkContext
  createdAt: string
  updatedAt?: string
  resolvedAt?: string
  resolvedBy?: 'human' | 'agent'
  /**
   * When set, a ghost marker (when “show all markers” / ghost pins are enabled)
   * can click the element
   * `[data-instruckt-open="<this value>"]` to re-open the overlay that
   * hosted the annotation (modal, drawer, etc.). Captured automatically
   * from the nearest ancestor `[data-instruckt-host]` at annotation time.
   */
  revealHost?: string
}

export interface MarkerColors {
  /** Default marker color; also drives UI theme (toolbar accent, highlight box, popup primary). Default: '#6366f1' (indigo) */
  default?: string
  /** Screenshot marker color. Default: '#22c55e' (green) */
  screenshot?: string
  /** Dismissed marker color. Default: '#71717a' */
  dismissed?: string
}

export interface KeyBindings {
  /** Toggle annotate mode. Default: 'a' */
  annotate?: string
  /** Toggle freeze. Default: 'f' */
  freeze?: string
  /** Region screenshot. Default: 'c' */
  screenshot?: string
  /** Clear page annotations. Default: 'x' */
  clearPage?: string
}

/** Set to false to hide a built-in toolbar tool. Omit or true to show. */
export interface ToolsConfig {
  annotate?: boolean
  screenshot?: boolean
  freeze?: boolean
  copy?: boolean
  clear_page?: boolean
  clear_all?: boolean
  settings?: boolean
  minimize?: boolean
}

export interface InstrucktConfig {
  /** URL to POST annotations to. Default: '/instruckt' */
  endpoint: string
  /** Framework adapters to activate. Default: auto-detect */
  adapters?: Array<'livewire' | 'vue' | 'svelte' | 'react' | 'blade'>
  /** Theme preference. Default: 'auto' */
  theme?: 'light' | 'dark' | 'auto'
  /** Position of the toolbar. Default: 'bottom-right' */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /**
   * CSS selector for the page content column the toolbar aligns to on resize/zoom
   * (e.g. `main`, `.page`). When omitted, a centered layout wrapper is auto-detected.
   */
  positionAnchor?: string
  /** Customize marker pin colors */
  colors?: MarkerColors
  /** Customize keyboard shortcuts */
  keys?: KeyBindings
  /** Show or hide built-in toolbar tools. Set to false to hide. Default: all true. */
  tools?: ToolsConfig
  /** Path prefix for screenshots in markdown export. Default: 'storage/app/_instruckt/' */
  screenshotPath?: string
  /** Whether MCP tools (get_screenshot, resolve) are available. Default: false */
  mcp?: boolean
  /** Default output format for clipboard markdown. Default: 'standard' */
  outputFormat?: OutputFormat
  /**
   * @deprecated Use `markerShowCurrentPage` and `markerShowAll`. When both new
   * fields are omitted, this is still read once to seed visibility.
   */
  markerDisplayMode?: MarkerDisplayMode
  /** Show solid pins for in-viewport targets. Default: true */
  markerShowCurrentPage?: boolean
  /** Show ghost pins for hidden targets. Default: false */
  markerShowAll?: boolean
  /** UI language for toolbar, settings, and annotation popup. Default: 'zh-CN' */
  uiLocale?: UiLocale
  /** Callbacks */
  onAnnotationAdd?: (annotation: Annotation) => void
  onAnnotationResolve?: (annotation: Annotation) => void
}

export interface PendingAnnotation {
  element: Element
  elementPath: string
  elementName: string
  elementLabel: string
  cssClasses: string
  boundingBox: BoundingBox
  x: number
  y: number
  /** See {@link Annotation.targetOffsetX}. */
  targetOffsetX?: number
  targetOffsetY?: number
  selectedText?: string
  nearbyText?: string
  screenshot?: string
  framework?: FrameworkContext
  /** See {@link Annotation.revealHost}. */
  revealHost?: string
}
