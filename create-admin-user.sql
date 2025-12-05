-- =============================================
-- TẠO ADMIN USER
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Bước 1: Tạo user admin trong auth.users (thay thế bằng cách tạo trong Dashboard)
-- Vào Supabase Dashboard > Authentication > Users > Add user
-- Email: admin@quiz.com
-- Password: admin123

-- Bước 2: Sau khi tạo user trong Dashboard, lấy user ID và chạy lệnh này
-- Thay 'YOUR_ADMIN_USER_ID' bằng ID thực của user vừa tạo

-- Cập nhật profile thành admin
UPDATE profiles 
SET is_admin = true, role = 'admin'
WHERE id = 'YOUR_ADMIN_USER_ID';

-- Hoặc nếu bạn biết email:
UPDATE profiles 
SET is_admin = true, role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@quiz.com');
