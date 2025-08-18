const bcrypt = require("bcrypt");

const users = {
  admin: {
    password: "$2b$10$rRQ94BEMf64pjkHYXRjyjOrqOwxEFXEyQ51wRMxHc7vKH//YNOa0C", // admin123
    role: "test"
  },
  operator: {
    password: "$2b$10$5vG7IlfvzpRzFnqJxMk09OCea/dFJneObAsHJg2efHiWSfLLfK/k6", // operator123
    role: "operator"
  },
  client1: {
    password: "$2b$10$Kcd6DRZMuUr/6uwn4pTzfu04x9pnrtdZ8ixd6CvqZg6x2UvlMKK1K", // client1pass
    role: "client1"
  },
  client2: {
    password: "$2b$10$qW3cHbLbLR9sPvxtX1VfYe3eCeKMF9ZaXDuUpYcuZYOVP0AxIlEGa", // client2pass
    role: "client2"
  }
};

const testPasswords = {
  admin: "admin123",
  operator: "operator123",
  client1: "client1pass",
  client2: "client2pass"
};

for (const user in users) {
  bcrypt.compare(testPasswords[user], users[user].password, (err, result) => {
    console.log(`${user}: ${result ? "✅ Match" : "❌ No match"}`);
  });
}