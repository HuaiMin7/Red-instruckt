import type { Annotation, MarkerDisplayMode } from '../types'

type MarkerClickHandler = (annotation: Annotation, ctx: { ghost: boolean }) => void

interface MarkerEl {
  el: HTMLElement
  annotationId: string
}

function escapeAttrSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Manages numbered annotation pins rendered directly on the page */
export class AnnotationMarkers {
  private container: HTMLElement
  private markers: Map<string, MarkerEl> = new Map()
  private spotlight: HTMLDivElement
  private preview: HTMLDivElement

  private static readonly EDIT_ICON = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
  `

  constructor(
    private readonly onClick: MarkerClickHandler,
    private readonly getDisplayMode: () => MarkerDisplayMode,
  ) {
    // Fixed-position container over the page, pointer-events passthrough
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '2147483645',
    })
    this.container.setAttribute('data-instruckt', 'markers')
    const root = document.getElementById('instruckt-root') ?? document.body
    root.appendChild(this.container)

    // Spotlight overlay for "see the marked area"
    this.spotlight = document.createElement('div')
    this.spotlight.className = 'ik-spotlight'
    this.container.appendChild(this.spotlight)

    // Hover preview for comment/context
    this.preview = document.createElement('div')
    this.preview.className = 'ik-marker-preview'
    this.container.appendChild(this.preview)
  }

  /** Best-effort: resolve the live DOM element from stored selector */
  private findTarget(annotation: Annotation): Element | null {
    if (!annotation.elementPath) return null
    try {
      const el = document.querySelector(annotation.elementPath)
      if (!el) return null
      const rect = el.getBoundingClientRect()
      // Treat invisible (display:none / detached) elements as missing.
      if ((rect.width === 0 && rect.height === 0) || Number.isNaN(rect.left)) return null
      return el
    } catch {
      return null
    }
  }

  /**
   * Try to bring a hidden target back on screen: scroll clipped targets,
   * or programmatically click a `[data-instruckt-open="<revealHost>"]`
   * trigger when the target is not in the DOM (e.g. closed modal).
   */
  async revealHiddenTarget(annotation: Annotation): Promise<void> {
    const target = this.findTarget(annotation)
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      await new Promise<void>(r => setTimeout(r, 420))
      return
    }
    const key = annotation.revealHost?.trim()
    if (key) {
      const sel = `[data-instruckt-open="${escapeAttrSelector(key)}"]`
      const btn = document.querySelector(sel)
      if (btn instanceof HTMLElement) {
        btn.click()
        await new Promise<void>(r => setTimeout(r, 120))
      }
    }
  }

  /** Best-effort: resolve a live DOMRect from stored selector */
  private resolveRect(annotation: Annotation): DOMRect | null {
    const el = this.findTarget(annotation)
    return el ? el.getBoundingClientRect() : null
  }

  /**
   * Does this element have an overflow style that can clip descendants?
   * `visible` (the default) doesn't clip; everything else does.
   */
  private clipsOverflow(el: Element): boolean {
    if (el === document.documentElement || el === document.body) return false
    const cs = window.getComputedStyle(el)
    return cs.overflowX !== 'visible' || cs.overflowY !== 'visible'
  }

  /**
   * Return the on-screen rect of `el` after clipping against every ancestor
   * that has `overflow: hidden/auto/scroll`. Returns `null` when the element
   * is fully scrolled out of view inside one of those containers (in which
   * case we want to hide its marker, spotlight, and preview entirely).
   */
  private visibleRectFor(el: Element): DOMRect | null {
    const rect = el.getBoundingClientRect()
    if ((rect.width === 0 && rect.height === 0) || Number.isNaN(rect.left)) return null
    let { left, top, right, bottom } = rect
    let parent: Element | null = el.parentElement
    while (parent && parent !== document.documentElement) {
      if (this.clipsOverflow(parent)) {
        const pr = parent.getBoundingClientRect()
        left = Math.max(left, pr.left)
        top = Math.max(top, pr.top)
        right = Math.min(right, pr.right)
        bottom = Math.min(bottom, pr.bottom)
        if (right <= left || bottom <= top) return null
      }
      parent = parent.parentElement
    }
    return new DOMRect(left, top, right - left, bottom - top)
  }

  private markerHasScreenshot(annotation: Annotation): boolean {
    return !!annotation.screenshot
  }

  private showSpotlightFor(annotation: Annotation): void {
    const target = this.findTarget(annotation)
    if (!target) {
      this.hideSpotlight()
      return
    }
    const visible = this.visibleRectFor(target)
    if (!visible || visible.width <= 0 || visible.height <= 0) {
      this.hideSpotlight()
      return
    }

    this.spotlight.setAttribute('data-annotation-id', annotation.id)
    this.spotlight.className = `ik-spotlight${this.markerHasScreenshot(annotation) ? ' has-screenshot' : ''}`
    Object.assign(this.spotlight.style, {
      display: 'block',
      left: `${visible.left}px`,
      top: `${visible.top}px`,
      width: `${visible.width}px`,
      height: `${visible.height}px`,
    })
  }

  private hideSpotlight(): void {
    this.spotlight.style.display = 'none'
    this.spotlight.removeAttribute('data-annotation-id')
  }

  private showPreviewFor(annotation: Annotation, anchor: HTMLElement, opts?: { ghost?: boolean }): void {
    const title = annotation.comment === '(screenshot)' ? 'Screenshot' : 'Note'
    const content = annotation.comment === '(screenshot)' ? 'Screenshot only' : annotation.comment
    const component = annotation.framework?.component ? `in ${annotation.framework.component}` : ''
    const element = annotation.element ? annotation.element : ''
    const meta = [element, component].filter(Boolean).join(' ')
    const hint = opts?.ghost
      ? '<div class="ghost-hint">Hidden — click marker to reveal or scroll into view.</div>'
      : ''

    this.preview.innerHTML = `
      <div class="title">${this.esc(title)}</div>
      <div class="content">${this.esc(content).slice(0, 240)}</div>
      ${meta ? `<div class="meta">${this.esc(meta)}</div>` : ''}
      ${hint}
    `

    this.preview.setAttribute('data-annotation-id', annotation.id)

    const rect = anchor.getBoundingClientRect()
    this.preview.style.display = 'block'
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 10
    const gap = 10
    Object.assign(this.preview.style, { left: '-9999px', top: '0px' })
    const w = this.preview.getBoundingClientRect().width
    const h = this.preview.getBoundingClientRect().height
    const markerCenterX = rect.left + rect.width / 2

    const spaceBelow = vh - rect.bottom
    const spaceAbove = rect.top
    const placeBelow = spaceBelow >= h + gap + pad || spaceBelow >= spaceAbove

    const top = placeBelow
      ? Math.min(rect.bottom + gap, vh - h - pad)
      : Math.max(pad, rect.top - gap - h)
    const left = Math.max(pad, Math.min(markerCenterX - w / 2, vw - w - pad))
    Object.assign(this.preview.style, { left: `${left}px`, top: `${top}px` })
  }

  private hidePreview(): void {
    this.preview.style.display = 'none'
    this.preview.removeAttribute('data-annotation-id')
  }

  private esc(s: unknown): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  /** Legacy screen position (viewport coords) used for ghost markers */
  private legacyMarkerPosition(annotation: Annotation): { left: number; top: number } {
    return {
      left: (annotation.x / 100) * window.innerWidth,
      top: annotation.y - window.scrollY,
    }
  }

  /** Add or update a marker for an annotation */
  upsert(annotation: Annotation, index: number): void {
    const existing = this.markers.get(annotation.id)

    if (existing) {
      this.updateStyle(existing.el, annotation)
      this.positionMarker(existing.el, annotation)
      return
    }

    const el = document.createElement('div')
    const ssClass = annotation.screenshot ? ' has-screenshot' : ''
    el.className = `ik-marker ${this.statusClass(annotation.status)}${ssClass}`
    el.innerHTML = `<span class="ik-marker-index">${index}</span><span class="ik-marker-edit">${AnnotationMarkers.EDIT_ICON}</span>`
    el.title = annotation.comment === '(screenshot)' ? 'Screenshot' : annotation.comment.slice(0, 60)
    el.style.pointerEvents = 'all'

    this.positionMarker(el, annotation)

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      const ghost = el.classList.contains('ik-marker-ghost')
      if (!ghost) this.showSpotlightFor(annotation)
      this.onClick(annotation, { ghost })
    })

    el.addEventListener('mouseenter', () => {
      const ghost = el.classList.contains('ik-marker-ghost')
      if (ghost) {
        this.showPreviewFor(annotation, el, { ghost: true })
      } else {
        this.showSpotlightFor(annotation)
        this.showPreviewFor(annotation, el)
      }
    })
    el.addEventListener('mouseleave', () => {
      this.hideSpotlight()
      this.hidePreview()
    })

    this.container.appendChild(el)
    this.markers.set(annotation.id, { el, annotationId: annotation.id })
  }

  private positionMarker(el: HTMLElement, annotation: Annotation): void {
    el.classList.remove('ik-marker-ghost')
    const mode = this.getDisplayMode()
    const { left: legL, top: legT } = this.legacyMarkerPosition(annotation)

    const placeGhost = (): void => {
      el.classList.add('ik-marker-ghost')
      el.style.display = ''
      el.style.left = `${legL}px`
      el.style.top = `${legT}px`
    }

    const placeNormal = (left: number, top: number): void => {
      el.classList.remove('ik-marker-ghost')
      el.style.display = ''
      el.style.left = `${left}px`
      el.style.top = `${top}px`
    }

    const target = this.findTarget(annotation)

    if (mode === 'current-page') {
      if (!target) {
        el.style.display = 'none'
        return
      }
      const rect = target.getBoundingClientRect()
      const visible = this.visibleRectFor(target)
      if (!visible) {
        el.style.display = 'none'
        return
      }
      let left: number
      let top: number
      if (typeof annotation.targetOffsetX === 'number' && typeof annotation.targetOffsetY === 'number') {
        left = rect.left + annotation.targetOffsetX * rect.width
        top = rect.top + annotation.targetOffsetY * rect.height
      } else {
        left = legL
        top = legT
      }
      if (left < visible.left || left > visible.right || top < visible.top || top > visible.bottom) {
        el.style.display = 'none'
        return
      }
      placeNormal(left, top)
      return
    }

    // mode === 'all'
    if (!target) {
      placeGhost()
      return
    }

    const rect = target.getBoundingClientRect()
    const visible = this.visibleRectFor(target)

    let left: number
    let top: number
    if (typeof annotation.targetOffsetX === 'number' && typeof annotation.targetOffsetY === 'number') {
      left = rect.left + annotation.targetOffsetX * rect.width
      top = rect.top + annotation.targetOffsetY * rect.height
    } else {
      left = legL
      top = legT
    }

    if (
      visible &&
      left >= visible.left &&
      left <= visible.right &&
      top >= visible.top &&
      top <= visible.bottom
    ) {
      placeNormal(left, top)
    } else {
      placeGhost()
    }
  }

  /** Update an existing marker after its annotation status changed */
  update(annotation: Annotation): void {
    const marker = this.markers.get(annotation.id)
    if (!marker) return
    this.updateStyle(marker.el, annotation)
    this.positionMarker(marker.el, annotation)
  }

  private updateStyle(el: HTMLElement, annotation: Annotation): void {
    const ssClass = annotation.screenshot ? ' has-screenshot' : ''
    const ghost = el.classList.contains('ik-marker-ghost')
    el.className = `ik-marker ${this.statusClass(annotation.status)}${ssClass}${ghost ? ' ik-marker-ghost' : ''}`
    el.title = annotation.comment === '(screenshot)' ? 'Screenshot' : annotation.comment.slice(0, 60)
  }

  private statusClass(status: string): string {
    if (status === 'resolved') return 'resolved'
    if (status === 'dismissed') return 'dismissed'
    return ''
  }

  /** Reposition all markers (e.g. after scroll or resize) */
  reposition(annotations: Annotation[]): void {
    annotations.forEach(annotation => {
      const marker = this.markers.get(annotation.id)
      if (!marker) return
      this.positionMarker(marker.el, annotation)
    })

    if (this.spotlight.style.display !== 'none') {
      const visibleId = this.spotlight.getAttribute('data-annotation-id')
      if (visibleId) {
        const a = annotations.find(x => x.id === visibleId)
        if (a) this.showSpotlightFor(a)
      }
    }

    if (this.preview.style.display !== 'none') {
      const previewId = this.preview.getAttribute('data-annotation-id')
      if (previewId) {
        const marker = this.markers.get(previewId)?.el
        const a = annotations.find(x => x.id === previewId)
        if (marker && a && marker.style.display !== 'none') {
          const ghost = marker.classList.contains('ik-marker-ghost')
          this.showPreviewFor(a, marker, ghost ? { ghost: true } : undefined)
        } else {
          this.hidePreview()
        }
      }
    }
  }

  remove(annotationId: string): void {
    const marker = this.markers.get(annotationId)
    if (!marker) return
    marker.el.remove()
    this.markers.delete(annotationId)
  }

  /** Show or hide all markers */
  setVisible(visible: boolean): void {
    this.container.style.display = visible ? '' : 'none'
    if (!visible) this.hideSpotlight()
    if (!visible) this.hidePreview()
  }

  /** Remove all markers without destroying the container */
  clear(): void {
    for (const { el } of this.markers.values()) {
      el.remove()
    }
    this.markers.clear()
    this.hideSpotlight()
    this.hidePreview()
  }

  destroy(): void {
    this.container.remove()
    this.markers.clear()
  }
}
