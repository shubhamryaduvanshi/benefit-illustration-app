import React from 'react';

export type IllustrationRow = {
  year: number;
  attainedAge: number;
  premiumPaid: number;
  bonusRate: number;
  bonusAmount: number;
  cumulativeBonus: number;
  benefit: number;
  netCashflow: number;
  pvNetCashflow: number;
};

export function IllustrationTable({ rows }: { rows: IllustrationRow[] }) {
  if (!rows?.length) return null;

  return (
    <div className="card">
      <div className="cardBody">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <div className="sectionTitle">Projection</div>
          <div className="sectionHint">Year-on-year policy projection</div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Year</th>
                <th className="th">Age</th>
                <th className="th">Premium Paid</th>
                <th className="th">Bonus Rate</th>
                <th className="th">Bonus Amount</th>
                <th className="th">Cumulative Bonus</th>
                <th className="th">Benefit (Final Yr)</th>
                <th className="th">Net Cashflow</th>
                <th className="th">PV @ 8.4%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="row">
                  <td className="td">{r.year}</td>
                  <td className="td">{r.attainedAge}</td>
                  <td className="td">{Math.round(r.premiumPaid).toLocaleString()}</td>
                  <td className="td">{(r.bonusRate * 100).toFixed(2)}%</td>
                  <td className="td">{Math.round(r.bonusAmount).toLocaleString()}</td>
                  <td className="td">{Math.round(r.cumulativeBonus).toLocaleString()}</td>
                  <td className="td">{Math.round(r.benefit).toLocaleString()}</td>
                  <td className="td">{Math.round(r.netCashflow).toLocaleString()}</td>
                  <td className="td">{Math.round(r.pvNetCashflow).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

