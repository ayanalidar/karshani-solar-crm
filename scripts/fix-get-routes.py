import re, os

# Map of file → table name
files = {
    "src/app/api/enquiries/route.ts": ("enquiries", "enq", "enquiry"),
    "src/app/api/suppliers/route.ts": ("supplier_orders", "orders", "supplierOrder"),
    "src/app/api/expenses/route.ts": ("expenses", "expenses", "expense"),
    "src/app/api/cashbook/route.ts": ("cash_book", "entries", "cashBookEntry"),
    "src/app/api/installations/route.ts": ("installations", "installations", "installation"),
    "src/app/api/amc/route.ts": ("amc_contracts", "contracts", "amcContract"),
    "src/app/api/employees/route.ts": ("employees", "employees", "employee"),
}

for filepath, (table, varname, model) in files.items():
    with open(filepath) as f:
        content = f.read()

    # Find the GET function and add rawSelect fallback
    old_get = f"  const {varname} = await prisma.{model}.findMany({{ orderBy: {{ createdAt: \"desc\" }}, take: 100 }});\n  return NextResponse.json({varname});"
    new_get = f"""  let {varname} = await prisma.{model}.findMany({{ orderBy: {{ createdAt: \"desc\" }}, take: 100 }});
  if (!{varname} || {varname}.length === 0) {{
    const rows = await rawSelect("{table}", "created_at.desc", 100);
    if (rows) {varname} = toCamelArray(rows) as any;
  }}
  return NextResponse.json({varname} || []);"""

    content = content.replace(old_get, new_get)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

print("Done")
