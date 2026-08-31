import { Document, Types } from 'mongoose';

export interface IProductVariant {
  _id?: Types.ObjectId;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  stock: number;
  images: IProductImage[];
  attributes?: Record<string, string>;
  active: boolean;
}

export interface IProductImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  brand?: string;
  variants: IProductVariant[];
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  brand?: string;
  variants: CreateVariantInput[];
  featured?: boolean;
  active?: boolean;
}

export interface CreateVariantInput {
  sku: string;
  color?: string;
  size?: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  active?: boolean;
}