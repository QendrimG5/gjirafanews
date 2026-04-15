// Domain types — single source of truth for the entire monorepo.

export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type Source = {
  id: string;
  name: string;
  url: string;
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  readTime: number;
  categoryId: string;
  sourceId: string;
};

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type SafeUser = Omit<User, "password">;

export type ArticleWithRelations = Article & {
  category: Category;
  source: Source;
};

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: Date;
};

// API request/response types

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { email: string; password: string; name: string };
export type AuthResponse = { user: SafeUser };
export type MeResponse = {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
};

export type ArticleWithRelationsResponse = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  readTime: number;
  categoryId: string;
  sourceId: string;
  category: { id: string; name: string; slug: string; color: string };
  source: { id: string; name: string; url: string };
};

export type CreateArticleRequest = {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  categoryId: string;
  sourceId: string;
  readTime?: number;
};

export type CategoryWithCount = Category & {
  articleCount: number;
};

export type SourceResponse = {
  id: string;
  name: string;
  url: string;
};

export type ArticleFormData = {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  categoryId: string;
  sourceId: string;
  readTime: number;
};
