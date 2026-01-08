-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('B2C', 'B2B', 'DRIVER')),
  company_name TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
  business_type TEXT DEFAULT 'B2C' CHECK (business_type IN ('B2C', 'B2B')),
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  pickup_instructions TEXT,
  
  -- Dropoff details
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  dropoff_contact_name TEXT NOT NULL,
  dropoff_contact_phone TEXT NOT NULL,
  dropoff_instructions TEXT,
  
  -- Package details
  package_type TEXT NOT NULL,
  package_weight DECIMAL(8, 2),
  package_value DECIMAL(10, 2),
  package_description TEXT,
  is_fragile BOOLEAN DEFAULT FALSE,
  
  -- Pricing
  base_fare DECIMAL(10, 2),
  distance_cost DECIMAL(10, 2),
  fuel_adjustment DECIMAL(10, 2),
  toll_charges DECIMAL(10, 2) DEFAULT 0,
  waiting_time INTEGER DEFAULT 0,
  waiting_charges DECIMAL(10, 2) DEFAULT 0,
  platform_commission DECIMAL(10, 2),
  total_fare DECIMAL(10, 2),
  driver_earnings DECIMAL(10, 2),
  
  -- Timing
  scheduled_time TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_distance DECIMAL(8, 2),
  estimated_duration INTEGER,
  actual_distance DECIMAL(8, 2),
  actual_duration INTEGER,
  
  -- Additional info
  customer_notes TEXT,
  driver_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings table
CREATE TABLE earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  delivery_id UUID REFERENCES deliveries(id),
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_deliveries_customer_id ON deliveries(customer_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (firebase_uid = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (firebase_uid = auth.jwt() ->> 'sub');

-- Create policies for deliveries table
CREATE POLICY "Users can view own deliveries" ON deliveries
  FOR SELECT USING (
    customer_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub') OR
    driver_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Customers can create deliveries" ON deliveries
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Drivers can update deliveries" ON deliveries
  FOR UPDATE USING (
    driver_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );

-- Create policies for earnings table
CREATE POLICY "Users can view own earnings" ON earnings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );

-- Create policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.jwt() ->> 'sub')
  );