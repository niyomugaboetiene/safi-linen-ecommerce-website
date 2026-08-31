import { Document } from 'mongoose';

export interface IBusinessSettings {
  businessName: string;
  phone: string;
  email: string;
}

export interface IDeliverySettings {
  kigaliFee: number;
  outsideKigaliFee: number;
}

export interface IPaymentSettings {
  mtnNumber: string;
  airtelNumber: string;
  paymentInstructions: string;
}

export interface ISiteSettings {
  logoUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface ISettings extends Document {
  business: IBusinessSettings;
  delivery: IDeliverySettings;
  payment: IPaymentSettings;
  site: ISiteSettings;
  updatedAt: Date;
}