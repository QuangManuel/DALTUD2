-- =============================================
-- QUIZ APP - COMPLETE DATABASE SCHEMA
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE (liên kết với auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar TEXT DEFAULT '🐱',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('mc', 'tf')),
  text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_code TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASS_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 5. QUIZ_SETS TABLE
CREATE TABLE IF NOT EXISTS quiz_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  question_count INTEGER DEFAULT 5,
  time_limit INTEGER DEFAULT 600,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUIZ_SET_QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_set_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(quiz_set_id, question_id)
);

-- 7. QUIZ_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SESSION_PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- 9. QUIZ_RESULTS TABLE
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTING POLICIES FIRST
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
DROP POLICY IF EXISTS "Teachers can create questions" ON questions;
DROP POLICY IF EXISTS "Teachers can update own questions" ON questions;
DROP POLICY IF EXISTS "Teachers can delete own questions" ON questions;
DROP POLICY IF EXISTS "Anyone can view classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
DROP POLICY IF EXISTS "Anyone can view class members" ON class_members;
DROP POLICY IF EXISTS "Students can join classes" ON class_members;
DROP POLICY IF EXISTS "Students can leave classes" ON class_members;
DROP POLICY IF EXISTS "Anyone can view quiz sets" ON quiz_sets;
DROP POLICY IF EXISTS "Teachers can create quiz sets" ON quiz_sets;
DROP POLICY IF EXISTS "Teachers can update own quiz sets" ON quiz_sets;
DROP POLICY IF EXISTS "Teachers can delete own quiz sets" ON quiz_sets;
DROP POLICY IF EXISTS "Anyone can view quiz set questions" ON quiz_set_questions;
DROP POLICY IF EXISTS "Teachers can manage quiz set questions" ON quiz_set_questions;
DROP POLICY IF EXISTS "Anyone can view quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Teachers can create quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Students can join sessions" ON session_participants;
DROP POLICY IF EXISTS "Anyone can view quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Students can insert own results" ON quiz_results;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- QUESTIONS POLICIES
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Teachers can create questions" ON questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own questions" ON questions FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Teachers can delete own questions" ON questions FOR DELETE USING (created_by = auth.uid());

-- CLASSES POLICIES
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Teachers can create classes" ON classes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own classes" ON classes FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own classes" ON classes FOR DELETE USING (teacher_id = auth.uid());

-- CLASS_MEMBERS POLICIES
CREATE POLICY "Anyone can view class members" ON class_members FOR SELECT USING (true);
CREATE POLICY "Students can join classes" ON class_members FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can leave classes" ON class_members FOR DELETE USING (auth.uid() = student_id);

-- QUIZ_SETS POLICIES
CREATE POLICY "Anyone can view quiz sets" ON quiz_sets FOR SELECT USING (true);
CREATE POLICY "Teachers can create quiz sets" ON quiz_sets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own quiz sets" ON quiz_sets FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Teachers can delete own quiz sets" ON quiz_sets FOR DELETE USING (created_by = auth.uid());

-- QUIZ_SET_QUESTIONS POLICIES
CREATE POLICY "Anyone can view quiz set questions" ON quiz_set_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage quiz set questions" ON quiz_set_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- QUIZ_SESSIONS POLICIES
CREATE POLICY "Anyone can view quiz sessions" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Teachers can create quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own sessions" ON quiz_sessions FOR UPDATE USING (teacher_id = auth.uid());

-- SESSION_PARTICIPANTS POLICIES
CREATE POLICY "Anyone can view session participants" ON session_participants FOR SELECT USING (true);
CREATE POLICY "Students can join sessions" ON session_participants FOR INSERT WITH CHECK (auth.uid() = student_id);

-- QUIZ_RESULTS POLICIES
CREATE POLICY "Anyone can view quiz results" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Students can insert own results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = student_id);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🐱')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DONE! Database ready to use
-- =============================================
