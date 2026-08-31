# SAFI LIEN ECOMERCE WEBSITE

A secure, scalable website for an e-commerce platform built with Next.js, MongoDB Atlas, and Cloudinary.
## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Amazon DynamoDB (AWS SDK v3)
- **Authentication**: NextAuth.js (Google OAuth + Credentials)
- **Image Storage**: Cloudinary
- **Validation**: Zod
- **Language**: TypeScript

## Features

- 🔐 Secure authentication (Google OAuth + Email/Password)
- 👥 Role-based access control (Customer/Admin)
- 📦 Product management with variants
- 🗂️ Category management
- 🛒 Shopping cart
- 📦 Order management
- 💰 Manual payment (MTN/Airtel) with admin verification
- ⭐ Product reviews
- ❤️ Wishlist
- ⚙️ Configurable settings
- 📸 Image upload with Cloudinary

## Prerequisites

- Node.js 18+
- AWS Account with DynamoDB access
- Cloudinary account
- Google Cloud Console (for OAuth)

## DynamoDB Setup

### 1. Create DynamoDB Table

The application uses a single DynamoDB table with Global Secondary Indexes.

```bash
# Set up environment variables first
cp .env.example .env.local
# Fill in AWS credentials and other variables

# Create the table
npx ts-node scripts/create-dynamodb-table.ts