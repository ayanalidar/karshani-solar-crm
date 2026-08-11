"use client";

import { formatINR, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import type { ModuleConfig } from "@/components/CrudTable";
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  enquiries: {
    slug: "enquiries",
    apiPath: "/api/enquiries",
    label: "Enquiries",
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "phone", label: "Phone", className: "font-mono text-xs" },
      { key: "source", label: "Source" },
      { key: "systemDescription", label: "System", className: "text-xs text-[#504d44]" },
      {
        key: "estimatedAmount",
        label: "Est. Amount",
        className: "text-right",
        format: (v) => formatINR(Number(v || 0)),
      },
      { key: "status", label: "Status", format: (v) => <StatusPill status={v} /> },
    ],
    fields: [
      { name: "customerName", label: "Customer Name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "source", label: "Source", type: "select", options: ["walk-in", "phone", "online", "referral", "whatsapp"] },
      { name: "systemDescription", label: "System Description", type: "textarea" },
      { name: "estimatedAmount", label: "Estimated Amount (₹)", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["new", "quoted", "negotiating", "won", "lost"] },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  suppliers: {
    slug: "suppliers",
    apiPath: "/api/suppliers",
    label: "Suppliers & PO",
    columns: [
      { key: "poNumber", label: "PO No.", className: "font-mono text-xs" },
      { key: "supplierName", label: "Supplier" },
      { key: "items", label: "Items", className: "text-xs text-[#504d44]" },
      { key: "amount", label: "Amount", className: "text-right", format: (v) => formatINR(Number(v || 0)) },
      { key: "orderDate", label: "Order Date", format: (v) => formatDate(v) },
      { key: "status", label: "Status", format: (v) => <StatusPill status={v} /> },
    ],
    fields: [
      { name: "supplierName", label: "Supplier Name", type: "text", required: true },
      { name: "items", label: "Items (description)", type: "textarea", required: true },
      { name: "amount", label: "Amount (₹)", type: "number" },
      { name: "orderDate", label: "Order Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["pending", "delivered", "cancelled"] },
    ],
  },
  expenses: {
    slug: "expenses",
    apiPath: "/api/expenses",
    label: "Expenses",
    columns: [
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", className: "text-right", format: (v) => formatINR(Number(v || 0)) },
      { key: "expenseDate", label: "Date", format: (v) => formatDate(v) },
    ],
    fields: [
      { name: "category", label: "Category", type: "select", required: true, options: ["Rent", "Salary", "Utilities", "Transport", "Marketing", "Purchase", "Maintenance", "Misc"] },
      { name: "description", label: "Description", type: "textarea" },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
      { name: "expenseDate", label: "Date", type: "date" },
    ],
  },
  cashbook: {
    slug: "cashbook",
    apiPath: "/api/cashbook",
    label: "Cash Book",
    columns: [
      { key: "entryDate", label: "Date", format: (v) => formatDate(v) },
      { key: "type", label: "Type", format: (v) => <StatusPill status={v} /> },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", className: "text-right", format: (v) => formatINR(Number(v || 0)) },
    ],
    fields: [
      { name: "type", label: "Type", type: "select", required: true, options: ["credit", "debit"] },
      { name: "description", label: "Description", type: "textarea" },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
      { name: "entryDate", label: "Date", type: "date" },
    ],
  },
  installations: {
    slug: "installations",
    apiPath: "/api/installations",
    label: "Installations",
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "systemDescription", label: "System", className: "text-xs text-[#504d44]" },
      { key: "installDate", label: "Install Date", format: (v) => formatDate(v) },
      { key: "team", label: "Team" },
      { key: "stage", label: "Stage", format: (v) => <StatusPill status={v} /> },
    ],
    fields: [
      { name: "customerName", label: "Customer Name", type: "text", required: true },
      { name: "systemDescription", label: "System Description", type: "textarea" },
      { name: "installDate", label: "Install Date", type: "date" },
      { name: "stage", label: "Stage", type: "select", options: ["scheduled", "in progress", "completed"] },
      { name: "team", label: "Team / Engineer", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  amc: {
    slug: "amc",
    apiPath: "/api/amc",
    label: "AMC & Warranty",
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "system", label: "System", className: "text-xs text-[#504d44]" },
      { key: "contractType", label: "Type", format: (v) => <StatusPill status={v} /> },
      { key: "startDate", label: "Start", format: (v) => formatDate(v) },
      { key: "expiryDate", label: "Expires", format: (v) => formatDate(v) },
    ],
    fields: [
      { name: "customerName", label: "Customer Name", type: "text", required: true },
      { name: "system", label: "System Description", type: "text" },
      { name: "contractType", label: "Contract Type", type: "select", options: ["AMC", "warranty"] },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "expiryDate", label: "Expiry Date", type: "date" },
    ],
  },
  employees: {
    slug: "employees",
    apiPath: "/api/employees",
    label: "Employees",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "phone", label: "Phone", className: "font-mono text-xs" },
      { key: "salary", label: "Salary", className: "text-right", format: (v) => formatINR(Number(v || 0)) },
      { key: "joinDate", label: "Join Date", format: (v) => formatDate(v) },
      { key: "active", label: "Status", format: (v) => (v ? <StatusPill status="active" /> : <StatusPill status="inactive" />) },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role / Designation", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "salary", label: "Salary (₹/month)", type: "number" },
      { name: "joinDate", label: "Join Date", type: "date" },
      { name: "active", label: "Active", type: "select", options: ["true", "false"] },
    ],
  },
};

