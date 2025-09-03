const axios = require('axios');
require('dotenv').config();

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'udnews2025secure'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLogin();
