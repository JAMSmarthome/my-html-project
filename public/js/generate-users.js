// scripts/generate-users.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const users = {
  admin: { password: 'admin123', lane: 'operator' },
  client1: { password: 'client1pass', lane: 'Client1' },
  client2: { password: 'client2pass', lane: 'Client2' }
};

(async () => {
  const out = {};
  for (const [username, { password, lane }] of Object.entries(users)) {
    out[username] = { passwordHash: await bcrypt.hash(password, 10), lane };
  }

  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'users.json'), JSON.stringify(out, null, 2));
  console.log('✅ users.json created successfully!');
})();