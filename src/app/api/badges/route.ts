import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { daysFromToday } from "@/lib/format";

// Returns badge counts used by the sidebar (low stock + AMC expiring soon)
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  let lowStock = 0;
  let amcExpiring = 0;

  try {
    const products = await prisma.product.findMany({ select: { stockQuantity: true } });
    lowStock = products.filter((p) => p.stockQuantity < 5).length;
  } catch {
    lowStock = 0;
  }

  try {
    const contracts = await prisma.amcContract.findMany({ select: { expiryDate: true } });
    amcExpiring = contracts.filter((c) => {
      const days = daysFromToday(c.expiryDate);
      return days >= 0 && days <= 60;
    }).length;
  } catch {
    amcExpiring = 0;
  }

  return NextResponse.json({ lowStock, amcExpiring });
}
