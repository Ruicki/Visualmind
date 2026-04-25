import https from 'https';

const options = {
  hostname: 'visualmind-production.up.railway.app',
  port: 443,
  path: '/api/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body.substring(0, 500));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();