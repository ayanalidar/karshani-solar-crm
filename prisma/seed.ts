import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://localhost:5432/postgres" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  await prisma.user.upsert({
    where: { id: "admin-001" },
    update: {},
    create: { id: "admin-001", name: "Admin", pin: "0000", role: "admin" },
  });

  // Seed products
  const products = [
    { id: "p1", name: "WAAREE 580WP TOPCON BIFACIAL", category: "Solar Panel", brand: "WAAREE", spec: "580W · Mono Bifacial", hsnCode: "854143", unitPrice: 11200, gstPercentage: 5, stockQuantity: 42 },
    { id: "p2", name: "Tata Power Solar 540WP Mono", category: "Solar Panel", brand: "Tata", spec: "540W · Half-Cut", hsnCode: "854143", unitPrice: 10500, gstPercentage: 5, stockQuantity: 28 },
    { id: "p3", name: "POLYCAB Solar Inv On-Grid 3 kWh", category: "Inverter", brand: "Polycab", spec: "3kW · Single Phase", hsnCode: "85044090", unitPrice: 32800, gstPercentage: 12, stockQuantity: 15 },
    { id: "p4", name: "POLYCAB Solar Inv On-Grid 5 kWh", category: "Inverter", brand: "Polycab", spec: "5kW · Three Phase", hsnCode: "85044090", unitPrice: 48500, gstPercentage: 12, stockQuantity: 8 },
    { id: "p5", name: "Exide Solar Tubular 150Ah", category: "Battery", brand: "Exide", spec: "150Ah · C10", hsnCode: "85072000", unitPrice: 14200, gstPercentage: 12, stockQuantity: 3 },
    { id: "p6", name: "Luminous Solar 200Ah Tall Tubular", category: "Battery", brand: "Luminous", spec: "200Ah · 5yr", hsnCode: "85072000", unitPrice: 18900, gstPercentage: 12, stockQuantity: 11 },
    { id: "p7", name: "Tata Mounting Structure 3kW Kit", category: "Mounting", brand: "Tata", spec: "GI · 6-panel", hsnCode: "73089090", unitPrice: 8500, gstPercentage: 18, stockQuantity: 20 },
    { id: "p8", name: "DC Cable 6mm² Copper (meter)", category: "Accessories", brand: "", spec: "UV Protected", hsnCode: "85446090", unitPrice: 65, gstPercentage: 18, stockQuantity: 500 },
    { id: "p9", name: "Luminous 445WP Mono PERC", category: "Solar Panel", brand: "Luminous", spec: "445W", hsnCode: "854143", unitPrice: 8750, gstPercentage: 5, stockQuantity: 5 },
    { id: "p10", name: "ACDB Box 3kW with SPD", category: "Accessories", brand: "", spec: "IP65", hsnCode: "85371000", unitPrice: 4500, gstPercentage: 18, stockQuantity: 12 },
    { id: "p11", name: "MC4 Connector Pair", category: "Accessories", brand: "", spec: "IP68", hsnCode: "85369090", unitPrice: 180, gstPercentage: 18, stockQuantity: 200 },
    { id: "p12", name: "Amaron Solar 100Ah Tubular", category: "Battery", brand: "Amaron", spec: "100Ah", hsnCode: "85072000", unitPrice: 9800, gstPercentage: 12, stockQuantity: 7 },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // Seed customers
  const customers = [
    { id: "c1", name: "Murarilal Ji", phone: "+91 98765 43210", city: "Mathura", gstin: "", totalPurchases: 185000 },
    { id: "c2", name: "Rajesh Kumar", phone: "+91 98112 34567", city: "Vrindavan", gstin: "09ABCDE1234F1Z5", totalPurchases: 246000 },
    { id: "c3", name: "Priya Singh", phone: "+91 98734 56789", city: "Kosi Kalan", gstin: "09FGHIJ5678K2Z6", totalPurchases: 112000 },
    { id: "c4", name: "Amit Sharma", phone: "+91 98109 87654", city: "Govardhan", gstin: "", totalPurchases: 62400 },
    { id: "c5", name: "Suresh Patel", phone: "+91 98991 23456", city: "Mathura", gstin: "09KLMNO9012P3Z7", totalPurchases: 78500 },
    { id: "c6", name: "Anita Devi", phone: "+91 70172 34567", city: "Chhata", gstin: "", totalPurchases: 54000 },
    { id: "c7", name: "Vikram Singh", phone: "+91 94127 65432", city: "Barsana", gstin: "", totalPurchases: 32000 },
    { id: "c8", name: "Ramesh Yadav", phone: "+91 98371 23456", city: "Mathura", gstin: "09PQRST3456U4Z8", totalPurchases: 94500 },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({ where: { id: c.id }, update: c, create: c });
  }

  console.log("✓ Seed complete — 1 admin, 12 products, 8 customers");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
