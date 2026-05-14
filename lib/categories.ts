export const CATEGORIES = [
  "Weddings",
  "Portraits",
  "Family & Newborn",
  "Real Estate",
  "Products",
  "Events",
  "Fashion",
  "Artistic",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Maps canonical English DB value → Categories translation key
export const CATEGORY_KEY: Record<string, string> = {
  "Weddings":        "weddings",
  "Portraits":       "portraits",
  "Family & Newborn":"family_newborn",
  "Real Estate":     "real_estate",
  "Products":        "products",
  "Events":          "events",
  "Fashion":         "fashion",
  "Artistic":        "artistic",
  "Other":           "other",
};
