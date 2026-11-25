"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab, toggleComment } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, openSearchPanel, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { langExtension, type LangId } from "./languages";

/** Syntax colors come from CSS variables, so the editor follows the app theme. */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.operatorKeyword, t.controlKeyword, t.moduleKeyword], color: "var(--syn-keyword)" },
  { tag: [t.definitionKeyword], color: "var(--syn-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp, t.character], color: "var(--syn-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--syn-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: "var(--syn-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--syn-function)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--syn-type)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--syn-property)" },
  { tag: [t.definition(t.variableName)], color: "var(--syn-variable)" },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: "var(--syn-punct)" },
  { tag: [t.heading, t.heading1, t.heading2, t.heading3], color: "var(--syn-heading)", fontWeight: "700" },
  { tag: [t.strong], fontWeight: "700" },
  { tag: [t.emphasis], fontStyle: "italic" },
  { tag: [t.link, t.url], color: "var(--syn-string)", textDecoration: "underline" },
  { tag: [t.monospace], color: "var(--syn-string)" },
  { tag: [t.list, t.quote], color: "var(--syn-property)" },
  { tag: [t.meta, t.processingInstruction, t.contentSeparator], color: "var(--syn-comment)" },
  { tag: [t.invalid], color: "var(--bad)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "var(--editor-font, 13.5px)", backgroundColor: "var(--editor-bg)", color: "var(--text)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65", overflow: "auto" },
  ".cm-content": { padding: "10px 0 40vh", caretColor: "var(--accent-mark)" },
  ".cm-line": { padding: "0 16px 0 12px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent-mark)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--editor-selection) !important" },
  ".cm-activeLine": { backgroundColor: "var(--editor-line)" },
  ".cm-gutters": { backgroundColor: "var(--editor-bg)", color: "var(--text-3)", border: "none", paddingLeft: "6px" },
  ".cm-lineNumbers .cm-gutterElement": { minWidth: "3ch", padding: "0 10px 0 4px", opacity: "0.6" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text)", opacity: "1" },
  ".cm-activeLineGutter.cm-gutterElement": { opacity: "1" },
  ".cm-foldGutter .cm-gutterElement": { padding: "0 4px", color: "var(--text-3)" },
  ".cm-matchingBracket": { backgroundColor: "var(--accent-soft)", outline: "1px solid var(--accent-mark)", borderRadius: "2px" },
  ".cm-selectionMatch": { backgroundColor: "var(--editor-match)" },
  ".cm-searchMatch": { backgroundColor: "var(--warn-soft)", outline: "1px solid var(--warn)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "var(--accent-soft)" },
  ".cm-foldPlaceholder": { backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", padding: "0 6px", borderRadius: "4px" },
  ".cm-tooltip": { backgroundColor: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", overflow: "hidden" },
  ".cm-tooltip-autocomplete > ul > li": { padding: "2px 10px", fontFamily: "var(--font-mono)" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--accent)", color: "white" },
  ".cm-panels": { backgroundColor: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--border)" },
  ".cm-search": { padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "12px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" },
  ".cm-search label": { display: "inline-flex", gap: "4px", alignItems: "center", color: "var(--text-2)" },
  ".cm-textfield": { backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 8px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "12px" },
  ".cm-button": { backgroundImage: "none", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", color: "var(--text-2)", fontSize: "12px" },
  ".cm-button:hover": { color: "var(--text)", borderColor: "var(--border-strong)" },
  ".cm-search button[name=close]": { color: "var(--text-3)", fontSize: "16px", right: "8px" },
});

export interface CodeEditorHandle {
  /** Replace the whole document as one undoable edit (used by Format). */
  replaceAll: (text: string) => void;
  focus: () => void;
  openSearch: () => void;
}

export interface CursorInfo {
  line: number;
  col: number;
  selected: number;
  lines: number;
}

interface Props {
  value: string;
  lang: LangId;
  onChange: (value: string) => void;
  onCursor?: (c: CursorInfo) => void;
  onSave?: () => void;
  onFormat?: () => void;
  onBlur?: () => void;
  ariaLabel: string;
  wrap?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor({ value, lang, onChange, onCursor, onSave, onFormat, onBlur, ariaLabel, wrap }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());
  // Latest callbacks without rebuilding the editor.
  const cb = useRef({ onChange, onCursor, onSave, onFormat, onBlur });
  useEffect(() => {
    cb.current = { onChange, onCursor, onSave, onFormat, onBlur };
  });

  useEffect(() => {
    const report = (v: EditorView) => {
      const sel = v.state.selection.main;
      const line = v.state.doc.lineAt(sel.head);
      cb.current.onCursor?.({ line: line.number, col: sel.head - line.from + 1, selected: Math.abs(sel.to - sel.from), lines: v.state.doc.lines });
    };
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter({ openText: "⌄", closedText: "›" }),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          EditorState.tabSize.of(2),
          indentUnit.of("  "),
          indentOnInput(),
          syntaxHighlighting(highlight),
          bracketMatching(),
          closeBrackets(),
          autocompletion({ activateOnTyping: true }),
          rectangularSelection(),
          crosshairCursor(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([
            { key: "Mod-s", preventDefault: true, run: () => (cb.current.onSave?.(), true) },
            { key: "Shift-Alt-f", preventDefault: true, run: () => (cb.current.onFormat?.(), true) },
            { key: "Mod-/", run: toggleComment },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          langComp.current.of(langExtension(lang)),
          wrapComp.current.of(wrap ? EditorView.lineWrapping : []),
          theme,
          EditorView.contentAttributes.of({ "aria-label": ariaLabel, spellcheck: "false", autocapitalize: "off", autocorrect: "off" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString());
            if (u.docChanged || u.selectionSet) report(u.view);
            if (u.focusChanged && !u.view.hasFocus) cb.current.onBlur?.();
          }),
        ],
      }),
    });
    view.current = v;
    report(v);
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once per mounted file; later prop changes go through compartments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A change from outside (an agent, the shell, time travel) replaces the document.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const cur = v.state.doc.toString();
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: langComp.current.reconfigure(langExtension(lang)) });
  }, [lang]);
  useEffect(() => {
    view.current?.dispatch({ effects: wrapComp.current.reconfigure(wrap ? EditorView.lineWrapping : []) });
  }, [wrap]);

  useImperativeHandle(ref, () => ({
    replaceAll: (text) => {
      const v = view.current;
      if (!v) return;
      const cur = v.state.doc.toString();
      if (cur === text) return;
      const head = Math.min(v.state.selection.main.head, text.length);
      v.dispatch({ changes: { from: 0, to: cur.length, insert: text }, selection: { anchor: head } });
    },
    focus: () => view.current?.focus(),
    openSearch: () => {
      if (view.current) openSearchPanel(view.current);
    },
  }));

  return <div ref={host} className="h-full min-h-0" />;
});
