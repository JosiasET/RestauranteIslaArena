const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sudpjidjsophvgdeyhkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZHBqaWRqc29waHZnZGV5aGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTA0ODMsImV4cCI6MjA3NDIyNjQ4M30.wyjwg_ovsjRAeRAT7ZwAdfZi7G5qlNj-26LjN4X4J08';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Configurado para Supabase");
module.exports = supabase;