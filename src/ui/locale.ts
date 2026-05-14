import type { KeyBindings, OutputFormat, UiLocale } from '../types'

export const UI_LOCALE_CYCLE: readonly UiLocale[] = ['zh-CN', 'en', 'ja']

export function isUiLocale(v: string): v is UiLocale {
  return v === 'zh-CN' || v === 'en' || v === 'ja'
}

export function uiLocaleLabel(locale: UiLocale): string {
  switch (locale) {
    case 'zh-CN':
      return '简体中文'
    case 'en':
      return 'English'
    case 'ja':
      return '日本語'
  }
}

export interface ToolbarI18n {
  settingsBrandName: string
  panelTitle: string
  settingsPanelAria: string
  panelCloseAria: string
  dragHandleAria: string
  annotateTooltip: string
  freezeTooltip: string
  screenshotTooltip: string
  copyTooltip: string
  clearPageTooltip: string
  clearAllTooltip: string
  settingsTooltip: string
  minimizeTooltip: string
  fabTitle: string
  fabAria: string
  outputFormatTitle: string
  outputFormatHelp: string
  outputHelpAria: string
  outputCycleAria: string
  markerColorTitle: string
  languageTitle: string
  languageHelp: string
  languageHelpAria: string
  languageCycleAria: string
  formatLabel: Record<OutputFormat, string>
  markerCurrentPage: string
  markerAll: string
}

type ToolbarRow = {
  annotate: (k: string) => string
  freeze: (k: string) => string
  screenshot: (k: string) => string
  clearPage: (k: string) => string
  settingsBrandName: string
  panelTitle: string
  settingsPanelAria: string
  panelCloseAria: string
  dragHandleAria: string
  copyTooltip: string
  clearAllTooltip: string
  settingsTooltip: string
  minimizeTooltip: string
  fabTitle: string
  fabAria: string
  outputFormatTitle: string
  outputFormatHelp: string
  outputHelpAria: string
  outputCycleAria: string
  markerColorTitle: string
  languageTitle: string
  languageHelp: string
  languageHelpAria: string
  languageCycleAria: string
  formatLabel: Record<OutputFormat, string>
  markerCurrentPage: string
  markerAll: string
}

const T: Record<UiLocale, ToolbarRow> = {
  'zh-CN': {
    annotate: (k) => `标注元素 (${k})`,
    freeze: (k) => `冻结页面动画 (${k})`,
    screenshot: (k) => `框选截图 (${k})`,
    clearPage: (k) => `清除本页标注 (${k})`,
    settingsBrandName: 'Red-instruckt',
    panelTitle: 'Red-instruckt',
    settingsPanelAria: 'Red-instruckt 设置',
    panelCloseAria: '关闭设置',
    dragHandleAria: '拖动以移动工具栏',
    copyTooltip: '复制为 Markdown',
    clearAllTooltip: '删除所有标注。',
    settingsTooltip: '设置',
    minimizeTooltip: '收起工具栏',
    fabTitle: '打开 instruckt 工具栏',
    fabAria: '打开 instruckt 工具栏',
    outputFormatTitle: '输出详略',
    outputFormatHelp: `复制为 Markdown 时包含多少上下文。

• 简洁 — 最少字段，适合快速修改。
• 标准 — 元素、路径、来源、类名、附近文本、严重程度。
• 详细 — 增加边界框与更丰富的上下文。
• 取证 — 增加稳定 ID、完整组件栈与实时计算样式快照。

点击右侧当前值可循环切换格式。`,
    outputHelpAria: '关于输出详略',
    outputCycleAria: '切换输出详略',
    markerColorTitle: '标记颜色',
    languageTitle: '界面语言',
    languageHelp: `控制工具栏、设置面板与新建/编辑标注弹窗的显示语言。

点击右侧可在 简体中文、English、日本語 之间循环切换。`,
    languageHelpAria: '关于界面语言',
    languageCycleAria: '切换界面语言',
    formatLabel: {
      compact: '简洁',
      standard: '标准',
      detailed: '详细',
      forensic: '取证',
    },
    markerCurrentPage: '当前页面',
    markerAll: '全部标记',
  },
  en: {
    annotate: (k) => `Annotate elements (${k})`,
    freeze: (k) => `Freeze page (${k})`,
    screenshot: (k) => `Screenshot region (${k})`,
    clearPage: (k) => `Clear this page (${k})`,
    settingsBrandName: 'Red-instruckt',
    panelTitle: 'Red-instruckt',
    settingsPanelAria: 'Red-instruckt settings',
    panelCloseAria: 'Close settings',
    dragHandleAria: 'Drag to reposition toolbar',
    copyTooltip: 'Copy annotations as markdown',
    clearAllTooltip: 'Delete all instructions.',
    settingsTooltip: 'Settings',
    minimizeTooltip: 'Minimize toolbar',
    fabTitle: 'Open instruckt toolbar',
    fabAria: 'Open instruckt toolbar',
    outputFormatTitle: 'Output detail',
    outputFormatHelp: `How much context is included when you copy annotations as Markdown for AI agents.

• Compact — minimal fields for quick fixes.
• Standard — element, path, source, classes, nearby text, severity.
• Detailed — adds bounding-box position and richer context.
• Forensic — adds stable ID, full component stack, and a live computed-style snapshot.

Click the value on the right to cycle through formats in order.`,
    outputHelpAria: 'About output detail',
    outputCycleAria: 'Change output detail',
    markerColorTitle: 'Marker color',
    languageTitle: 'Language',
    languageHelp: `Controls the display language for the toolbar, settings panel, and new/edit annotation popups.

Click the value on the right to cycle: 简体中文 → English → 日本語.`,
    languageHelpAria: 'About interface language',
    languageCycleAria: 'Change interface language',
    formatLabel: {
      compact: 'Compact',
      standard: 'Standard',
      detailed: 'Detailed',
      forensic: 'Forensic',
    },
    markerCurrentPage: 'Current page',
    markerAll: 'All markers',
  },
  ja: {
    annotate: (k) => `要素に注釈 (${k})`,
    freeze: (k) => `ページのアニメーションを停止 (${k})`,
    screenshot: (k) => `範囲をスクリーンショット (${k})`,
    clearPage: (k) => `このページの注釈を消去 (${k})`,
    settingsBrandName: 'Red-instruckt',
    panelTitle: 'Red-instruckt',
    settingsPanelAria: 'Red-instruckt 設定',
    panelCloseAria: '設定を閉じる',
    dragHandleAria: 'ドラッグしてツールバーを移動',
    copyTooltip: 'Markdown としてコピー',
    clearAllTooltip: 'すべての指示を削除。',
    settingsTooltip: '設定',
    minimizeTooltip: 'ツールバーを最小化',
    fabTitle: 'instruckt ツールバーを開く',
    fabAria: 'instruckt ツールバーを開く',
    outputFormatTitle: '出力の詳しさ',
    outputFormatHelp: `注釈を AI 向け Markdown でコピーするときに含める文脈の量。

• コンパクト — 最小限のフィールドで素早く修正。
• 標準 — 要素、パス、ソース、クラス、周辺テキスト、重要度。
• 詳細 — バウンディングボックス位置などより豊富な文脈。
• フォレンジック — 安定 ID、完全なコンポーネントスタック、計算済みスタイルのスナップショット。

右側の値をクリックして順に切り替えます。`,
    outputHelpAria: '出力の詳しさについて',
    outputCycleAria: '出力の詳しさを変更',
    markerColorTitle: 'マーカー色',
    languageTitle: '表示言語',
    languageHelp: `ツールバー、設定パネル、新規/編集ポップアップの表示言語を切り替えます。

右側の値をクリックして 简体中文 → English → 日本語 の順で循環します。`,
    languageHelpAria: '表示言語について',
    languageCycleAria: '表示言語を変更',
    formatLabel: {
      compact: 'コンパクト',
      standard: '標準',
      detailed: '詳細',
      forensic: 'フォレンジック',
    },
    markerCurrentPage: '現在のページ',
    markerAll: 'すべてのマーカー',
  },
}

export function getToolbarI18n(locale: UiLocale, keys: KeyBindings): ToolbarI18n {
  const row = T[locale]
  const ka = (keys.annotate ?? 'A').toUpperCase()
  const kf = (keys.freeze ?? 'F').toUpperCase()
  const ks = (keys.screenshot ?? 'C').toUpperCase()
  const kx = (keys.clearPage ?? 'X').toUpperCase()
  return {
    settingsBrandName: row.settingsBrandName,
    panelTitle: row.panelTitle,
    settingsPanelAria: row.settingsPanelAria,
    panelCloseAria: row.panelCloseAria,
    dragHandleAria: row.dragHandleAria,
    annotateTooltip: row.annotate(ka),
    freezeTooltip: row.freeze(kf),
    screenshotTooltip: row.screenshot(ks),
    copyTooltip: row.copyTooltip,
    clearPageTooltip: row.clearPage(kx),
    clearAllTooltip: row.clearAllTooltip,
    settingsTooltip: row.settingsTooltip,
    minimizeTooltip: row.minimizeTooltip,
    fabTitle: row.fabTitle,
    fabAria: row.fabAria,
    outputFormatTitle: row.outputFormatTitle,
    outputFormatHelp: row.outputFormatHelp,
    outputHelpAria: row.outputHelpAria,
    outputCycleAria: row.outputCycleAria,
    markerColorTitle: row.markerColorTitle,
    languageTitle: row.languageTitle,
    languageHelp: row.languageHelp,
    languageHelpAria: row.languageHelpAria,
    languageCycleAria: row.languageCycleAria,
    formatLabel: row.formatLabel,
    markerCurrentPage: row.markerCurrentPage,
    markerAll: row.markerAll,
  }
}

export interface PopupI18n {
  cancelEscTitle: string
  screenshotAlt: string
  removeScreenshotTitle: string
  captureScreenshot: string
  placeholderWithScreenshot: string
  placeholderNoScreenshot: string
  addNote: string
  cancel: string
  capturing: string
  captureFailed: string
  closeAria: string
  remove: string
  save: string
}

const P: Record<UiLocale, PopupI18n> = {
  'zh-CN': {
    cancelEscTitle: '取消 (Esc)',
    screenshotAlt: '截图',
    removeScreenshotTitle: '移除截图',
    captureScreenshot: '截取截图',
    placeholderWithScreenshot: '添加备注（可选）',
    placeholderNoScreenshot: '这里需要改什么？',
    addNote: '添加备注',
    cancel: '取消',
    capturing: '正在截取…',
    captureFailed: '截取失败',
    closeAria: '关闭',
    remove: '删除',
    save: '保存',
  },
  en: {
    cancelEscTitle: 'Cancel (Esc)',
    screenshotAlt: 'Screenshot',
    removeScreenshotTitle: 'Remove screenshot',
    captureScreenshot: 'Capture screenshot',
    placeholderWithScreenshot: 'Add a note (optional)',
    placeholderNoScreenshot: 'What needs to change here?',
    addNote: 'Add note',
    cancel: 'Cancel',
    capturing: 'Capturing…',
    captureFailed: 'Capture failed',
    closeAria: 'Close',
    remove: 'Remove',
    save: 'Save',
  },
  ja: {
    cancelEscTitle: 'キャンセル (Esc)',
    screenshotAlt: 'スクリーンショット',
    removeScreenshotTitle: 'スクリーンショットを削除',
    captureScreenshot: 'スクリーンショットを撮る',
    placeholderWithScreenshot: 'メモを追加（任意）',
    placeholderNoScreenshot: 'ここで何を変えたいですか？',
    addNote: 'メモを追加',
    cancel: 'キャンセル',
    capturing: '撮影中…',
    captureFailed: '撮影に失敗しました',
    closeAria: '閉じる',
    remove: '削除',
    save: '保存',
  },
}

export function getPopupI18n(locale: UiLocale): PopupI18n {
  return P[locale]
}

export const CAPTURE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`

export function captureButtonHtml(label: string): string {
  const safe = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<button class="btn-capture" data-action="capture">${CAPTURE_SVG} ${safe}</button>`
}
