const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('--- TESTING REST API ENDPOINTS FROM ARCHITECTURE DIAGRAM ---');

  const endpoints = [
    { method: 'GET', url: '/health' },
    { method: 'GET', url: '/crops' },
    { method: 'GET', url: '/market-prices' },
    { method: 'GET', url: '/weather' },
    { method: 'GET', url: '/content' },
    { method: 'GET', url: '/feedback' },
    { method: 'GET', url: '/notifications' },
    { method: 'POST', url: '/feedback', data: { message: 'Test feedback message from architecture verification', rating: 5 } }
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios({
        method: ep.method,
        url: BASE_URL + ep.url,
        data: ep.data,
        validateStatus: () => true
      });
      console.log(`[${ep.method}] ${ep.url} => Status: ${res.status}, Success: ${res.data?.success}`);
    } catch (err) {
      console.error(`[${ep.method}] ${ep.url} => Error: ${err.message}`);
    }
  }
}

testEndpoints();
