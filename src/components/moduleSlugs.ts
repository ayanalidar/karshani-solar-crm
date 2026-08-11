// List of module slugs handled by the [slug] dynamic route.
// Kept in a separate non-client file so it can be imported by both
// server components (generateStaticParams) and client components.

export const MODULE_SLUGS = [
  "enquiries",
  "suppliers",
  "expenses",
  "cashbook",
  "installations",
  "amc",
  "employees",
] as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[number];
