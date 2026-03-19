
const https = require('https');

const projectRef = 'kbcwvtkstdxdbvygpwzr';
const token = 'sbp_847153fd46c73d6c3f0d26697b62b1ff90afb705';

const query = `
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'consultas' AND c.contype = 'c';
`;

const data = JSON.stringify({ query });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
