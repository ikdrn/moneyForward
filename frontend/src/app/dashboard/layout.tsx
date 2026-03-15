import Link from "next/link";

const NAV = [
  { href: "/dashboard",        label: "収支明細" },
  { href: "/dashboard/assets", label: "資産管理" },
  { href: "/dashboard/trend",  label: "資産推移" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダナビ */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-6 px-4 h-14">
          <span className="font-bold text-blue-700 mr-4">💹 資産管理</span>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
