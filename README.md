# MarkItDown – VS Code Extension

Advanced **Markdown** formatting directly in the VS Code source editor.  
Designed to complement existing extensions like **Markdown All in One**
and **indent-rainbow**.

---

## Features

### 1. Admonition Highlighting

MKDocs‑compatible admonitions are color‑coded in the editor.

- `!!! note` – Note (blue)
- `!!! warning` – Warning (orange)
- `!!! danger` – Danger (red)
- `!!! success` – Success (green)
- `!!! info` – Information (cyan)
- `!!! quote` – Quote (gray)
- `??? question` – Collapsible question

```markdown
!!! note "Title"
    Content of the note.
```

The **type marker** (`!!! note`) is displayed **bold** and with its own color —
the optional title appears in the normal text color.

### 2. Inline Markers

Use `@` markers to highlight **priorities, statuses, due dates, and tags**
directly in your text.

| Marker               | Color                             | Example                         |
| -------------------- | --------------------------------- | ------------------------------- |
| `@P1` … `@P6`        | Traffic‑light system (red → blue) | `@P1 Important task`            |
| Word priorities      | Same as numeric equivalents       | `@critical`, `@high`, `@medium` |
| `@todo` / `@doing`   | Purple                            | `@todo finish API`              |
| `@due` / `@end`      | Light blue                        | `@due 2025-01-01`               |
| `@done`              | Green                             | `@done 2025-05-20`              |
| `@in` / `@start`     | Light blue                        | `@in 2h 30m`                    |
| `@hold` / `@pending` | Gray                              | `@hold waiting for approval`    |
| `#tag` / `@tag`      | Subtle purple                     | `@project` `#docs`              |

#### Priority Traffic Light

| Level  | Color    | Examples                            |
| ------ | -------- | ----------------------------------- |
| **P1** | Deep red | `@P1`, `@critical`, `@kritisch`     |
| **P2** | Red      | `@P2`, `@high`, `@hoch`             |
| **P3** | Orange   | `@P3`, `@average`, `@mittel`        |
| **P4** | Yellow   | `@P4`, `@mid`                       |
| **P5** | Green    | `@P5`, `@low`, `@niedrig`           |
| **P6** | Blue     | `@P6`, `@unimportant`, `@unwichtig` |

#### Date & Time Formats

- **ISO date:** `@due 2025-06-01`
- **German date:** `@due 01.06.2025` (also two‑digit years: `01.01.25`)
- **With time:** `@due 2025-06-01 14:30`
- **Only time:** `@due 14:30`
- **In parentheses:** `@due(2025-06-01)`
- **Relative times:** `@in 30m`, `@in 2h`, `@in 1h 30m`, `@in 2 days`

### 3. Text Highlight

Double equals `==text==` creates a ==yellow background== — just like the HTML
`<mark>` element.

### 4. Code Blocks & Blockquotes

- **Code blocks** (```` ``` ````) get a subtle gray background.
- **Blockquotes** (`> `) also receive a light background.

### 5. Folding

Headings (`#`) and admonitions can be collapsed/expanded using VS Code’s
native folding feature.

---

## Formatting Commands

Accessible via the Command Palette (`Ctrl+Shift+P`), the context menu, and
Code Actions (`Ctrl+.`):

| Command                    | Description                       |
| -------------------------- | --------------------------------- |
| `markitdown.bold`          | Format Bold (`**text**`)          |
| `markitdown.italic`        | Format Italic (`*text*`)          |
| `markitdown.underline`     | Format Underline (`__text__`)     |
| `markitdown.strikethrough` | Format Strikethrough (`~~text~~`) |
| `markitdown.highlight`     | Format Highlight (`==text==`)     |
| `markitdown.quote`         | Format Quote (`> text`)           |
| `markitdown.link`          | Insert Link (`[text](url)`)       |
| `markitdown.inlineCode`    | Format Inline Code (`` `text` ``) |
| `markitdown.codeBlock`     | Format Code Block                 |

---

## IntelliSense (Ctrl+Space)

In any Markdown file you'll get **all markers** as autocompletion suggestions:
priorities, status, time markers, admonition snippets, and formatting commands.

---

## Demo / Playground

Here is a quick reference you can copy into a `.md` file to see all
decorations in action:

```markdown
# Priority & Task Playground

## Priorities
- @P1 Critical task
- @P2 High priority
- @P3 Average
- @P4 Low priority
- @P5 Unimportant
- @P6 Nice to have

## Status
- @todo Write documentation
- @doing Review pull requests

## Time
- @due 2025-12-01
- @done 2025-11-20
- @in 1h 30m

## Blocked
- @hold Waiting for external API
- @pending Depends on PR #42

## Tags
- @project #backend
- @bug #urgent

## Highlight
This is ==important== information.

## Admonitions
!!! note "Note"
    This is a regular note.

!!! warning "Warning"
    Pay attention here.

!!! danger "Danger"
    Critical error!

!!! success "Success"
    Task completed.

!!! info "Info"
    Additional details.

!!! quote "Quote"
    A famous quote.

## Code Block
```python
print("Hello World")
```

## Blockquote
> This is a blockquote.
> Multiple lines are supported.
```

---

## Compatibility

This extension works together with:

- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
- [indent-rainbow](https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow)

---

## Installation

### From Source

```bash
git clone https://github.com/sbthe97th-star/MarkItDown-VSCode.git
cd MarkItDown-VSCode/markitdown-extension
npm install
npm run compile
npx @vscode/vsce package --allow-missing-repository
```

Install the generated `.vsix` file in VS Code:
`Extensions → … → Install from VSIX…`

---

## Development

```bash
cd markitdown-extension
npm install
npm run compile   # TypeScript → JavaScript
npm run watch     # Watch for changes
```

Tested with **VS Code ≥ 1.80.0** and **Node.js ≥ 20**.

---

## Vibecoding Disclaimer

This project was created with the assistance of **AI** (a process
sometimes called *vibecoding*). While every feature has been tested and
refined, the codebase was built through human–AI collaboration.