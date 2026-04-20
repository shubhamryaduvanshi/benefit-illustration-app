const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function maskMobile(mobile) {
  const digits = String(mobile || '').replace(/[^\d]/g, '');
  if (digits.length < 8) return '********';
  const last4 = digits.slice(-4);
  return `******${last4}`;
}

function maskDob(dobIso) {
  const d = new Date(dobIso);
  if (Number.isNaN(d.getTime())) return '**/**/****';
  const yyyy = String(d.getUTCFullYear());
  return `**/**/${yyyy}`;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    mobileMasked: { type: String, default: null },
    dobMasked: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.statics.register = async function register({ email, password, mobile, dob }) {
  const passwordHash = await bcrypt.hash(String(password), 12);
  return this.create({
    email,
    passwordHash,
    mobileMasked: mobile ? maskMobile(mobile) : null,
    dobMasked: dob ? maskDob(dob) : null,
  });
};

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  return bcrypt.compare(String(password), this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: String(this._id),
    email: this.email,
    mobileMasked: this.mobileMasked,
    dobMasked: this.dobMasked,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User, maskMobile, maskDob };

