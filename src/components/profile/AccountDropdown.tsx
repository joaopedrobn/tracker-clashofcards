import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ClashAccount } from "../../types/clashAccount";

interface Props {
  accounts: ClashAccount[];
  value: string;
  onChange: (accountId: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  testId?: string;
}

function accountDisplayText(account: ClashAccount): string {
  return `${account.accountLabel} · ${account.clashNickname} · ${account.clashPlayerTag}`;
}

export function AccountDropdown({ accounts, value, onChange, ariaLabel, disabled = false, testId }: Props) {
  const [open, setOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = accounts.find((account) => account.id === value) ?? accounts[0] ?? null;
  const selectedIndex = Math.max(0, accounts.findIndex((account) => account.id === selected?.id));

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent | TouchEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("touchstart", closeOutside); };
  }, [open]);

  useEffect(() => { if (open) { const bounds = rootRef.current?.getBoundingClientRect(); setMenuAbove(Boolean(bounds && bounds.bottom + 270 > window.innerHeight && bounds.top > 270)); optionRefs.current[selectedIndex]?.focus(); } }, [open, selectedIndex]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? (index + 1) % accounts.length : (index - 1 + accounts.length) % accounts.length;
    optionRefs.current[next]?.focus();
  };

  if (!selected) return null;
  const fullText = accountDisplayText(selected);
  const toggle = () => { if (!disabled && accounts.length > 1) setOpen((current) => !current); };
  return <div ref={rootRef} className="relative min-w-0 w-full" data-testid={testId}>
    <button ref={triggerRef} type="button" className="field flex h-12 w-full min-w-0 items-center gap-2 py-1.5 pl-3 pr-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-default disabled:opacity-100" title={fullText} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} disabled={disabled || accounts.length <= 1} onClick={toggle} onKeyDown={(event) => { if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open && accounts.length > 1) { event.preventDefault(); setOpen(true); } }}>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-stone-100">{selected.accountLabel} · {selected.clashNickname}</span><span className="block truncate text-[11px] leading-tight text-stone-500 sm:hidden">{selected.clashPlayerTag}</span></span>
      <span className="hidden max-w-[38%] shrink-0 truncate text-xs text-stone-400 sm:block">{selected.clashPlayerTag}</span>
      {accounts.length > 1 && <ChevronDown size={16} className={`shrink-0 text-stone-400 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />}
    </button>
    {open && <div className={`panel-metal absolute left-0 right-0 z-50 max-h-64 min-w-0 overflow-y-auto rounded-2xl border border-white/10 p-1.5 shadow-2xl ${menuAbove ? "bottom-[calc(100%+.4rem)]" : "top-[calc(100%+.4rem)]"}`} role="listbox" aria-label={ariaLabel}>
      {accounts.map((account, index) => { const active = account.id === selected.id; return <button key={account.id} ref={(element) => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={active} title={accountDisplayText(account)} className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-amber-300 ${active ? "bg-amber-300/12 text-amber-200" : "text-stone-300 hover:bg-white/6"}`} onClick={() => { onChange(account.id); setOpen(false); window.requestAnimationFrame(() => triggerRef.current?.focus()); }} onKeyDown={(event) => moveFocus(event, index)}><span className="min-w-0 flex-1"><span className="block break-words text-sm font-black [overflow-wrap:anywhere]">{account.accountLabel} · {account.clashNickname}</span><span className="block text-xs text-stone-500">{account.clashPlayerTag}</span></span>{active && <Check size={15} className="shrink-0 text-amber-300" aria-hidden="true" />}</button>; })}
    </div>}
  </div>;
}
