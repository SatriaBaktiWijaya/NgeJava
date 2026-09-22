# Software Requirements Specification (SRS)
## Project: "JForge" — Java IDE & GUI Builder (Desktop, Tauri + React)

| | |
|---|---|
| **Document Type** | Software Requirements Specification |
| **Author** | Lead Systems Engineer (drafted with Claude) |
| **Date** | September 22, 2026 |
| **Version** | 1.0 (V1 / MVP) |
| **Reference** | Derived from JForge PRD v1.0 |
| **Audience** | AI coding assistant (primary implementer), engineers, QA |

> This document is the strict technical blueprint referenced by Section 9 of the JForge PRD. It defines **what the system SHALL do**, at a level of precision suitable for module-by-module, AI-assisted implementation. It intentionally does not repeat product rationale from the PRD — see the PRD for the "why."

---

## 1. Introduction

### 1.1 Purpose

This SRS specifies the functional and non-functional requirements for **JForge V1 (MVP)** — a desktop application that provides a drag-and-drop visual builder for Java Swing GUIs, paired with a live, auto-generated Java code view. This document is written to be consumed directly by an AI coding assistant building the system incrementally, module by module, so every requirement is stated precisely enough to implement and test in isolation.

### 1.2 Scope

**In scope for V1:**
- A Tauri desktop shell hosting a React frontend.
- A Zustand-managed JSON tree representing a single-form Swing UI.
- A drag-and-drop canvas (`@dnd-kit/core`) for placing/arranging components.
- A property inspector for editing component attributes.
- A pure-function code generator producing Java Swing source from the JSON tree.
- A Monaco-based, **read-only** display of the generated code.
- Tauri IPC commands for saving the generated `.java` source to disk and loading a previously saved **project state** (JSON, not parsed Java) from disk.

**Out of scope for V1** (see PRD §4 Non-Goals for rationale): compiling/running Java code, parsing hand-edited Java back into the JSON tree, multi-form projects, `GridBagLayout` support, plugin/extension APIs, a custom Mini-Java compiler.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **AST** | Abstract Syntax Tree. Not produced by JForge V1's code generator (which is template/string-based, not AST-based) — listed here because it is relevant to the deferred round-tripping/compiler work in future versions. |
| **IPC** | Inter-Process Communication. In Tauri, the mechanism by which the React (WebView/JS) frontend invokes Rust backend functions (`commands`) and receives typed responses. |
| **JVM** | Java Virtual Machine. Not invoked anywhere in V1 (no compilation/execution) — mentioned for scope clarity only. |
| **Canvas Node / `CanvasNode`** | A single node in the JSON UI tree representing one Swing component instance (see §4, FR-1). |
| **Codegen** | Shorthand for the Code Generator Engine (FR-3). |
| **Store** | The Zustand global state container holding the canvas tree and derived state. |
| **WebView** | The OS-native browser engine embedded by Tauri that renders the React frontend (WKWebView on macOS, WebView2 on Windows, WebKitGTK on Linux). |
| **Rust command** | A `#[tauri::command]`-annotated Rust function callable from the frontend via `invoke()`. |
| **P0 / P1 / P2** | Requirement priority: P0 = mandatory for V1 acceptance, P1 = should-have, P2 = deferrable. |
| **SHALL / SHOULD / MAY** | Per IEEE 830 convention: SHALL = mandatory, SHOULD = strongly recommended, MAY = optional. |

### 1.4 References

- JForge PRD v1.0 (companion document; source of product goals, personas, and phase breakdown).
- Tauri IPC documentation (`invoke`, `#[tauri::command]`, `tauri-plugin-dialog`, `tauri-plugin-fs`).
- `@monaco-editor/react` API (controlled `value`/`onChange`, `options.readOnly`, `beforeMount`/`onMount`).
- `@dnd-kit/core` API (`DndContext`, `useDraggable`, `useDroppable`, `onDragStart`/`onDragEnd`/`onDragOver`).

---

## 2. Overall Description

### 2.1 System Environment

JForge is a two-process-model desktop application, per the standard Tauri architecture:

```
┌───────────────────────────────┐        IPC (invoke/emit,        ┌──────────────────────────────┐
│      Rust Backend (Tauri)     │◀──────  JSON-serialized  ──────▶│   React Frontend (WebView)    │
│                                │        arguments/returns)        │                                │
│  - Owns ALL OS-level access:  │                                   │  - Owns ALL application state │
│    file read/write, native    │                                   │    (Zustand store)             │
│    dialogs, window mgmt       │                                   │  - Owns ALL UI rendering       │
│  - NO business logic          │                                   │    (Canvas, Palette, Inspector,│
│  - NO knowledge of the        │                                   │    Monaco)                     │
│    CanvasNode schema          │                                   │  - Owns the Code Generator      │
│                                │                                   │    (pure TS functions)          │
└───────────────────────────────┘                                   └──────────────────────────────┘
```

**Division of responsibility (strict):**
- **The Rust backend is a dumb I/O layer.** It SHALL NOT contain any logic that understands the shape of a `CanvasNode`, the Component Registry, or Java syntax. It exposes generic file-system commands (open dialog, read file, write file, read/write app-config) and nothing more.
- **The React frontend owns 100% of the domain logic** — the tree, the code generation, the UI. This separation exists so that an AI assistant working on codegen or canvas logic never needs to touch or reason about Rust, and vice versa.
- The WebView renders the entire UI; Tauri's native shell provides only the window chrome, menu bar (if any), and OS integration.

### 2.2 Design and Implementation Constraints

These constraints are **binding** on every implementation phase and SHALL be enforced in code review / AI-assistant self-checks:

- **[CON-1]** All canvas/tree/selection/generated-code state SHALL live exclusively in a single Zustand store (`useBuilderStore`). React Context SHALL NOT be used for this state, to avoid the re-render fan-out and lag that Context's provider-tree subscription model causes on high-frequency updates (drag move events, property edits). Context MAY be used only for static, rarely-changing concerns unrelated to canvas state (e.g., a theme toggle), if introduced later.
- **[CON-2]** Zustand selectors SHALL be used at the component level (e.g., `useBuilderStore(s => s.tree)`, not `useBuilderStore()` destructured wholesale) so that unrelated state changes (e.g., editing a property) do not force full re-renders of components that don't depend on that slice (e.g., the Palette).
- **[CON-3]** The Code Generator (FR-3) SHALL be implemented as pure functions with no dependency on React, Zustand, or the DOM, located in a standalone module (e.g., `src/codegen/`) so it is independently unit-testable and independently assignable to an AI coding task.
- **[CON-4]** The Component Registry (FR-1.2) SHALL be the single source of truth for: palette entries, default properties, the property schema shown in the Inspector, and the codegen template for each component type. No component-type-specific `if`/`switch` branching SHALL be duplicated across the Palette, Inspector, and Codegen modules — all three SHALL read from the registry.
- **[CON-5]** All Tauri IPC commands SHALL accept and return only JSON-serializable, explicitly typed payloads (see §3.2). Passing untyped `any`/`unknown` across the IPC boundary is prohibited.
- **[CON-6]** The Monaco editor instance SHALL be configured `readOnly: true` in V1 and SHALL NOT have its `onChange` wired to mutate the Zustand store (no round-tripping — see PRD Non-Goals).
- **[CON-7]** Drag-and-drop state (active drag item, drop target hover) SHALL be kept local to the DnD layer (component-local `useState` or `@dnd-kit`'s own context) and SHALL NOT be mirrored into the Zustand store — only the *result* of a completed drop (a committed tree mutation) touches the store.
- **[CON-8]** Target runtime: Tauri v2.x, React 18+, Node 18+ for the build toolchain. No server-side component; the application SHALL function fully offline.

### 2.3 Assumptions

- A single logical "project" = one in-memory tree rooted at one `JFrame`, for the duration of a session (see FR-1).
- "Saving" in V1 means either (a) exporting the generated Java text to a `.java` file, and/or (b) persisting the JSON tree itself as a project-state file for reload — these are two distinct IPC operations (§3.2).

---

## 3. External Interface Requirements

### 3.1 User Interfaces

- **[UI-1]** The application window SHALL render a single-page layout divided into four regions: Palette (fixed-width left sidebar, 200–280px), Canvas (flexible center, minimum 400px), Property Inspector (fixed-width right-of-canvas, 260–320px), and Code Editor (flexible right pane). Canvas and Code Editor SHALL be separated by a user-draggable horizontal split handle.
- **[UI-2]** The Palette, Canvas, and Property Inspector regions SHALL be rendered entirely with React + Tailwind CSS components (no Swing/Java rendering at any point — the Canvas is an HTML/CSS approximation, per PRD §7.3).
- **[UI-3]** Monaco integration specifics:
  - Instantiated via `@monaco-editor/react`'s `<Editor />` component.
  - `language="java"` (using Monaco's built-in Java tokenizer; a custom `monaco.languages.register` grammar is NOT required for V1).
  - `options.readOnly = true`, `options.domReadOnly = true`.
  - `value` prop SHALL be bound to `store.generatedCode` (a controlled, one-directional binding — Monaco never calls back into the store).
  - `theme`: a single fixed theme for V1 (e.g., `vs-dark`); user-selectable themes are out of scope.
  - A non-blocking banner/badge SHALL be rendered above or over the editor stating the content is generated and read-only (satisfies PRD FR-5.3).
- **[UI-4]** Selecting a component on the Canvas SHOULD scroll the Monaco viewport to and highlight (via Monaco decorations) the line range corresponding to that component's generated code, using a line-map produced alongside the generated string by the Code Generator (see FR-3.4). This is a P1 requirement — acceptable to ship V1 without it if timeline requires, per PRD FR-5.5.

### 3.2 Software Interfaces — Tauri IPC Contracts

All commands below are `#[tauri::command]` functions in Rust, invoked from React via `@tauri-apps/api/core`'s `invoke()`. Every payload is JSON; TypeScript types on the frontend SHALL mirror the Rust struct shapes exactly.

#### IPC-1: `save_java_file`
Exports generated Java source text to disk.

```ts
// Frontend call site
interface SaveJavaFileRequest {
  suggestedFileName: string;   // e.g. "GeneratedForm.java"
  content: string;             // the full generated Java source
}
interface SaveJavaFileResponse {
  success: boolean;
  filePath: string | null;     // absolute path if saved, null if user cancelled the dialog
  error: string | null;
}

const result: SaveJavaFileResponse = await invoke("save_java_file", {
  request: { suggestedFileName, content } as SaveJavaFileRequest
});
```
```rust
// Backend (Rust) — signature contract, using tauri-plugin-dialog + tauri-plugin-fs
#[tauri::command]
async fn save_java_file(request: SaveJavaFileRequest) -> Result<SaveJavaFileResponse, String>;
```
- **[IPC-1.1]** The command SHALL open a native "Save As" dialog defaulting to `suggestedFileName`, filtered to `.java` files.
- **[IPC-1.2]** If the user cancels the dialog, the command SHALL return `{ success: false, filePath: null, error: null }` — this is NOT an error condition.
- **[IPC-1.3]** On write failure (permissions, disk full, etc.), the command SHALL return `{ success: false, filePath: null, error: "<message>" }`.

#### IPC-2: `save_project_state`
Persists the raw `CanvasNode` JSON tree (not the generated Java) so a session can be resumed. **This is a P1 capability** — V1 acceptance does not strictly require persistence across app restarts, but the IPC contract SHALL be defined now so Phase 5 (PRD §9) can implement it without touching the Rust layer's shape.

```ts
interface SaveProjectStateRequest {
  suggestedFileName: string;   // e.g. "MyForm.jforge.json"
  projectState: BuilderPersistedState; // see §4 FR-1.4
}
interface SaveProjectStateResponse {
  success: boolean;
  filePath: string | null;
  error: string | null;
}
```
- **[IPC-2.1]** The Rust command SHALL serialize `projectState` verbatim (it does not interpret or validate the tree's internal shape — that is a frontend responsibility, per §2.1's separation of concerns).

#### IPC-3: `load_project_state`
```ts
interface LoadProjectStateResponse {
  success: boolean;
  projectState: BuilderPersistedState | null;
  error: string | null;
}
```
- **[IPC-3.1]** The command SHALL open a native "Open" dialog filtered to `.json`/`.jforge.json`, read the file, and return its parsed JSON content typed as `BuilderPersistedState`.
- **[IPC-3.2]** If the file is not valid JSON, the command SHALL return `{ success: false, projectState: null, error: "<parse error message>" }`. **Schema validation** (i.e., confirming the JSON actually matches `BuilderPersistedState`) SHALL happen on the **frontend** after receiving the parsed JSON, not in Rust (per CON-1/§2.1 — Rust stays domain-agnostic).

#### IPC-4: `get_app_config` / `set_app_config`
Used for persisting non-project preferences (split-pane ratio, window size) per PRD FR-1.3.
```ts
interface AppConfig {
  splitPaneRatio: number;       // 0.0–1.0, builder-vs-editor width ratio
  windowWidth: number;
  windowHeight: number;
}
```
- **[IPC-4.1]** `get_app_config(): Promise<AppConfig>` SHALL return sensible defaults (`splitPaneRatio: 0.55`, a reasonable default window size) if no config file exists yet.
- **[IPC-4.2]** `set_app_config(config: AppConfig): Promise<void>` SHALL write the config to the Tauri app-data directory (e.g., via `tauri-plugin-store` or a plain JSON file managed by `tauri-plugin-fs`).

---

## 4. System Features & Functional Requirements

### FR-1: Zustand JSON Canvas Tree

#### FR-1.1 — Data Model (TypeScript, authoritative)

```ts
/** A single property value on a component instance. */
type PropertyValue = string | number | boolean;

/** Describes the editable, type-tagged properties of one component instance. */
interface ElementProperties {
  [propKey: string]: PropertyValue;
}

/** Absolute-position layout data for a node under a null-layout parent. */
interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single node in the canvas tree — one Swing component instance. */
interface CanvasNode {
  id: string;                    // unique, e.g. nanoid(10)
  type: string;                  // MUST match a key in the Component Registry, e.g. "JButton"
  varName: string;               // stable generated Java variable name, e.g. "jButton1"
  props: ElementProperties;      // values conforming to that type's PropertySchema (FR-1.3)
  layout: LayoutBounds | null;   // null for the JFrame root; required for all other node types in V1
  children: CanvasNode[];        // empty array for non-container types (leaf components)
}

/** Root-level store shape held in Zustand. */
interface BuilderState {
  rootId: string | null;
  tree: CanvasNode | null;
  selectedComponentId: string | null;
  generatedCode: string;
  codeLineMap: Record<string, { startLine: number; endLine: number }>; // nodeId -> generated-code line range (FR-3.4)

  // Actions (see FR-1.5 for exact mutation contracts)
  addComponent: (parentId: string, type: string, layout?: Partial<LayoutBounds>) => string; // returns new node id
  updateComponentProp: (id: string, key: string, value: PropertyValue) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  resizeComponent: (id: string, width: number, height: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  loadTree: (tree: CanvasNode, rootId: string) => void; // used by IPC-3 load flow
}

/** Shape persisted to disk via IPC-2/IPC-3 — a strict subset of BuilderState. */
interface BuilderPersistedState {
  schemaVersion: 1;               // SHALL be incremented on any breaking change to CanvasNode
  rootId: string;
  tree: CanvasNode;
}
```

#### FR-1.2 — Component Registry (TypeScript, authoritative)

```ts
type PropertyType = "string" | "number" | "boolean" | "color";

interface PropertySchemaEntry {
  key: string;                 // matches a key that will appear in ElementProperties
  label: string;               // human-readable label shown in the Inspector
  type: PropertyType;
}

interface ComponentRegistryEntry {
  type: string;                       // e.g. "JButton" — matches CanvasNode.type
  label: string;                      // palette display label, e.g. "Button"
  icon: string;                       // icon identifier (e.g. a lucide-react icon name)
  isContainer: boolean;               // true for JFrame, JPanel — determines droppable behavior
  defaultProps: ElementProperties;    // seeded into props when a new instance is created
  defaultLayout: LayoutBounds | null; // seeded into layout when a new instance is created (null only for JFrame)
  propertySchema: PropertySchemaEntry[];
  javaImport: string;                 // fully-qualified import, e.g. "javax.swing.JButton"
  codeTemplate: (node: CanvasNode) => string; // returns the Java instantiation/config statements for this node (see FR-3)
}

// The full V1 registry SHALL contain exactly these 7 entries:
// "JFrame" (isContainer: true, single-instance-only — see FR-1.6),
// "JPanel" (isContainer: true),
// "JButton", "JLabel", "JTextField", "JTextArea", "JCheckBox" (isContainer: false)
type ComponentRegistry = Record<string, ComponentRegistryEntry>;
```

- **[FR-1.2.1]** The registry SHALL be defined in exactly one module (`src/registry/componentRegistry.ts`) and imported by the Palette, Property Inspector, and Code Generator modules — no component-type logic SHALL be duplicated elsewhere (restates CON-4 as a testable requirement).

#### FR-1.3 — Property Schema Requirements
- **[FR-1.3.1]** Every entry in a `ComponentRegistryEntry.propertySchema` array SHALL have a corresponding key present in that type's `defaultProps`.
- **[FR-1.3.2]** The Property Inspector SHALL render exactly one input control per `propertySchema` entry, using the mapping: `"string"` → text input, `"number"` → numeric input, `"boolean"` → checkbox, `"color"` → color picker (hex value).

#### FR-1.4 — Persistence Shape
- **[FR-1.4.1]** `BuilderPersistedState.schemaVersion` SHALL be checked on load (IPC-3 flow); if the loaded file's `schemaVersion` does not match the application's current expected version, the frontend SHALL reject the load and surface an error rather than attempting a best-effort parse.

#### FR-1.5 — Store Action Mutation Contracts
- **[FR-1.5.1]** `addComponent(parentId, type, layout?)` SHALL: (a) reject with a no-op if `parentId` does not resolve to an existing node with `isContainer: true` in the registry; (b) generate a new `id`; (c) compute `varName` as `${lowerFirst(type)}${N}` where `N` is a monotonically increasing counter scoped to that `type` across the whole tree (never reused, even after deletion — see FR-1.5.4); (d) seed `props` and `layout` from the registry's `defaultProps`/`defaultLayout`, overridden by any provided `layout` argument; (e) immutably append the new node to `parentId`'s `children`; (f) set `selectedComponentId` to the new node's id; (g) return the new node's id.
- **[FR-1.5.2]** `updateComponentProp(id, key, value)` SHALL be a no-op (with a dev-mode console warning) if `key` is not present in that node type's `propertySchema`, to prevent silently introducing untracked properties.
- **[FR-1.5.3]** `removeComponent(id)` SHALL remove the target node and its entire `children` subtree. If `id === rootId`, the entire tree SHALL be cleared (`rootId: null, tree: null`).
- **[FR-1.5.4]** The `varName` counter state (per type) SHALL persist for the lifetime of the session even across deletions — i.e., deleting `jButton1` and adding a new button SHALL produce `jButton2`, not a reused `jButton1`. This guarantees `varName` stability referenced in codegen (FR-3.3) and prevents confusing diffs in the generated code.
- **[FR-1.5.5]** All actions SHALL perform immutable updates (new object/array references for every node on the path from root to the mutated node) so that Zustand's shallow-equality subscribers correctly detect changes. Direct mutation of nested `props`/`children` objects is prohibited.

#### FR-1.6 — Root Uniqueness Constraint
- **[FR-1.6.1]** The system SHALL allow at most one `JFrame`-type node to exist in the tree, and it SHALL always be the root (`id === rootId`). `addComponent` SHALL reject attempts to add a `JFrame` type when `rootId` is already set.

---

### FR-2: Drag-and-Drop Engine

#### FR-2.1 — DnD Context Structure
- **[FR-2.1.1]** A single top-level `<DndContext>` (from `@dnd-kit/core`) SHALL wrap both the Palette and Canvas regions.
- **[FR-2.1.2]** Each Palette entry SHALL be a `useDraggable` source with `id` equal to a synthetic value encoding intent, e.g. `palette:JButton` — distinguishing "new component from palette" drags from "reposition existing component" drags (§FR-2.3).
- **[FR-2.1.3]** Each container node rendered on the Canvas (the `JFrame` root surface and any `JPanel` instance) SHALL be a `useDroppable` target with `id` equal to that node's `CanvasNode.id`.

#### FR-2.2 — New-Component Drop (Palette → Canvas)
- **[FR-2.2.1]** On `onDragEnd`, if `active.id` starts with `"palette:"` and `over.id` resolves to a droppable container node, the handler SHALL extract the `type` from `active.id`, compute the drop-relative `(x, y)` coordinates from the pointer delta relative to the container's bounding rect, and call `store.addComponent(over.id, type, { x, y })`.
- **[FR-2.2.2]** If `onDragEnd` fires with `over === null` (dropped outside any droppable), the operation SHALL be a no-op — no component is created.

#### FR-2.3 — Reposition Drag (Existing Canvas Component)
- **[FR-2.3.1]** Each rendered `CanvasNode` on the Canvas (except the root) SHALL simultaneously register as a `useDraggable` source with `id` equal to its own `CanvasNode.id` (no `"palette:"` prefix) to distinguish it from new-component drags per FR-2.1.2.
- **[FR-2.3.2]** On `onDragEnd` for a component-reposition drag, the handler SHALL call `store.moveComponent(active.id, newX, newY)`, where `newX`/`newY` are the node's original `layout.x/y` plus the drag delta (`event.delta.x`, `event.delta.y`) from `@dnd-kit`'s event payload.
- **[FR-2.3.3]** `onDragStart` SHALL set a local (component-level, non-Zustand — per CON-7) "is dragging" flag used only for visual feedback (e.g., reduced opacity of the dragged element); this flag SHALL be cleared on `onDragEnd` regardless of outcome.

#### FR-2.4 — Resize Interaction
- **[FR-2.4.1]** Each selected, non-root `CanvasNode` SHALL render resize handles (corner and/or edge) implemented as separate small `useDraggable` sources; their `onDragEnd` SHALL call `store.resizeComponent(id, newWidth, newHeight)` computed from the handle's drag delta applied to the original `layout.width/height`, clamped to a minimum of `(20, 20)`.

---

### FR-3: Real-Time Code Generator

#### FR-3.1 — Function Signature and Purity
```ts
interface CodegenResult {
  code: string;
  lineMap: Record<string /* nodeId */, { startLine: number; endLine: number }>;
}

/** Pure function: no I/O, no React/Zustand dependency, deterministic for a given tree. */
function generateJavaCode(tree: CanvasNode, registry: ComponentRegistry): CodegenResult;
```
- **[FR-3.1.1]** `generateJavaCode` SHALL be a pure function: identical `tree` + `registry` input SHALL always produce byte-identical `CodegenResult` output. It SHALL NOT read from or write to any global/module-level mutable state.
- **[FR-3.1.2]** `generateJavaCode` SHALL be located in `src/codegen/generateJavaCode.ts` with zero imports from `src/store/`, `src/components/`, or any React package (enforced constraint, testable via a lint rule or import-boundary check — see NFR-Maintainability).

#### FR-3.2 — Generation Algorithm (Logic Mapping)
For a given tree, the generator SHALL:
1. Perform a depth-first traversal of `tree.children` (recursively), skipping the root's own instantiation step until step 4.
2. For each visited `CanvasNode`, look up its `ComponentRegistryEntry` by `node.type` in the registry and invoke `entry.codeTemplate(node)` to obtain that node's instantiation/configuration statement(s) (e.g., a `CanvasNode` of `type: "JButton"` with `props.text === "Submit"` maps, via its registry's `codeTemplate`, to a string block instantiating `new JButton("Submit")` plus any non-default property setters such as `.setEnabled(false)` when `props.enabled !== true`).
3. After a container node's own instantiation statement, recursively emit its children's statements, followed by one `parentVarName.add(childVarName);` call per direct child, in the order children appear in the `children` array.
4. Assemble the final output as: license-free header comment (optional) → `import` statements (deduplicated, one per distinct `javaImport` used in the tree, plus the fixed `javax.swing.*`/`java.awt.*` if any component requires AWT types such as `Color`) → `public class GeneratedForm { public static void main(String[] args) { ... } }` wrapping the full statement sequence → `frame.setVisible(true);` as the final statement.
5. While emitting each node's statement block, record the 1-indexed starting and ending line numbers into `lineMap[node.id]` for FR-3.4/UI-4.

#### FR-3.3 — Variable Naming Stability
- **[FR-3.3.1]** The generator SHALL use `node.varName` exactly as stored on the node (never recomputed at generation time) — variable-name assignment is exclusively the responsibility of `addComponent` (FR-1.5.1), guaranteeing that unrelated store mutations do not produce spurious variable-name diffs in the generated code between renders.

#### FR-3.4 — Regeneration Trigger and Editor Sync
- **[FR-3.4.1]** A Zustand subscription (e.g., a `useEffect` subscribed to `store.tree` via a selector, or a `subscribe()` call outside React) SHALL invoke `generateJavaCode` on every tree mutation and write the result into `store.generatedCode` / `store.codeLineMap` via a dedicated internal action (e.g., `_setGeneratedCode`), which SHALL NOT be exposed as a user-facing store action.
- **[FR-3.4.2]** The Monaco-binding component SHALL pass `store.generatedCode` as the controlled `value` prop; it SHALL NOT call the Monaco model's imperative `setValue()` directly from arbitrary event handlers — the one-way binding through props is the only permitted update path (reinforces CON-6).

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance

- **[NFR-PERF-1]** The system SHALL complete a full `addComponent`/`updateComponentProp`/`moveComponent`/`removeComponent` → `generateJavaCode` → Monaco re-render cycle within **100ms (p95)** for trees of up to 50 nodes, measured from the triggering DOM event to the Monaco `value` prop update.
- **[NFR-PERF-2]** During an active reposition or resize drag (FR-2.3/FR-2.4), the Canvas SHALL visually track the pointer at a minimum of **30fps**; the Zustand store SHALL NOT be mutated on every intermediate `onDragMove` frame — only on `onDragEnd` (per CON-7) — to keep drag interaction smooth and avoid triggering repeated full-tree codegen mid-drag.
- **[NFR-PERF-3]** The Monaco editor instance SHALL NOT freeze, drop keystrokes (n/a in read-only mode, but SHALL NOT block the render thread), or exhibit visible jank when `store.generatedCode` updates in rapid succession (e.g., 10 property edits within 2 seconds) — verified by a manual/scripted stress test performing 10 rapid `updateComponentProp` calls and confirming the UI thread remains responsive (no dropped frames > 200ms).
- **[NFR-PERF-4]** Application cold-start time (process launch to interactive UI) SHALL NOT exceed **2 seconds** on reference hardware (a mid-range 2023+ laptop), reflecting the PRD's "lightweight" goal relative to a JVM-based IDE.

### 5.2 Maintainability

- **[NFR-MAINT-1]** The repository SHALL follow this top-level structure:
```
src/
  components/        # Palette, Canvas, Inspector, SplitPane, MonacoPanel (React, presentational + container components)
  store/              # Zustand store definition, actions (useBuilderStore.ts)
  registry/           # componentRegistry.ts — the single Component Registry
  codegen/            # generateJavaCode.ts and any codegen helper modules — NO React/Zustand imports permitted
  ipc/                # thin typed wrappers around invoke() calls for each Tauri command (§3.2)
  types/              # shared TypeScript interfaces (CanvasNode, BuilderState, etc.) if not colocated
src-tauri/
  src/                # Rust commands (file I/O, dialogs) — no domain logic
```
- **[NFR-MAINT-2]** No file under `src/codegen/` SHALL import from `react`, `zustand`, or any file under `src/components/` (import-boundary rule, restates FR-3.1.2 as a project-wide constraint applicable to all future codegen-adjacent modules).
- **[NFR-MAINT-3]** Every `ComponentRegistryEntry` SHALL be added by editing exactly one file (`componentRegistry.ts`) — no PR/AI-generated change that adds a new Swing component type SHALL need to touch the Palette, Inspector, or Codegen module files (validates CON-4/FR-1.2.1 as an ongoing acceptance check for future component additions).
- **[NFR-MAINT-4]** Each Zustand action (FR-1.5) SHALL have at least one corresponding unit test asserting its exact mutation contract, independent of any UI rendering.

### 5.3 Reliability

- **[NFR-REL-1]** A malformed or schema-mismatched project-state file loaded via IPC-3 SHALL NOT crash the application; the frontend SHALL catch the validation failure (FR-1.4.1) and present a non-blocking error notification, leaving the current in-memory tree (if any) unchanged.
- **[NFR-REL-2]** A thrown exception inside `generateJavaCode` SHALL be caught by an error boundary around the Codegen-subscription effect (FR-3.4.1) such that a Codegen bug degrades to a stale/frozen code panel rather than crashing the entire application (restates PRD §9 Phase 5 hardening requirement as a testable NFR).

### 5.4 Usability

- **[NFR-USE-1]** The read-only state of the Monaco editor SHALL be visually indicated at all times the editor has content (UI-3), so a user does not mistake it for an editable surface.
- **[NFR-USE-2]** Every property input in the Inspector (FR-1.3.2) SHALL reflect the currently selected node's live value on every render — there SHALL be no stale/cached display when switching selection between two different nodes of the same type.

---

## 6. Acceptance Criteria Summary (P0 Requirements Only)

| Req ID | Acceptance Criterion |
|---|---|
| FR-1.5.1 | Dragging each of the 6 non-root palette types onto the canvas root creates a node with correct `defaultProps`/`defaultLayout` and an incrementing, type-scoped `varName`. |
| FR-1.6.1 | Attempting to add a second `JFrame` (via any code path) is rejected with no store mutation. |
| FR-2.2.1 | A palette-to-canvas drop of `JButton` results in exactly one new `CanvasNode` of `type: "JButton"` as a child of the drop-target container. |
| FR-2.3.2 | Dragging an existing canvas component updates its `layout.x/y` by exactly the drag delta, with no change to any other node. |
| FR-3.1.1 | Calling `generateJavaCode` twice with the identical tree object produces identical output strings (byte-for-byte). |
| FR-3.3.1 | Editing an unrelated property on node A does not change node B's `varName` or its position in the generated code's variable declarations. |
| NFR-PERF-1 | Automated/manual timing of the mutation→codegen→render cycle on a 50-node tree stays under 100ms at p95 across 20 sampled interactions. |
| IPC-1.2 | Cancelling the native save dialog returns `success: false, error: null` — no exception is thrown or surfaced to the user as an error. |

---

## 7. Open Items Carried from PRD

The following PRD open questions (§11) have direct SRS implications and SHALL be resolved before Phase 3 implementation begins, as they affect FR-1.2/FR-1.3 (Inspector `varName` editability) and UI-1 (Inspector panel behavior):
1. Whether `varName` becomes user-editable (would require an additional `renameComponent` store action and uniqueness validation not currently specified in FR-1.5).
2. Exact Inspector panel layout mode (fixed column vs. collapsible overlay) — affects UI-1's split-pane region definitions.

---

*End of SRS — implement per PRD §9 phase breakdown; each Functional Requirement group (FR-1, FR-2, FR-3) maps directly to PRD Phases 2, 3, and 4 respectively.*
