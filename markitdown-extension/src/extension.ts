import * as vscode from 'vscode';

/**
 * MarkItDown Extension
 * 
 * Provides enhanced markdown editing features:
 * - Admonition syntax highlighting (via grammar injection)
 * - CodeLens copy buttons for code blocks
 * - Table formatting commands
 * - Highlight text formatting
 * - Admonition folding ranges
 */

export function activate(context: vscode.ExtensionContext) {
    console.log('MarkItDown extension is now active!');

    // Register commands
    const formatTableCommand = vscode.commands.registerCommand('markitdown.formatTable', formatTable);
    const highlightCommand = vscode.commands.registerCommand('markitdown.highlight', highlightText);
    const copyCodeCommand = vscode.commands.registerCommand('markitdown.copyCode', copyCodeBlock);

    context.subscriptions.push(formatTableCommand);
    context.subscriptions.push(highlightCommand);
    context.subscriptions.push(copyCodeCommand);

    // Register CodeLens provider for code blocks
    const codeLensProvider = new CodeBlockCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider('markdown', codeLensProvider)
    );

    // Register Folding Range provider for admonitions
    const foldingProvider = new AdmonitionFoldingProvider();
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider('markdown', foldingProvider)
    );

    // Register type command interceptor for auto table row (opt-in)
    const typeCommandInterceptor = new TypeCommandInterceptor();
    context.subscriptions.push(
        vscode.commands.registerCommand('type', (args) => typeCommandInterceptor.interceptType(args))
    );
}

export function deactivate() {
    console.log('MarkItDown extension deactivated');
}

/**
 * Format Table Command
 * Aligns columns in a markdown table based on the separator row
 */
async function formatTable() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const line = position.line;

    // Find table boundaries
    let startLine = line;
    let endLine = line;

    // Navigate up to find table start
    while (startLine >= 0 && document.lineAt(startLine).text.trim().startsWith('|')) {
        startLine--;
    }
    startLine++; // Move back to first table line

    // Navigate down to find table end
    while (endLine < document.lineCount && document.lineAt(endLine).text.trim().startsWith('|')) {
        endLine++;
    }
    endLine--; // Move back to last table line

    if (startLine >= endLine) {
        vscode.window.showInformationMessage('No valid table found at cursor position');
        return;
    }

    // Extract table lines
    const tableLines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
        tableLines.push(document.lineAt(i).text);
    }

    // Parse and format table
    const formattedTable = formatTableLines(tableLines);

    // Replace table with formatted version
    const range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );

    await editor.edit(editBuilder => {
        editBuilder.replace(range, formattedTable.join('\n'));
    });
}

/**
 * Format table lines into aligned columns
 */
function formatTableLines(lines: string[]): string[] {
    if (lines.length < 2) {
        return lines;
    }

    // Parse all rows into cells
    const rows: string[][] = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
            return [line];
        }
        // Split by | and trim each cell
        return trimmed
            .slice(1, -1) // Remove leading and trailing |
            .split('|')
            .map(cell => cell.trim());
    });

    // Determine column count
    const maxColumns = Math.max(...rows.map(row => row.length));

    // Calculate max width for each column
    const maxWidths: number[] = new Array(maxColumns).fill(0);
    for (const row of rows) {
        for (let i = 0; i < row.length; i++) {
            maxWidths[i] = Math.max(maxWidths[i], row[i].length);
        }
    }

    // Determine alignments from separator row (second row)
    const alignments: ('left' | 'center' | 'right')[] = [];
    if (rows.length > 1) {
        const separatorCells = rows[1];
        for (const cell of separatorCells) {
            const hasLeft = cell.trimStart().startsWith(':');
            const hasRight = cell.trimEnd().endsWith(':');
            
            if (hasLeft && hasRight) {
                alignments.push('center');
            } else if (hasRight) {
                alignments.push('right');
            } else {
                alignments.push('left'); // Default
            }
        }
    }

    // Format each row
    return rows.map((row, rowIndex) => {
        const formattedCells = row.map((cell, colIndex) => {
            const width = maxWidths[colIndex] || 0;
            const alignment = alignments[colIndex] || 'left';

            if (alignment === 'center') {
                const padding = width - cell.length;
                const leftPad = Math.floor(padding / 2);
                const rightPad = padding - leftPad;
                return ' '.repeat(leftPad) + cell + ' '.repeat(rightPad);
            } else if (alignment === 'right') {
                return cell.padStart(width, ' ');
            } else {
                return cell.padEnd(width, ' ');
            }
        });

        // Special handling for separator row
        if (rowIndex === 1 && alignments.length > 0) {
            const separatorCells = formattedCells.map((_, colIndex) => {
                const width = maxWidths[colIndex] || 0;
                const alignment = alignments[colIndex] || 'left';
                
                let separator = '-'.repeat(width);
                if (alignment === 'center') {
                    separator = ':' + '-'.repeat(width - 2) + ':';
                } else if (alignment === 'right') {
                    separator = '-'.repeat(width - 1) + ':';
                } else {
                    separator = '-'.repeat(width);
                }
                return separator;
            });
            return '| ' + separatorCells.join(' | ') + ' |';
        }

        return '| ' + formattedCells.join(' | ') + ' |';
    });
}

/**
 * Highlight Text Command
 * Wraps selected text with ==highlight== markers
 */
async function highlightText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (selectedText.length === 0) {
        vscode.window.showWarningMessage('Please select text to highlight');
        return;
    }

    // Check if already highlighted
    if (selectedText.startsWith('==') && selectedText.endsWith('==')) {
        // Remove highlighting
        const range = new vscode.Range(selection.start, selection.end);
        await editor.edit(editBuilder => {
            editBuilder.replace(range, selectedText.slice(2, -2));
        });
    } else {
        // Add highlighting
        const range = new vscode.Range(selection.start, selection.end);
        await editor.edit(editBuilder => {
            editBuilder.replace(range, `==${selectedText}==`);
        });
    }
}

/**
 * Copy Code Block Command
 * Copies the content of a code block to clipboard
 */
async function copyCodeBlock(codeBlockInfo?: { startLine: number; endLine: number }) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    let startLine: number;
    let endLine: number;

    if (codeBlockInfo) {
        startLine = codeBlockInfo.startLine;
        endLine = codeBlockInfo.endLine;
    } else {
        // Find code block at cursor position
        const position = editor.selection.active;
        const line = position.line;

        startLine = line;
        endLine = line;

        // Find opening ```
        while (startLine >= 0 && !editor.document.lineAt(startLine).text.trim().startsWith('```')) {
            startLine--;
        }

        // Find closing ```
        while (endLine < editor.document.lineCount && !editor.document.lineAt(endLine).text.trim().startsWith('```')) {
            endLine++;
        }

        if (startLine < 0 || endLine >= editor.document.lineCount) {
            vscode.window.showWarningMessage('No code block found at cursor position');
            return;
        }
    }

    // Extract code block content (excluding the ``` lines)
    const contentLines: string[] = [];
    for (let i = startLine + 1; i < endLine; i++) {
        contentLines.push(editor.document.lineAt(i).text);
    }

    const codeContent = contentLines.join('\n');

    // Copy to clipboard
    await vscode.env.clipboard.writeText(codeContent);
    vscode.window.showInformationMessage('Code block copied to clipboard! 📋');
}

/**
 * CodeLens Provider for Code Blocks
 * Shows "📋 Copy" button above code blocks
 */
class CodeBlockCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        
        // Match code blocks: ```language\ncontent\n```
        const codeBlockRegex = /^(\s*)```[a-zA-Z0-9]*\r?\n([\s\S]*?)\r?\n\1```/gm;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            
            // Create CodeLens at the line before the code block
            const codeLensPosition = new vscode.Position(startPos.line, 0);
            
            const codeLens = new vscode.CodeLens(
                new vscode.Range(codeLensPosition, codeLensPosition),
                {
                    title: '📋 Copy',
                    command: 'markitdown.copyCode',
                    arguments: [{
                        startLine: startPos.line,
                        endLine: endPos.line
                    }]
                }
            );
            
            codeLenses.push(codeLens);
        }

        return codeLenses;
    }
}

/**
 * Folding Range Provider for Admonitions
 * Enables folding of admonition blocks in the editor
 */
class AdmonitionFoldingProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.FoldingRange[] {
        const foldingRanges: vscode.FoldingRange[] = [];
        
        // Regex for admonition headers
        const admonitionRegex = /^(\s*)(!!!|\?\?\?|\?\?\?\+)\s+(note|info|todo|tip|hint|success|check|done|question|help|faq|warning|attention|caution|failure|fail|missing|danger|error|bug|example|snippet|quote|cite)/;
        
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const match = line.text.match(admonitionRegex);
            
            if (match) {
                const baseIndent = match[1].length;
                let endLine = i + 1;
                
                // Find the end of the admonition block
                while (endLine < document.lineCount) {
                    const nextLine = document.lineAt(endLine);
                    
                    // Empty lines are part of the admonition
                    if (nextLine.text.trim() === '') {
                        endLine++;
                        continue;
                    }
                    
                    // Calculate indentation of non-empty line
                    const indentMatch = nextLine.text.match(/^(\s*)/);
                    const currentIndent = indentMatch ? indentMatch[1].length : 0;
                    
                    // If indentation is less than or equal to base indent, admonition ends
                    if (currentIndent <= baseIndent) {
                        break;
                    }
                    
                    endLine++;
                }
                
                // Only create folding range if there's content to fold
                if (endLine > i + 1) {
                    foldingRanges.push(new vscode.FoldingRange(i, endLine - 1));
                }
            }
        }
        
        return foldingRanges;
    }
}

/**
 * Type Command Interceptor
 * Handles automatic table row generation when Enter is pressed in a table
 */
class TypeCommandInterceptor {
    private previousPosition: { line: number; character: number } | null = null;
    private consecutiveEnters: number = 0;

    async interceptType(args: { text: string }): Promise<any> {
        const config = vscode.workspace.getConfiguration('markitdown');
        const enableAutoRow = config.get<boolean>('enableAutoRow', false);

        if (!enableAutoRow || args.text !== '\n') {
            this.consecutiveEnters = 0;
            this.previousPosition = null;
            return vscode.commands.executeCommand('default:type', { text: args.text });
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return vscode.commands.executeCommand('default:type', { text: args.text });
        }

        const document = editor.document;
        const position = editor.selection.active;
        const currentLine = document.lineAt(position.line);

        // Check if we're in a table
        if (!currentLine.text.trim().startsWith('|')) {
            this.consecutiveEnters = 0;
            this.previousPosition = null;
            return vscode.commands.executeCommand('default:type', { text: args.text });
        }

        // Detect double enter to exit table
        if (this.previousPosition && 
            position.line === this.previousPosition.line && 
            position.character === this.previousPosition.character) {
            this.consecutiveEnters++;
            
            if (this.consecutiveEnters >= 2) {
                // Double enter detected, just insert newline without table row
                this.consecutiveEnters = 0;
                this.previousPosition = null;
                return vscode.commands.executeCommand('default:type', { text: args.text });
            }
        } else {
            this.consecutiveEnters = 0;
        }

        // Parse current table row to determine column count
        const trimmedLine = currentLine.text.trim();
        if (!trimmedLine.startsWith('|') || !trimmedLine.endsWith('|')) {
            return vscode.commands.executeCommand('default:type', { text: args.text });
        }

        const cells = trimmedLine.slice(1, -1).split('|');
        const columnCount = cells.length;

        // Skip separator row (contains only dashes and colons)
        const isSeparatorRow = cells.every(cell => /^:?-+:?$/.test(cell.trim()));
        if (isSeparatorRow) {
            return vscode.commands.executeCommand('default:type', { text: args.text });
        }

        // Generate new table row with empty cells
        const newRow = '| ' + new Array(columnCount).fill('').join(' | ') + ' |';

        // Insert newline and new row
        await editor.edit(editBuilder => {
            editBuilder.insert(position, '\n' + newRow);
        });

        // Move cursor to first cell of new row
        const newPosition = new vscode.Position(position.line + 1, 2);
        editor.selection = new vscode.Selection(newPosition, newPosition);

        this.previousPosition = { line: position.line, character: position.character };
        this.consecutiveEnters = 1;

        return undefined; // We handled the command
    }
}
