export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  image?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}