// ─── Break-even context ───────────────────────────────────────────────────────

export function BreakEvenContext({ breakEvenYear }: { breakEvenYear: number }) {
  if (breakEvenYear === -1) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-bold text-amber-800 mb-1">No Break-Even Within 30 Years</p>
        <p className="text-sm text-amber-700">
          At the current inputs, renting is cheaper than buying on a net-cost basis for at least 30
          years. This is often the case when home prices are very high relative to rents, appreciation
          is low, or the opportunity cost of the down payment is significant. Consider adjusting
          appreciation rate, down payment, or mortgage rate to explore sensitivity.
        </p>
      </div>
    );
  }

  const displayYear = Math.max(1, breakEvenYear);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-sm font-semibold text-slate-700 mb-2">
        At the break-even point (Year {displayYear}), your total buying costs equal your total
        renting costs.
      </p>
      <p className="text-sm text-slate-600">
        After that point, every additional year you stay makes buying increasingly advantageous &mdash;
        you continue building equity while your fixed mortgage payment stays flat as rent escalates.
        The longer you stay past the break-even, the wider the gap grows in favor of buying.
      </p>
    </div>
  );
}
