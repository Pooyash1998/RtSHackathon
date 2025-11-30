// Test Frontend-Backend Connection
// Run this in your browser console on your Vercel site

console.log('🔍 Testing Frontend-Backend Connection...\n');

// 1. Check environment variable
console.log('1️⃣ Checking VITE_API_URL:');
const apiUrl = import.meta?.env?.VITE_API_URL || 'NOT SET';
console.log('   API URL:', apiUrl);

if (apiUrl === 'NOT SET' || apiUrl.includes('localhost')) {
  console.error('   ❌ PROBLEM: API URL not set correctly!');
  console.log('   Fix: Update VITE_API_URL in Vercel to: https://rtshackathon-production.up.railway.app');
} else {
  console.log('   ✅ API URL looks good!');
}

// 2. Test backend health
console.log('\n2️⃣ Testing backend health endpoint...');
fetch('https://rtshackathon-production.up.railway.app/health')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('   ✅ Backend is responding!');
    console.log('   Response:', data);
    
    if (data.supabase_configured) {
      console.log('   ✅ Supabase is configured!');
    } else {
      console.error('   ❌ Supabase not configured!');
    }
  })
  .catch(error => {
    console.error('   ❌ Backend health check failed:', error.message);
    console.log('   Check Railway logs for errors');
  });

// 3. Test CORS
console.log('\n3️⃣ Testing CORS...');
fetch('https://rtshackathon-production.up.railway.app/students')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('   ✅ CORS is working!');
    console.log('   Students:', data);
  })
  .catch(error => {
    if (error.message.includes('CORS')) {
      console.error('   ❌ CORS error! Backend needs to allow your domain');
    } else {
      console.error('   ❌ Request failed:', error.message);
    }
  });

console.log('\n📋 Summary will appear above in a few seconds...');
