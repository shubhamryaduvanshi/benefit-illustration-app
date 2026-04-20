const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { authRouter } = require('./routes/auth.routes');
const { illustrationRouter } = require('./routes/illustration.routes');

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '200kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/illustration', illustrationRouter);

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "Missing JWT_SECRET. Create 'server/.env' (copy from '.env.example') and set JWT_SECRET to a long random string."
    );
  }
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI. Create 'server/.env' (copy from '.env.example') and set MONGODB_URI.");
  }
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${port}`);
  });
}

start().catch((err) => {
  const msg = String(err?.message || err);
  if (msg.includes('ECONNREFUSED') && String(mongoUri || '').includes('27017')) {
    // eslint-disable-next-line no-console
    console.error(
      [
        msg,
        '',
        'MongoDB is not reachable at your MONGODB_URI.',
        'Fix options (pick one):',
        '  1) Start local MongoDB service (Windows) and keep MONGODB_URI=mongodb://127.0.0.1:27017/benefit_illustration',
        '  2) Run MongoDB via Docker:',
        '     docker run --name mongo -p 27017:27017 -d mongo:7',
        '  3) Use MongoDB Atlas and set MONGODB_URI accordingly',
      ].join('\n')
    );
  } else {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  process.exitCode = 1;
});

