# MarkItDown - VS Code Extension

Extended markdown editing features for VS Code, designed to complement existing markdown extensions like **Markdown All in One** and **Markdown Preview Enhanced**.

## Features

This extension augments the **raw source editor** (not the preview window) by filling specific gaps left by other markdown tools:

### 1. Admonition Syntax Highlighting
- MKDocs-style admonitions with full syntax highlighting in the raw editor
- Supports standard `!!!`, closed collapsible `???`, and open collapsible `???+`
- Supported types: note, info, todo, tip, hint, success, check, done, question, help, faq, warning, attention, caution, failure, fail, missing, danger, error, bug, example, snippet, quote, cite

Example:
```markdown
!!! note "Important Note"
    This is a note admonition with highlighted syntax in the editor.

??? tip "Collapsible Tip"
    This content can be folded/collapsed in the editor gutter.
```

### 2. Text Highlighting (`==text==`)
- Yellow highlight markup for emphasizing text
- Toggle highlighting on/off with the command

### 3. CodeLens Copy Buttons
- Floating "📋 Copy" buttons appear above code blocks in the editor
- Click to copy the entire code block content to clipboard
- No preview scripts needed - native VS Code integration

### 4. Table Formatting
- Manual table formatting command accessible via Command Palette
- Aligns columns based on separator row indicators (`:---`, `---:`, `:---:`)
- Alternative to Markdown All in One's auto-formatter

### 5. Admonition Folding
- Native fold/unfold chevrons in the editor gutter for admonition blocks
- Automatically detects admonition boundaries based on indentation

### 6. Auto Table Row Generation (Opt-in)
- Press Enter in a table row to automatically create a new row with matching columns
- Double-tap Enter to exit table mode
- Configurable via `markitdown.enableAutoRow` setting

## Commands

Access these via Command Palette (`Ctrl+Shift+P`):

| Command | Title | Description |
|---------|-------|-------------|
| `markitdown.formatTable` | MarkItDown: Format Table | Format the markdown table at cursor position |
| `markitdown.highlight` | MarkItDown: Format Highlight | Wrap selected text with `==highlight==` markers |
| `markitdown.copyCode` | MarkItDown: Copy Code Block | Copy code block content to clipboard |

## Configuration

Add to your `settings.json`:

```json
{
  "markitdown.enableAutoRow": false
}
```

- `enableAutoRow` (default: `false`): Enable automatic table row generation when pressing Enter inside a table

## Compatibility

This extension is designed to work alongside:
- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
- [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
- [indent-rainbow](https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow)

**No default keybindings** are assigned to prevent conflicts with existing extensions. Use Command Palette or assign your own keybindings.

## Installation from Source

1. Clone or download this extension
2. Navigate to the extension directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile TypeScript:
   ```bash
   npm run compile
   ```
5. In VS Code, go to Extensions → ⋯ → Install from VSIX (or use "Run Extension" in debug mode)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## License

ISC
