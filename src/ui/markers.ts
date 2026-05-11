import type { Annotation } from '../types'

type MarkerClickHandler = (annotation: Annotation) => void

interface MarkerEl {
  el: HTMLElement
  annotationId: string
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

  constructor(private readonly onClick: MarkerClickHandler) {
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

  /** Best-effort: resolve a live DOMRect from stored selector */
  private resolveRect(annotation: Annotation): DOMRect | null {
    const el = this.findTarget(annotation)
    return el ? el.getBoundingClientRect() : null
  }

  private markerHasScreenshot(annotation: Annotation): boolean {
    return !!annotation.screenshot
  }

  private showSpotlightFor(annotation: Annotation): void {
    // Only show the region when the live target element is in DOM and visible.
    // If the modal/drawer hosting this annotation is closed, do NOT fall back
    // to stored coordinates — the region no longer exists on screen.
    const liveRect = this.resolveRect(annotation)
    if (!liveRect || liveRect.width <= 0 || liveRect.height <= 0) {
      this.hideSpotlight()
      return
    }

    this.spotlight.setAttribute('data-annotation-id', annotation.id)
    this.spotlight.className = `ik-spotlight${this.markerHasScreenshot(annotation) ? ' has-screenshot' : ''}`
    Object.assign(this.spotlight.style, {
      display: 'block',
      left: `${Math.max(0, liveRect.left)}px`,
      top: `${Math.max(0, liveRect.top)}px`,
      width: `${liveRect.width}px`,
      height: `${liveRect.height}px`,
    })
  }

  private hideSpotlight(): void {
    this.spotlight.style.display = 'none'
    this.spotlight.removeAttribute('data-annotation-id')
  }

  private showPreviewFor(annotation: Annotation, anchor: HTMLElement): void {
    const title = annotation.comment === '(screenshot)' ? 'Screenshot' : 'Note'
    const content = annotation.comment === '(screenshot)' ? 'Screenshot only' : annotation.comment
    const component = annotation.framework?.component ? `in ${annotation.framework.component}` : ''
    const element = annotation.element ? annotation.element : ''
    const meta = [element, component].filter(Boolean).join(' ')

    this.preview.innerHTML = `
      <div class="title">${this.esc(title)}</div>
      <div class="content">${this.esc(content).slice(0, 240)}</div>
      ${meta ? `<div class="meta">${this.esc(meta)}</div>` : ''}
    `

    const rect = anchor.getBoundingClientRect()
    this.preview.style.display = 'block'
    // Place above or below the marker (prefer below; flip to above if no room).
    // Horizontally center on the marker, clamp into viewport.
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
  }

  private esc(s: unknown): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  /** Add or update a marker for an annotation */
  upsert(annotation: Annotation, index: number): void {
    const existing = this.markers.get(annotation.id)

    if (existing) {
      this.updateStyle(existing.el, annotation)
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
      // On click, also show the marked region so the user can orient quickly
      this.showSpotlightFor(annotation)
      this.onClick(annotation)
    })

    el.addEventListener('mouseenter', () => {
      this.showSpotlightFor(annotation)
      this.showPreviewFor(annotation, el)
    })
    el.addEventListener('mouseleave', () => {
      this.hideSpotlight()
      this.hidePreview()
    })

    this.container.appendChild(el)
    this.markers.set(annotation.id, { el, annotationId: annotation.id })
  }

  private positionMarker(el: HTMLElement, annotation: Annotation): void {
    // Hide the marker if its target element is no longer in DOM / not visible
    // (e.g. the modal or drawer that hosted it has been closed).
    const target = this.findTarget(annotation)
    if (!target) {
      el.style.display = 'none'
      return
    }
    // Show + position at the saved click point (not the element bbox top-left).
    // annotation.x: % of viewport width; annotation.y: page Y (clientY + scrollY)
    el.style.display = ''
    const left = (annotation.x / 100) * window.innerWidth
    const top = annotation.y - window.scrollY
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }

  /** Update an existing marker after its annotation status changed */
  update(annotation: Annotation): void {
    const marker = this.markers.get(annotation.id)
    if (!marker) return
    this.updateStyle(marker.el, annotation)
  }

  private updateStyle(el: HTMLElement, annotation: Annotation): void {
    const ssClass = annotation.screenshot ? ' has-screenshot' : ''
    el.className = `ik-marker ${this.statusClass(annotation.status)}${ssClass}`
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

    // If spotlight is visible, keep it aligned with scroll/reflow.
    if (this.spotlight.style.display !== 'none') {
      const visibleId = this.spotlight.getAttribute('data-annotation-id')
      if (visibleId) {
        const a = annotations.find(x => x.id === visibleId)
        if (a) this.showSpotlightFor(a)
      }
    }

    // If preview is visible, keep it inside viewport (re-anchor to its marker).
    if (this.preview.style.display !== 'none') {
      const visibleId = this.spotlight.getAttribute('data-annotation-id')
      if (visibleId) {
        const marker = this.markers.get(visibleId)?.el
        const a = annotations.find(x => x.id === visibleId)
        if (marker && a) this.showPreviewFor(a, marker)
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
