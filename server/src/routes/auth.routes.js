const express = require('express');
const { User } = require('../models/User');
const { signJwt } = require('../middleware/auth');

const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, mobile, dob } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.register({ email, password, mobile, dob });
    const token = signJwt({ sub: String(user._id), email: user.email });
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    if (String(err?.code) === '11000') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signJwt({ sub: String(user._id), email: user.email });
    return res.json({ token, user: user.toSafeJSON() });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { authRouter };

