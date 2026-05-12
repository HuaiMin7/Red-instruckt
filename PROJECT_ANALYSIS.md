# PROJECT_ANALYSIS — instruckt（维护者导读）

> 目标：帮助**新的维护者**快速理解该项目的核心架构、框架无关的实现方式、端到端数据流，以及构建/发布流程。

## 1. 项目定位与交付物

`instruckt` 是一个“给 AI 编码代理用的可视化反馈工具”：用户在页面上点选元素 → 输入反馈/截图 → 生成结构化 Markdown → 粘贴给 AI agent。

项目同时交付两类能力：

- **浏览器端核心库（framework-agnostic）**：运行在任意 Web 页面（SPA/MPA），负责 UI（toolbar/popup/marker）、事件监听、框架检测、存储与 Markdown 导出。
  - 入口：`src/index.ts` 导出 `Instruckt` 与 `init(config)`。
  - 核心实现：`src/instruckt.ts`
- **Vite 插件（开发期体验 + 可选后端）**：仅在 `vite dev` 下启用（`apply: 'serve'`），注入客户端初始化脚本，并可提供一个内置 dev API server，将注释/截图落盘到 `.instruckt/`。
  - 入口：`src/vite.ts`

对应 `package.json` 的 exports：

- `import instruckt from 'instruckt/vite'` → `./dist/vite.*`
- `import { Instruckt } from 'instruckt'` → `./dist/instruckt.*`

## 2. 整体架构（模块分层）

### 2.1 顶层模块图

```text
                ┌───────────────────────────────────────────┐
                │                 Vite plugin               │
                │  src/vite.ts                               │
                │  - transformIndexHtml 注入 init()           │
                │  - virtual:instruckt (SSR-safe)             │
                │  - (可选) dev API server + 文件存储         │
                └─────────────────────┬─────────────────────┘
                                      │  (DEV only)
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Browser core library                          │
│  src/instruckt.ts                                                │
│  - Toolbar / Popup / Markers / Highlight / Screenshot            │
│  - DOM 事件拦截（annotate/freeze）                                │
│  - Framework detection（element-source + adapters/*）            │
│  - Persistence（localStorage + IndexedDB + 可选 backend）          │
│  - exportMarkdown()                                              │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                               │
                ▼                               ▼
        ┌───────────────┐               ┌──────────────────┐
        │  API client    │               │ Framework adapters│
        │ src/api.ts     │               │ src/adapters/*    │
        │ fetch GET/POST │               │ 从 DOM 反查组件信息│
        └───────────────┘               └──────────────────┘
```

### 2.2 `src/` 目录结构（核心关注点）

- `src/index.ts`
  - 对外入口：导出 `Instruckt` class、类型、以及 `init(config)` 工厂方法。
- `src/instruckt.ts`
  - 核心运行时：UI 初始化、事件拦截、框架检测、存储、轮询、导出 Markdown、销毁。
- `src/vite.ts`
  - Vite 插件：注入客户端、提供 `virtual:instruckt`、可选 dev server 落盘存储。
- `src/types.ts`
  - 所有对外类型：`InstrucktConfig`、`Annotation`、`FrameworkContext` 等。
- `src/api.ts`
  - `InstrucktApi`：与后端约定接口通信（`GET/POST/PATCH {endpoint}/annotations`），并做 snake_case/camelCase 转换（兼容 Laravel 风格）。
- `src/adapters/*`
  - 框架适配器：`react.ts`、`vue.ts`、`svelte.ts`、`livewire.ts`、`blade.ts`
- `src/ui/*`
  - 纯 UI 与交互：`toolbar.ts`、`popup.ts`、`markers.ts`、`highlight.ts`、`screenshot.ts`、`styles.ts`
- `src/selector.ts`
  - 生成 selector/元素标签/附近文本/类名/页面坐标等，用于注释 payload 与导出 Markdown。

## 3. Vite 插件设计（`src/vite.ts`）

该插件的目标是“让 SPA 直接零后端使用 instruckt”，并兼容 SSR 框架（Nuxt/SvelteKit 等）。

### 3.1 两种注入方式

- **SPA：`transformIndexHtml` 注入**
  - 插件在 dev server 下修改 HTML，在 `</body>` 前插入一个 `type="module"` 脚本：
    - `import { init } from 'instruckt'`
    - `if (import.meta.env.DEV) init(<clientConfig>)`
- **SSR/非 index.html：`virtual:instruckt`**
  - 插件实现 `resolveId/load`，提供虚拟模块：
    - `import 'virtual:instruckt'` 会在浏览器 dev 环境执行 `init(config)`
    - 且明确 SSR-safe：`if (!import.meta.env.SSR && import.meta.env.DEV) { ... }`

### 3.2 内置 dev API server（可选）

默认 `server: true`，启用后在 `configureServer()` 中挂中间件，提供：

- `GET  {endpoint}/annotations` → 读取 `.instruckt/annotations.json`
- `POST {endpoint}/annotations` → 生成 `uuid`，可将 `screenshot` data URL 写入 `.instruckt/screenshots/<id>.png|svg`，并将 screenshot 字段替换为相对路径 `screenshots/<id>.*`
- `PATCH {endpoint}/annotations/:id` → 更新注释；当 `status` 变为 `resolved/dismissed` 时会删除对应截图文件
- `GET  {endpoint}/screenshots/:filename` → 读取截图文件（带 path traversal 防护）

关键点：

- **只在 dev 生效**：插件 `apply: 'serve'`，不会进生产构建。
- **配置下发给客户端**：`clientConfig()` 组装传给 `init()` 的配置；当启用内置 server 时额外下发 `screenshotPath = "<dirName>/"`（用于 Markdown 导出时拼接文件路径提示）。

## 4. “框架无关”是如何实现的？

### 4.1 核心思想：统一的 `FrameworkContext`

`instruckt` 的业务逻辑只依赖一个统一结构：

- `FrameworkContext`（见 `src/types.ts`）包含：
  - `framework`: `'livewire' | 'vue' | 'svelte' | 'react' | 'blade'`
  - `component`: 组件名
  - （可选）`source_file/source_line/source_column`
  - （可选）`component_stack`：完整组件栈（由 `element-source` 提供）
  - （可选）`data`：props/state 等上下文

因此核心流程可以完全不关心“React/Vue/Svelte/Livewire/Blade 的内部机制”，只要能从 DOM 元素解析出 `FrameworkContext`。

### 4.2 “element-source + adapters” 的两层解析策略

在 `src/instruckt.ts` 的 `detectFramework(el)` 中，策略是：

1. **Livewire 优先**：`element-source` 不支持 Livewire，因此先用 `adapters/livewire.ts` 直接识别 `wire:id` / `wire:snapshot`。
2. **对 React/Vue/Svelte 优先使用 `element-source`**
   - `element-source` 能提供：
     - 精确 source location（file:line:column）
     - 完整组件栈 `stack`
3. **再用本项目的 adapter 补充 framework-specific 信息（props/state 等）**
   - Vue：props/setupState/uid
   - React：fiber props、debug source
   - Svelte：文件路径/组件名等
4. **fallback**：`element-source` 失败时直接使用 adapters 的 DOM 反查逻辑
5. **Blade 最后兜底**：当没有 JS 框架声明该元素时，尝试 Blade（依赖服务器注入的视图列表脚本）

这种组合使得：

- **跨框架一致输出**：最终都归一化为 `FrameworkContext`。
- **精确定位优先**：能拿到 file:line:column 与 component stack 时优先使用。
- **低耦合**：适配器是“可插拔”的，只要实现 `getContext(el)` 即可。

### 4.3 各框架适配器是如何工作的？

#### React（`src/adapters/react.ts`）

- 通过 DOM 节点上 React 注入的私有字段 `__reactFiber$*` / `__reactInternalInstance$*` 找到 fiber。
- 向上遍历 fiber.return，寻找最合适的组件名：
  - 优先选择 `_debugSource` 指向用户代码（非 `node_modules`）的 fiber。
  - 退化为第一个命中的具名组件。
- 提取 props（过滤 `children` 与 function），并尽量 JSON 序列化。

#### Vue（`src/adapters/vue.ts`）

- Vue3 常见字段：DOM 上的 `__vueParentComponent` / `__vue__`。
- DOM 向上找“最合适组件实例”，并尽量选择 `__file` 指向用户代码的组件（非 `node_modules`）。
- 读取 props 与 setupState（过滤内部字段、函数），并提供 `component_uid`。

#### Svelte（`src/adapters/svelte.ts`）

- 依赖 DOM 上的 `__svelte_meta`（包含 `loc.file`）。
- 组件名从文件名推断：`Button.svelte` → `Button`。

#### Livewire（`src/adapters/livewire.ts`）

- 通过 DOM 向上找到 `wire:id`。
- 解析 `wire:snapshot`（Livewire v3+），从 `memo.name/path` 推断组件名/类名。

#### Blade（`src/adapters/blade.ts`）

- Blade 没有前端组件边界，因此**不能从 DOM 精确映射**。
- 采用“服务器注入视图列表”的方式：读取 `#instruckt-views` 脚本标签 JSON。
- 用启发式选择“最像页面级模板”的 view（排除 `layouts.*`、`components.*`，否则取最后一个）。

## 5. 核心数据流（点击 → 注释 → 存储 → 导出 Markdown）

下面以最典型流程（用户进入 annotate 模式并点击元素）为例。

### 5.1 事件与 UI 交互流

```text
Toolbar(Annotate ON)
  └─ Instruckt.attachAnnotateListeners()
       - mousemove: ElementHighlight.show()
       - mousedown/pointerdown capture: 阻止 SPA 框架抢先导航
       - click capture: boundClick()

用户 click 页面元素
  └─ boundClick()
       - preventDefault/stopPropagation/stopImmediatePropagation
       - selector.ts: selector/name/label/classes/nearbyText/bbox
       - detectFramework(el): element-source + adapters
       - popup.showNew(pending)

Popup 提交
  └─ onSubmit()
       - submitAnnotation(pending, comment, screenshot?)
```

关键实现点：

- **为什么要 capture 阶段拦截**：很多 SPA 框架（Livewire/Inertia 等）会在 `mousedown/pointerdown` 就触发路由跳转或关闭弹层，导致用户无法完成备注；因此 `Instruckt` 在 annotation mode 下优先拦截这些事件。
- **UI 样式隔离**：`Toolbar`、`Popup` 都在 **shadow DOM** 中渲染，避免污染宿主页面样式；marker/highlight 使用 inline style 或注入极小的全局 CSS。

### 5.2 注释生成与 payload 结构

`submitAnnotation()` 生成 `AnnotationPayload`（见 `src/instruckt.ts`）：

- `x`: viewport 宽度的百分比（便于响应式定位 marker）
- `y`: 页面绝对坐标（`clientY + scrollY`）
- `comment`
- `element`/`elementPath`/`cssClasses`/`boundingBox`
- `selectedText`/`nearbyText`
- `screenshot`（data URL）
- `framework`（`FrameworkContext`）
- `url`（完整 URL）
- 默认 `intent: 'fix'`，`severity: 'important'`

### 5.3 存储策略（无后端 vs 有后端）

#### 5.3.1 本地存储（永远存在）

`loadAnnotations()` 会**先读 localStorage** 作为基线（即使有后端也如此）。

- localStorage key：`instruckt:${origin}:annotations`
- 为避免 localStorage 5MB 限制：
  - screenshot data URL 会被剥离为 `idb:<annotationId>` 引用
  - screenshot 实体写入 IndexedDB（DB: `instruckt`，store: `screenshots`）

这使得“无后端”场景仍能做到刷新不丢注释，同时截图不会把 localStorage 撑爆。

#### 5.3.2 后端存储（可选）

当 `InstrucktApi.getAnnotations()` 成功时，认为存在后端（`hasBackend=true`）：

- 远端数据作为主（source of truth）
- 仍保留 localStorage 中“仅本地的注释”（remote 未包含的 id）

Vite 插件内置后端的落盘位置：

- `.instruckt/annotations.json`
- `.instruckt/screenshots/<id>.png|svg`

### 5.4 导出 Markdown（复制到剪贴板）

触发方式：

- 自动：每次 `submitAnnotation()` 成功后会 `copyAnnotations()`（在安全上下文下用 Clipboard API）
- 手动：Toolbar 的 Copy 按钮（可 fallback 到 `execCommand('copy')`，用于非 secure context）

`exportMarkdown()`（`src/instruckt.ts`）逻辑：

- 过滤掉 `resolved/dismissed`，只导出“打开的注释”
- 按 page（pathname）分组：
  - 多页：顶层 `# UI Feedback`，每页一个 `## /path`
  - 单页：`# UI Feedback: /path`
- 每条注释输出：
  - comment（作为标题）
  - ID
  - element +（可选）component
  - Source（若有 source_file/line/column）
  - Component stack（若 `component_stack` 长度 > 1）
  - Classes / Text
  - Screenshot：
    - 若后端落盘：输出路径提示（结合 `config.screenshotPath`），并在 `mcp: true` 时附加 MCP 提示
    - 若 data URL：内联 `![Screenshot](data:...)`
- 若 `mcp: true`：尾部追加“用 MCP tool resolve”的提示文本

## 6. 构建与发布流程（`tsup.config.ts` + `package.json`）

### 6.1 构建产物矩阵（tsup 三段配置）

`tsup.config.ts` 定义了三套构建：

1. **CDN IIFE**
   - entry：`src/index.ts`
   - format：`iife`
   - global：`Instruckt`
   - 输出：`dist/instruckt.iife.js`
   - `noExternal: ['modern-screenshot']` + `minify: true` + `sourcemap: true`
   - 用途：直接 `<script>` 引入，使用 `Instruckt.init(...)`
2. **npm ESM + CJS（浏览器平台）**
   - entry：`src/index.ts`
   - format：`esm` + `cjs`
   - 输出：`dist/instruckt.esm.js`、`dist/instruckt.cjs.js`、并生成 `dist/instruckt.d.ts`
3. **Vite 插件（Node 平台）**
   - entry：`src/vite.ts`
   - format：`esm` + `cjs`
   - 输出：`dist/vite.esm.js`、`dist/vite.cjs.js`、并基于 `tsconfig.vite.json` 生成 `dist/vite.d.ts`
   - `external: ['vite']`（作为 peer dependency）
   - `platform: 'node'`, `target: 'node18'`

### 6.2 `package.json` 的发布形态

- `main/module/types` 指向 `dist/instruckt.*`
- `exports` 同时暴露：
  - `"."`（核心库）
  - `"./vite"`（Vite 插件）
- `files: ["dist"]`：仅发布构建产物
- scripts：
  - `build`: `tsup`
  - `dev`: `tsup --watch`
  - `lint`: `oxlint src/`
  - `typecheck`: `tsc --noEmit`
  - `check`: lint + typecheck + build

维护建议：

- **改 Vite 插件类型**：需要同时关注 `tsconfig.vite.json`（用于 dts 生成）。
- **改浏览器端 API/类型**：影响 `dist/instruckt.d.ts`，注意 semver。

## 7. 维护者视角：关键扩展点与常见改动落点

- **新增框架适配器**
  - 增加 `src/adapters/<fw>.ts`，实现 `isAvailable?` / `getContext(el)`（至少后者）
  - 扩展 `FrameworkContext.framework` union（`src/types.ts`）
  - 在 `Instruckt.detectFramework()` 中接入（优先级：是否需要在 element-source 前/后）
  - 更新 README（用户安装指引与 adapters 配置）
- **更改后端协议**
  - 核心客户端协议在 `src/api.ts`（GET/POST/PATCH）
  - Vite 插件内置后端在 `src/vite.ts`（中间件路由）
  - Markdown 中截图路径提示在 `Instruckt.exportMarkdown()`（`screenshotPath`/`mcp` 文案）
- **更改导出 Markdown 的格式**
  - 主要在 `Instruckt.exportMarkdown()`（`src/instruckt.ts`）
  - 注意多页/单页标题层级与 agent 解析习惯（ID、Source、stack 等）

## 8. 对你（新维护者）的快速上手路径

建议按以下顺序阅读代码：

1. `README.md`（使用方式与用户场景）
2. `src/vite.ts`（注入与内置后端）
3. `src/instruckt.ts`（真正的业务核心：事件→注释→存储→导出）
4. `src/adapters/*`（框架识别）
5. `src/ui/*` + `src/selector.ts`（UI 和 selector 细节）

