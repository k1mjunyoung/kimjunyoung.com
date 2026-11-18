"use client";

import { useImperativeHandle, useMemo, useRef, type Ref } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorSelection } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// 색은 globals.css 토큰과 article.css의 문법 색(--sn-*)을 쓴다. 다크모드는 CSS 변수가 알아서 바뀐다.
const highlight = HighlightStyle.define([
  // 마크다운
  { tag: t.heading1, fontWeight: "700", fontSize: "1.25em" },
  { tag: t.heading2, fontWeight: "700", fontSize: "1.15em" },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], fontWeight: "700" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.url], color: "var(--brand)" },
  { tag: t.quote, color: "var(--muted-foreground)" },
  { tag: t.monospace, fontFamily: "var(--font-mono)", color: "var(--sn-keyword)" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--muted-foreground)" },
  // 코드 블록 안 (언어별 문법)
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--sn-comment)", fontStyle: "italic" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword], color: "var(--sn-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--sn-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--sn-constant)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.typeName], color: "var(--sn-entity)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--sn-variable)" },
  { tag: [t.tagName, t.angleBracket], color: "var(--sn-tag)" },
]);

const theme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "14.5px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.75",
  },
  ".cm-content": { padding: "20px 0 40vh", caretColor: "var(--brand)" },
  ".cm-line": { padding: "0 20px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--brand)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--brand) 22%, transparent) !important",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--muted) 70%, transparent)" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
  ".cm-matchingBracket": { backgroundColor: "var(--muted)", outline: "1px solid var(--border)" },
  ".cm-panels": { backgroundColor: "var(--background)", color: "var(--foreground)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--border)" },
  ".cm-searchMatch": { backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)" },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "color-mix(in srgb, var(--brand) 38%, transparent)",
  },
  ".cm-textfield, .cm-button": { fontFamily: "inherit", fontSize: "12px" },
});

// --- 서식 명령 (툴바와 단축키가 같이 쓴다) ---

/** 선택 영역을 앞뒤로 감싼다. 선택이 없으면 placeholder를 넣고 그 부분을 선택한다 */
function wrap(view: EditorView, before: string, after: string, placeholder: string): boolean {
  view.dispatch(
    view.state.changeByRange((range) => {
      const text = view.state.sliceDoc(range.from, range.to) || placeholder;
      const insert = before + text + after;
      const start = range.from + before.length;
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(start, start + text.length),
      };
    }),
  );
  view.focus();
  return true;
}

/** 선택한 줄마다 앞에 붙인다. 이미 있으면 뗀다 (제목은 다른 단계 제목을 바꾼다) */
function togglePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const changes = [];
  const seen = new Set<number>();
  for (const range of state.selection.ranges) {
    for (let pos = range.from; pos <= range.to; ) {
      const line = state.doc.lineAt(pos);
      if (!seen.has(line.number)) {
        seen.add(line.number);
        const heading = prefix.startsWith("#") ? /^#{1,6} /.exec(line.text) : null;
        if (line.text.startsWith(prefix)) {
          changes.push({ from: line.from, to: line.from + prefix.length });
        } else if (heading) {
          changes.push({ from: line.from, to: line.from + heading[0].length, insert: prefix });
        } else {
          changes.push({ from: line.from, insert: prefix });
        }
      }
      pos = line.to + 1;
    }
  }
  view.dispatch({ changes });
  view.focus();
  return true;
}

function codeBlock(view: EditorView): boolean {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);
  const line = view.state.doc.lineAt(range.from);
  const lead = range.from === line.from ? "" : "\n";
  const insert = `${lead}\`\`\`\n${text}\n\`\`\`\n`;
  // 언어 이름을 바로 쓸 수 있도록 ``` 뒤에 커서를 둔다
  const cursor = range.from + lead.length + 3;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: cursor },
  });
  view.focus();
  return true;
}

function link(view: EditorView, image = false): boolean {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to) || (image ? "설명" : "텍스트");
  const insert = `${image ? "!" : ""}[${text}](url)`;
  const urlStart = range.from + insert.length - 4;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: urlStart, head: urlStart + 3 },
  });
  view.focus();
  return true;
}

export const commands = {
  bold: (v: EditorView) => wrap(v, "**", "**", "굵게"),
  italic: (v: EditorView) => wrap(v, "*", "*", "기울임"),
  strike: (v: EditorView) => wrap(v, "~~", "~~", "취소선"),
  code: (v: EditorView) => wrap(v, "`", "`", "code"),
  h2: (v: EditorView) => togglePrefix(v, "## "),
  h3: (v: EditorView) => togglePrefix(v, "### "),
  quote: (v: EditorView) => togglePrefix(v, "> "),
  ul: (v: EditorView) => togglePrefix(v, "- "),
  ol: (v: EditorView) => togglePrefix(v, "1. "),
  codeBlock,
  link: (v: EditorView) => link(v),
  image: (v: EditorView) => link(v, true),
};

export type CommandName = keyof typeof commands;

const formatKeymap = keymap.of([
  { key: "Mod-b", run: commands.bold },
  { key: "Mod-i", run: commands.italic },
  { key: "Mod-k", run: commands.link },
  { key: "Mod-e", run: commands.code },
  { key: "Mod-Shift-x", run: commands.strike },
]);

export interface MarkdownEditorHandle {
  run(name: CommandName): void;
}

interface Props {
  value: string;
  onChange(value: string): void;
  /** 툴바에서 서식 명령을 실행할 때 쓴다 (next/dynamic으로 불러오므로 ref 대신 prop으로 받는다) */
  handleRef?: Ref<MarkdownEditorHandle>;
}

/** 마크다운 원문 편집기 (CodeMirror 6). 원문 그대로 저장하고, 렌더링은 미리보기가 맡는다 */
export default function MarkdownEditor({ value, onChange, handleRef }: Props) {
  const cm = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(handleRef, () => ({
    run(name) {
      const view = cm.current?.view;
      if (view) commands[name](view);
    },
  }));

  const extensions = useMemo(
    () => [
      // 코드 블록 언어는 쓸 때 필요한 것만 불러온다 (language-data)
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(highlight),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": "본문 (마크다운)" }),
      formatKeymap,
      theme,
    ],
    [],
  );

  return (
    <CodeMirror
      ref={cm}
      className="md-editor h-full"
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="none"
      height="100%"
      placeholder="마크다운으로 본문을 쓰세요"
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLineGutter: false,
        autocompletion: false,
        syntaxHighlighting: false,
      }}
    />
  );
}
