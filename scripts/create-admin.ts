import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB_NAME) {
      throw new Error('Missing MongoDB environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    });

    // Define User schema inline for script
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      phone: String,
      password: String,
      profileImage: String,
      googleId: String,
      role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
      address: {
        street: String,
        city: String,
        district: String,
        country: String,
      },
      city: String,
      district: String,
      accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active',
      },
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
    });

    console.log('Admin user created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Please change the password after first login');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();