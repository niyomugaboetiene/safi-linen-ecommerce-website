import { Document, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending_payment'
  | 'payment_verification'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_rejected';

export type PaymentMethod = 'mtn' | 'airtel';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type DeliveryZone = 'kigali' | 'outside_kigali';

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  variant: Types.ObjectId;
  variantDetails: {
    color?: string;
    size?: string;
    sku: string;
  };
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryZone: DeliveryZone;
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  payment: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  user: Types.ObjectId;
  method: PaymentMethod;
  transactionId: string;
  phoneNumber: string;
  amount: number;
  status: PaymentStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}