const http = require('http');

const data = JSON.stringify({
  email: 'aryan@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log('Login Response:', body);
  });
});
req.on('error', error => { console.error(error); });
req.write(data);
req.end();
