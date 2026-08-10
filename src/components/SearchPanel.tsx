import { useMemo, useState } from "react";
import { usePlanner } from "../hooks/usePlanner";
import { useQuickNotes } from "../hooks/useQuickNotes";
import { native } from "../lib/native";
import { useFocus } from "../stores/focus";
import { useSettings } from "../stores/settings";
import { Icon } from "./ui/Icon";

type SearchResult = { id: string; title: string; detail: string; action: () => void | Promise<void> };

function parseMath(expression: string): number | null {
  const source = expression.replace(/\s+/g, "");
  if (!source || !/^[0-9+\-*/^().]+$/.test(source)) return null;
  const tokens = source.match(/\d+(?:\.\d+)?|[()+\-*/^]/g);
  if (!tokens || tokens.join("") !== source) return null;
  let index = 0;
  const peek = () => tokens[index];
  const consume = () => tokens[index++];
  const primary = (): number => {
    const token = consume();
    if (!token) throw new Error("incomplete expression");
    if (token === "(") {
      const value = addSub();
      if (consume() !== ")") throw new Error("missing parenthesis");
      return value;
    }
    if (token === "+") return primary();
    if (token === "-") return -primary();
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error("invalid number");
    return value;
  };
  const power = (): number => {
    const left = primary();
    return peek() === "^" ? (consume(), Math.pow(left, power())) : left;
  };
  const multiply = (): number => {
    let value = power();
    while (peek() === "*" || peek() === "/") {
      const operator = consume();
      const right = power();
      if (operator === "/" && right === 0) throw new Error("division by zero");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  function addSub(): number {
    let value = multiply();
    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = multiply();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }
  try {
    const value = addSub();
    return index === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

type Unit = "km" | "mi" | "kg" | "lb" | "cm" | "in" | "c" | "f" | "gb" | "mb";
const unitAliases: Record<string, Unit> = { kilometer: "km", kilometers: "km", km: "km", mile: "mi", miles: "mi", mi: "mi", kilogram: "kg", kilograms: "kg", kg: "kg", pound: "lb", pounds: "lb", lb: "lb", centimeter: "cm", centimeters: "cm", cm: "cm", inch: "in", inches: "in", in: "in", c: "c", "°c": "c", f: "f", "°f": "f", gb: "gb", gigabyte: "gb", gigabytes: "gb", mb: "mb", megabyte: "mb", megabytes: "mb" };

function convert(value: number, from: Unit, to: Unit): number | null {
  if (from === to) return value;
  const pair = `${from}:${to}`;
  const factors: Record<string, number> = { "km:mi": 0.621371, "mi:km": 1.609344, "kg:lb": 2.2046226218, "lb:kg": 0.45359237, "cm:in": 0.3937007874, "in:cm": 2.54, "gb:mb": 1024, "mb:gb": 1 / 1024 };
  if (factors[pair]) return value * factors[pair];
  if (from === "c" && to === "f") return value * 9 / 5 + 32;
  if (from === "f" && to === "c") return (value - 32) * 5 / 9;
  return null;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function SearchPanel({ onBack, onNotes, onPlanner, onSettings, onFocus }: { onBack: () => void; onNotes: () => void; onPlanner: () => void; onSettings: () => void; onFocus: () => void }) {
  const [query, setQuery] = useState("");
  const { notes } = useQuickNotes();
  const { items } = usePlanner();
  const { start } = useFocus();
  const { update } = useSettings();

  const results = useMemo<SearchResult[]>(() => {
    const raw = query.trim();
    const term = raw.toLowerCase();
    if (!term) return [];
    const commandResults: SearchResult[] = [];
    const volumeMatch = term.match(/^volume\s+(\d{1,3})%?$/);
    if (volumeMatch) {
      const value = Math.max(0, Math.min(100, Number(volumeMatch[1])));
      commandResults.push({ id: "command-volume", title: `Set volume to ${value}%`, detail: "Nutch action", action: () => native.setVolume(value).then(onBack) });
    }
    if (term === "mute" || term === "unmute" || term === "toggle mute") commandResults.push({ id: "command-mute", title: term === "unmute" ? "Unmute system audio" : term === "mute" ? "Mute system audio" : "Toggle mute", detail: "Nutch action", action: async () => { const status = await native.volume(); await native.setMuted(term === "mute" ? true : term === "unmute" ? false : !status.muted); onBack(); } });
    const focusMatch = term.match(/^focus\s+(\d{1,3})\s*(?:m|min|minutes)?$/);
    if (focusMatch) { const minutes = Math.max(1, Math.min(240, Number(focusMatch[1]))); commandResults.push({ id: "command-focus", title: `Start ${minutes}-minute Focus`, detail: "Nutch action", action: () => { start(minutes); onFocus(); } }); }
    if (term === "new note" || term === "note") commandResults.push({ id: "command-note", title: "Create a new note", detail: "Nutch action", action: onNotes });
    if (term === "new task" || term === "task" || term === "planner") commandResults.push({ id: "command-task", title: "Open Planner", detail: "Nutch action", action: onPlanner });
    if (term === "open settings" || term === "settings") commandResults.push({ id: "command-settings", title: "Open Settings", detail: "Nutch action", action: onSettings });
    if (term === "notch mode" || term === "island mode") { const mode = term.startsWith("notch") ? "notch" : "island"; commandResults.push({ id: `command-${mode}`, title: `Switch to ${mode[0].toUpperCase()}${mode.slice(1)} mode`, detail: "Nutch action", action: () => update({ displayStyle: mode }).then(onBack) }); }

    const conversion = term.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-z°]+)\s+(?:to|in)\s+([a-z°]+)$/);
    if (conversion) {
      const from = unitAliases[conversion[2]];
      const to = unitAliases[conversion[3]];
      const converted = from && to ? convert(Number(conversion[1]), from, to) : null;
      if (converted !== null) commandResults.push({ id: "conversion", title: `${formatNumber(Number(conversion[1]))} ${from} = ${formatNumber(converted)} ${to}`, detail: "Local conversion", action: () => undefined });
    }
    const expression = term.startsWith("calc ") ? raw.slice(5) : raw;
    const value = parseMath(expression);
    if (value !== null) commandResults.push({ id: "calculator", title: formatNumber(value), detail: "Calculator", action: () => undefined });

    const noteResults = notes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(term)).map((note) => ({ id: note.id, title: note.title || "Untitled note", detail: "Note", action: onNotes }));
    const plannerResults = items.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(term)).map((item) => ({ id: item.id, title: item.title, detail: "Planner", action: onPlanner }));
    return [...commandResults, ...noteResults, ...plannerResults];
  }, [items, notes, onBack, onFocus, onNotes, onPlanner, onSettings, query, start, update]);

  return <section className="search-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls"><Icon name="back" size="small" /></button><div><h1>Quick Search</h1><p>Apps, notes, tasks, commands, and calculations</p></div></header><label className="search-box"><Icon name="search" size="small" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘volume 50’, ‘20 km to miles’, or 2^8" /></label><div className="search-results">{query && results.length === 0 && <p className="notes-empty">No matching Nutch items.</p>}{results.map((result) => <button className="search-result" key={`${result.detail}-${result.id}`} onClick={() => void result.action()}><span>{result.detail}</span><strong>{result.title}</strong></button>)}</div></section>;
}
