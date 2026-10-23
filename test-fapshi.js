const https = require('https');

const data = JSON.stringify({
  amount: 100,
  phone: '670000000',
  medium: 'mobile money',
  externalId: 'test-1234',
  message: 'Test Fapshi API'
});

const options = {
  hostname: 'live.fapshi.com',
  port: 443,
  path: '/direct-pay',
  method: 'POST',
  headers: {
    'apiuser': '449d70c1-7010-4a28-bef2-6a82922f22ee',
    'apikey': 'FAK_a6fa9ff23f9640a69624e1bbc49e0495',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
