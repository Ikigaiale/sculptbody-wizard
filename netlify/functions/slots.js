const https    = require('https');
const BRANCHES = require('./_branches');

exports.handler = async function(event) {
  const { branch, service_id, date } = event.queryStringParameters || {};
  const b = BRANCHES[parseInt(branch ?? '0')];
  if (!b || !service_id || !date) return err('Parámetros faltantes');

  const auth = Buffer.from(b.user + ':' + b.pass).toString('base64');

  // Probar endpoints conocidos de AgendaPro para disponibilidad
  const paths = [
    `/api/public/v1/available_hours?service_id=${service_id}&date=${date}`,
    `/api/public/v1/slots?service_id=${service_id}&date=${date}`,
    `/api/public/v1/agenda?service_id=${service_id}&date=${date}`,
  ];

  for (const path of paths) {
    try {
      const data = await apiFetch(path, auth);
      const slots = Array.isArray(data) ? data : (data.slots || data.available_hours || data.hours || data.data || null);
      if (slots) return ok({ slots, date });
    } catch(e) { /* siguiente */ }
  }

  return err('No se pudo obtener disponibilidad');
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
