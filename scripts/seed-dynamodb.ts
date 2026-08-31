import dotenv from 'dotenv';
import { userRepository } from '../lib/dynamodb/repositories/userRepository';
import { settingsRepository } from '../lib/dynamodb/repositories/settingsRepository';
import { categoryRepository } from '../lib/dynamodb/repositories/categoryRepository';

dotenv.config();

async function seedDynamoDB() {
  console.log('Starting DynamoDB seeding...\n');

  try {
    // 1. Create default settings
    console.log('1. Creating default settings...');
    const settings = await settingsRepository.getSettings();
    console.log('   Settings created/retrieved successfully');
    console.log('   Business Name:', settings.business.businessName);
    console.log('   Kigali Delivery Fee:', settings.delivery.kigaliFee, 'RWF');
    console.log('   Outside Kigali Fee:', settings.delivery.outsideKigaliFee, 'RWF\n');

    // 2. Create admin user
    console.log('2. Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existingAdmin = await userRepository.getUserByEmail(adminEmail);

    if (existingAdmin) {
      console.log('   Admin user already exists');
      console.log('   Email:', adminEmail);
    } else {
      await userRepository.createUser({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('   Admin user created successfully');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   Please change the password after first login');
    }

    // 3. Create sample categories
    console.log('\n3. Creating sample categories...');
    const sampleCategories = [
      { name: 'Bedding', description: 'Luxury bed covers, sheets, and pillows' },
      { name: 'Furniture', description: 'Premium furniture for your home' },
      { name: 'Electronics', description: 'Latest electronics and gadgets' },
      { name: 'Kitchen', description: 'Kitchen appliances and accessories' },
      { name: 'Bathroom', description: 'Bathroom essentials and accessories' },
      { name: 'Decor', description: 'Home decor and accessories' },
    ];

    for (const category of sampleCategories) {
      const existingCategory = await categoryRepository.checkNameExists(category.name);
      
      if (!existingCategory) {
        await categoryRepository.createCategory(category);
        console.log(`   Created category: ${category.name}`);
      } else {
        console.log(`   Category already exists: ${category.name}`);
      }
    }

    console.log('\n✅ DynamoDB seeding completed successfully!');
    console.log('\nSummary:');
    console.log('- Default settings initialized');
    console.log('- Admin user ready');
    console.log('- Sample categories created');
    console.log('\nYou can now start the application with: npm run dev');

  } catch (error: any) {
    console.error('\n❌ Error seeding DynamoDB:', error);
    console.error('\nPlease check:');
    console.error('1. AWS credentials are correct in .env.local');
    console.error('2. DynamoDB table exists (run create-dynamodb-table.ts first)');
    console.error('3. IAM permissions are sufficient');
    process.exit(1);
  }
}

// Run the seeding
seedDynamoDB();