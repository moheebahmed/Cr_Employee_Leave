// Test script to check if live API is returning correct data
// Run this with: node test-live-api.js

const API_URL = 'https://leave-management.conceptrecall.com/api';

async function testAPI() {
  console.log('🔍 Testing Live API...\n');
  
  // You need to get a valid token first by logging in
  console.log('Step 1: Login to get token');
  console.log('Please login through your app and copy the token, then run:');
  console.log('node test-live-api.js YOUR_TOKEN_HERE\n');
  
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ No token provided');
    console.log('Usage: node test-live-api.js YOUR_TOKEN');
    return;
  }
  
  try {
    console.log('Step 2: Fetching dashboard data...');
    const response = await fetch(`${API_URL}/employee/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ API Error:', data.message);
      return;
    }
    
    console.log('✅ API Response received\n');
    console.log('📊 Leave Balances:');
    console.log('─────────────────────────────────────────────');
    
    const balances = data.data?.balances || [];
    
    if (balances.length === 0) {
      console.log('⚠️  No balances found');
      return;
    }
    
    balances.forEach(balance => {
      const name = balance.LeaveType?.name || 'Unknown';
      const total = balance.total_allowed || 0;
      const used = balance.used || 0;
      const remaining = balance.remaining || 0;
      
      console.log(`${name.padEnd(20)} | Total: ${total.toString().padStart(2)} | Used: ${used.toString().padStart(2)} | Remaining: ${remaining.toString().padStart(2)}`);
    });
    
    console.log('─────────────────────────────────────────────\n');
    
    // Check if the fix is deployed
    const hasNonZeroUsed = balances.some(b => b.used > 0);
    
    if (hasNonZeroUsed) {
      console.log('✅ SUCCESS! The fix is deployed correctly.');
      console.log('   The API is returning database values for "used" field.');
    } else {
      console.log('❌ ISSUE DETECTED! All "used" values are 0.');
      console.log('   The old code is still running on the server.');
      console.log('   You need to deploy the updated employee.controller.js file.');
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testAPI();
