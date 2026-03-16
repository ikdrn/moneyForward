"use client";

interface UpgradeWallProps {
  requiredPlan: "standard" | "advance";
  feature: string;
}

const PLAN_INFO = {
  standard: { label: "Standard", price: "¥540/月", color: "indigo" },
  advance:  { label: "Advance",  price: "¥980/月", color: "amber"  },
};

export function UpgradeWall({ requiredPlan, feature }: UpgradeWallProps) {
  const info = PLAN_INFO[requiredPlan];
  const colorMap = {
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", btn: "bg-indigo-600 hover:bg-indigo-700" },
    amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  btn: "bg-amber-600 hover:bg-amber-700" },
  };
  const c = colorMap[info.color as keyof typeof colorMap];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} px-6 py-8 text-center`}>
      <div className="text-2xl mb-3">🔒</div>
      <p className={`font-semibold text-base ${c.text} mb-1`}>
        {info.label}プランの機能です
      </p>
      <p className="text-sm text-slate-500 mb-5">
        {feature}は{info.label}（{info.price}）以上でご利用いただけます。
      </p>
      <a
        href="https://moneyforward.com/pages/premium_features"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-white ${c.btn} transition-colors`}
      >
        プランをアップグレード
      </a>
    </div>
  );
}
