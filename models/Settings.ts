import mongoose, { Schema, Model } from 'mongoose';
import { ISettings, IBusinessSettings, IDeliverySettings, IPaymentSettings, ISiteSettings } from '@/types/settings';

const businessSettingsSchema = new Schema<IBusinessSettings>(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Business phone is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Business email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
  },
  { _id: false }
);

const deliverySettingsSchema = new Schema<IDeliverySettings>(
  {
    kigaliFee: {
      type: Number,
      required: [true, 'Kigali delivery fee is required'],
      min: [0, 'Delivery fee cannot be negative'],
      default: 2000,
    },
    outsideKigaliFee: {
      type: Number,
      required: [true, 'Outside Kigali delivery fee is required'],
      min: [0, 'Delivery fee cannot be negative'],
      default: 5000,
    },
  },
  { _id: false }
);

const paymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    mtnNumber: {
      type: String,
      required: [true, 'MTN number is required'],
      trim: true,
    },
    airtelNumber: {
      type: String,
      required: [true, 'Airtel number is required'],
      trim: true,
    },
    paymentInstructions: {
      type: String,
      required: [true, 'Payment instructions are required'],
      trim: true,
      maxlength: [2000, 'Payment instructions cannot exceed 2000 characters'],
      default: 'Please send payment to the provided number and submit the transaction ID.',
    },
  },
  { _id: false }
);

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    logoUrl: {
      type: String,
      trim: true,
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
    },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    business: {
      type: businessSettingsSchema,
      required: true,
      default: {
        businessName: 'My E-Commerce Store',
        phone: '+250700000000',
        email: 'info@example.com',
      },
    },
    delivery: {
      type: deliverySettingsSchema,
      required: true,
      default: {
        kigaliFee: 2000,
        outsideKigaliFee: 5000,
      },
    },
    payment: {
      type: paymentSettingsSchema,
      required: true,
      default: {
        mtnNumber: '+250780000000',
        airtelNumber: '+250730000000',
        paymentInstructions: 'Please send payment to the provided number and submit the transaction ID.',
      },
    },
    site: {
      type: siteSettingsSchema,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.pre('save', async function (next) {
  const Settings = this.constructor as Model<ISettings>;
  const count = await Settings.countDocuments();
  if (count > 0 && this.isNew) {
    next(new Error('Settings already exist. Use update instead.'));
  }
  next();
});

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;