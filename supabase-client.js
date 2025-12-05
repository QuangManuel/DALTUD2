import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const supabaseUrl = 'https://qvrawnurfmxdsjttlele.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjEwNzMsImV4cCI6MjA3NDM5NzA3M30.dyDgXVTCvNwbvj1PsbVMaOnAea2NgVruuNnEpMfcj2w'
const supabase = createClient(supabaseUrl, supabaseKey)


export const auth = {
  // Đăng ký
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.fullName,
          avatar: userData.avatar,
          role: userData.role || 'student'
        }
      }
    })
    return { data, error }
  },

  // Đăng nhập
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Đăng xuất
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Lấy thông tin user hiện tại
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Lắng nghe thay đổi trạng thái đăng nhập
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Hàm liên quan đến profile
export const profiles = {
  // Lấy thông tin profile của user
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Cập nhật thông tin profile của user
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  }
}

// Hàm liên quan đến câu hỏi
export const questions = {
  // Lấy tất cả câu hỏi
  async getAll() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Lấy câu hỏi theo danh mục
  async getByCategory(category) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Lấy câu hỏi ngẫu nhiên cho quiz
  async getRandomQuestions(count) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('random()')
      .limit(count)
    return { data, error }
  },

  // Tạo câu hỏi mới
  async create(questionData) {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()
    return { data, error }
  },

  // Cập nhật câu hỏi
  async update(questionId, updates) {
    const { data, error } = await supabase
      .from('questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single()
    return { data, error }
  },

  // Xóa câu hỏi
  async delete(questionId) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
    return { error }
  }
}

// Xuất supabase client để sử dụng trực tiếp nếu cần
export { supabase }
