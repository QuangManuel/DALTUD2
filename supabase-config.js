const SUPABASE_CONFIG = {
  url: 'https://qvrawnurfmxdsjttlele.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjEwNzMsImV4cCI6MjA3NDM5NzA3M30.dyDgXVTCvNwbvj1PsbVMaOnAea2NgVruuNnEpMfcj2w'
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, DB_SCHEMA }
} else {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG
  window.DB_SCHEMA = DB_SCHEMA
}
