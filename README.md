# Quiz CNTT - DALTUD2

Ứng dụng luyện thi trắc nghiệm kiến thức Công nghệ thông tin với giao diện đơn giản, dễ hiểu.

## 🎯 Tính năng chính

### Cho tất cả người dùng:
- ✅ **Đăng ký/Đăng nhập** đơn giản (chỉ cần email, password, username)
- ✅ **Làm bài quiz** với câu hỏi ngẫu nhiên
- ✅ **Cài đặt** số câu hỏi, âm thanh, timer
- ✅ **Thông tin cá nhân** - cập nhật username

### Cho giáo viên:
- ✅ **Thêm câu hỏi** (Đúng/Sai và 4 lựa chọn)
- ✅ **Quản lý câu hỏi** trong database

## 🚀 Cài đặt và chạy

### 1. Chuẩn bị Supabase Database

Chạy SQL script này trong Supabase SQL Editor:

```sql
-- Tạo bảng profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student','teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('tf','mcq')),
  text TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  answer BOOLEAN,
  options TEXT[],
  correct_index INTEGER,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies cho profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies cho questions
CREATE POLICY "Anyone can view questions" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "Teachers can insert questions" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Trigger tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text,1,8)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Thêm câu hỏi mẫu
INSERT INTO public.questions (type, text, category, answer) VALUES
('tf', 'JavaScript chạy trên trình duyệt.', 'Web', true),
('tf', 'HTTP là giao thức stateless.', 'Network', true),
('tf', 'CSS dùng để tạo kiểu cho trang web.', 'Web', true);

INSERT INTO public.questions (type, text, category, options, correct_index) VALUES
('mcq', 'Cấu trúc dữ liệu FIFO là gì?', 'DSA', 
 ARRAY['Stack', 'Queue', 'Tree', 'Graph'], 1),
('mcq', 'SQL dùng để làm gì?', 'Database', 
 ARRAY['Styling', 'Truy vấn CSDL', 'Server routing', 'Deploy'], 1),
('mcq', 'TCP hoạt động ở lớp nào của OSI?', 'Network', 
 ARRAY['Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 7'], 1);
```

### 2. Chạy ứng dụng

```bash
# Mở file index.html trong trình duyệt
# Hoặc dùng live server
npx serve .
```

### 3. Deploy lên Vercel

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📁 Cấu trúc code

```
DALTUD2/
├── index.html          # Giao diện chính
├── style.css           # CSS styling
├── app.js             # Logic ứng dụng
├── vercel.json        # Cấu hình Vercel
└── README.md          # Hướng dẫn
```

## 🔧 Cách sử dụng

### Đăng ký tài khoản:
1. Vào "Đăng ký"
2. Nhập email, password, username
3. Chọn vai trò (Học sinh/Giáo viên)
4. Xác thực email

### Làm bài quiz:
1. Đăng nhập
2. Vào "Làm bài"
3. Chọn đáp án cho từng câu
4. Xem kết quả

### Thêm câu hỏi (Giáo viên):
1. Đăng nhập với tài khoản giáo viên
2. Vào "Thêm câu hỏi"
3. Chọn loại câu hỏi (Đúng/Sai hoặc 4 lựa chọn)
4. Nhập nội dung và đáp án
5. Lưu

## 🎨 Giao diện

- **Đơn giản, dễ hiểu** - Phù hợp cho báo cáo môn học
- **Responsive** - Hoạt động trên mọi thiết bị
- **Màu sắc hài hòa** - Gradient xanh tím
- **Thông báo rõ ràng** - Success/Error messages

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel
- **Database**: PostgreSQL với Row Level Security

## 📝 Báo cáo môn học

### Điểm mạnh:
- ✅ Code đơn giản, dễ hiểu
- ✅ Giao diện đẹp, responsive
- ✅ Đầy đủ tính năng yêu cầu
- ✅ Sử dụng database thực
- ✅ Authentication và authorization
- ✅ Deploy production

### Tính năng đã implement:
1. **Login/Register** - Đơn giản chỉ cần email, password, username
2. **Settings** - Âm thanh, timer, số câu hỏi
3. **Quiz System** - Làm bài trắc nghiệm
4. **Question Builder** - Thêm câu hỏi (chỉ giáo viên)
5. **Profile Management** - Cập nhật thông tin
6. **Role-based Access** - Phân quyền học sinh/giáo viên

## 🚀 Demo

Sau khi deploy, ứng dụng sẽ có:
- URL: `https://your-app.vercel.app`
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Storage: LocalStorage cho settings

---

**Lưu ý**: Đây là phiên bản đơn giản, dễ hiểu phù hợp cho báo cáo môn học. Code được viết rõ ràng, có comment và cấu trúc đơn giản.