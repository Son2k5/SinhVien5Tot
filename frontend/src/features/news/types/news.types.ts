export interface ImageBlock {
  type: 'Image';
  imageId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export type Block =
  | { type: 'Heading'; level: 2 | 3; text: string }
  | { type: 'Paragraph'; text: string }
  | { type: 'Quote'; text: string }
  | { type: 'List'; items: string[] }
  | ImageBlock;

export interface ArticleListItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'News' | 'Announcement' | 'Event';
  isPinned: boolean;
  publishedAt: string;
  authorName: string;
  coverImage?: {
    id: string;
    url: string;
    width: number;
    height: number;
  };
}

export interface ArticleDetail extends ArticleListItem {
  blocks: Block[];
}

export interface AdminArticleListItem extends ArticleListItem {
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
  coverImageId?: string;
}

export interface AdminArticleDetail extends AdminArticleListItem {
  blocks: Block[];
}

export interface NewsFilters {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  status?: string; // admin only
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateArticleRequest {
  title: string;
  excerpt: string;
  category: 'News' | 'Announcement' | 'Event';
  isPinned: boolean;
  coverImageId?: string;
  blocks: (Omit<Block, 'url' | 'width' | 'height'> & { url?: string; width?: number; height?: number })[];
}

export interface UpdateArticleRequest extends CreateArticleRequest {
  rowVersion: string;
}
