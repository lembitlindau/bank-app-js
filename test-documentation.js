#!/usr/bin/env node

/**
 * API Documentation Validation Script
 * Tests that documented API responses match actual responses
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// Test data
const testUser = {
  username: 'test_user_doc',
  password: 'testPassword123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user.doc@example.com'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  return {
    status: response.status,
    data,
    headers: response.headers
  };
}

// Test functions
async function testUserRegistration() {
  console.log('🧪 Testing user registration...');
  
  const response = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 201 && response.data.status === 'success') {
    console.log('✅ Registration test passed');
    return true;
  } else if (response.status === 409) {
    console.log('ℹ️ User already exists, continuing with login');
    return true;
  } else {
    console.log('❌ Registration test failed');
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🧪 Testing user login...');
  
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: testUser.username,
      password: testUser.password
    })
  });

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    console.log('✅ Login test passed');
    console.log(`🔑 Auth token obtained: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login test failed');
    return false;
  }
}

async function testGetUserProfile() {
  console.log('\n🧪 Testing get user profile...');
  
  const response = await apiRequest('/api/auth/me');

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 200 && response.data.user) {
    console.log('✅ Get profile test passed');
    return true;
  } else {
    console.log('❌ Get profile test failed');
    return false;
  }
}

async function testGetAccounts() {
  console.log('\n🧪 Testing get accounts...');
  
  const response = await apiRequest('/api/accounts');

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 200 && response.data.data) {
    console.log('✅ Get accounts test passed');
    return true;
  } else {
    console.log('❌ Get accounts test failed');
    return false;
  }
}

async function testCreateAccount() {
  console.log('\n🧪 Testing create account...');
  
  const accountData = {
    accountName: 'Test Documentation Account',
    currency: 'EUR',
    initialBalance: 1000
  };

  const response = await apiRequest('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 201 && response.data.data && response.data.data.account) {
    console.log('✅ Create account test passed');
    return response.data.data.account;
  } else {
    console.log('❌ Create account test failed');
    return null;
  }
}

async function testGetTransactions() {
  console.log('\n🧪 Testing get transactions...');
  
  const response = await apiRequest('/api/transactions');

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  if (response.status === 200) {
    console.log('✅ Get transactions test passed');
    return true;
  } else {
    console.log('❌ Get transactions test failed');
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Testing unauthorized access...');
  
  const originalToken = authToken;
  authToken = null; // Remove auth token
  
  const response = await apiRequest('/api/accounts');

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  
  authToken = originalToken; // Restore auth token
  
  if (response.status === 401) {
    console.log('✅ Unauthorized access test passed');
    return true;
  } else {
    console.log('❌ Unauthorized access test failed');
    return false;
  }
}

async function testSwaggerEndpoints() {
  console.log('\n🧪 Testing Swagger documentation endpoints...');
  
  // Test English docs
  const enResponse = await fetch(`${BASE_URL}/docs`);
  console.log(`English docs status: ${enResponse.status}`);
  
  // Test Estonian docs
  const etResponse = await fetch(`${BASE_URL}/docs/et`);
  console.log(`Estonian docs status: ${etResponse.status}`);
  
  // Test api-docs endpoints
  const apiDocsResponse = await fetch(`${BASE_URL}/api-docs`);
  console.log(`API docs status: ${apiDocsResponse.status}`);
  
  const apiDocsEtResponse = await fetch(`${BASE_URL}/api-docs/et`);
  console.log(`API docs ET status: ${apiDocsEtResponse.status}`);
  
  if (enResponse.status === 200 && etResponse.status === 200 && 
      apiDocsResponse.status === 200 && apiDocsEtResponse.status === 200) {
    console.log('✅ Swagger documentation endpoints test passed');
    return true;
  } else {
    console.log('❌ Swagger documentation endpoints test failed');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Documentation Validation Tests\n');
  console.log('=' .repeat(50));
  
  const tests = [
    testSwaggerEndpoints,
    testUserRegistration,
    testUserLogin,
    testGetUserProfile,
    testGetAccounts,
    testCreateAccount,
    testGetTransactions,
    testUnauthorizedAccess
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
    }
    console.log('-'.repeat(30));
  }

  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log(`✅ Tests passed: ${passed}`);
  console.log(`❌ Tests failed: ${failed}`);
  console.log(`📈 Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API documentation is accurate.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the API implementation vs documentation.');
  }
}

// Wait a bit for server to be ready, then run tests
setTimeout(runTests, 2000);
