-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS withdrawals;
DROP TABLE IF EXISTS point_transactions;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Point transactions table
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Withdrawals table
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
