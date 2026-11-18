export const SORTS = [
  { id: "rating", label: "Top rated" },
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price, low to high" },
  { id: "price_desc", label: "Price, high to low" },
  { id: "name", label: "Name" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

export const PRODUCT_IMAGES = [
  { src: "/products/harbor.jpg", label: "Headphones" },
  { src: "/products/ledger.jpg", label: "Notebook" },
  { src: "/products/kettle.jpg", label: "Kettle" },
  { src: "/products/arc.jpg", label: "Lamp" },
  { src: "/products/tote.jpg", label: "Tote" },
  { src: "/products/balm.jpg", label: "Balm" },
  { src: "/products/slate.jpg", label: "Keyboard" },
  { src: "/products/carafe.jpg", label: "Carafe" },
] as const;

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  summary: string;
  priceCents: number;
  imageUrl: string;
  categorySlug: string;
  categoryName: string;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
};

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  productCount: number;
};

export type PublicReview = {
  id: number;
  authorName: string;
  title: string;
  body: string;
  score: number;
  origin: "house" | "member";
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = ProductCard & {
  description: string;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: PublicReview[];
  related: ProductCard[];
};

export type Profile = {
  userId: string;
  displayName: string;
  bio: string;
  role: "user" | "admin";
  suspended: boolean;
  email: string;
  createdAt: string;
};

export type MyProductReview = {
  id: number;
  title: string;
  body: string;
  score: number;
  status: "published" | "hidden";
  createdAt: string;
  updatedAt: string;
};

export type OwnReview = MyProductReview & {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string;
};

export type AdminProduct = ProductCard & {
  description: string;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  suspended: boolean;
  reviewCount: number;
  createdAt: string;
};

export type AdminReview = PublicReview & {
  status: "published" | "hidden";
  userId: string;
  productName: string;
  productSlug: string;
};

export type AdminStats = {
  products: number;
  users: number;
  reviews: number;
  hidden: number;
  suspended: number;
  avgRating: number;
  byCategory: { name: string; reviews: number }[];
  recent: AdminReview[];
};

export type HomePayload = {
  stats: { products: number; reviews: number; categories: number; members: number };
  categories: Category[];
  featured: ProductCard[];
};
