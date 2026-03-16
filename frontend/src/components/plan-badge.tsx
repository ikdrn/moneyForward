"use client";

interface PlanBadgeProps {
  pname: string;
}

const PLAN_STYLE: Record<string, { label: string; cls: string }> = {
  free:     { label: "無料",     cls: "bg-slate-100 text-slate-500" },
  standard: { label: "Standard", cls: "bg-indigo-50 text-indigo-600 border border-indigo-200" },
  advance:  { label: "Advance",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
};

export function PlanBadge({ pname }: PlanBadgeProps) {
  const style = PLAN_STYLE[pname] ?? PLAN_STYLE.free;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.cls}`}>
      {style.label}
    </span>
  );
}
