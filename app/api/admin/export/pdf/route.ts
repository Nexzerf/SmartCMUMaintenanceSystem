import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { getDashboard, resolveRange } from "@/lib/dashboard";
import { buildPdf } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const range = resolveRange({ range: sp.get("range") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined });
  const file = await buildPdf(await getDashboard(range, { includeRows: true }));
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cmu-maintenance-${range.from}_${range.to}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
