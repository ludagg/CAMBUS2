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
    'apiuser': '20307990-d0a6-4073-bc3b-e23797771057',
    'apikey': 'FAK_871ca524baaec9a2b36b57d0e3871266',
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
