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
  lastEvaluatedKey?: string; // Base64 encoded DynamoDB LastEvaluatedKey
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  category?: string;
  featured?: string;
  active?: string;
  lastEvaluatedKey?: string; // Base64 encoded DynamoDB LastEvaluatedKey
  [key: string]: any;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  image?: string;
  accountStatus?: 'active' | 'suspended' | 'deleted';
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

// DynamoDB specific types
export interface DynamoDBKey {
  PK: string;
  SK: string;
}

export interface DynamoDBPaginationResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface DynamoDBQueryOptions {
  page?: number;
  limit?: number;
  lastEvaluatedKey?: string;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  scanIndexForward?: boolean;
}

export interface DynamoDBUpdateOptions {
  updateExpression: string;
  conditionExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
}

// Error types
export interface ApiError {
  name: string;
  message: string;
  statusCode: number;
  code?: string;
}

// Success response helper types
export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationInfo;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

// Admin stats types
export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  totalReviews: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    variants: Array<{
      id: string;
      sku: string;
      color?: string;
      size?: string;
      stock: number;
    }>;
  }>;
}

// Upload types
export interface UploadResponse {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

// Payment types
export interface PaymentSubmitData {
  orderId: string;
  method: 'mtn' | 'airtel';
  transactionId: string;
  phoneNumber: string;
}

export interface PaymentVerifyData {
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}

// Order types
export interface OrderCheckoutData {
  deliveryZone: 'kigali' | 'outside_kigali';
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
  };
}

// Cart types
export interface AddToCartData {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

// Wishlist types
export interface WishlistData {
  productId: string;
}

// Review types
export interface CreateReviewData {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

// Settings types
export interface UpdateSettingsData {
  business?: {
    businessName?: string;
    phone?: string;
    email?: string;
  };
  delivery?: {
    kigaliFee?: number;
    outsideKigaliFee?: number;
  };
  payment?: {
    mtnNumber?: string;
    airtelNumber?: string;
    paymentInstructions?: string;
  };
  site?: {
    logoUrl?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
}