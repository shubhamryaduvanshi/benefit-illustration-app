import React, { useMemo, useState } from 'react';
import { IllustrationTable, type IllustrationRow } from './IllustrationTable';
import { apiFetch } from '../lib/api';

type Frequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
type Gender = 'M' | 'F' | 'Other';

type ProjectionResponse = {
  inputs: {
    dob: string;
    gender: Gender;
    sumAssured: number;
    premium: number;
    frequency: Frequency;
    pt: number;
    ppt: number;
    age: number;
  };
  annualPremium: number;
  irrAssumed: number;
  rows: IllustrationRow[];
};

function ageCompletedBirthday(dobIso: string, asOfDate = new Date()): number | null {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const y = asOfDate.getFullYear() - dob.getFullYear();
  const m = asOfDate.getMonth() - dob.getMonth();
  const hadBirthday = m > 0 || (m === 0 && asOfDate.getDate() >= dob.getDate());
  return hadBirthday ? y : y - 1;
}

function max(a: number, b: number) {
  return a > b ? a : b;
}

export function PolicyInputForm({ token }: { token: string }) {
  const [dob, setDob] = useState<string>('1995-01-01');
  const [gender, setGender] = useState<Gender>('M');
  const [sumAssured, setSumAssured] = useState<number>(5_000_000);
  const [premium, setPremium] = useState<number>(10_000);
  const [frequency, setFrequency] = useState<Frequency>('Yearly');
  const [pt, setPt] = useState<number>(18);
  const [ppt, setPpt] = useState<number>(10);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [data, setData] = useState<ProjectionResponse | null>(null);

  // Treat “provided data” as constants on the client; replace with your approved rate card.
  const bonusRatesByYear = useMemo(() => {
    const byYear: number[] = [];
    for (let y = 1; y <= 20; y += 1) byYear.push(0.0);
    return byYear;
  }, []);

  const validationErrors = useMemo(() => {
    const e: string[] = [];
    const age = ageCompletedBirthday(dob);
    if (age == null) e.push('DOB is invalid');
    if (age != null && (age < 23 || age > 56)) e.push('Age must be 23–56 (completed birthday)');

    if (ppt < 5 || ppt > 10) e.push('PPT must be 5–10');
    if (pt < 10 || pt > 20) e.push('PT must be 10–20');
    if (pt <= ppt) e.push('PT must be > PPT');

    if (premium < 10_000 || premium > 50_000) e.push('Premium must be 10,000–50,000');
    const minSA = max(10 * premium, 5_000_000);
    if (sumAssured < minSA) e.push(`Sum Assured must be >= ${minSA.toLocaleString()}`);

    return e;
  }, [dob, ppt, pt, premium, sumAssured]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiErrors([]);
    setData(null);

    if (!token) {
      setApiErrors(['Please login first to generate an illustration.']);
      return;
    }

    if (validationErrors.length) {
      setApiErrors(validationErrors);
      return;
    }

    const { resp, payload } = await apiFetch('/api/illustration/project', {
      method: 'POST',
      token,
      body: JSON.stringify({
        dob,
        gender,
        sumAssured,
        premium,
        frequency,
        pt,
        ppt,
        bonusRatesByYear,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 401) setApiErrors(['Session expired. Please login again.']);
      else setApiErrors(payload?.errors || [payload?.error || 'Request failed']);
      return;
    }
    setData(payload as ProjectionResponse);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="cardBody" style={{ display: 'grid', gap: 12 }}>
          <div>
            <div className="sectionTitle">Generate illustration</div>
            <div className="sectionHint">{token ? 'Authenticated session' : 'Login required to generate.'}</div>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <div className="grid3">
              <div className="field">
                <div className="label">DOB</div>
                <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="field">
                <div className="label">Gender</div>
                <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <div className="label">Frequency</div>
                <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid4">
              <div className="field">
                <div className="label">Sum Assured (SA)</div>
                <input className="input" type="number" value={sumAssured} onChange={(e) => setSumAssured(Number(e.target.value))} />
              </div>
              <div className="field">
                <div className="label">Premium</div>
                <input className="input" type="number" value={premium} onChange={(e) => setPremium(Number(e.target.value))} />
              </div>
              <div className="field">
                <div className="label">PT (10–20)</div>
                <input className="input" type="number" value={pt} onChange={(e) => setPt(Number(e.target.value))} />
              </div>
              <div className="field">
                <div className="label">PPT (5–10)</div>
                <input className="input" type="number" value={ppt} onChange={(e) => setPpt(Number(e.target.value))} />
              </div>
            </div>

            <div className="notice">
              IRR is treated as a constant at <b>8.4%</b>. Bonus rates are treated as constants provided in the request.
            </div>

            {apiErrors.length > 0 && (
              <div className="alert">
                <div className="alertTitle">Fix these</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)' }}>
                  {apiErrors.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button type="submit" disabled={!token} className="btn btnPrimary">
                Generate Illustration
              </button>
              {data?.irrAssumed != null ? <div className="pill">PV uses IRR: {(data.irrAssumed * 100).toFixed(1)}%</div> : null}
            </div>
          </form>
        </div>
      </div>

      {data?.rows?.length ? <IllustrationTable rows={data.rows} /> : null}
    </div>
  );
}

