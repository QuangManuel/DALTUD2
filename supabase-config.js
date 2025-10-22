// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://qvrawnurfmxdsjttlele.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjEwNzMsImV4cCI6MjA3NDM5NzA3M30.dyDgXVTCvNwbvj1PsbVMaOnAea2NgVruuNnEpMfcj2w'
}

// Database schema setup (run these in Supabase SQL editor)
const DB_SCHEMA = `
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar TEXT DEFAULT '🐱',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('tf', 'mcq')),
  text TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  answer BOOLEAN, -- for true/false questions
  options TEXT[], -- for multiple choice questions
  correct_index INTEGER, -- for multiple choice questions
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Teachers can insert questions" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update questions" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete questions" ON questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🐱'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_members table
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Create quiz_sets table
CREATE TABLE IF NOT EXISTS quiz_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  question_ids UUID[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  score INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, student_id)
);

-- RLS Policies for classes
CREATE POLICY "Teachers can manage their classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher' AND id = teacher_id
    )
  );

CREATE POLICY "Students can view classes they joined" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_id = classes.id AND student_id = auth.uid()
    )
  );

-- RLS Policies for class_members
CREATE POLICY "Students can join classes" ON class_members
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view their class members" ON class_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_members.class_id AND teacher_id = auth.uid()
    )
  );

-- RLS Policies for quiz_sets
CREATE POLICY "Teachers can manage quiz sets for their classes" ON quiz_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = quiz_sets.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view quiz sets for their classes" ON quiz_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_id = quiz_sets.class_id AND student_id = auth.uid()
    )
  );

-- RLS Policies for quiz_sessions
CREATE POLICY "Teachers can manage quiz sessions" ON quiz_sessions
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view quiz sessions for their classes" ON quiz_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN quiz_sets qs ON qs.class_id = cm.class_id
      WHERE qs.id = quiz_sessions.quiz_set_id AND cm.student_id = auth.uid()
    )
  );

-- RLS Policies for session_participants
CREATE POLICY "Students can manage their own participation" ON session_participants
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view all participants in their sessions" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE id = session_participants.session_id AND teacher_id = auth.uid()
    )
  );

-- Insert some sample questions
INSERT INTO questions (type, text, category, answer) VALUES
('tf', 'JavaScript chạy trên trình duyệt.', 'Web', true),
('tf', 'HTTP là giao thức trạng thái (stateful).', 'Networking', false),
('tf', 'CSS được sử dụng để tạo kiểu cho trang web.', 'Web', true);

INSERT INTO questions (type, text, category, options, correct_index) VALUES
('mcq', 'Cấu trúc dữ liệu nào là FIFO?', 'DSA', 
 ARRAY['Stack', 'Queue', 'Tree', 'Graph'], 1),
('mcq', 'SQL dùng để làm gì?', 'Database', 
 ARRAY['Styling', 'Truy vấn CSDL', 'Server routing', 'Triển khai'], 1),
('mcq', 'TCP hoạt động ở lớp nào của mô hình OSI?', 'Networking', 
 ARRAY['Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 7'], 1);
`

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, DB_SCHEMA }
} else {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG
  window.DB_SCHEMA = DB_SCHEMA
}
