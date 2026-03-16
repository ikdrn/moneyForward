export const dynamic = "force-dynamic";

// GET /api/v1/export/csv?type=transactions|balances
// Standard+ プラン限定: CSV エクスポート
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { getPlanLimits, isPremium, historyFrom } from "@/lib/plan";

function escapeCSV(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  return lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await verifyAuth();
    const plan = await getPlanLimits(userId);

    if (!isPremium(plan.pname)) {
      return NextResponse.json(
        { error: "CSVエクスポートはStandard以上のプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    const type  = req.nextUrl.searchParams.get("type") ?? "transactions";
    const since = historyFrom(plan.hislm);

    let csv: string;
    let filename: string;

    if (type === "balances") {
      const { rows } = await pool.query(
        `SELECT a.aname, a.atype, b.dates, b.amnts
         FROM TBL_BALAN b
         JOIN TBL_ASSET a ON a.objid = b.astid
         WHERE b.ownid = $1
           AND ($2::date IS NULL OR b.dates >= $2::date)
         ORDER BY b.dates DESC, a.aname`,
        [userId, since],
      );
      csv      = toCSV(["aname", "atype", "dates", "amnts"], rows);
      filename = "balances.csv";
    } else {
      const { rows } = await pool.query(
        `SELECT t.dates, c.cname, c.ctype, t.amnts
         FROM TBL_TRANS t
         JOIN TBL_CATEG c ON c.objid = t.catid
         WHERE t.ownid = $1
           AND ($2::date IS NULL OR t.dates >= $2::date)
         ORDER BY t.dates DESC`,
        [userId, since],
      );
      csv      = toCSV(["dates", "cname", "ctype", "amnts"], rows);
      filename = "transactions.csv";
    }

    return new NextResponse("\uFEFF" + csv, {  // BOM付き UTF-8 (Excel対応)
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
