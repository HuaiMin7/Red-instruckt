import type { Annotation, PendingAnnotation, UiLocale } from '../types'
import { POPUP_CSS } from './styles'
import { captureElement } from './screenshot'
import { captureButtonHtml, getPopupI18n } from './locale'

interface PopupResult {
  comment: string
  screenshot?: string
}

interface PopupCallbacks {
  onSubmit: (result: PopupResult) => void
  onCancel: () => void
}

interface EditCallbacks {
  onSave: (annotation: Annotation, newComment: string) => void
  onDelete: (annotation: Annotation) => void
  /** Fired once when the edit panel is torn down (close, outside click, Escape, save, delete). */
  onDismiss?: () => void
}

/** Resolve screenshot URL from annotation data */
function screenshotUrl(screenshot: string | undefined, endpoint?: string): string | null {
  if (!screenshot) return null
  if (screenshot.startsWith('data:')) return screenshot
  // Backend path like "screenshots/01ABC.png" — serve via endpoint
  const base = endpoint ?? '/instruckt'
  return `${base}/${screenshot}`
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Annotation popup — rendered in its own shadow DOM for CSS isolation */
export class AnnotationPopup {
  private host: HTMLElement | null = null
  private shadow: ShadowRoot | null = null
  private onEditDismiss: (() => void) | undefined

  constructor(private readonly getLocale: () => UiLocale = () => 'zh-CN') {}

  // ── New annotation popup ──────────────────────────────────────

  showNew(pending: PendingAnnotation, callbacks: PopupCallbacks): void {
    this.destroy()
    const p = getPopupI18n(this.getLocale())
    this.host = document.createElement('div')
    this.host.setAttribute('data-instruckt', 'popup')
    this.stopHostPropagation(this.host)
    this.shadow = this.host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = POPUP_CSS
    this.shadow.appendChild(style)

    const popup = document.createElement('div')
    popup.className = 'popup'

    const fwBadge = pending.framework
      ? `<div class="fw-badge">${esc(pending.framework.component)}</div>`
      : ''
    const selText = pending.selectedText
      ? `<div class="selected-text">"${esc(pending.selectedText.slice(0, 80))}"</div>`
      : ''
    const hasScreenshot = !!pending.screenshot

    popup.innerHTML = `
      <div class="header">
        <span class="element-tag" title="${esc(pending.elementPath)}">${esc(pending.elementLabel)}</span>
        <button class="close-btn" title="${esc(p.cancelEscTitle)}">✕</button>
      </div>
      ${fwBadge}${selText}
      <div class="screenshot-slot">${hasScreenshot
        ? `<div class="screenshot-preview"><img src="${pending.screenshot}" alt="${esc(p.screenshotAlt)}" /><button class="screenshot-remove" title="${esc(p.removeScreenshotTitle)}">✕</button></div>`
        : captureButtonHtml(p.captureScreenshot)
      }</div>
      <textarea placeholder="${hasScreenshot ? esc(p.placeholderWithScreenshot) : esc(p.placeholderNoScreenshot)}" rows="3"></textarea>
      <div class="actions">
        <button class="btn-secondary" data-action="cancel">${esc(p.cancel)}</button>
        <button class="btn-primary" data-action="submit" ${hasScreenshot ? '' : 'disabled'}>${esc(p.addNote)}</button>
      </div>
    `

    let currentScreenshot = pending.screenshot ?? null
    const textarea = popup.querySelector('textarea')!
    const submitBtn = popup.querySelector<HTMLButtonElement>('[data-action="submit"]')!
    const screenshotSlot = popup.querySelector('.screenshot-slot')!

    const updateSubmitState = () => {
      submitBtn.disabled = !currentScreenshot && textarea.value.trim().length === 0
    }

    const attachScreenshotEvents = () => {
      // Capture button
      const captureBtn = screenshotSlot.querySelector('[data-action="capture"]')
      captureBtn?.addEventListener('click', async () => {
        captureBtn.textContent = p.capturing
        const dataUrl = await captureElement(pending.element)
        if (dataUrl) {
          currentScreenshot = dataUrl
          screenshotSlot.innerHTML = `<div class="screenshot-preview"><img src="${dataUrl}" alt="${esc(p.screenshotAlt)}" /><button class="screenshot-remove" title="${esc(p.removeScreenshotTitle)}">✕</button></div>`
          textarea.placeholder = p.placeholderWithScreenshot
          attachScreenshotEvents()
          updateSubmitState()
        } else {
          captureBtn.textContent = p.captureFailed
          setTimeout(() => {
            if (captureBtn.parentElement) captureBtn.outerHTML = captureButtonHtml(p.captureScreenshot)
            attachScreenshotEvents()
          }, 1500)
        }
      })

      // Remove button
      const removeBtn = screenshotSlot.querySelector('.screenshot-remove')
      removeBtn?.addEventListener('click', () => {
        currentScreenshot = null
        screenshotSlot.innerHTML = captureButtonHtml(p.captureScreenshot)
        textarea.placeholder = p.placeholderNoScreenshot
        attachScreenshotEvents()
        updateSubmitState()
      })
    }

    attachScreenshotEvents()

    textarea.addEventListener('input', updateSubmitState)
    textarea.addEventListener('keydown', (e) => {
      // Stop ALL keyboard events from reaching page forms (React, Inertia, etc.)
      e.stopPropagation()
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!submitBtn.disabled) submitBtn.click()
      }
      if (e.key === 'Escape') { callbacks.onCancel(); this.destroy() }
    })

    popup.querySelector('[data-action="cancel"]')!.addEventListener('click', () => {
      callbacks.onCancel(); this.destroy()
    })
    popup.querySelector('.close-btn')!.addEventListener('click', () => {
      callbacks.onCancel(); this.destroy()
    })
    submitBtn.addEventListener('click', () => {
      const comment = textarea.value.trim()
      if (!comment && !currentScreenshot) return
      callbacks.onSubmit({ comment: comment || '(screenshot)', screenshot: currentScreenshot ?? undefined })
      this.destroy()
    })

    this.shadow.appendChild(popup)
    ;(document.getElementById('instruckt-root') ?? document.body).appendChild(this.host)

    this.positionHost(pending.x, pending.y)
    this.setupOutsideClick()
    textarea.focus()
  }

  // ── Edit existing annotation ──────────────────────────────────

  showEdit(annotation: Annotation, callbacks: EditCallbacks, endpoint?: string, anchorEl?: HTMLElement | null): void {
    this.destroy()
    this.onEditDismiss = callbacks.onDismiss
    const p = getPopupI18n(this.getLocale())
    this.host = document.createElement('div')
    this.host.setAttribute('data-instruckt', 'popup')
    this.stopHostPropagation(this.host)
    this.shadow = this.host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = POPUP_CSS
    this.shadow.appendChild(style)

    const popup = document.createElement('div')
    popup.className = 'popup'

    const fwBadge = annotation.framework
      ? `<div class="fw-badge">${esc(annotation.framework.component)}</div>`
      : ''
    const ssUrl = screenshotUrl(annotation.screenshot, endpoint)
    const screenshotPreview = ssUrl
      ? `<div class="screenshot-preview screenshot-slot"><img src="${ssUrl}" alt="${esc(p.screenshotAlt)}" /><button class="screenshot-remove" title="${esc(p.removeScreenshotTitle)}">✕</button></div>`
      : ''
    const commentText = annotation.comment === '(screenshot)' ? '' : annotation.comment

    popup.innerHTML = `
      <div class="header">
        <span class="element-tag" title="${esc(annotation.elementPath)}">${esc(annotation.element)}</span>
        <button class="close-btn" title="${esc(p.closeAria)}">✕</button>
      </div>
      ${fwBadge}${screenshotPreview}
      <textarea rows="3">${esc(commentText)}</textarea>
      <div class="actions">
        <button class="btn-danger" data-action="delete">${esc(p.remove)}</button>
        <button class="btn-primary" data-action="save">${esc(p.save)}</button>
      </div>
    `

    popup.querySelector('.close-btn')!.addEventListener('click', () => this.destroy())

    // Screenshot remove button
    const ssRemoveBtn = popup.querySelector('.screenshot-remove')
    ssRemoveBtn?.addEventListener('click', () => {
      callbacks.onSave(annotation, annotation.comment)
      // Remove screenshot visually
      const slot = popup.querySelector('.screenshot-slot')
      if (slot) slot.remove()
    })

    const textarea = popup.querySelector('textarea')!
    const saveBtn = popup.querySelector<HTMLButtonElement>('[data-action="save"]')!
    const deleteBtn = popup.querySelector<HTMLButtonElement>('[data-action="delete"]')!

    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        saveBtn.click()
      }
      if (e.key === 'Escape') this.destroy()
    })

    saveBtn.addEventListener('click', () => {
      const newComment = textarea.value.trim()
      if (!newComment) return
      callbacks.onSave(annotation, newComment)
      this.destroy()
    })

    deleteBtn.addEventListener('click', () => {
      callbacks.onDelete(annotation)
      this.destroy()
    })

    this.shadow.appendChild(popup)
    ;(document.getElementById('instruckt-root') ?? document.body).appendChild(this.host)

    // Position near the pin: prefer live marker DOM (follows targetOffset / scroll);
    // fall back to stored annotation x/y (viewport % + document Y).
    const markerX = (annotation.x / 100) * window.innerWidth
    const markerY = annotation.y - window.scrollY
    this.positionHost(markerX, markerY, anchorEl ?? undefined)
    this.setupOutsideClick()
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }

  // ── Helpers ───────────────────────────────────────────────────

  /** Prevent popup interactions from reaching page handlers (e.g. @click.outside, form submit) */
  private stopHostPropagation(host: HTMLElement): void {
    for (const evt of ['click', 'mousedown', 'pointerdown', 'keydown', 'keyup', 'keypress', 'submit'] as const) {
      host.addEventListener(evt, (e) => e.stopPropagation())
    }
  }

  /** Place fixed popup; when `anchorEl` is the marker pin, keep ≥8px gap on all sides. */
  private positionHost(x: number, y: number, anchorEl?: HTMLElement): void {
    if (!this.host) return
    // Use popover="manual" to render in the top layer (above native popovers)
    this.host.setAttribute('popover', 'manual')
    try { this.host.showPopover() } catch { /* fallback to z-index */ }
    Object.assign(this.host.style, { position: 'fixed', zIndex: '2147483647', left: '-9999px', top: '0' })

    requestAnimationFrame(() => {
      if (!this.host) return
      let ax = x
      let ay = y
      let markerRect: DOMRect | null = null
      if (anchorEl?.isConnected) {
        const r = anchorEl.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          markerRect = r
          ax = r.left + r.width / 2
          ay = r.top + r.height / 2
        }
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const inner = this.host.querySelector('.popup')?.getBoundingClientRect()
      const pw = Math.max(this.host.getBoundingClientRect().width, inner?.width ?? 340, 300)
      const ph = Math.max(this.host.getBoundingClientRect().height, inner?.height ?? 280, 120)

      let left: number
      let top: number
      if (markerRect) {
        const pos = this.computePopupPositionClearOfMarker(markerRect, pw, ph, vw, vh)
        left = pos.left
        top = pos.top
      } else {
        const w = 340 + 20
        const h = inner?.height ?? 300
        left = Math.max(10, Math.min(ax + 10, vw - w))
        top = Math.max(10, Math.min(ay + 10, vh - h - 10))
      }
      Object.assign(this.host.style, { left: `${left}px`, top: `${top}px` })
    })
  }

  /** ≥8px between popup edges and marker edges (viewport-clamped). */
  private computePopupPositionClearOfMarker(
    marker: DOMRect,
    pw: number,
    ph: number,
    vw: number,
    vh: number,
  ): { left: number; top: number } {
    const GAP = 8
    const pad = {
      left: marker.left - GAP,
      top: marker.top - GAP,
      right: marker.right + GAP,
      bottom: marker.bottom + GAP,
    }
    const overlaps = (L: number, T: number): boolean => {
      const R = L + pw
      const B = T + ph
      return !(R <= pad.left || L >= pad.right || B <= pad.top || T >= pad.bottom)
    }
    const clamp = (L: number, T: number): { left: number; top: number } => ({
      left: Math.max(10, Math.min(L, vw - pw - 10)),
      top: Math.max(10, Math.min(T, vh - ph - 10)),
    })
    const cx = marker.left + marker.width / 2
    const cy = marker.top + marker.height / 2

    const tries: Array<{ left: number; top: number }> = [
      { left: pad.right, top: cy - ph / 2 },
      { left: pad.left - pw, top: cy - ph / 2 },
      { left: cx - pw / 2, top: pad.bottom },
      { left: cx - pw / 2, top: pad.top - ph },
    ]
    for (const t of tries) {
      const c = clamp(t.left, t.top)
      if (!overlaps(c.left, c.top)) return c
    }
    return clamp(pad.right, cy - ph / 2)
  }

  private boundOutside = (e: MouseEvent): void => {
    if (this.host && !this.host.contains(e.target as Node)) {
      this.destroy()
    }
  }

  private setupOutsideClick(): void {
    setTimeout(() => document.addEventListener('mousedown', this.boundOutside), 0)
  }

  destroy(): void {
    const dismiss = this.onEditDismiss
    this.onEditDismiss = undefined
    try {
      dismiss?.()
    } catch {
      /* avoid blocking teardown */
    }
    this.host?.remove()
    this.host = null
    this.shadow = null
    document.removeEventListener('mousedown', this.boundOutside)
  }
}
