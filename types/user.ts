import { Document, Types } from 'mongoose';

export type UserRole = 'customer' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deleted';

export interface IUserAddress {
  street?: string;
  city?: string;
  district?: string;
  country?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  profileImage?: string;
  googleId?: string;
  role: UserRole;
  address?: IUserAddress;
  city?: string;
  district?: string;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  profileImage?: string;
  address?: IUserAddress;
  city?: string;
  district?: string;
}