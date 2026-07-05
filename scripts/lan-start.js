#!/usr/bin/env node
/*
 * Starts Expo in LAN mode pinned to the real Wi-Fi/Ethernet IP.
 *
 * Why this exists: Expo auto-picks the lowest-metric network interface, which on
 * this machine is the VirtualBox host-only adapter (192.168.56.x) — an address
 * the phone can never reach, so scanning the QR just times out. This script finds
 * the actual LAN IPv4 (skipping VirtualBox, APIPA, and other virtual adapters) and
 * sets REACT_NATIVE_PACKAGER_HOSTNAME so the QR always points somewhere reachable.
 *
 * Usage:  node scripts/lan-start.js            (or: npm run lan)
 *         node scripts/lan-start.js --print    (just print the detected IP)
 */
const os = require('os');
const { spawn } = require('child_process');

function pickLanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];
  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue; // APIPA / link-local
      if (a.address.startsWith('192.168.56.')) continue; // VirtualBox host-only
      const virtual = /virtual|vethernet|vmware|hyper-v|loopback|bluetooth/i.test(name);
      // Rank real private LAN ranges highest; de-prioritise virtual adapters.
      const priv =
        a.address.startsWith('192.168.') ||
        a.address.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(a.address);
      candidates.push({ name, address: a.address, score: (priv ? 2 : 0) + (virtual ? 0 : 1) });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.address ?? null;
}

const ip = pickLanIp();

if (process.argv.includes('--print')) {
  console.log(ip ?? '(no LAN IP found)');
  process.exit(ip ? 0 : 1);
}

if (!ip) {
  console.error('Could not detect a LAN IP. Falling back to Expo default.');
} else {
  console.log(`\n📡  Pinning Expo to LAN IP: ${ip}\n    (phone must be on the same Wi-Fi)\n`);
}

const env = { ...process.env };
if (ip) env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

const args = ['expo', 'start', ...process.argv.slice(2)];
const child = spawn('npx', args, { stdio: 'inherit', env, shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
