// Pre-built quotation templates for common solar system configurations.
// These are "starting points" — not stored in the DB. When a user picks
// a template, the quotation builder is pre-filled with these line items
// + system description, which they can then edit before saving.

export type TemplateLineItem = {
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  // amount is computed: quantity * unitPrice
};

export type QuotationTemplate = {
  id: string;
  name: string;
  description: string;
  systemDescription: string;
  items: TemplateLineItem[];
};

export const QUOTATION_TEMPLATES: QuotationTemplate[] = [
  {
    id: "home-3kw",
    name: "3kW Home Solar System",
    description: "Complete on-grid solar system for a typical home — 6 panels + inverter + mounting + accessories",
    systemDescription: "3kW On-Grid Solar Power Generating System",
    items: [
      { itemName: "WAAREE 580WP TOPCON BIFACIAL Solar Panel", hsnCode: "854143", quantity: 6, unitPrice: 11200, gstPercentage: 5 },
      { itemName: "POLYCAB Solar Inv On-Grid 3 kWh", hsnCode: "85044090", quantity: 1, unitPrice: 32800, gstPercentage: 12 },
      { itemName: "Tata Mounting Structure 3kW Kit", hsnCode: "73089090", quantity: 1, unitPrice: 8500, gstPercentage: 18 },
      { itemName: "ACDB Box 3kW with SPD", hsnCode: "85371000", quantity: 1, unitPrice: 4500, gstPercentage: 18 },
      { itemName: "DC Cable 6mm² Copper (meter)", hsnCode: "85446090", quantity: 50, unitPrice: 65, gstPercentage: 18 },
      { itemName: "MC4 Connector Pair", hsnCode: "85369090", quantity: 6, unitPrice: 180, gstPercentage: 18 },
      { itemName: "Installation & Commissioning", hsnCode: "998731", quantity: 1, unitPrice: 8000, gstPercentage: 18 },
    ],
  },
  {
    id: "home-5kw",
    name: "5kW Home Solar System",
    description: "Larger on-grid system for bigger homes — 10 panels + 5kW inverter + structure + accessories",
    systemDescription: "5kW On-Grid Solar Power Generating System",
    items: [
      { itemName: "WAAREE 580WP TOPCON BIFACIAL Solar Panel", hsnCode: "854143", quantity: 10, unitPrice: 11200, gstPercentage: 5 },
      { itemName: "POLYCAB Solar Inv On-Grid 5 kWh", hsnCode: "85044090", quantity: 1, unitPrice: 48500, gstPercentage: 12 },
      { itemName: "Tata Mounting Structure 5kW Kit", hsnCode: "73089090", quantity: 1, unitPrice: 13500, gstPercentage: 18 },
      { itemName: "ACDB Box 5kW with SPD+MCB", hsnCode: "85371000", quantity: 1, unitPrice: 6800, gstPercentage: 18 },
      { itemName: "DC Cable 6mm² Copper (meter)", hsnCode: "85446090", quantity: 80, unitPrice: 65, gstPercentage: 18 },
      { itemName: "MC4 Connector Pair", hsnCode: "85369090", quantity: 10, unitPrice: 180, gstPercentage: 18 },
      { itemName: "Installation & Commissioning", hsnCode: "998731", quantity: 1, unitPrice: 12000, gstPercentage: 18 },
    ],
  },
  {
    id: "commercial-10kw",
    name: "10kW Commercial Solar Plant",
    description: "Commercial-grade system for shops/small factories — 18 panels + 10kW inverter + 3-phase setup",
    systemDescription: "10kW Commercial Solar Power Plant (3-Phase)",
    items: [
      { itemName: "WAAREE 580WP TOPCON BIFACIAL Solar Panel", hsnCode: "854143", quantity: 18, unitPrice: 11200, gstPercentage: 5 },
      { itemName: "POLYCAB Solar Inv On-Grid 10 kWh (3-Phase)", hsnCode: "85044090", quantity: 1, unitPrice: 85000, gstPercentage: 12 },
      { itemName: "Tata Mounting Structure 10kW Kit", hsnCode: "73089090", quantity: 1, unitPrice: 24000, gstPercentage: 18 },
      { itemName: "ACDB Box 10kW with SPD+MCB", hsnCode: "85371000", quantity: 1, unitPrice: 12000, gstPercentage: 18 },
      { itemName: "DC Cable 6mm² Copper (meter)", hsnCode: "85446090", quantity: 150, unitPrice: 65, gstPercentage: 18 },
      { itemName: "MC4 Connector Pair", hsnCode: "85369090", quantity: 18, unitPrice: 180, gstPercentage: 18 },
      { itemName: "Earthing Kit + Lightning Arrester", hsnCode: "85353000", quantity: 1, unitPrice: 6500, gstPercentage: 18 },
      { itemName: "Installation & Commissioning", hsnCode: "998731", quantity: 1, unitPrice: 25000, gstPercentage: 18 },
    ],
  },
  {
    id: "hybrid-3kw",
    name: "3kW Hybrid Solar System (with Battery)",
    description: "Off-grid/hybrid system with battery backup — 6 panels + hybrid inverter + 2 batteries",
    systemDescription: "3kW Hybrid Solar Power System with Battery Backup",
    items: [
      { itemName: "WAAREE 580WP TOPCON BIFACIAL Solar Panel", hsnCode: "854143", quantity: 6, unitPrice: 11200, gstPercentage: 5 },
      { itemName: "Tata Solar Inv Off-Grid 5kVA (Hybrid)", hsnCode: "85044090", quantity: 1, unitPrice: 62000, gstPercentage: 12 },
      { itemName: "Luminous Solar 200Ah Tall Tubular", hsnCode: "85072000", quantity: 2, unitPrice: 18900, gstPercentage: 12 },
      { itemName: "Tata Mounting Structure 3kW Kit", hsnCode: "73089090", quantity: 1, unitPrice: 8500, gstPercentage: 18 },
      { itemName: "ACDB Box 3kW with SPD", hsnCode: "85371000", quantity: 1, unitPrice: 4500, gstPercentage: 18 },
      { itemName: "DC Cable 6mm² Copper (meter)", hsnCode: "85446090", quantity: 50, unitPrice: 65, gstPercentage: 18 },
      { itemName: "MC4 Connector Pair", hsnCode: "85369090", quantity: 6, unitPrice: 180, gstPercentage: 18 },
      { itemName: "Installation & Commissioning", hsnCode: "998731", quantity: 1, unitPrice: 10000, gstPercentage: 18 },
    ],
  },
  {
    id: "solar-pump-2kw",
    name: "2kW Solar Water Pump",
    description: "Solar pump system for irrigation — 4 panels + pump controller + DC pump",
    systemDescription: "2kW Solar Water Pumping System",
    items: [
      { itemName: "Tata Power Solar 540WP Mono", hsnCode: "854143", quantity: 4, unitPrice: 10500, gstPercentage: 5 },
      { itemName: "Solar Pump Controller 2kW (VFD)", hsnCode: "85044090", quantity: 1, unitPrice: 28000, gstPercentage: 12 },
      { itemName: "DC Submersible Pump 2HP", hsnCode: "84137010", quantity: 1, unitPrice: 35000, gstPercentage: 12 },
      { itemName: "Tata Mounting Structure (Pump Kit)", hsnCode: "73089090", quantity: 1, unitPrice: 6500, gstPercentage: 18 },
      { itemName: "DC Cable 6mm² Copper (meter)", hsnCode: "85446090", quantity: 30, unitPrice: 65, gstPercentage: 18 },
      { itemName: "Installation & Commissioning", hsnCode: "998731", quantity: 1, unitPrice: 6000, gstPercentage: 18 },
    ],
  },
  {
    id: "battery-replacement",
    name: "Battery Replacement Service",
    description: "Replace old solar batteries — 2x 150Ah tubular batteries + disposal of old units",
    systemDescription: "Solar Battery Replacement (2x 150Ah)",
    items: [
      { itemName: "Exide Solar Tubular 150Ah", hsnCode: "85072000", quantity: 2, unitPrice: 14200, gstPercentage: 12 },
      { itemName: "Battery Replacement Labor", hsnCode: "998731", quantity: 1, unitPrice: 1500, gstPercentage: 18 },
      { itemName: "Old Battery Disposal (credit)", hsnCode: "998731", quantity: 1, unitPrice: -2000, gstPercentage: 0 },
    ],
  },
  {
    id: "amc-annual",
    name: "Annual Maintenance Contract (AMC)",
    description: "Annual service contract — 4 quarterly visits + cleaning + parts replacement",
    systemDescription: "Annual Maintenance Contract (4 Quarterly Visits)",
    items: [
      { itemName: "Quarterly Inspection & Maintenance Visit", hsnCode: "998731", quantity: 4, unitPrice: 2500, gstPercentage: 18 },
      { itemName: "Panel Cleaning (per visit)", hsnCode: "998731", quantity: 4, unitPrice: 1500, gstPercentage: 18 },
      { itemName: "MC4 Connector Replacement (spare)", hsnCode: "85369090", quantity: 4, unitPrice: 180, gstPercentage: 18 },
      { itemName: "DC Cable Spares (meter)", hsnCode: "85446090", quantity: 10, unitPrice: 65, gstPercentage: 18 },
    ],
  },
];
