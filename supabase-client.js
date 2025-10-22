// Supabase client setup and database operations
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = 'https://qvrawnurfmxdsjttlele.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjEwNzMsImV4cCI6MjA3NDM5NzA3M30.dyDgXVTCvNwbvj1PsbVMaOnAea2NgVruuNnEpMfcj2w'
const supabase = createClient(supabaseUrl, supabaseKey)

// Authentication functions
export const auth = {
  // Sign up new user
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

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Profile functions
export const profiles = {
  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
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

// Questions functions
export const questions = {
  // Get all questions
  async getAll() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get questions by category
  async getByCategory(category) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get random questions for quiz
  async getRandomQuestions(count) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('random()')
      .limit(count)
    return { data, error }
  },

  // Create new question
  async create(questionData) {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()
    return { data, error }
  },

  // Update question
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

  // Delete question
  async delete(questionId) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
    return { error }
  }
}

// Export supabase client for direct use if needed
export { supabase }
