/** Global styles injected into document.head — ONLY what must affect the host page */
export const GLOBAL_CSS = /* css */ `
body.ik-annotating,
body.ik-annotating * { cursor: crosshair !important; }
`

/** Toolbar shadow DOM styles — fully isolated */
export const TOOLBAR_CSS = /* css */ `
:host {
  all: initial;
  display: block;
  position: fixed;
  z-index: 2147483646;
}

* { box-sizing: border-box; }

:host-context([data-instruckt-theme="dark"]),
@media (prefers-color-scheme: dark) {
  :host {
    --ik-bg: #1c1c1e; --ik-bg2: #2c2c2e; --ik-border: #38383a;
    --ik-text: #f4f4f5; --ik-muted: #a1a1aa;
    --ik-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.06);
  }
}

:host {
  --ik-accent: var(--instruckt-accent, #6366f1);
  --ik-accent-h: var(--instruckt-accent-hover, #4f46e5);
  --ik-bg: #ffffff;
  --ik-bg2: #f4f4f5;
  --ik-border: #e4e4e7;
  --ik-text: #18181b;
  --ik-muted: #a1a1aa;
  --ik-shadow: 0 8px 32px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04);
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: var(--ik-bg);
  border-radius: 12px;
  padding: 6px;
  box-shadow: var(--ik-shadow);
  user-select: none;
  touch-action: none;
  cursor: grab;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.toolbar:active { cursor: grabbing; }

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 10px;
  cursor: grab;
  opacity: 0.35;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-bottom: 2px;
}
.drag-handle:hover { opacity: 0.7; }
.drag-handle:active { cursor: grabbing; opacity: 0.9; }
.drag-handle svg { pointer-events: none; }

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--ik-muted);
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: background .15s ease, color .15s ease;
}
.btn svg { display: block; }
.btn:hover { background: var(--ik-bg2); color: var(--ik-text); }
.btn[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--ik-text);
  color: var(--ik-bg);
  pointer-events: none;
  opacity: 0;
  transition: opacity .1s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.btn[data-tooltip]:hover::before { opacity: 1; }
.btn.active { background: var(--ik-accent); color: #fff; }
.btn.active:hover { background: var(--ik-accent-h); }

.divider { width: 18px; height: 1px; background: var(--ik-border); margin: 3px 0; }

.badge {
  position: absolute;
  top: -3px; right: -3px;
  min-width: 16px; height: 16px;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.minimize-btn { color: var(--ik-muted); opacity: .6; }
.minimize-btn:hover { opacity: 1; }

.danger-btn { color: var(--ik-muted); opacity: .6; }
.danger-btn:hover { opacity: 1; color: #ef4444; }

.clear-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.clear-all-btn {
  display: none;
  position: absolute;
  right: 100%;
  top: 0;
  background: var(--ik-bg);
  box-shadow: var(--ik-shadow);
  border-radius: 8px;
}
/* clear-all tooltip inherits from .btn[data-tooltip]::before */
/* Invisible bridge so hover doesn't break crossing the gap */
.clear-all-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 100%;
  width: 6px;
  height: 100%;
}
/* Clear-page tooltip shows above-left so it doesn't cover the clear-all button */
.clear-wrap > .btn:first-child[data-tooltip]::before {
  right: 0;
  left: auto;
  top: auto;
  bottom: calc(100% + 8px);
  transform: none;
}
.clear-wrap:hover .clear-all-btn { display: flex; align-items: center; justify-content: center; }

.fab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--ik-bg);
  color: var(--ik-muted);
  box-shadow: var(--ik-shadow);
  cursor: pointer;
  padding: 0;
  transition: color .15s ease, transform .15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.fab:hover { color: var(--ik-accent); transform: scale(1.1); }
.fab { position: relative; }

.fab-badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 16px; height: 16px;
  background: var(--ik-accent);
  color: #fff;
  border-radius: 8px;
  font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Settings panel — Figma tokens (node 1:4) + dark fallbacks */
.settings-btn { color: var(--ik-muted); }
.settings-btn:hover { color: var(--ik-text); }
.settings-btn.active { background: var(--ik-bg2); color: var(--ik-accent); }

.settings-panel {
  --sp-brand: #ff2442;
  --sp-text-paragraph: #000000b2;
  --sp-text-title: #000000d9;
  --sp-text-placeholder: #0000006b;
  --sp-line-divider: #00000014;
  --sp-checkbox-active: #3077f1;
  --sp-checkbox-stroke: #0000001a;
  position: fixed;
  z-index: 2147483647;
  width: 320px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 11px;
  background: var(--ik-bg);
  border: 1px solid var(--ik-border);
  border-radius: 16px;
  box-shadow: var(--ik-shadow);
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
  color: var(--ik-text);
  user-select: text;
  cursor: default;
}

:host-context([data-instruckt-theme="dark"]) .settings-panel {
  --sp-text-paragraph: color-mix(in srgb, var(--ik-text) 70%, transparent);
  --sp-text-title: color-mix(in srgb, var(--ik-text) 85%, transparent);
  --sp-text-placeholder: color-mix(in srgb, var(--ik-text) 42%, transparent);
  --sp-line-divider: color-mix(in srgb, var(--ik-text) 8%, transparent);
  --sp-checkbox-stroke: color-mix(in srgb, var(--ik-text) 10%, transparent);
}
@media (prefers-color-scheme: dark) {
  :host-context(html:not([data-instruckt-theme="light"])) .settings-panel {
    --sp-text-paragraph: color-mix(in srgb, var(--ik-text) 70%, transparent);
    --sp-text-title: color-mix(in srgb, var(--ik-text) 85%, transparent);
    --sp-text-placeholder: color-mix(in srgb, var(--ik-text) 42%, transparent);
    --sp-line-divider: color-mix(in srgb, var(--ik-text) 8%, transparent);
    --sp-checkbox-stroke: color-mix(in srgb, var(--ik-text) 10%, transparent);
  }
}

.settings-panel .panel-head-figma {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  flex-shrink: 0;
}
.settings-panel .panel-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.settings-panel .panel-brand {
  display: flex;
  align-items: center;
  line-height: 0;
  min-width: 0;
  flex: 0 1 auto;
  max-width: calc(100% - 120px);
}
.settings-panel .panel-brand svg {
  display: block;
  height: 11px;
  width: auto;
  max-width: 100%;
}
.settings-panel .panel-version {
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  color: var(--sp-text-placeholder);
  flex-shrink: 0;
}
.settings-panel .panel-divider,
.settings-panel .settings-list-divider {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 0;
  height: auto;
  background: transparent;
  border: 0;
  box-sizing: border-box;
}
.settings-panel .panel-divider::after,
.settings-panel .settings-list-divider::after {
  content: '';
  display: block;
  height: 1px;
  width: 100%;
  background: var(--sp-line-divider);
}
.settings-panel .panel-close {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border: 0; background: transparent;
  border-radius: 4px;
  color: var(--ik-muted);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.settings-panel .panel-close:hover { background: var(--ik-bg2); color: var(--ik-text); }
.settings-panel .panel-body {
  min-height: 0;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: var(--sp-text-paragraph);
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.settings-panel .settings-section { display: flex; flex-direction: column; gap: 8px; }
.settings-panel .settings-section-head { display: none; }

.settings-panel .settings-row.settings-pick-row,
.settings-panel .settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-height: 32px;
  padding: 5px 0;
  border-radius: 4px;
}
.settings-panel .settings-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
}
.settings-panel .settings-row-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--sp-text-paragraph);
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
}
.settings-panel .settings-help-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}
.settings-panel .settings-help-wrap.is-help-open {
  z-index: 50;
  isolation: isolate;
}
.settings-panel .settings-help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ik-text);
  cursor: help;
  flex-shrink: 0;
}
.settings-panel .settings-help-btn:hover {
  background: color-mix(in srgb, var(--ik-text) 6%, transparent);
  color: var(--ik-text);
}
.settings-panel .settings-help-btn svg {
  display: block;
  opacity: 0.45;
}
.settings-panel .settings-help-btn:hover svg {
  opacity: 0.65;
}
.settings-panel .settings-help-popover {
  position: absolute;
  left: 0;
  right: auto;
  top: auto;
  bottom: calc(100% + 6px);
  z-index: 2;
  width: min(300px, calc(100vw - 48px));
  max-width: 300px;
  max-height: min(280px, 40vh);
  overflow-y: auto;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: 0;
  text-transform: none;
  white-space: pre-wrap;
  color: var(--ik-text);
  background: var(--ik-bg);
  border: 1px solid var(--ik-border);
  border-radius: 8px;
  box-shadow: var(--ik-shadow);
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  transition: opacity .12s ease, visibility .12s ease;
}
.settings-panel .settings-help-wrap.is-help-open .settings-help-popover {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}
.settings-panel .settings-value-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--ik-text);
  flex-shrink: 0;
  max-width: 52%;
  min-width: 0;
}
.settings-panel .settings-value-toggle:hover {
  background: color-mix(in srgb, var(--ik-text) 4%, transparent);
}
.settings-panel .settings-value-toggle .value-name {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--sp-text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.settings-panel .settings-more-hit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 0;
  color: color-mix(in srgb, var(--ik-text) 45%, transparent);
  flex-shrink: 0;
}
.settings-panel .settings-more-hit svg {
  display: block;
}

.settings-panel .settings-color-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 5px 0;
  border-radius: 4px;
}
.settings-panel .settings-color-head {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--sp-text-paragraph);
}
.settings-panel .settings-color-swatches {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
}
.settings-panel .settings-color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--swatch, #6366f1);
  box-sizing: border-box;
}
.settings-panel .settings-color-swatch:hover {
  filter: brightness(1.06);
}
.settings-panel .settings-color-swatch.is-selected {
  border-color: var(--ik-bg);
  border-width: 2px;
  box-shadow: 0 0 0 1px var(--swatch, #6366f1);
}

.settings-panel .settings-modes-section {
  gap: 0;
}
.settings-panel .settings-mode-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 5px 0;
  width: 100%;
}
.settings-panel .settings-mode-main {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
  border-radius: 4px;
}
.settings-panel .settings-mode-main:hover {
  background: color-mix(in srgb, var(--ik-text) 4%, transparent);
}
.settings-panel .settings-check-ui {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid var(--sp-checkbox-stroke);
  background: #ffffff;
  flex-shrink: 0;
  box-sizing: border-box;
  position: relative;
}
:host-context([data-instruckt-theme="dark"]) .settings-panel .settings-check-ui {
  background: var(--ik-bg);
}
@media (prefers-color-scheme: dark) {
  :host-context(html:not([data-instruckt-theme="light"])) .settings-panel .settings-check-ui {
    background: var(--ik-bg);
  }
}
.settings-panel .settings-mode-row.is-selected .settings-check-ui {
  border-color: var(--sp-checkbox-active);
  background: var(--sp-checkbox-active);
}
.settings-panel .settings-mode-row.is-selected .settings-check-ui::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.settings-panel .settings-mode-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--sp-text-paragraph);
}
`

/** Popup shadow DOM styles — fully isolated */
export const POPUP_CSS = /* css */ `
:host {
  all: initial;
  display: block;
  position: fixed;
  z-index: 2147483647;
}

* { box-sizing: border-box; }

:host {
  --ik-accent: var(--instruckt-accent, #6366f1);
  --ik-accent-h: var(--instruckt-accent-hover, #4f46e5);
  --ik-bg: #ffffff;
  --ik-bg2: #f8f8f8;
  --ik-border: #e4e4e7;
  --ik-text: #18181b;
  --ik-muted: #71717a;
  --ik-shadow: 0 4px 24px rgba(0,0,0,.12);
  --ik-radius: 10px;
  --ik-hl: color-mix(in srgb, var(--ik-accent) 15%, transparent);
}

@media (prefers-color-scheme: dark) {
  :host {
    --ik-bg: #1c1c1e; --ik-bg2: #2c2c2e; --ik-border: #3a3a3c;
    --ik-text: #f4f4f5; --ik-muted: #a1a1aa;
    --ik-shadow: 0 4px 24px rgba(0,0,0,.5);
    --ik-hl: color-mix(in srgb, var(--ik-accent) 22%, transparent);
  }
}

.popup {
  width: 340px;
  background: var(--ik-bg);
  border: 1px solid var(--ik-border);
  border-radius: var(--ik-radius);
  box-shadow: var(--ik-shadow);
  padding: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  color: var(--ik-text);
  animation: pop-in .12s ease;
}
@keyframes pop-in {
  from { opacity:0; transform: scale(.95) translateY(4px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}

.header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.element-tag {
  font-size:11px; font-family:ui-monospace,monospace; color:var(--ik-muted);
  background:var(--ik-bg2); border-radius:4px; padding:2px 6px;
  max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.close-btn {
  background:none; border:none; color:var(--ik-muted);
  cursor:pointer; font-size:18px; line-height:1; padding:0;
}

.fw-badge {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
  color:var(--ik-accent); background:var(--ik-hl); border-radius:4px;
  padding:2px 6px; margin-bottom:8px;
}
.selected-text {
  font-size:12px; color:var(--ik-muted); background:var(--ik-bg2);
  border-left:3px solid var(--ik-accent); padding:4px 8px;
  border-radius:0 4px 4px 0; margin-bottom:10px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}

.label {
  font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; color:var(--ik-muted); margin-bottom:4px;
}
.row { display:flex; gap:6px; margin-bottom:10px; }
.chips { display:flex; gap:4px; flex-wrap:wrap; }

.chip {
  font-size:11px; padding:3px 8px; border-radius:12px;
  border:1px solid var(--ik-border); background:transparent;
  color:var(--ik-muted); cursor:pointer; transition:all .1s;
}
.chip:hover { border-color:var(--ik-accent); color:var(--ik-accent); }
.chip.sel { background:var(--ik-accent); border-color:var(--ik-accent); color:#fff; }
.chip.blocking.sel  { background:#ef4444; border-color:#ef4444; }
.chip.important.sel { background:#f97316; border-color:#f97316; }
.chip.suggestion.sel{ background:#22c55e; border-color:#22c55e; }

.screenshot-slot { margin-bottom: 10px; }

.btn-capture {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  border: 1px dashed var(--ik-border);
  border-radius: 6px;
  background: var(--ik-bg2);
  color: var(--ik-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.btn-capture:hover {
  border-color: var(--ik-accent);
  color: var(--ik-accent);
}
.btn-capture svg { flex-shrink: 0; }

.screenshot-preview {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--ik-border);
  margin-bottom: 10px;
}
.screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  background: var(--ik-bg2);
}
.screenshot-remove {
  position: absolute;
  top: 4px; right: 4px;
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.screenshot-remove:hover { background: #ef4444; }

textarea {
  width:100%; min-height:80px; resize:vertical;
  border:1px solid var(--ik-border); border-radius:6px;
  background:var(--ik-bg2); color:var(--ik-text);
  font-family:inherit; font-size:13px; padding:8px 10px;
  outline:none; transition:border-color .15s; margin-bottom:10px;
}
textarea:focus { border-color:var(--ik-accent); }
textarea::placeholder { color:var(--ik-muted); }

.actions { display:flex; justify-content:flex-end; gap:6px; }

.btn-secondary {
  padding:6px 14px; border-radius:6px; border:1px solid var(--ik-border);
  background:transparent; color:var(--ik-muted); font-size:12px; cursor:pointer; transition:all .1s;
}
.btn-secondary:hover { border-color:var(--ik-muted); color:var(--ik-text); }

.btn-primary {
  padding:6px 14px; border-radius:6px; border:none;
  background:var(--ik-accent); color:#fff;
  font-size:12px; font-weight:700; cursor:pointer; transition:background .1s;
}
.btn-primary:hover { background:var(--ik-accent-h); }
.btn-primary:disabled { opacity:.5; cursor:not-allowed; }

.btn-danger {
  padding:6px 14px; border-radius:6px; border:1px solid #ef4444;
  background:transparent; color:#ef4444;
  font-size:12px; cursor:pointer; transition:all .1s;
}
.btn-danger:hover { background:#ef4444; color:#fff; }

/* Thread view */
.thread { margin-top:10px; border-top:1px solid var(--ik-border); padding-top:10px; }
.msg { margin-bottom:8px; }
.msg-role {
  font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; margin-bottom:2px;
}
.msg-role.human { color:var(--ik-accent); }
.msg-role.agent { color:#22c55e; }
.msg-content { font-size:12px; line-height:1.5; }

.status-badge {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
  border-radius:4px; padding:2px 6px;
}
.status-badge.pending      { background:var(--ik-hl); color:var(--ik-accent); }
.status-badge.resolved     { background:rgba(34,197,94,.15); color:#22c55e; }
.status-badge.dismissed    { background:var(--ik-bg2); color:var(--ik-muted); }
`

/** Marker pin styles injected into document.head — pins overlay the page */
export const MARKER_CSS = /* css */ `
.ik-marker {
  position: absolute;
  z-index: 2147483645;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--ik-marker-default, #6366f1);
  color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--ik-marker-default, #6366f1) 40%, transparent);
  transition: transform .15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  pointer-events: all;
  user-select: none;
  /* left/top are the click point; center the pin on that point */
  transform: translate(-50%, -50%);
}
.ik-marker:hover { transform: translate(-50%, -50%) scale(1.15); }
.ik-marker.has-screenshot { background: var(--ik-marker-screenshot, #22c55e); box-shadow: 0 2px 8px color-mix(in srgb, var(--ik-marker-screenshot, #22c55e) 40%, transparent); }
.ik-marker.dismissed { background: var(--ik-marker-dismissed, #71717a); box-shadow: 0 2px 8px rgba(0,0,0,.2); }
/* Ghost pin — target is off-screen, in a closed overlay, or clipped; click to reveal */
.ik-marker.ik-marker-ghost {
  opacity: 0.55;
  background: color-mix(in srgb, var(--ik-marker-default, #6366f1) 70%, #ffffff);
  border: 2px dashed color-mix(in srgb, var(--ik-marker-default, #6366f1) 55%, #ffffff);
  box-shadow: none;
}
.ik-marker.ik-marker-ghost.has-screenshot {
  background: color-mix(in srgb, var(--ik-marker-screenshot, #22c55e) 70%, #ffffff);
  border-color: color-mix(in srgb, var(--ik-marker-screenshot, #22c55e) 55%, #ffffff);
}
.ik-marker .ik-marker-edit { display: none; line-height: 0; }
.ik-marker:hover .ik-marker-index { display: none; }
.ik-marker:hover .ik-marker-edit { display: block; }

/* Spotlight rectangle showing the annotated region */
.ik-spotlight {
  position: absolute;
  z-index: 2147483644;
  pointer-events: none;
  /* Use border-box so width/height match the element's bbox exactly
     (border is drawn inside, not outside, the rect we position). */
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, var(--ik-marker-default, #6366f1) 80%, #ffffff);
  background: color-mix(in srgb, var(--ik-marker-default, #6366f1) 16%, transparent);
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,.15);
  display: none;
}
.ik-spotlight.has-screenshot {
  border-color: color-mix(in srgb, var(--ik-marker-screenshot, #22c55e) 80%, #ffffff);
  background: color-mix(in srgb, var(--ik-marker-screenshot, #22c55e) 16%, transparent);
}

/* Hover preview (comment) */
.ik-marker-preview {
  position: absolute;
  z-index: 2147483646;
  pointer-events: none;
  display: none;
  max-width: min(360px, calc(100vw - 24px));
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,.22);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.35;
}
.ik-marker-preview .title {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  opacity: .75;
  margin-bottom: 4px;
}
.ik-marker-preview .content {
  font-weight: 600;
  word-break: break-word;
}
.ik-marker-preview .meta {
  margin-top: 6px;
  font-size: 11px;
  opacity: .75;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ik-marker-preview .ghost-hint {
  margin-top: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: #fcd34d;
  line-height: 1.3;
}
`

/** Comma-separated R,G,B for the page theme accent (marker default). */
export function getInstrucktAccentRgbComma(): string {
  if (typeof document === 'undefined') return '99, 102, 241'
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--instruckt-accent-rgb').trim()
    return v || '99, 102, 241'
  } catch {
    return '99, 102, 241'
  }
}

function isValidHex6(s: string | undefined): s is string {
  return !!s && /^#[0-9A-Fa-f]{6}$/.test(s.trim())
}

/** Darken / lighten hex by multiplying RGB channels (0–1 darker, >1 lighter). */
function shadeHex(hex: string, factor: number): string {
  const h = hex.replace('#', '').trim()
  const m = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h)
  if (!m) return '#4f46e5'
  const ch = (i: number) => {
    const n = Math.round(parseInt(m[i], 16) * factor)
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
  }
  return `#${ch(1)}${ch(2)}${ch(3)}`
}

function hexToRgbComma(hex: string): string {
  const h = hex.replace('#', '').trim()
  const m = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h)
  if (!m) return '99, 102, 241'
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`
}

/** `:root { … }` block: marker colors + theme tokens used by toolbar / popup / highlights. */
function buildInstrucktRootCss(colors?: import('../types').MarkerColors): string {
  const def = isValidHex6(colors?.default) ? colors!.default!.trim() : '#6366f1'
  const hover = shadeHex(def, 0.88)
  const rgb = hexToRgbComma(def)
  const parts = [
    `--ik-marker-default: ${def};`,
    `--instruckt-accent: ${def};`,
    `--instruckt-accent-hover: ${hover};`,
    `--instruckt-accent-rgb: ${rgb};`,
  ]
  if (isValidHex6(colors?.screenshot)) parts.push(`--ik-marker-screenshot: ${colors!.screenshot!.trim()};`)
  if (isValidHex6(colors?.dismissed)) parts.push(`--ik-marker-dismissed: ${colors!.dismissed!.trim()};`)
  return `:root {\n  ${parts.join('\n  ')}\n}\n`
}

/** Inject styles into document.head (idempotent) */
export function injectGlobalStyles(colors?: import('../types').MarkerColors): void {
  if (document.getElementById('instruckt-global')) return
  const style = document.createElement('style')
  style.id = 'instruckt-global'
  style.textContent = buildInstrucktRootCss(colors) + GLOBAL_CSS + MARKER_CSS
  document.head.appendChild(style)
}
