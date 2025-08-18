const bcrypt = require("bcrypt");

const users = {
  admin: "admin123",
  operator: "operator123",
  client1: "client1pass",
  client2: "client2pass"
};

for (const [user, pass] of Object.entries(users)) {
  const hash = bcrypt.hashSync(pass, 10);
  console.log(`${user}: "${hash}"`);
}