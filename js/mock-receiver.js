const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

app.post('/receive-alert', (req, res) => {
  const alert = req.body;

  console.log('📥 Received alert from test system:');
  console.log(JSON.stringify(alert, null, 2));

  // Simulate response back
  res.json({ status: 'received', receivedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`📡 Mock Third-Party Receiver running at http://localhost:${PORT}/receive-alert`);
});