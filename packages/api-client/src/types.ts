// Wire types — these match GjirafaNewsAPI DTOs exactly. Numeric ids and
// camelCase fields are how System.Text.Json serializes records by default.

export type CategoryDto = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

export type CategoryWithCountDto = CategoryDto & { articleCount: number };

export type SourceDto = {
  id: number;
  name: string;
  url: string;
  logoUrl: string | null;
};

export type TagDto = { id: number; name: string; slug: string };

export type FeaturedImageDto = {
  id: number;
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type CommentAuthorDto = { id: string; name: string };

export type CommentDto = {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthorDto;
};

export type ArticleListDto = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  imageUrl: string;
  readTime: number;
  publishedAt: string;
  category: CategoryDto;
  source: SourceDto;
  tags: TagDto[];
};

export type ArticleDetailDto = ArticleListDto & {
  content: string;
  featuredImage: FeaturedImageDto | null;
  comments: CommentDto[];
};

export type CategoryStatsDto = {
  categoryName: string;
  articleCount: number;
  averageReadTime: number;
  latestPublishedAt: string | null;
};

export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

export type BroadcastNotificationRequest = {
  title: string;
  message: string;
  type?: string;
};

export type ChatMessageDto = {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  clientId: string | null;
};

// Multipart upload flow.
export type InitiateMultipartUploadRequest = {
  fileName: string;
  contentType: string;
  partCount: number;
};

export type PresignedPartUrlDto = { partNumber: number; url: string };

export type InitiateMultipartUploadResponse = {
  key: string;
  uploadId: string;
  partUrls: PresignedPartUrlDto[];
  expiresAt: string;
};

export type UploadedPartDto = { partNumber: number; eTag: string };

export type CompleteMultipartUploadRequest = {
  key: string;
  uploadId: string;
  parts: UploadedPartDto[];
};

export type CompleteMultipartUploadResponse = {
  key: string;
  location: string | null;
  eTag: string | null;
};

export type AbortMultipartUploadRequest = { key: string; uploadId: string };

// Email.
export type SendEmailRequest = { to: string; subject: string; body: string };
export type ScheduleEmailRequest = SendEmailRequest & { delaySeconds: number };
export type ScheduleEmailResponse = {
  jobId: string;
  enqueuedAt: string;
  runAt: string;
};

// Users (these endpoints DO use the ApiResponse<T> envelope).
export type CurrentUserResponse = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type CreateUserRequest = { name: string; email: string };
export type UpdateUserRequest = { name: string; email: string };

// Articles writes.
export type CreateArticleRequest = {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  categoryId: number;
  sourceId: number;
  readTime?: number;
};
export type UpdateArticleRequest = CreateArticleRequest;

// Categories / Sources writes.
export type CreateCategoryRequest = { name: string; slug: string; color: string };
export type UpdateCategoryRequest = CreateCategoryRequest;

export type CreateSourceRequest = {
  name: string;
  url: string;
  logoUrl?: string | null;
};
export type UpdateSourceRequest = CreateSourceRequest;

// Wraps responses from controllers that opt into the envelope (UsersController).
export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: { field: string | null; message: string }[] | null;
};
