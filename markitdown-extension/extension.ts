import * as vscode from "vscode";

// ── Admonition & sonstige Dekorationstypen ──
const admonitionTypes = ["note", "warning", "danger", "success", "info", "quote"] as const;
type AdmonitionType = (typeof admonitionTypes)[number];

const admonitionColors: Record<AdmonitionType, string> = {
  note:    "rgba(59,130,246,0.25)",
  warning: "rgba(245,158,11,0.25)",
  danger:  "rgba(239,68,68,0.25)",
  success: "rgba(16,185,129,0.25)",
  info:    "rgba(6,182,212,0.25)",
  quote:   "rgba(128,128,128,0.2)",
};

const headerTypeColor = { dark: "#CE9178", light: "#A31515" };

// ── Admonition Dekorationstypen ──
const admonitionBorderDecos: Record<string, vscode.TextEditorDecorationType> = {};
const admonitionTypeFettDeco: Record<string, vscode.TextEditorDecorationType> = {};
const admonitionBodyDecos: Record<string, vscode.TextEditorDecorationType> = {};

for (const t of admonitionTypes) {
  admonitionBorderDecos[t] = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    dark: { backgroundColor: admonitionColors[t] },
    light: { backgroundColor: admonitionColors[t] },
  });

  admonitionTypeFettDeco[t] = vscode.window.createTextEditorDecorationType({
    dark: { fontWeight: "bold", color: headerTypeColor.dark },
    light: { fontWeight: "bold", color: headerTypeColor.light },
  });

  admonitionBodyDecos[t] = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    dark: { backgroundColor: admonitionColors[t].replace("0.25", "0.12") },
    light: { backgroundColor: admonitionColors[t].replace("0.25", "0.12") },
  });
}

// Codeblöcke – nur Hintergrund
const codeBlockDecoration = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  dark: { backgroundColor: "rgba(128,128,128,0.1)" },
  light: { backgroundColor: "rgba(128,128,128,0.1)" },
});

// Zitate – nur Hintergrund
const blockquoteDecoration = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  dark: { backgroundColor: "rgba(128,128,128,0.05)" },
  light: { backgroundColor: "rgba(128,128,128,0.05)" },
});

// ── Neue Inline‑Dekorationstypen ──

// Prioritäten – Ampelsystem, nur transparenter Hintergrund, keine Schriftänderung
const priorityDecos: Record<number, vscode.TextEditorDecorationType> = {};
const priorityBgColors: Record<number, string> = {
  1: "rgba(153,27,27,0.3)",   // tiefes Rot
  2: "rgba(239,68,68,0.3)",   // Rot
  3: "rgba(249,115,22,0.3)",  // Orange
  4: "rgba(234,179,8,0.3)",   // Gelb
  5: "rgba(34,197,94,0.3)",   // Grün
  6: "rgba(59,130,246,0.3)",  // Blau
};

for (let p = 1; p <= 6; p++) {
  priorityDecos[p] = vscode.window.createTextEditorDecorationType({
    backgroundColor: priorityBgColors[p],
  });
}

// Status @todo / @doing – lila
const todoDoingDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(139, 92, 246, 0.3)",
});

// Zeitmarker @due / @end – jetzt gleiches helles Blau wie @in
const dueDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(14, 165, 233, 0.2)", // Helles Blau
});

// Zeitmarker @done (Grün)
const doneDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(22, 163, 74, 0.25)",
});

// Zeitmarker @in / @start (gleiches Blau wie due, aber wegen Übersichtlichkeit getrennt)
const inDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(14, 165, 233, 0.2)", // Helles Blau
});

// Blockierte Aufgaben
const holdDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(156, 163, 175, 0.25)",
});

// Tags – dezentes Lila
const tagDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(139, 92, 246, 0.15)",
});

// Highlight ==text==
const highlightDeco = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(255, 255, 0, 0.4)",
});

// ── Hilfsfunktionen ──
function getEditor(): vscode.TextEditor | undefined {
  return vscode.window.activeTextEditor;
}

async function insertSnippet(snippet: string) {
  const editor = getEditor();
  if (!editor) return;
  await editor.insertSnippet(new vscode.SnippetString(snippet));
}

// Prioritätswörter (deutsch/englisch)
const priorityWordMap: Record<string, number> = {
  "unimportant": 6, "low": 5, "mid": 4, "average": 3, "high": 2, "critical": 1, "major": 1,
  "unwichtig": 6, "niedrig": 5, "mittel": 3, "durchschnitt": 3, "hoch": 2, "kritisch": 1,
};

// Reservierte Schlüsselwörter
const reservedMarkers = new Set([
  "due", "done", "end", "in", "start", "todo", "doing", "hold", "pending",
  "unimportant", "low", "mid", "average", "high", "critical", "major",
  "unwichtig", "niedrig", "mittel", "durchschnitt", "hoch", "kritisch",
  "p1", "p2", "p3", "p4", "p5", "p6"
]);

// Datum/Uhrzeit‑Parser mit Unterstützung für zweistellige Jahre im deutschen Format
function tryParseDateTime(text: string): number {
  let consumed = 0;
  const trimmed = text.replace(/^\s+/, '');
  consumed = text.length - trimmed.length;
  if (trimmed.length === 0) return consumed;

  let look = trimmed[0];
  let inner = trimmed;
  if (look === ':' || look === '(') {
    consumed += 1;
    inner = trimmed.substring(1).replace(/^\s+/, '');
    consumed += trimmed.substring(1).length - inner.length;
  }

  // Datum/Uhrzeit-Muster: ISO, deutsches mit zwei- oder vierstelligem Jahr, Uhrzeit
  const dateTimePattern = /^(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{2,4}|\d{2}:\d{2}(?::\d{2})?)/;
  const dtMatch = inner.match(dateTimePattern);
  if (!dtMatch) return 0;
  consumed += dtMatch[0].length;
  let rest = inner.substring(dtMatch[0].length);

  const firstIsDate = /^\d{4}-\d{2}-\d{2}/.test(dtMatch[0]) || /^\d{2}\.\d{2}\.\d{2,4}/.test(dtMatch[0]);
  if (firstIsDate) {
    const timeMatch = rest.match(/^\s*(\d{2}:\d{2}(?::\d{2})?)/);
    if (timeMatch) {
      consumed += timeMatch[0].length;
      rest = rest.substring(timeMatch[0].length);
    }
  }

  if (look === '(') {
    const closeIdx = rest.indexOf(')');
    if (closeIdx !== -1) consumed += closeIdx + 1;
  }
  return consumed;
}

function updateDecorations() {
  const editor = getEditor();
  if (!editor || editor.document.languageId !== "markdown") return;

  const doc = editor.document;
  const text = doc.getText();
  const lines = text.split(/\r?\n/);

  const borderRanges: Record<string, vscode.Range[]> = {};
  const typeFettRanges: Record<string, vscode.Range[]> = {};
  const bodyRanges: Record<string, vscode.Range[]> = {};
  for (const t of admonitionTypes) {
    borderRanges[t] = [];
    typeFettRanges[t] = [];
    bodyRanges[t] = [];
  }

  const codeBlockRanges: vscode.Range[] = [];
  const blockquoteRanges: vscode.Range[] = [];

  const priorityRanges: Record<number, vscode.Range[]> = {};
  for (let p = 1; p <= 6; p++) priorityRanges[p] = [];

  const todoDoingRanges: vscode.Range[] = [];
  const dueRanges: vscode.Range[] = [];
  const doneRanges: vscode.Range[] = [];
  const inRanges: vscode.Range[] = [];
  const holdRanges: vscode.Range[] = [];
  const tagRanges: vscode.Range[] = [];
  const highlightRanges: vscode.Range[] = [];

  let inCodeBlock = false;
  const admonStack: { indent: number; type: AdmonitionType }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      codeBlockRanges.push(new vscode.Range(i, 0, i, line.length));
      continue;
    }
    if (inCodeBlock) {
      codeBlockRanges.push(new vscode.Range(i, 0, i, line.length));
      continue;
    }

    if (line.trim().startsWith(">")) {
      blockquoteRanges.push(new vscode.Range(i, 0, i, line.length));
    }

    const indent = line.length - line.trimStart().length;
    const isEmpty = line.trim() === "";

    if (!isEmpty) {
      while (admonStack.length > 0 && indent < admonStack[admonStack.length - 1].indent + 4) {
        admonStack.pop();
      }

      const admonMatch = line.match(/^(\s*)(!!!|\?\?\?)(\s*)([a-zA-Z0-9_-]+)(?:\s+"?(.*?)"?)?$/);
      if (admonMatch) {
        const raw = admonMatch[4].toLowerCase();
        let type: AdmonitionType = "note";
        if (["warning","caution","attention"].includes(raw)) type = "warning";
        else if (["danger","error","bug","failure","fail","missing","contra","con"].includes(raw)) type = "danger";
        else if (["success","tip","check","done","pro"].includes(raw)) type = "success";
        else if (["info","todo","hint","help","faq","example","snippet"].includes(raw)) type = "info";
        else if (["quote","cite"].includes(raw)) type = "quote";

        borderRanges[type].push(new vscode.Range(i, 0, i, line.length));
        const fettStartCol = admonMatch[1].length;
        const fettEndCol = fettStartCol + admonMatch[2].length + admonMatch[3].length + admonMatch[4].length;
        typeFettRanges[type].push(new vscode.Range(i, fettStartCol, i, fettEndCol));
        admonStack.push({ indent, type });
      } else if (admonStack.length > 0) {
        const currentType = admonStack[admonStack.length - 1].type;
        bodyRanges[currentType].push(new vscode.Range(i, 0, i, line.length));
      }

      // Prioritäten numerisch
      const numPrioRegex = /@\s*P\s*([1-6])\b/gi;
      let m: RegExpExecArray | null;
      while ((m = numPrioRegex.exec(line)) !== null) {
        const level = parseInt(m[1], 10);
        const start = m.index;
        const end = start + m[0].length;
        priorityRanges[level].push(new vscode.Range(i, start, i, end));
      }

      // Prioritäten als Wort
      const wordPrioPattern = Object.keys(priorityWordMap).join("|");
      const wordPrioRegex = new RegExp(`@\\s*(${wordPrioPattern})\\b`, "gi");
      while ((m = wordPrioRegex.exec(line)) !== null) {
        const word = m[1].toLowerCase();
        const level = priorityWordMap[word];
        const start = m.index;
        const end = start + m[0].length;
        priorityRanges[level].push(new vscode.Range(i, start, i, end));
      }

      // @due, @done, @end
      const dueDoneRegex = /@\s*(due|done|end)\b/gi;
      while ((m = dueDoneRegex.exec(line)) !== null) {
        const kind = m[1].toLowerCase();
        const start = m.index;
        let end = start + m[0].length;
        const restLine = line.substring(end);
        const consumed = tryParseDateTime(restLine);
        if (consumed > 0) end += consumed;
        if (kind === "done") {
          doneRanges.push(new vscode.Range(i, start, i, end));
        } else {
          dueRanges.push(new vscode.Range(i, start, i, end));
        }
      }

      // @in und @start – erweiterte Zeitangaben
      const timeUnits = [
        // Minuten
        "minuten", "minute", "min",
        // Stunden
        "stunden", "stunde", "std", "hour", "hours",
        // Tage
        "tage", "tagen", "tag", "day", "days",
        // Wochen
        "wochen", "woche", "week", "weeks",
        // Monate
        "monate", "monaten", "monat", "month", "months", "mon",
        // Jahre
        "jahre", "jahren", "jahr", "year", "years",
        // Sekunden
        "sekunden", "sekunde", "second", "seconds", "sek", "sec",
        // Kurzformen am Ende, um Konflikte zu vermeiden
        "h", "d", "w", "y", "s", "m"
      ].join("|");
      const inRegex = new RegExp(`@\\s*(in|start)((?:\\s+\\d+\\s*(?:${timeUnits})\\b)+)`, "gi");
      while ((m = inRegex.exec(line)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        inRanges.push(new vscode.Range(i, start, i, end));
      }

      // @todo, @doing
      const todoDoingRegex = /@\s*(todo|doing)\b/gi;
      while ((m = todoDoingRegex.exec(line)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        todoDoingRanges.push(new vscode.Range(i, start, i, end));
      }

      // @hold, @pending
      const holdRegex = /@\s*(hold|pending)\b/gi;
      while ((m = holdRegex.exec(line)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        holdRanges.push(new vscode.Range(i, start, i, end));
      }

      // Tags
      const reservedRanges: { start: number; end: number }[] = [];
      const addReserved = (ranges: vscode.Range[]) => {
        for (const r of ranges) {
          if (r.start.line === i) reservedRanges.push({ start: r.start.character, end: r.end.character });
        }
      };
      for (let p = 1; p <= 6; p++) addReserved(priorityRanges[p]);
      addReserved(todoDoingRanges.filter(r => r.start.line === i));
      addReserved(dueRanges.filter(r => r.start.line === i));
      addReserved(doneRanges.filter(r => r.start.line === i));
      addReserved(inRanges.filter(r => r.start.line === i));
      addReserved(holdRanges.filter(r => r.start.line === i));

      const tagRegex = /[@#][\w-]+/g;
      while ((m = tagRegex.exec(line)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        if (reservedRanges.some(r => start >= r.start && start < r.end && end > r.start && end <= r.end)) continue;
        const word = m[0].replace(/^[@#]/, '').toLowerCase();
        if (reservedMarkers.has(word)) continue;
        tagRanges.push(new vscode.Range(i, start, i, end));
      }

      // Highlight ==text==
      const highlightRegex = /==(.+?)==/g;
      while ((m = highlightRegex.exec(line)) !== null) {
        const start = m.index + 2;
        const end = start + m[1].length;
        highlightRanges.push(new vscode.Range(i, start, i, end));
      }
    }
  }

  // Dekorationen setzen
  for (const t of admonitionTypes) {
    editor.setDecorations(admonitionBorderDecos[t], borderRanges[t]);
    editor.setDecorations(admonitionTypeFettDeco[t], typeFettRanges[t]);
    editor.setDecorations(admonitionBodyDecos[t], bodyRanges[t]);
  }
  editor.setDecorations(codeBlockDecoration, codeBlockRanges);
  editor.setDecorations(blockquoteDecoration, blockquoteRanges);

  for (let p = 1; p <= 6; p++) {
    editor.setDecorations(priorityDecos[p], priorityRanges[p]);
  }

  editor.setDecorations(todoDoingDeco, todoDoingRanges);
  editor.setDecorations(dueDeco, dueRanges);
  editor.setDecorations(doneDeco, doneRanges);
  editor.setDecorations(inDeco, inRanges);
  editor.setDecorations(holdDeco, holdRanges);
  editor.setDecorations(tagDeco, tagRanges);
  editor.setDecorations(highlightDeco, highlightRanges);
}

// ── Aktivierung ──
export function activate(context: vscode.ExtensionContext) {
  const commands: [string, () => void][] = [
    ["markitdown.bold",           () => insertSnippet("**${1:$TM_SELECTED_TEXT}**")],
    ["markitdown.italic",         () => insertSnippet("*${1:$TM_SELECTED_TEXT}*")],
    ["markitdown.underline",      () => insertSnippet("__${1:$TM_SELECTED_TEXT}__")],
    ["markitdown.strikethrough",  () => insertSnippet("~~${1:$TM_SELECTED_TEXT}~~")],
    ["markitdown.highlight",      () => insertSnippet("==${1:$TM_SELECTED_TEXT}==")],
    ["markitdown.quote",          () => insertSnippet("> ${1:$TM_SELECTED_TEXT}")],
    ["markitdown.link",           () => insertSnippet("[${1:$TM_SELECTED_TEXT}](${2:url})")],
    ["markitdown.inlineCode",     () => insertSnippet("`${1:$TM_SELECTED_TEXT}`")],
    ["markitdown.codeBlock",      () => insertSnippet("```${1:language}\n${2:$TM_SELECTED_TEXT}\n```")],
  ];

  commands.forEach(([id, fn]) => context.subscriptions.push(vscode.commands.registerCommand(id, fn)));

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("markdown", {
      provideCodeActions(document, range) {
        if (range.isEmpty) return;
        const actions = [
          { title: "Format Bold",           command: "markitdown.bold" },
          { title: "Format Italic",         command: "markitdown.italic" },
          { title: "Format Underline",      command: "markitdown.underline" },
          { title: "Format Strikethrough",  command: "markitdown.strikethrough" },
          { title: "Format Highlight",      command: "markitdown.highlight" },
          { title: "Format as Quote",       command: "markitdown.quote" },
          { title: "Insert Link",           command: "markitdown.link" },
        ].map(a => {
          const ca = new vscode.CodeAction(a.title, vscode.CodeActionKind.QuickFix);
          ca.command = { command: a.command, title: a.title };
          return ca;
        });
        return actions;
      },
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider("markdown", {
      provideCompletionItems() {
        const items = [
          { label: "bold",          insert: "**${1:$TM_SELECTED_TEXT}**", kind: vscode.CompletionItemKind.Snippet },
          { label: "italic",        insert: "*${1:$TM_SELECTED_TEXT}*", kind: vscode.CompletionItemKind.Snippet },
          { label: "link",          insert: "[${1:$TM_SELECTED_TEXT}](${2:url})", kind: vscode.CompletionItemKind.Snippet },
          { label: "codeblock",     insert: "```${1:language}\n${2:$TM_SELECTED_TEXT}\n```", kind: vscode.CompletionItemKind.Snippet },
          { label: "inline code",   insert: "`${1:$TM_SELECTED_TEXT}`", kind: vscode.CompletionItemKind.Snippet },
          { label: "highlight",     insert: "==${1:$TM_SELECTED_TEXT}==", kind: vscode.CompletionItemKind.Snippet },
          { label: "underline",     insert: "__${1:$TM_SELECTED_TEXT}__", kind: vscode.CompletionItemKind.Snippet },
          { label: "strikethrough", insert: "~~${1:$TM_SELECTED_TEXT}~~", kind: vscode.CompletionItemKind.Snippet },
          { label: "heading",       insert: "# ${1:$TM_SELECTED_TEXT}", kind: vscode.CompletionItemKind.Snippet },
          { label: "admonition",    insert: '!!! ${1|note,summary,abstract,tldr,info,todo,tip,hint,success,check,done,question,help,faq,warning,attention,caution,failure,fail,missing,danger,error,bug,example,snippet,quote,cite|} "${2:Title}"\n\t${3:$TM_SELECTED_TEXT}', kind: vscode.CompletionItemKind.Snippet },
          { label: "blockquote",    insert: "> ${1:$TM_SELECTED_TEXT}", kind: vscode.CompletionItemKind.Snippet },

          { label: "@P1", insert: "@P1", kind: vscode.CompletionItemKind.Keyword },
          { label: "@P2", insert: "@P2", kind: vscode.CompletionItemKind.Keyword },
          { label: "@P3", insert: "@P3", kind: vscode.CompletionItemKind.Keyword },
          { label: "@P4", insert: "@P4", kind: vscode.CompletionItemKind.Keyword },
          { label: "@P5", insert: "@P5", kind: vscode.CompletionItemKind.Keyword },
          { label: "@P6", insert: "@P6", kind: vscode.CompletionItemKind.Keyword },

          { label: "@critical",      insert: "@critical",      kind: vscode.CompletionItemKind.Keyword },
          { label: "@high",          insert: "@high",          kind: vscode.CompletionItemKind.Keyword },
          { label: "@average",       insert: "@average",       kind: vscode.CompletionItemKind.Keyword },
          { label: "@mid",           insert: "@mid",           kind: vscode.CompletionItemKind.Keyword },
          { label: "@low",           insert: "@low",           kind: vscode.CompletionItemKind.Keyword },
          { label: "@unimportant",   insert: "@unimportant",   kind: vscode.CompletionItemKind.Keyword },
          { label: "@major",         insert: "@major",         kind: vscode.CompletionItemKind.Keyword },
          { label: "@kritisch",      insert: "@kritisch",      kind: vscode.CompletionItemKind.Keyword },
          { label: "@hoch",          insert: "@hoch",          kind: vscode.CompletionItemKind.Keyword },
          { label: "@mittel",        insert: "@mittel",        kind: vscode.CompletionItemKind.Keyword },
          { label: "@niedrig",       insert: "@niedrig",       kind: vscode.CompletionItemKind.Keyword },
          { label: "@unwichtig",     insert: "@unwichtig",     kind: vscode.CompletionItemKind.Keyword },

          { label: "@todo",  insert: "@todo",  kind: vscode.CompletionItemKind.Keyword },
          { label: "@doing", insert: "@doing", kind: vscode.CompletionItemKind.Keyword },
          { label: "@due",   insert: "@due ",  kind: vscode.CompletionItemKind.Keyword },
          { label: "@done",  insert: "@done ", kind: vscode.CompletionItemKind.Keyword },
          { label: "@end",   insert: "@end ",  kind: vscode.CompletionItemKind.Keyword },
          { label: "@in",    insert: "@in ",   kind: vscode.CompletionItemKind.Keyword },
          { label: "@start", insert: "@start ", kind: vscode.CompletionItemKind.Keyword },
          { label: "@hold",    insert: "@hold",    kind: vscode.CompletionItemKind.Keyword },
          { label: "@pending", insert: "@pending", kind: vscode.CompletionItemKind.Keyword },
        ];

        return items.map(i => {
          const ci = new vscode.CompletionItem(i.label, i.kind);
          if (i.kind === vscode.CompletionItemKind.Snippet) {
            ci.insertText = new vscode.SnippetString(i.insert);
          } else {
            ci.insertText = i.insert;
          }
          return ci;
        });
      },
    })
  );

  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider("markdown", {
      provideFoldingRanges(document) {
        const folds: vscode.FoldingRange[] = [];
        const hStack: { level: number; line: number }[] = [];
        const aStack: { line: number; indent: number }[] = [];

        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const text = line.text;
          let indent = 0;
          for (const ch of text) {
            if (ch === " ") indent++;
            else if (ch === "\t") indent += 4;
            else break;
          }
          if (text.trim() === "") continue;

          while (aStack.length > 0 && indent < aStack[aStack.length - 1].indent + 4) {
            const popped = aStack.pop()!;
            if (i - 1 > popped.line) folds.push(new vscode.FoldingRange(popped.line, i - 1));
          }

          const hMatch = text.match(/^(#{1,6})\s/);
          if (hMatch) {
            const level = hMatch[1].length;
            while (hStack.length > 0 && hStack[hStack.length - 1].level >= level) {
              const p = hStack.pop()!;
              if (i - 1 > p.line) folds.push(new vscode.FoldingRange(p.line, i - 1));
            }
            hStack.push({ level, line: i });
          }

          if (/^(\s*)(!!!|\?\?\?)\s*[a-zA-Z0-9_-]+/.test(text)) {
            aStack.push({ line: i, indent });
          }
        }

        while (hStack.length) {
          const p = hStack.pop()!;
          if (document.lineCount - 1 > p.line) folds.push(new vscode.FoldingRange(p.line, document.lineCount - 1));
        }
        while (aStack.length) {
          const p = aStack.pop()!;
          if (document.lineCount - 1 > p.line) folds.push(new vscode.FoldingRange(p.line, document.lineCount - 1));
        }
        return folds;
      },
    })
  );

  updateDecorations();
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateDecorations),
    vscode.workspace.onDidChangeTextDocument(() => updateDecorations())
  );
}

export function deactivate() {}