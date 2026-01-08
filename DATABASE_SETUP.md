# PakkaDrop Database Setup Guide

## Quick Setup with Neon (Recommended)

### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub/Google
3. Create a new project named "pakkadrop"

### 2. Get Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.neon.tech/pakkadrop?sslmode=require
   ```

### 3. Update Environment
1. Open `.env` file in the project root
2. Replace the DATABASE_URL with your Neon connection string:
   ```env
   DATABASE_URL="your-neon-connection-string-here"
   ```

### 4. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## Alternative: Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database

### 2. Get Connection String
1. Copy the connection string from Database settings
2. Update `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

## Local PostgreSQL Setup

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database
```bash
# Create user and database
sudo -u postgres createuser --interactive pakkadrop_user
sudo -u postgres createdb pakkadrop_db -O pakkadrop_user

# Set password
sudo -u postgres psql -c "ALTER USER pakkadrop_user PASSWORD 'your_password';"
```

### 3. Update Environment
```env
DATABASE_URL="postgresql://pakkadrop_user:your_password@localhost:5432/pakkadrop_db"
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

## Verify Setup

### 1. Test Connection
```bash
npm run server
```
You should see: "✅ Database connected successfully"

### 2. View Database
```bash
npx prisma studio
```
This opens a web interface to view your database tables.

## Demo Mode

If you don't want to set up a database right now, the application runs in demo mode with mock data. Just start the servers:

```bash
npm run dev
```

The application will work with simulated data for testing purposes.

## Troubleshooting

### Connection Issues
- Ensure your IP is whitelisted in Neon/Supabase
- Check if the connection string is correct
- Verify SSL mode is set to 'require' for cloud databases

### Schema Issues
```bash
# Reset database (WARNING: This deletes all data)
npx prisma db push --force-reset

# Generate client after schema changes
npx prisma generate
```

### Environment Variables
Make sure your `.env` file has:
```env
DATABASE_URL="your-connection-string"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

## Production Deployment

For production, use:
- **Neon**: Automatic scaling and backups
- **Supabase**: Built-in auth and real-time features  
- **AWS RDS**: Enterprise-grade PostgreSQL
- **Google Cloud SQL**: Managed PostgreSQL

Remember to:
1. Use connection pooling for production
2. Enable SSL/TLS encryption
3. Set up regular backups
4. Monitor database performance