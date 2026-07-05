// Generates a standalone HTML file with a scannable QR for an Expo URL.
// Usage: node scripts/make-qr.js "exp://192.168.1.249:8081" out.html
const QRCode = require('qrcode');
const fs = require('fs');

const url = process.argv[2];
const out = process.argv[3] || 'qr.html';

QRCode.toString(url, { type: 'svg', margin: 2, width: 320 }, (err, svg) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scan to open MRAC in Expo Go</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0D1B45;color:#fff;
       margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#fff;color:#0f172a;border-radius:20px;padding:28px;max-width:380px;text-align:center;
        box-shadow:0 20px 60px rgba(0,0,0,.4)}
  h1{font-size:20px;margin:0 0 4px}
  p{color:#64748b;font-size:14px;margin:4px 0}
  .qr{background:#fff;padding:8px;display:inline-block;margin:14px 0}
  code{background:#f1f5f9;padding:3px 8px;border-radius:6px;font-size:12px;color:#0D1B45}
  ol{text-align:left;font-size:13px;color:#334155;line-height:1.6;padding-left:20px}
</style></head><body>
  <div class="card">
    <h1>MRAC Mobile</h1>
    <p>Point your <b>iPhone Camera</b> at this code</p>
    <div class="qr">${svg}</div>
    <p><code>${url}</code></p>
    <ol>
      <li>Make sure Expo Go is installed from the App Store</li>
      <li>Open the iPhone <b>Camera</b> (not a QR app) and aim at the code</li>
      <li>Tap the yellow banner to open in Expo Go</li>
      <li>If it looks blank, shake the phone → <b>Reload</b></li>
    </ol>
  </div>
</body></html>`;
  fs.writeFileSync(out, html);
  console.log('Wrote', out, 'for', url);
});
