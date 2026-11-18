import { z } from "zod";
import { ApiError } from "./errors.ts";
import type { SortId } from "./types";

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(" ");
    throw new ApiError(400, message || "Check the form and try again.");
  }
  return result.data;
}

const sortSchema = z.enum(["rating", "newest", "price_asc", "price_desc", "name"]);

const listSchema = z.object({
  q: z.string().trim().max(80, "Search is too long.").optional(),
  category: z.string().trim().max(40).optional(),
  sort: sortSchema.optional(),
});

export type ListInput = {
  q: string;
  category: string;
  sort: SortId;
};

export function normalizeList(input: unknown): ListInput {
  const parsed = parse(listSchema, input ?? {});
  const category = parsed.category ?? "";
  if (category !== "" && !/^[a-z0-9-]+$/.test(category)) {
    throw new ApiError(400, "Unknown category.");
  }
  const sort = parsed.sort ?? "rating";
  return { q: parsed.q ?? "", category, sort };
}

export function likePattern(q: string): string {
  const cleaned = q.trim().replace(/[%_\\]/g, "").slice(0, 80);
  if (!cleaned) return "";
  return `%${cleaned}%`;
}

export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "object";
}

export function cleanName(input: string): string {
  const name = input.replace(/\s+/g, " ").trim().slice(0, 60);
  return name.length >= 2 ? name : "Member";
}

export function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > 500_000) return null;
  return cents;
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export const profileInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name must be 60 characters or fewer."),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
});

export const reviewInput = z.object({
  productId: z.number().int().positive(),
  score: z.number().int().min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(100, "Title is too long."),
  body: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters.")
    .max(2000, "Review must be 2000 characters or fewer."),
});

export const reviewUpdateInput = z.object({
  id: z.number().int().positive(),
  score: z.number().int().min(1, "Choose a rating from 1 to 5.").max(5),
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(100),
  body: z.string().trim().min(20, "Write at least 20 characters.").max(2000),
});

export const productInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Name is too short.").max(80, "Name is too long."),
  brand: z.string().trim().min(2, "Brand is too short.").max(60, "Brand is too long."),
  categorySlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/, "Choose a category."),
  summary: z.string().trim().min(10, "Summary is too short.").max(180, "Summary is too long."),
  description: z
    .string()
    .trim()
    .min(20, "Description is too short.")
    .max(4000, "Description is too long."),
  priceCents: z.number().int().min(0, "Price cannot be negative.").max(500_000, "Price is too high."),
  imageUrl: z
    .string()
    .trim()
    .regex(/^\/products\/[a-z0-9-]+\.(png|jpe?g)$/, "Choose a catalog image."),
});

export const roleInput = z.object({
  userId: z.string().trim().min(1).max(128),
  role: z.enum(["user", "admin"]),
});

export const suspendInput = z.object({
  userId: z.string().trim().min(1).max(128),
  suspended: z.boolean(),
});

export const reviewStatusInput = z.object({
  id: z.number().int().positive(),
  status: z.enum(["published", "hidden"]),
});

export const idInput = z.object({
  id: z.number().int().positive(),
});

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Password is too long.")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Include a letter and a number.");

export const emailSchema = z
  .string()
  .trim()
  .max(160)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email.");
