"use client";
import { AttendeeShell, type ShellFunction } from "../AttendeeShell";
import type { ContentListItem } from "./logic";

const icon = (it: ContentListItem) =>
  it.kind === "link" ? "🔗" : it.mime?.startsWith("audio") ? "🎧" : it.mime?.startsWith("video") ? "🎬" : it.mime?.startsWith("image") ? "🖼️" : "📄";

export function ExtraContentCard({ fn, unlocked, items }: { fn: ShellFunction; unlocked: boolean; items: ContentListItem[] }) {
  const list = (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id}>
          {it.url ? (
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 transition-colors hover:bg-huddle-yellow/40"
            >
              <span>{icon(it)}</span>
              <span className="flex-1 font-medium">{it.title}</span>
              <span className="text-sm text-slate">{it.kind === "link" ? "Open" : "View"} →</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-slate">
              <span>🔒</span>
              <span className="flex-1">{it.title}</span>
            </div>
          )}
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-slate">Nothing here yet — check back after the event.</li>}
    </ul>
  );
  return (
    <AttendeeShell fn={fn} unlocked={unlocked} lockedBody={list} freeCta="Get the content">
      {list}
    </AttendeeShell>
  );
}
