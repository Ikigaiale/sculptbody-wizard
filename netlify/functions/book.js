const https    = require('https');
const BRANCHES = require('./_branches');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch(e) { return err('JSON inválido'); }

  const { branch, service_id, provider_id, start_time, client } = body;
  const b = BRANCHES[parseInt(branch ?? '0')];
  if (!b) return err('Sucursal inválida');

  const auth    = Buffer.from(b.user + ':' + b.pass).toString('base64');
  const payload = JSON.stringify({ service_id, service_provider_id: provider_id, start_time, client });

  try {
    const data = await apiPost('/api/public/v1/bookings', auth, payload);
    return ok(data);
  } catch(e) {
    return err(e.message);
  }
};

function apiPost(path, auth, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'agendapro.com', path, method: 'POST',
        headers: { Authorization: 'Basic ' + auth, Accept: 'application/json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
      res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); }
    );
    req.on('error', reject); req.write(payload); req.end();
  });
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
const ok  = d => ({ statusCode: 200, headers: CORS, body: JSON.stringify(d) });
const err = m => ({ statusCode: 502, headers: CORS, body: JSON.stringify({ error: m }) });
