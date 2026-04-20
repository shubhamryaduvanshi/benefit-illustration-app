const express = require('express');
const { requireAuth } = require('../middleware/auth');

/**
 * Controller + Calculation Utility in one block (per requirement).
 * - Inputs: DOB, Gender, SA, Premium, Frequency, PT, PPT.
 * - Validations: 5 rules (strict).
 * - Calculation: bonus = SA * bonusRate, total benefit only final year, net cashflow = benefit - premium.
 * - Precision: IRR=8.4% constant used for PV column.
 */
const IRR_ASSUMED = 0.084;

const FREQ = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
};

function frequencyMultiplier(frequency) {
  switch (frequency) {
    case FREQ.MONTHLY:
      return 12;
    case FREQ.QUARTERLY:
      return 4;
    case FREQ.HALF_YEARLY:
      return 2;
    case FREQ.YEARLY:
      return 1;
    default:
      return null;
  }
}

function ageCompletedBirthday(dobIso, asOfDate = new Date()) {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const y = asOfDate.getFullYear() - dob.getFullYear();
  const m = asOfDate.getMonth() - dob.getMonth();
  const hadBirthday = m > 0 || (m === 0 && asOfDate.getDate() >= dob.getDate());
  return hadBirthday ? y : y - 1;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function validateInputs(input) {
  const errors = [];
  const {
    dob,
    gender,
    sumAssured,
    premium,
    frequency,
    pt,
    ppt,
    bonusRatesByYear,
  } = input || {};

  const age = ageCompletedBirthday(dob);
  if (age == null) errors.push('DOB is invalid');
  if (age != null && (age < 23 || age > 56)) errors.push('Age must be between 23 and 56 (completed birthday)');

  if (!['M', 'F', 'Other'].includes(gender)) errors.push('Gender must be M, F, or Other');

  const PT = Number(pt);
  const PPT = Number(ppt);
  const Prem = Number(premium);
  const SA = Number(sumAssured);

  // (1) PPT (5-10), PT (10-20).
  if (!Number.isFinite(PPT) || PPT < 5 || PPT > 10) errors.push('PPT must be between 5 and 10');
  if (!Number.isFinite(PT) || PT < 10 || PT > 20) errors.push('PT must be between 10 and 20');

  // (2) Premium (10k-50k).
  if (!Number.isFinite(Prem) || Prem < 10_000 || Prem > 50_000) errors.push('Premium must be between 10,000 and 50,000');

  // (3) PT must be > PPT.
  if (Number.isFinite(PT) && Number.isFinite(PPT) && PT <= PPT) errors.push('PT must be greater than PPT');

  // (4) SA >= Max(10*Premium, 5,000,000).
  const minSA = Math.max(10 * Prem, 5_000_000);
  if (!Number.isFinite(SA) || SA < minSA) errors.push(`Sum Assured must be at least ${minSA}`);

  const mult = frequencyMultiplier(frequency);
  if (!mult) errors.push('Frequency must be Monthly, Quarterly, Half-Yearly, or Yearly');

  if (!Array.isArray(bonusRatesByYear) || bonusRatesByYear.length < PT) {
    errors.push('bonusRatesByYear must be an array with at least PT entries (year-indexed from 1)');
  } else {
    for (let i = 0; i < PT; i += 1) {
      const r = Number(bonusRatesByYear[i]);
      if (!Number.isFinite(r) || r < 0) {
        errors.push(`Invalid bonus rate for year ${i + 1}`);
        break;
      }
    }
  }

  return { ok: errors.length === 0, errors, age, PT, PPT, Prem, SA, frequencyMult: mult };
}

function buildProjection({ age, PT, PPT, Prem, SA, frequencyMult, bonusRatesByYear }) {
  const annualPremium = Prem * frequencyMult;
  let cumulativeBonus = 0;
  const rows = [];

  for (let year = 1; year <= PT; year += 1) {
    const bonusRate = Number(bonusRatesByYear[year - 1]); // treat as constant per supplied data
    const bonusAmount = round2(SA * bonusRate);
    cumulativeBonus = round2(cumulativeBonus + bonusAmount);

    const premiumPaid = year <= PPT ? annualPremium : 0;

    const benefit = year === PT ? round2(SA + cumulativeBonus) : 0; // paid only in final year
    const netCashflow = round2(benefit - premiumPaid);
    const pvNetCashflow = round2(netCashflow / Math.pow(1 + IRR_ASSUMED, year));

    rows.push({
      year,
      attainedAge: age + (year - 1),
      premiumPaid,
      bonusRate,
      bonusAmount,
      cumulativeBonus,
      benefit,
      netCashflow,
      pvNetCashflow,
    });
  }

  return { annualPremium, irrAssumed: IRR_ASSUMED, rows };
}

const illustrationRouter = express.Router();

illustrationRouter.post('/project', requireAuth, async (req, res) => {
  const v = validateInputs(req.body);
  if (!v.ok) return res.status(400).json({ errors: v.errors });

  const { bonusRatesByYear } = req.body;
  const projection = buildProjection({ ...v, bonusRatesByYear });

  return res.json({
    inputs: {
      dob: req.body.dob,
      gender: req.body.gender,
      sumAssured: v.SA,
      premium: v.Prem,
      frequency: req.body.frequency,
      pt: v.PT,
      ppt: v.PPT,
      age: v.age,
    },
    ...projection,
  });
});

module.exports = { illustrationRouter };

