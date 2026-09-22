# Product Requirements Document
## Project: "JForge" — A Modern Web-Native Java IDE & GUI Builder

| | |
|---|---|
| **Author** | Senior Technical PM / Lead System Architect (drafted with Claude) |
| **Date** | September 22, 2026 |
| **Version** | 1.0 (V1 / MVP Scope) |
| **Status** | Draft — for AI-assisted incremental implementation |

> **Note on naming:** "JForge" is a placeholder working name used throughout this document so requirements can be referenced unambiguously. Replace it with your actual project name before use.

---

## 1. Executive Summary

Apache NetBeans popularized a workflow that an entire generation of Java developers still relies on: drag a `JButton` from a palette onto a canvas, tweak its properties in an inspector, and watch matching Swing code appear automatically. That workflow is powerful but the tooling around it — a 20+ year old Swing-based IDE — is heavy, dated, and difficult to extend or theme.

**JForge** re-implements the *core value proposition* of the NetBeans GUI Builder ("Matisse") as a modern, lightweight desktop application, using a Tauri (Rust) shell around a React/Vite frontend instead of a monolithic Swing/NetBeans Platform codebase. The product's big bet is that **a strictly unidirectional, JSON-first state architecture** — UI structure lives as data in a Zustand store, and the Monaco-rendered Java source is a *pure function* of that data — will make the codebase dramatically easier to build, test, and extend than the tightly-coupled, mutation-heavy architecture of legacy GUI builders.

This architectural choice is not just a technical preference — it is what makes the project **AI-friendly by design**. Because the "vibe coding" development approach means large portions of this codebase will be generated incrementally by an AI coding assistant working in bounded context windows, JForge's architecture must be modular enough that each module can be built, reasoned about, and verified in isolation.

**V1 / MVP scope** is deliberately narrow: a split-pane workspace with a drag-and-drop visual builder on the left and a live, read-mirrored Monaco code editor on the right, wired together by a one-way JSON → Java Swing code generation engine. Compiling, running, or round-tripping hand-edited code back into the visual tree is explicitly **out of scope** for V1 (see Non-Goals).

---

## 2. Problem Statement

**The pain:** Building Swing UIs by hand is tedious and error-prone (manual `GridBagConstraints`, layout math, boilerplate `add()` calls). NetBeans solved this over a decade ago, but its solution is now bundled inside a large, aging IDE that:
- Has a dated UI toolkit (Swing-on-Swing) that feels inconsistent with modern developer tooling expectations (VS Code-style editors, fast startup, low memory footprint).
- Is difficult to extend, theme, or embed into other workflows because its plugin architecture (NetBeans Platform / Lookup API) is heavyweight and Java-specific.
- Was not designed with AI-assisted, incremental development in mind — its module system predates "generate this feature in isolation" workflows.

**Why now:** The web-technology desktop stack (Tauri + React + Monaco) has matured to the point where it can deliver native-feeling performance with a fraction of the resource footprint of a JVM-based IDE, while being dramatically more approachable to build and extend — especially important when much of the build-out will be AI-assisted rather than hand-written line by line.

**The opportunity:** A student, hobbyist, or educator who wants the classic "drag, drop, see the Swing code" experience without installing a multi-gigabyte legacy IDE, and a solo/small-team developer (you) who wants to prove out a genuinely novel IDE architecture that can be extended module-by-module using AI pair-programming.

---

## 3. Goals & Objectives

| Goal | Success Signal (3–6 months) |
|---|---|
| **G1 — Prove the JSON→Code architecture** | The Zustand JSON tree can represent a non-trivial Swing form (JFrame with 5+ nested components, mixed layouts) and generate compilable Java Swing source with zero manual patching. |
| **G2 — Deliver a usable drag-and-drop builder loop** | A user can drag ≥6 core Swing components onto a canvas, reposition/nest them, edit properties, and see the Monaco editor update in real time (<100ms perceived latency). |
| **G3 — Keep the codebase AI-buildable in slices** | Each of the 5 development phases (Section 8) can be handed to an AI coding assistant as a self-contained prompt and produce working, testable output without needing the full codebase in context. |
| **G4 — Establish the extensibility foundation** | The component palette, code generator, and property schema are all data-driven (config/registry-based) rather than hardcoded, so V2 features (compiler, more components, other languages) can be added without rearchitecting. |

---

## 4. Non-Goals (Out of Scope for V1)

Explicitly **not** building in this phase:
- ❌ **Compiling or running the generated Java code.** No JDK invocation, no `javac`/`java` process spawning, no console output panel.
- ❌ **Round-tripping**: parsing hand-edited Monaco code back into the JSON tree. V1 is **one-way** (JSON → Code). The Monaco editor is effectively **read-only / generated-output** in V1 (see Section 6.3 for the exact interaction model).
- ❌ **Custom Mini-Java Compiler** — explicitly deferred to a future phase per project context. Noted here only so it isn't accidentally scoped into V1 work.
- ❌ Multi-file / multi-form projects (V1 supports a single `JFrame` root form per session).
- ❌ Project save/load to disk, project templates, or file system project trees.
- ❌ Advanced layout managers beyond `null` (absolute/free-form) and `BorderLayout`/`FlowLayout` basics — `GridBagLayout` generation is a stretch goal, not a requirement.
- ❌ Theming/skinning system, plugin marketplace, or extension API surface (the *architecture* should allow this later; building it is out of scope now).
- ❌ Undo/redo history persistence across sessions, multi-user collaboration, or cloud sync.

---

## 5. Target Users & Personas

**Primary persona — "Sat, the CS Student / Vibe-Coder"**
- Comfortable with modern JS/TS tooling (React, Vite) and using AI assistants to generate code incrementally.
- Learning or teaching Java Swing in an academic context (object-oriented programming, computer organization coursework) and wants a fast, visual way to prototype GUI assignments.
- Values a lightweight, fast-starting tool over a feature-complete legacy IDE — willing to trade advanced features for a clean, hackable codebase they built/understand themselves.

**Secondary persona — "The Swing Hobbyist"**
- A developer who occasionally needs to throw together a quick Swing utility/tool UI and doesn't want to open a heavyweight IDE just to drag a few buttons onto a frame.

**Tertiary / architectural persona — "The AI Coding Assistant"**
- Not a human user, but a first-class *consumer* of this PRD and the codebase it describes. Every module, data model, and phase in this document is written to be independently understandable and buildable by an LLM-based coding agent working with limited context. This shapes Section 8 heavily.

---

## 6. System Architecture & Data Flow

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Shell (Rust)                        │
│   - Native window, menu bar, file-system access (future)         │
│   - No business logic in V1 — a thin native wrapper only         │
└─────────────────────────────────────────────────────────────────┘
                                │  WebView (renders the React app)
┌─────────────────────────────────────────────────────────────────┐
│                     React + Vite Frontend                        │
│                                                                   │
│  ┌───────────────┐   drag/drop    ┌─────────────────────────┐    │
│  │ Palette Panel │ ─────────────▶ │      Canvas Panel        │   │
│  │ (component    │                │  (renders tree from      │   │
│  │  registry)    │                │   Zustand as live DOM    │   │
│  └───────────────┘                │   preview + drop target) │   │
│                                    └────────────┬─────────────┘   │
│                                                  │ select/mutate   │
│                                                  ▼                 │
│                                    ┌─────────────────────────┐    │
│                                    │   Zustand UI Tree Store  │    │
│                                    │   (single source of      │    │
│                                    │    truth — pure JSON)    │    │
│                                    └────────────┬─────────────┘    │
│                       ┌──────────────────────────┤                │
│                       ▼                          ▼                │
│         ┌───────────────────────┐   ┌─────────────────────────┐   │
│         │  Property Inspector   │   │   Code Generator Engine  │   │
│         │  (reads/writes the    │   │   (pure function:        │   │
│         │   selected node)      │   │   JSON tree → Java string)│  │
│         └───────────────────────┘   └────────────┬─────────────┘   │
│                                                   ▼                 │
│                                     ┌─────────────────────────┐    │
│                                     │  Monaco Editor (Java)    │    │
│                                     │  read-only rendering of  │    │
│                                     │  generated source in V1  │    │
│                                     └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Core Architectural Principle: Unidirectional Data Flow

This is the single most important architectural rule in the project, and it must be preserved through every development phase:

```
User Interaction (drag / select / edit property)
        │
        ▼
Zustand Store Mutation  (the ONLY place state changes)
        │
        ▼
   ┌────┴─────┐
   ▼          ▼
Canvas     Code Generator
Re-render  (subscribes to store) → produces new Java string
   │          │
   ▼          ▼
 DOM        Monaco.setValue(newCode)
```

- **The Zustand store is the single source of truth.** Neither the Canvas nor the Monaco Editor ever mutate each other directly.
- **The Code Generator is a pure function**: `generateJavaCode(uiTree: ComponentNode) => string`. Given the same JSON tree, it always produces the same Java source. This purity is what makes it trivially unit-testable and safe for an AI assistant to implement/modify in isolation — it has no side effects and no hidden state.
- **Monaco is a projection, not an input, in V1.** The editor displays `store.generatedCode` and is configured read-only (or "soft read-only" with a visible banner) to prevent the false impression that hand edits will be preserved. This sidesteps the entire round-tripping/reconciliation problem, which is deliberately deferred (see Non-Goals).

### 6.3 Data Flow — Step by Step (e.g., "user drags a JButton onto the canvas")

1. `@dnd-kit/core` fires a drop event on the Canvas drop zone, carrying the dragged palette item's `componentType` ("JButton") and drop coordinates/target-parent-id.
2. The Canvas's drop handler calls a Zustand action: `addComponent(parentId, componentType, position)`.
3. The store action:
   a. Looks up the **default property set** for `componentType` from the **Component Registry** (Section 7.3).
   b. Generates a new unique `id` (e.g., `nanoid()`).
   c. Immutably inserts a new node into the `children` array of the `parentId` node.
   d. Sets `selectedComponentId` to the new node's id.
4. Zustand notifies all subscribed components:
   - **Canvas** re-renders, now showing the new button at its position.
   - **Property Inspector** re-renders, now showing the new button's editable properties (since `selectedComponentId` changed).
   - **Code Generator** (subscribed via a `useEffect`/selector on the whole tree) re-runs `generateJavaCode(tree)` and writes the result into `store.generatedCode`.
5. A Monaco-binding component subscribes to `store.generatedCode` and calls the Monaco model's `setValue()` (or an incremental edit for smoother scrolling/cursor preservation — see Phase 4 notes) to reflect the new source.

Editing a property (e.g., changing button text in the Inspector) follows the identical path from step 3 onward — it's a store mutation, not a special case.

---

## 7. Functional Requirements

Requirements use **P0 (must-have for V1)** / **P1 (should-have, do if time allows)** / **P2 (nice-to-have, explicitly deferrable)** priority.

### 7.1 Split Pane Layout — P0
- **FR-1.1 (P0):** App renders a two-pane horizontally resizable split layout on load: left pane = Visual Builder workspace, right pane = Monaco Code Editor.
- **FR-1.2 (P0):** Split ratio is adjustable via drag handle; a sensible default (e.g., 55% builder / 45% editor) is used on first launch.
- **FR-1.3 (P1):** Split ratio persists across app restarts (local Tauri app-config storage).

### 7.2 Sidebar Palette — P0
- **FR-2.1 (P0):** A vertical sidebar lists draggable component "chips," each representing a Swing component type. V1 palette must include at minimum: `JFrame` (root only, not draggable after one exists), `JPanel`, `JButton`, `JLabel`, `JTextField`, `JTextArea`, `JCheckBox`.
- **FR-2.2 (P0):** Each palette entry is rendered from a **Component Registry** config object (Section 7.3.1), not hardcoded per-component — this is required for the architecture to be extensible and AI-buildable in isolated slices.
- **FR-2.3 (P1):** Palette entries show a small icon and label; hovering shows a tooltip with the Swing class name.
- **FR-2.4 (P0):** Only one `JFrame` root may exist per session; once placed, `JFrame` is removed from (or disabled in) the palette.

### 7.3 Canvas / Drop Zone — P0
- **FR-3.1 (P0):** The Canvas renders a live visual approximation of the current JSON tree — actual styled `<div>`/HTML elements standing in for Swing components (e.g., a styled `<button>` for `JButton`), not a Java rendering engine.
- **FR-3.2 (P0):** Components can be dropped onto the root `JFrame`/`JPanel` canvas area and onto any container-type component already on the canvas (i.e., nesting `JPanel` inside `JPanel` is supported).
- **FR-3.3 (P0):** Clicking a rendered component on the Canvas sets it as the `selectedComponentId` in the store and visually highlights it (selection outline/handles).
- **FR-3.4 (P0):** For components placed under a `null`-layout (absolute-position) parent, dragging repositions the component and updates its `x`/`y` in the store; a resize handle updates `width`/`height`.
- **FR-3.5 (P1):** Deleting the selected component (Delete key or context-menu) removes it and its children from the tree.
- **FR-3.6 (P2):** Basic support for `BorderLayout`/`FlowLayout` region drop targets (North/South/East/West/Center) for a parent panel configured with those layouts.

#### 7.3.1 Component Registry — the extensibility backbone
Every supported Swing component is described once, in a single registry file, with:
```ts
{
  type: "JButton",
  label: "Button",
  icon: "MousePointerClick",
  isContainer: false,
  defaultProps: { text: "Button", x: 20, y: 20, width: 100, height: 30 },
  propertySchema: [
    { key: "text", label: "Text", type: "string" },
    { key: "enabled", label: "Enabled", type: "boolean" },
    { key: "background", label: "Background", type: "color" }
  ],
  javaImport: "javax.swing.JButton",
  codeTemplate: (node) => `JButton ${node.varName} = new JButton("${node.props.text}");`
}
```
This registry is read by the **Palette** (7.2), the **Property Inspector** (7.4), and the **Code Generator** (7.5) — one definition drives three subsystems. Adding a new component type (e.g., `JComboBox`) in a future phase means adding one registry entry, not touching three separate hardcoded implementations. **This pattern is the key enabler for AI-assisted incremental development** — an AI assistant can be prompted to "add a JComboBox to the registry" as a fully isolated, low-context task.

### 7.4 Property Inspector — P0
- **FR-4.1 (P0):** When a component is selected, the Inspector renders one input control per entry in that component type's `propertySchema` (from the registry).
- **FR-4.2 (P0):** Editing a property value dispatches a store action `updateComponentProp(id, key, value)` and immediately reflects in the Canvas and generated code.
- **FR-4.3 (P0):** Supported property input types for V1: `string` (text input), `number` (numeric input, used for x/y/width/height/font size), `boolean` (checkbox/toggle), `color` (color picker producing a hex value mapped to `new Color(r,g,b)` in codegen).
- **FR-4.4 (P1):** Inspector shows a read-only "Component ID / Variable Name" field (auto-generated, e.g., `jButton1`) matching the variable name used in generated code.
- **FR-4.5 (P2):** Inline validation (e.g., width/height must be > 0).

### 7.5 Code Editor Sync (Code Generator Engine) — P0
- **FR-5.1 (P0):** `generateJavaCode(tree)` is a pure, side-effect-free function producing a complete, syntactically valid Java Swing class as a string, including package-less top-level class, imports, constructor, component instantiation/configuration, `add()` calls reflecting nesting/layout, and a `main` method that instantiates and shows the frame.
- **FR-5.2 (P0):** Regeneration is triggered by any store mutation to the component tree (add/remove/reposition/property change) and completes fast enough to feel real-time (<100ms for trees up to ~50 nodes).
- **FR-5.3 (P0):** Monaco Editor is configured with Java syntax highlighting (via Monaco's built-in `java` language or a lightweight custom tokenizer) and is **read-only in V1**, with a subtle UI indicator ("Generated — edit via the visual builder") explaining why.
- **FR-5.4 (P1):** Generated code uses one variable name per component, derived deterministically from type + an incrementing counter (e.g., `jButton1`, `jButton2`), stored on the node itself (`varName`) at creation time so names remain stable across regenerations (do not regenerate names from scratch every render, or unrelated diffs will appear in the editor on every edit).
- **FR-5.5 (P1):** Editor auto-scrolls/highlights the line(s) corresponding to the currently selected canvas component (best-effort; exact line mapping can be a simple lookup table produced alongside the generated string).
- **FR-5.6 (P2):** A "Copy code" / "Export .java file" button (file export can simply use Tauri's file-save dialog once available).

---

## 8. Data Models / Schema

### 8.1 The Zustand Store Shape

```ts
interface ComponentNode {
  id: string;                 // unique, e.g. nanoid()
  type: string;                // matches a Component Registry "type", e.g. "JButton"
  varName: string;             // stable generated variable name, e.g. "jButton1"
  props: Record<string, any>;  // values matching that type's propertySchema
  layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children: ComponentNode[];   // empty array for non-container types
}

interface BuilderState {
  rootId: string | null;             // id of the JFrame root, or null if not yet placed
  tree: ComponentNode | null;        // the full tree, rooted at rootId
  selectedComponentId: string | null;
  generatedCode: string;             // derived/cached output of generateJavaCode(tree)

  // actions
  addComponent: (parentId: string, type: string, position?: {x:number,y:number}) => void;
  updateComponentProp: (id: string, key: string, value: any) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  resizeComponent: (id: string, width: number, height: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
}
```

### 8.2 Example JSON Tree

A `JFrame` containing a `JPanel`, which itself contains a `JLabel` and a `JButton`:

```json
{
  "rootId": "n1",
  "tree": {
    "id": "n1",
    "type": "JFrame",
    "varName": "frame1",
    "props": { "title": "My Application", "width": 500, "height": 400 },
    "children": [
      {
        "id": "n2",
        "type": "JPanel",
        "varName": "jPanel1",
        "props": { "background": "#F0F0F0" },
        "layout": { "x": 0, "y": 0, "width": 500, "height": 400 },
        "children": [
          {
            "id": "n3",
            "type": "JLabel",
            "varName": "jLabel1",
            "props": { "text": "Enter your name:" },
            "layout": { "x": 20, "y": 20, "width": 160, "height": 25 },
            "children": []
          },
          {
            "id": "n4",
            "type": "JButton",
            "varName": "jButton1",
            "props": { "text": "Submit", "enabled": true, "background": "#4A90D9" },
            "layout": { "x": 20, "y": 60, "width": 100, "height": 30 },
            "children": []
          }
        ]
      }
    ]
  },
  "selectedComponentId": "n4"
}
```

### 8.3 Corresponding Generated Java (illustrative output of the Code Generator for the tree above)

```java
import javax.swing.*;
import java.awt.*;

public class GeneratedForm {
    public static void main(String[] args) {
        JFrame frame1 = new JFrame("My Application");
        frame1.setSize(500, 400);
        frame1.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        JPanel jPanel1 = new JPanel();
        jPanel1.setLayout(null);
        jPanel1.setBackground(new Color(0xF0F0F0));
        jPanel1.setBounds(0, 0, 500, 400);

        JLabel jLabel1 = new JLabel("Enter your name:");
        jLabel1.setBounds(20, 20, 160, 25);
        jPanel1.add(jLabel1);

        JButton jButton1 = new JButton("Submit");
        jButton1.setEnabled(true);
        jButton1.setBackground(new Color(0x4A90D9));
        jButton1.setBounds(20, 60, 100, 30);
        jPanel1.add(jButton1);

        frame1.add(jPanel1);
        frame1.setVisible(true);
    }
}
```

---

## 9. Development Phases (Milestones for Incremental AI-Assisted Build)

Each phase below is scoped to be handed to an AI coding assistant **as a standalone prompt**, with clear inputs, outputs, and a definition of done — so no single phase requires the assistant to hold the entire codebase in context.

### Phase 1 — Foundation & Shell
**Goal:** A running Tauri + React + Vite + Tailwind app with the static split-pane layout, no interactivity yet.
- Scaffold Tauri project with React/Vite/Tailwind template.
- Build the static three-region layout: Palette sidebar (left), Canvas area (center), Property Inspector (right-of-canvas or collapsible), Monaco Editor (right pane), using a resizable split (e.g., a simple flex-based divider or `react-resizable-panels`).
- Install and render an empty Monaco instance configured for Java syntax, read-only, with placeholder text.
- **Definition of Done:** App launches via `tauri dev`, shows all four regions with static/dummy content, and the split pane is manually resizable.

### Phase 2 — State Model & Component Registry (no UI wiring yet)
**Goal:** The data layer exists and is fully unit-testable before any drag-and-drop UI touches it.
- Implement the Zustand store exactly per the schema in Section 8.1, including all listed actions, operating on an in-memory tree via immutable updates (e.g., using `immer` middleware with Zustand for ergonomic nested updates).
- Implement the Component Registry (Section 7.3.1) as a single config file/module covering the V1 component set: `JFrame`, `JPanel`, `JButton`, `JLabel`, `JTextField`, `JTextArea`, `JCheckBox`.
- Write unit tests exercising `addComponent`, `updateComponentProp`, `removeComponent`, and `moveComponent` against the schema in Section 8.1/8.2.
- **Definition of Done:** Store actions can be called from a test script/console and produce correct tree mutations matching the example JSON in Section 8.2, with zero UI involved.

### Phase 3 — Drag-and-Drop Builder UI
**Goal:** The Palette and Canvas are wired to the store from Phase 2; visual building works end-to-end (still no code generation).
- Integrate `@dnd-kit/core`: draggable palette chips, droppable Canvas + droppable container components (for nesting).
- Canvas renders the tree recursively as real DOM elements, reflecting `layout.x/y/width/height` via absolute positioning for `null`-layout parents.
- Implement selection (click to select, visual highlight) and wire the Property Inspector to read/write the selected node's `props` via `propertySchema`-driven form controls (Section 7.4).
- Implement basic reposition/resize interactions on the Canvas (drag to move, handles to resize) calling `moveComponent`/`resizeComponent`.
- **Definition of Done:** A user can drag all 7 palette component types onto the canvas, nest a `JButton`/`JLabel` inside a `JPanel`, reposition/resize them, and edit their properties in the Inspector — all purely visual, no Java code yet.

### Phase 4 — Code Generator Engine & Monaco Sync
**Goal:** The one-way JSON → Java pipeline described in Section 6 is implemented and wired to Monaco.
- Implement `generateJavaCode(tree): string` as a pure function per FR-5.1, using each registry entry's `codeTemplate` and `javaImport` to assemble the class body, `add()` calls (respecting nesting order), and `main` method.
- Implement deterministic, stable `varName` assignment at component-creation time (FR-5.4) so regeneration doesn't rename existing components.
- Subscribe a Monaco-binding component to `store.generatedCode` and update the Monaco model on every store mutation, preserving scroll position/selection where possible (avoid full `setValue()` flicker if feasible; a straightforward `setValue()` is an acceptable fallback for V1).
- Add the "read-only / generated" banner and basic line-highlight-on-select behavior (FR-5.5, best-effort).
- **Definition of Done:** Every action performed in Phase 3's builder UI (add/move/resize/edit-property/delete) immediately produces correct, compilable-looking Java Swing source in the Monaco pane, matching the illustrative output in Section 8.3 for an equivalent tree.

### Phase 5 — Polish, Persistence-Lite & Hardening
**Goal:** Round out the MVP into something demo-ready and stable.
- Add delete/keyboard shortcuts, basic undo/redo (in-memory stack of tree snapshots is sufficient for V1 — no persistence required).
- Persist split-pane ratio and last-used window size via Tauri's app-config APIs (FR-1.3).
- Add "Copy code to clipboard" and/or "Export .java" using Tauri's save-dialog + filesystem APIs (FR-5.6).
- Edge-case hardening: empty canvas state, deleting a component with children, rapid successive drags (debounce/throttle code regeneration if performance requires it), and a basic error boundary around the Code Generator so a bug there can't crash the whole app.
- Manual QA pass against every P0 functional requirement in Section 7.
- **Definition of Done:** All P0 requirements in Section 7 are demonstrably working together in one continuous session (build a multi-component form, edit it, delete part of it, export the code) without console errors or visual glitches.

> **Future Phase (V2+, explicitly out of scope now):** Custom Mini-Java Compiler and/or bytecode execution sandbox to actually run the generated Swing app in-app; round-trip parsing of hand-edited Monaco code back into the JSON tree; `GridBagLayout` support; multi-form projects; project save/load to disk.

---

## 10. Assumptions & Risks

| # | Assumption / Risk | Mitigation |
|---|---|---|
| 1 | **Assumption:** A DOM-based Canvas rendering (styled `<div>`s) is a close-enough visual approximation of actual Swing rendering for V1 purposes. | Acceptable for MVP; flag to the user that pixel-perfect Swing L&F fidelity is not a goal. |
| 2 | **Risk:** Read-only Monaco may frustrate users who instinctively try to type in it. | FR-5.3's visible banner is a required mitigation, not optional polish. |
| 3 | **Risk:** `null`-layout (absolute positioning) is the easiest to implement but produces Java code that's brittle to resize — acceptable for V1 but worth flagging as a known limitation. | Documented explicitly in Non-Goals/limitations; `BorderLayout`/`FlowLayout` support is P1/P2. |
| 4 | **Risk:** Because each phase is built somewhat independently (by design, for AI-context reasons), integration bugs between phases (e.g., Phase 3's tree shape drifting from Phase 2's schema) are more likely than in a single continuous build. | Section 8.1's schema must be treated as a frozen contract across all phases; any schema change requires updating Sections 7.3.1 and 8 together, in the same PR/prompt. |

---

## 11. Open Questions

1. Should the Property Inspector be a fixed third column, or a collapsible panel that overlays the Canvas — affects the split-pane implementation in Phase 1.
2. What is the exact visual fidelity bar for the DOM-based Canvas preview (does it need to closely mimic a specific Swing Look & Feel, e.g., Metal, or is a clean modern approximation acceptable)?
3. Is offline/local-only usage assumed for V1 (no network calls at all), or should the architecture leave room for a future cloud-sync feature?
4. Should `varName` be user-editable in V1 (FR-4.4 currently specifies read-only), or is renaming a component variable an expected V1 capability?

---

*End of PRD — ready to be broken into individual AI-assistant prompts per Section 9.*
