// Base types
export type EntityType = 
  | 'USER'
  | 'PRODUCT'
  | 'VARIANT'
  | 'CATEGORY'
  | 'CART'
  | 'ORDER'
  | 'PAYMENT'
  | 'REVIEW'
  | 'WISHLIST'
  | 'SETTINGS';

export interface BaseEntity {
  PK: string;
  SK: string;
  type: EntityType;
  createdAt: string;
  updatedAt: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  GSI4PK?: string;
  GSI4SK?: string;
}

// User types
export type UserRole = 'customer' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deleted';

export interface UserAddress {
  street?: string;
  city?: string;
  district?: string;
  country?: string;
}

export interface UserEntity extends BaseEntity {
  type: 'USER';
  userId: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  profileImage?: string;
  googleId?: string;
  role: UserRole;
  address?: UserAddress;
  city?: string;
  district?: string;
  accountStatus: AccountStatus;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  address?: UserAddress;
  city?: string;
  district?: string;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface ProductImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ProductVariantEntity extends BaseEntity {
  type: 'VARIANT';
  productId: string;
  variantId: string;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  stock: number;
  images: ProductImage[];
  attributes?: Record<string, string>;
  active: boolean;
}

export interface ProductEntity extends BaseEntity {
  type: 'PRODUCT';
  productId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  featured: boolean;
  active: boolean;
  variants: ProductVariantEntity[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  brand?: string;
  featured: boolean;
  active: boolean;
  variants: ProductVariantEntity[];
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface CategoryEntity extends BaseEntity {
  type: 'CATEGORY';
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart types
export interface CartItemEntity extends BaseEntity {
  type: 'CART';
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product?: any;
  variant?: any;
}

export interface Cart {
  userId: string;
  items: CartItem[];
}

// Order types
export type OrderStatus = 
  | 'pending_payment'
  | 'payment_verification'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_rejected';

export type DeliveryZone = 'kigali' | 'outside_kigali';

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: {
    color?: string;
    size?: string;
    sku: string;
  };
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
}

export interface OrderEntity extends BaseEntity {
  type: 'ORDER';
  orderId: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryZone: DeliveryZone;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentId?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryZone: DeliveryZone;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export type PaymentMethod = 'mtn' | 'airtel';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentEntity extends BaseEntity {
  type: 'PAYMENT';
  paymentId: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  transactionId: string;
  phoneNumber: string;
  amount: number;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface PaymentListItem {
  id: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  transactionId: string;
  phoneNumber: string;
  amount: number;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface ReviewEntity extends BaseEntity {
  type: 'REVIEW';
  reviewId: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
}

export interface ReviewListItem {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Wishlist types
export interface WishlistEntity extends BaseEntity {
  type: 'WISHLIST';
  userId: string;
  productId: string;
}

export interface Wishlist {
  userId: string;
  products: any[];
}

// Settings types
export interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
}

export interface DeliverySettings {
  kigaliFee: number;
  outsideKigaliFee: number;
}

export interface PaymentSettings {
  mtnNumber: string;
  airtelNumber: string;
  paymentInstructions: string;
}

export interface SiteSettings {
  logoUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface SettingsEntity extends BaseEntity {
  type: 'SETTINGS';
  business: BusinessSettings;
  delivery: DeliverySettings;
  payment: PaymentSettings;
  site: SiteSettings;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    lastEvaluatedKey?: Record<string, any>;
  };
}

// Query types
export interface ProductQueryParams {
  category?: string;
  search?: string;
  featured?: string;
  active?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  page?: number;
  limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

export interface OrderQueryParams {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

export interface PaymentQueryParams {
  status?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

export interface ReviewQueryParams {
  productId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

// Admin stats
export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  totalReviews: number;
  recentOrders: OrderListItem[];
  lowStockProducts: ProductListItem[];
}