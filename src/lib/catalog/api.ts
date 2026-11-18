import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { ApiError, isUniqueViolation } from "./errors";
import type {
  AdminProduct,
  AdminReview,
  AdminStats,
  AdminUser,
  Category,
  HomePayload,
  MyProductReview,
  OwnReview,
  ProductCard,
  ProductDetail,
  Profile,
  PublicReview,
} from "./types";
import {
  cleanName,
  idInput,
  likePattern,
  normalizeList,
  parse,
  productInput,
  profileInput,
  reviewInput,
  reviewStatusInput,
  reviewUpdateInput,
  roleInput,
  slugify,
  suspendInput,
  type ListInput,
} from "./validate";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  summary: string;
  description?: string;
  price_cents: number;
  image_url: string;
  category_slug: string;
  category_name: string;
  avg_rating: number | string | null;
  review_count: number | string | null;
  created_at: string | Date;
};

const ORDER_BY: Record<ListInput["sort"], string> = {
  rating: "avg_rating desc, review_count desc, p.name asc",
  newest: "p.created_at desc",
  price_asc: "p.price_cents asc, p.name asc",
  price_desc: "p.price_cents desc, p.name asc",
  name: "p.name asc",
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function mapProduct(row: ProductRow): ProductCard {
  return {
    id: num(row.id),
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    summary: row.summary,
    priceCents: num(row.price_cents),
    imageUrl: row.image_url,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    avgRating: num(row.avg_rating),
    reviewCount: num(row.review_count),
    createdAt: iso(row.created_at),
  };
}

function asOrigin(value: string): "house" | "member" {
  return value === "house" ? "house" : "member";
}

function asStatus(value: string): "published" | "hidden" {
  return value === "hidden" ? "hidden" : "published";
}

function asRole(value: string): "user" | "admin" {
  return value === "admin" ? "admin" : "user";
}

type ProfileRow = {
  user_id: string;
  display_name: string;
  bio: string;
  role: string;
  suspended: boolean;
  created_at: string | Date;
  email?: string;
};

function mapProfile(row: ProfileRow, email: string): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio ?? "",
    role: asRole(row.role),
    suspended: Boolean(row.suspended),
    email,
    createdAt: iso(row.created_at),
  };
}

async function ensureProfile(sql: Sql, userId: string): Promise<Profile> {
  const accounts = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId}
  `;
  const account = accounts[0];
  if (!account) throw new ApiError(401, "Unauthorized");
  const displayName = cleanName(account.name);
  const existing = await sql<ProfileRow>`
    select user_id, display_name, bio, role, suspended, created_at
    from profiles where user_id = ${userId}
  `;
  if (!existing[0]) {
    try {
      await sql`
        insert into profiles (user_id, display_name)
        values (${userId}, ${displayName})
      `;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  const admins = await sql<{ user_id: string }>`
    select user_id from profiles where role = 'admin' limit 1
  `;
  if (!admins[0]) {
    await sql`
      update profiles set role = 'admin', updated_at = now() where user_id = ${userId}
    `;
  }
  const created = await sql<ProfileRow>`
    select user_id, display_name, bio, role, suspended, created_at
    from profiles where user_id = ${userId}
  `;
  if (!created[0]) throw new ApiError(500, "Could not open a profile.");
  return mapProfile(created[0], account.email);
}

async function assertCanReview(sql: Sql, userId: string): Promise<Profile> {
  const profile = await ensureProfile(sql, userId);
  if (profile.suspended) throw new ApiError(403, "This account is suspended.");
  return profile;
}

async function requireAdmin(sql: Sql, userId: string): Promise<Profile> {
  const profile = await ensureProfile(sql, userId);
  if (profile.suspended) throw new ApiError(403, "This account is suspended.");
  if (profile.role !== "admin") throw new ApiError(403, "Admin access is required.");
  return profile;
}

export async function queryProducts(input: ListInput): Promise<ProductCard[]> {
  if (!Object.hasOwn(ORDER_BY, input.sort)) throw new ApiError(400, "Unknown sort.");
  const sql = await getSql();
  const rows = await sql.query<ProductRow>(
    `
    select
      p.id, p.slug, p.name, p.brand, p.summary, p.price_cents, p.image_url, p.created_at,
      c.slug as category_slug, c.name as category_name,
      coalesce((round((avg(ra.score) filter (where rv.status = 'published'))::numeric, 1))::float8, 0) as avg_rating,
      (count(rv.id) filter (where rv.status = 'published'))::int as review_count
    from products p
    join categories c on c.id = p.category_id
    left join reviews rv on rv.product_id = p.id
    left join ratings ra on ra.id = rv.rating_id
    where ($1 = '' or p.name ilike $1 or p.brand ilike $1 or p.summary ilike $1 or c.name ilike $1)
      and ($2 = '' or c.slug = $2)
    group by p.id, p.slug, p.name, p.brand, p.summary, p.price_cents, p.image_url, p.created_at, c.slug, c.name
    order by ${ORDER_BY[input.sort]}
    limit 48
    `,
    [likePattern(input.q), input.category],
  );
  return rows.map(mapProduct);
}

export async function queryCategories(): Promise<Category[]> {
  const sql = await getSql();
  const rows = await sql<{ slug: string; name: string; blurb: string; product_count: number }>`
    select c.slug, c.name, c.blurb,
      (select count(*)::int from products p where p.category_id = c.id) as product_count
    from categories c
    order by c.name
  `;
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    blurb: row.blurb,
    productCount: num(row.product_count),
  }));
}

export async function queryHome(): Promise<HomePayload> {
  const sql = await getSql();
  const statsRows = await sql<{
    products: number;
    reviews: number;
    categories: number;
    members: number;
  }>`
    select
      (select count(*)::int from products) as products,
      (select count(*)::int from reviews where status = 'published') as reviews,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from "user") as members
  `;
  const [categories, featured] = await Promise.all([
    queryCategories(),
    queryProducts({ q: "", category: "", sort: "rating" }),
  ]);
  const stats = statsRows[0];
  return {
    stats: {
      products: num(stats?.products),
      reviews: num(stats?.reviews),
      categories: num(stats?.categories),
      members: num(stats?.members),
    },
    categories,
    featured: featured.slice(0, 4),
  };
}

const emptyDistribution = (): ProductDetail["distribution"] => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

export async function queryProduct(slug: string): Promise<ProductDetail> {
  const clean = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,60}$/.test(clean)) throw new ApiError(400, "Unknown product.");
  const sql = await getSql();
  const rows = await sql<
    ProductRow & { description: string }
  >`
    select p.id, p.slug, p.name, p.brand, p.summary, p.description, p.price_cents, p.image_url,
      p.created_at, c.slug as category_slug, c.name as category_name,
      0::float8 as avg_rating, 0::int as review_count
    from products p
    join categories c on c.id = p.category_id
    where p.slug = ${clean}
  `;
  const row = rows[0];
  if (!row) throw new ApiError(404, "Product not found.");
  const reviewRows = await sql<{
    id: number;
    author_name: string;
    title: string;
    body: string;
    origin: string;
    created_at: string | Date;
    updated_at: string | Date;
    score: number;
  }>`
    select v.id, v.author_name, v.title, v.body, v.origin, v.created_at, v.updated_at, ra.score
    from reviews v
    join ratings ra on ra.id = v.rating_id
    where v.product_id = ${row.id} and v.status = 'published'
    order by v.created_at desc
  `;
  const distRows = await sql<{ score: number; count: number }>`
    select ra.score, count(*)::int as count
    from reviews v
    join ratings ra on ra.id = v.rating_id
    where v.product_id = ${row.id} and v.status = 'published'
    group by ra.score
  `;
  const distribution = emptyDistribution();
  for (const item of distRows) {
    const score = num(item.score);
    if (score >= 1 && score <= 5) distribution[score as 1 | 2 | 3 | 4 | 5] = num(item.count);
  }
  let weighted = 0;
  let count = 0;
  for (const score of [1, 2, 3, 4, 5] as const) {
    weighted += score * distribution[score];
    count += distribution[score];
  }
  const product = mapProduct({
    ...row,
    avg_rating: count ? Math.round((weighted / count) * 10) / 10 : 0,
    review_count: count,
  });
  const siblings = await queryProducts({ q: "", category: product.categorySlug, sort: "rating" });
  const reviews: PublicReview[] = reviewRows.map((item) => ({
    id: num(item.id),
    authorName: item.author_name,
    title: item.title,
    body: item.body,
    score: num(item.score),
    origin: asOrigin(item.origin),
    createdAt: iso(item.created_at),
    updatedAt: iso(item.updated_at),
  }));
  return {
    ...product,
    description: row.description,
    distribution,
    reviews,
    related: siblings.filter((item) => item.slug !== product.slug).slice(0, 3),
  };
}

export const getHome = createServerFn({ method: "GET" }).handler(async () => queryHome());

export const listProducts = createServerFn({ method: "GET" })
  .validator((input: unknown) => normalizeList(input))
  .handler(async ({ data }) => queryProducts(data));

export const listCategories = createServerFn({ method: "GET" }).handler(async () => queryCategories());

export const getProduct = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    if (typeof input !== "string") throw new ApiError(400, "Unknown product.");
    return input;
  })
  .handler(async ({ data }) => queryProduct(data));

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return ensureProfile(sql, context.userId);
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(profileInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    await sql`
      update profiles
      set display_name = ${data.displayName}, bio = ${data.bio}, updated_at = now()
      where user_id = ${context.userId}
    `;
    await sql`
      update "user" set name = ${data.displayName}, "updatedAt" = now() where id = ${context.userId}
    `;
    return ensureProfile(sql, context.userId);
  });

export const getMyReview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const id = num(input);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Unknown product.");
    return id;
  })
  .handler(async ({ context, data: productId }) => {
    const sql = await getSql();
    const products = await sql<{ id: number }>`select id from products where id = ${productId}`;
    if (!products[0]) throw new ApiError(404, "Product not found.");
    const rows = await sql<{
      id: number;
      title: string;
      body: string;
      score: number;
      status: string;
      created_at: string | Date;
      updated_at: string | Date;
    }>`
      select v.id, v.title, v.body, v.status, v.created_at, v.updated_at, ra.score
      from reviews v
      join ratings ra on ra.id = v.rating_id
      where v.product_id = ${productId} and v.user_id = ${context.userId} and v.origin = 'member'
    `;
    const row = rows[0];
    if (!row) return null;
    const review: MyProductReview = {
      id: num(row.id),
      title: row.title,
      body: row.body,
      score: num(row.score),
      status: asStatus(row.status),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    };
    return review;
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      title: string;
      body: string;
      status: string;
      created_at: string | Date;
      updated_at: string | Date;
      score: number;
      product_id: number;
      product_name: string;
      product_slug: string;
      image_url: string;
    }>`
      select v.id, v.title, v.body, v.status, v.created_at, v.updated_at, ra.score,
        p.id as product_id, p.name as product_name, p.slug as product_slug, p.image_url
      from reviews v
      join ratings ra on ra.id = v.rating_id
      join products p on p.id = v.product_id
      where v.user_id = ${context.userId} and v.origin = 'member'
      order by v.updated_at desc
    `;
    return rows.map(
      (row): OwnReview => ({
        id: num(row.id),
        title: row.title,
        body: row.body,
        score: num(row.score),
        status: asStatus(row.status),
        createdAt: iso(row.created_at),
        updatedAt: iso(row.updated_at),
        productId: num(row.product_id),
        productName: row.product_name,
        productSlug: row.product_slug,
        imageUrl: row.image_url,
      }),
    );
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await assertCanReview(sql, context.userId);
    const products = await sql<{ id: number }>`select id from products where id = ${data.productId}`;
    if (!products[0]) throw new ApiError(404, "Product not found.");
    try {
      const inserted = await sql<{ id: number }>`
        with new_rating as (
          insert into ratings (product_id, user_id, score)
          values (${data.productId}, ${context.userId}, ${data.score})
          returning id
        )
        insert into reviews (product_id, user_id, rating_id, author_name, title, body, origin)
        select ${data.productId}, ${context.userId}, id, ${profile.displayName}, ${data.title}, ${data.body}, 'member'
        from new_rating
        returning id
      `;
      return { id: num(inserted[0]?.id) };
    } catch (err) {
      if (isUniqueViolation(err)) throw new ApiError(409, "You already reviewed this product.");
      throw err;
    }
  });

export const updateReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewUpdateInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertCanReview(sql, context.userId);
    const updated = await sql<{ id: number }>`
      with upd as (
        update reviews
        set title = ${data.title}, body = ${data.body}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId} and origin = 'member'
        returning rating_id
      )
      update ratings
      set score = ${data.score}, updated_at = now()
      from upd
      where ratings.id = upd.rating_id and ratings.user_id = ${context.userId}
      returning ratings.id
    `;
    if (!updated[0]) throw new ApiError(404, "Review not found.");
    return { id: data.id };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(idInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const removed = await sql<{ id: number }>`
      delete from ratings
      where user_id = ${context.userId}
        and id in (
          select rating_id from reviews
          where id = ${data.id} and user_id = ${context.userId} and origin = 'member'
        )
      returning id
    `;
    if (!removed[0]) throw new ApiError(404, "Review not found.");
    return { ok: true };
  });

async function categoryId(sql: Sql, slug: string): Promise<number> {
  const rows = await sql<{ id: number }>`select id from categories where slug = ${slug}`;
  if (!rows[0]) throw new ApiError(400, "Unknown category.");
  return num(rows[0].id);
}

async function uniqueSlug(sql: Sql, base: string): Promise<string> {
  let slug = base;
  for (let i = 2; i < 40; i += 1) {
    const rows = await sql<{ id: number }>`select id from products where slug = ${slug} limit 1`;
    if (!rows[0]) return slug;
    slug = `${base}-${i}`;
  }
  throw new ApiError(409, "Could not create a unique link for that name.");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminStats> => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql<{
      products: number;
      users: number;
      reviews: number;
      hidden: number;
      suspended: number;
      avg_rating: number | string | null;
    }>`
      select
        (select count(*)::int from products) as products,
        (select count(*)::int from "user") as users,
        (select count(*)::int from reviews) as reviews,
        (select count(*)::int from reviews where status = 'hidden') as hidden,
        (select count(*)::int from profiles where suspended = true) as suspended,
        (
          select coalesce(round(avg(ra.score)::numeric, 1)::float8, 0)
          from ratings ra
          join reviews rv on rv.rating_id = ra.id
          where rv.status = 'published'
        ) as avg_rating
    `;
    const byCategory = await sql<{ name: string; reviews: number }>`
      select c.name,
        (
          select count(*)::int from reviews rv
          join products p on p.id = rv.product_id
          where p.category_id = c.id and rv.status = 'published'
        ) as reviews
      from categories c
      order by c.name
    `;
    const recent = await queryAdminReviews(sql);
    const row = rows[0];
    return {
      products: num(row?.products),
      users: num(row?.users),
      reviews: num(row?.reviews),
      hidden: num(row?.hidden),
      suspended: num(row?.suspended),
      avgRating: num(row?.avg_rating),
      byCategory: byCategory.map((item) => ({ name: item.name, reviews: num(item.reviews) })),
      recent: recent.slice(0, 5),
    };
  });

async function queryAdminReviews(sql: Sql): Promise<AdminReview[]> {
  const rows = await sql<{
    id: number;
    author_name: string;
    title: string;
    body: string;
    origin: string;
    status: string;
    created_at: string | Date;
    updated_at: string | Date;
    score: number;
    user_id: string;
    product_name: string;
    product_slug: string;
  }>`
    select v.id, v.author_name, v.title, v.body, v.origin, v.status, v.created_at, v.updated_at,
      v.user_id, ra.score, p.name as product_name, p.slug as product_slug
    from reviews v
    join ratings ra on ra.id = v.rating_id
    join products p on p.id = v.product_id
    order by v.created_at desc
    limit 100
  `;
  return rows.map((row) => ({
    id: num(row.id),
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    score: num(row.score),
    origin: asOrigin(row.origin),
    status: asStatus(row.status),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    userId: row.user_id,
    productName: row.product_name,
    productSlug: row.product_slug,
  }));
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql<ProductRow & { description: string }>`
      select p.id, p.slug, p.name, p.brand, p.summary, p.description, p.price_cents, p.image_url,
        p.created_at, c.slug as category_slug, c.name as category_name,
        coalesce((
          select round(avg(ra.score)::numeric, 1)::float8
          from reviews rv join ratings ra on ra.id = rv.rating_id
          where rv.product_id = p.id and rv.status = 'published'
        ), 0) as avg_rating,
        (select count(*)::int from reviews rv where rv.product_id = p.id) as review_count
      from products p
      join categories c on c.id = p.category_id
      order by p.updated_at desc
    `;
    return rows.map(
      (row): AdminProduct => ({
        ...mapProduct(row),
        description: row.description,
      }),
    );
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(productInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const cat = await categoryId(sql, data.categorySlug);
    if (data.id) {
      const updated = await sql<{ id: number; slug: string }>`
        update products
        set name = ${data.name}, brand = ${data.brand}, category_id = ${cat},
          summary = ${data.summary}, description = ${data.description},
          price_cents = ${data.priceCents}, image_url = ${data.imageUrl}, updated_at = now()
        where id = ${data.id}
        returning id, slug
      `;
      if (!updated[0]) throw new ApiError(404, "Product not found.");
      return updated[0];
    }
    const slug = await uniqueSlug(sql, slugify(data.name));
    const inserted = await sql<{ id: number; slug: string }>`
      insert into products (slug, name, brand, category_id, summary, description, price_cents, image_url)
      values (
        ${slug}, ${data.name}, ${data.brand}, ${cat}, ${data.summary},
        ${data.description}, ${data.priceCents}, ${data.imageUrl}
      )
      returning id, slug
    `;
    return inserted[0];
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(idInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const removed = await sql<{ id: number }>`delete from products where id = ${data.id} returning id`;
    if (!removed[0]) throw new ApiError(404, "Product not found.");
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql<{
      id: string;
      email: string;
      name: string;
      display_name: string | null;
      role: string | null;
      suspended: boolean | null;
      review_count: number;
      created_at: string | Date;
    }>`
      select u.id, u.email, u.name, u."createdAt" as created_at,
        p.display_name, p.role, p.suspended,
        (select count(*)::int from reviews r where r.user_id = u.id) as review_count
      from "user" u
      left join profiles p on p.user_id = u.id
      order by u."createdAt" desc
    `;
    return rows.map(
      (row): AdminUser => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name || cleanName(row.name),
        role: asRole(row.role ?? "user"),
        suspended: Boolean(row.suspended),
        reviewCount: num(row.review_count),
        createdAt: iso(row.created_at),
      }),
    );
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(roleInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new ApiError(400, "You can't remove your own admin access.");
    }
    const accounts = await sql<{ name: string }>`select name from "user" where id = ${data.userId}`;
    if (!accounts[0]) throw new ApiError(404, "User not found.");
    if (data.role !== "admin") {
      const admins = await sql<{ user_id: string }>`select user_id from profiles where role = 'admin'`;
      const targetIsAdmin = admins.some((row) => row.user_id === data.userId);
      const others = admins.filter((row) => row.user_id !== data.userId);
      if (targetIsAdmin && others.length === 0) {
        throw new ApiError(400, "The shelf needs at least one administrator.");
      }
    }
    await sql`
      insert into profiles (user_id, display_name, role)
      values (${data.userId}, ${cleanName(accounts[0].name)}, ${data.role})
      on conflict (user_id) do update
      set role = excluded.role, updated_at = now()
    `;
    return { ok: true };
  });

export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(suspendInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    if (data.userId === context.userId && data.suspended) {
      throw new ApiError(400, "You can't suspend your own account.");
    }
    const accounts = await sql<{ name: string }>`select name from "user" where id = ${data.userId}`;
    if (!accounts[0]) throw new ApiError(404, "User not found.");
    await sql`
      insert into profiles (user_id, display_name, suspended)
      values (${data.userId}, ${cleanName(accounts[0].name)}, ${data.suspended})
      on conflict (user_id) do update
      set suspended = excluded.suspended, updated_at = now()
    `;
    return { ok: true };
  });

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return queryAdminReviews(sql);
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewStatusInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const updated = await sql<{ id: number }>`
      update reviews set status = ${data.status}, updated_at = now()
      where id = ${data.id}
      returning id
    `;
    if (!updated[0]) throw new ApiError(404, "Review not found.");
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(idInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const removed = await sql<{ id: number }>`
      delete from ratings
      where id in (select rating_id from reviews where id = ${data.id})
      returning id
    `;
    if (!removed[0]) throw new ApiError(404, "Review not found.");
    return { ok: true };
  });
