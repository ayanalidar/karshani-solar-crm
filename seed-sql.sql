-- KARSHANI ENTERPRISES Solar CMS — Seed Data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jmxbqvzxzezjqyoqfzdz/sql/new

-- Admin user (PIN: 0000)
INSERT INTO "User" (id, name, pin, role, "createdAt", "updatedAt")
VALUES ('admin-001', 'Admin', '0000', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Products (solar equipment)
INSERT INTO "Product" (id, name, category, brand, "unitPrice", "stockQuantity", "hsnCode", "gstRate", "createdAt", "updatedAt")
VALUES
  ('prod-001', 'WAAREE 540W Mono PERC Solar Panel', 'Solar Panel', 'WAAREE', 18500, 120, '85414300', 5, NOW(), NOW()),
  ('prod-002', 'Tata Power 445W Bifacial Panel', 'Solar Panel', 'Tata Power', 17500, 85, '85414300', 5, NOW(), NOW()),
  ('prod-003', 'Polycab 5kW Grid-Tie Inverter', 'Inverter', 'Polycab', 42000, 15, '85044090', 12, NOW(), NOW()),
  ('prod-004', 'Luminous 10kVA Solar Inverter', 'Inverter', 'Luminous', 68500, 8, '85044090', 12, NOW(), NOW()),
  ('prod-005', 'Exide 150Ah Solar Tubular Battery', 'Battery', 'Exide', 14500, 45, '85072000', 18, NOW(), NOW()),
  ('prod-006', 'Amaron 200Ah Solar Battery', 'Battery', 'Amaron', 17800, 30, '85072000', 18, NOW(), NOW()),
  ('prod-007', 'WAAREE 3kW Off-Grid Solar Kit', 'Solar Kit', 'WAAREE', 95000, 5, '85414300', 5, NOW(), NOW()),
  ('prod-008', 'Tata Power 5kW On-Grid Kit', 'Solar Kit', 'Tata Power', 135000, 3, '85414300', 5, NOW(), NOW()),
  ('prod-009', 'GI Mounting Structure 4-Panel', 'Mounting', 'Everest', 4500, 60, '73089090', 18, NOW(), NOW()),
  ('prod-010', 'Solar DC Cable 6mm (per meter)', 'Accessories', 'Polycab', 65, 500, '85446090', 18, NOW(), NOW()),
  ('prod-011', 'MC4 Connector Pair', 'Accessories', 'RenewSys', 120, 200, '85369090', 18, NOW(), NOW()),
  ('prod-012', 'ACDB Box Single Phase', 'Accessories', 'Havells', 3500, 25, '85371000', 18, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Customers (Mathura & nearby)
INSERT INTO "Customer" (id, name, phone, address, city, state, "gstin", type, "createdAt", "updatedAt")
VALUES
  ('cust-001', 'Rajesh Kumar Sharma', '9876543210', 'Shyam Sundar Colony, Badh Pura Road', 'Mathura', 'Uttar Pradesh', '09ABCDE1234F1Z5', 'residential', NOW(), NOW()),
  ('cust-002', 'Amit Agarwal Industries', '9876543211', 'Dhauli Pyau, NH-19', 'Mathura', 'Uttar Pradesh', '09BCDEF2345G2Z6', 'commercial', NOW(), NOW()),
  ('cust-003', 'Green Future NGO', '9876543212', 'Vrindavan Parikrama Marg', 'Vrindavan', 'Uttar Pradesh', NULL, 'institutional', NOW(), NOW()),
  ('cust-004', 'Patel Solar Solutions', '9876543213', 'Goverdhan Road', 'Mathura', 'Uttar Pradesh', '09CDEFG3456H3Z7', 'dealer', NOW(), NOW()),
  ('cust-005', 'Meena Devi', '9876543214', 'Kosi Kalan Road, Chhata', 'Mathura', 'Uttar Pradesh', NULL, 'residential', NOW(), NOW()),
  ('cust-006', 'Radha Krishna Farms', '9876543215', 'Barsana Road', 'Barsana', 'Uttar Pradesh', NULL, 'commercial', NOW(), NOW()),
  ('cust-007', 'Sanjay Tyre Works', '9876543216', 'NH-2 Bypass', 'Mathura', 'Uttar Pradesh', '09DEFGH4567I4Z8', 'commercial', NOW(), NOW()),
  ('cust-008', 'Shakuntala Devi School', '9876543217', 'Masani Road', 'Mathura', 'Uttar Pradesh', NULL, 'institutional', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
