const https   = require('https');
const BRANCHES = require('./_branches');

exports.handler = async function(event) {
  const idx = parseInt(event.queryStringParameters?.branch ?? '0');
  const b   = BRANCHES[idx];
  if (!b) return { statusCode: 400, body: JSON.stringify({ error: 'Sucursal inválida' }) };

  const auth = Buffer.from(b.user + ':' + b.pass).toString('base64');

  try {
    const data = await apiFetch('/api/public/v1/services', auth);
    const list = Array.isArray(data) ? data : (data.services || data.data || []);
    return ok({ services: list });
  } catch(e) {
    return err(e.message);
  }
};

function apiFetch(path, auth) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'agendapro.com', path, method: 'GET',
        headers: { Authorization: 'Basic ' + auth, Accept: 'application/json' } },
      res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); }
    );
    req.on('error', reject); req.end();
  });
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
const ok  = d => ({ statusCode: 200, headers: CORS, body: JSON.stringify(d) });
const err = m => ({ statusCode: 502, headers: CORS, body: JSON.stringify({ error: m }) });
