-- Admin Dashboard Database Schema Updates
-- Run this AFTER running create-basic-tables.sql

-- Add admin field to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update role constraint to allow 'admin' role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'admin'));

-- Add quiz configuration fields to quiz_sets (if not exists)
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5;
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 600;

-- RLS for admin access
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can access admins table" ON admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all questions
CREATE POLICY "Admins can view all questions" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can manage all questions
CREATE POLICY "Admins can manage all questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all classes
CREATE POLICY "Admins can view all classes" ON classes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can manage all classes
CREATE POLICY "Admins can manage all classes" ON classes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all quiz_sets
CREATE POLICY "Admins can view all quiz_sets" ON quiz_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can manage all quiz_sets
CREATE POLICY "Admins can manage all quiz_sets" ON quiz_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all quiz_sessions
CREATE POLICY "Admins can view all quiz_sessions" ON quiz_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all session_participants
CREATE POLICY "Admins can view all session_participants" ON session_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can see all quiz_results
CREATE POLICY "Admins can view all quiz_results" ON quiz_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Insert default admin user (password: admin123)
INSERT INTO admins (email, password_hash, full_name) VALUES 
('admin@quiz.com', '$2a$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

-- Admin profile sẽ được tạo thông qua create-admin-user.sql
-- sau khi tạo admin user trong Supabase Dashboard
