import { createElement, useMemo, useState } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { ShoppingCart, Trash2, Plus } from 'lucide-react';

interface CartItem {
  id: number;
  label: string;
  price: number;
  discount1: number;
  discount2: number;
}

function DiscountPanel({}: { results: CalculatorResult[] }) {
  const [items, setItems] = useState<CartItem[]>([
    { id: 1, label: 'Item 1', price: 49.99, discount1: 20, discount2: 0 },
  ]);
  const [salesTax, setSalesTax] = useState('8.25');

  const taxRate = parseFloat(salesTax) / 100 || 0;

  const cartTotals = useMemo(() => {
    let totalOriginal = 0;
    let totalAfterDiscount = 0;
    let totalAfterTax = 0;
    const rows = items.map((item) => {
      const price = item.price;
      const d1 = item.discount1 / 100;
      const d2 = item.discount2 / 100;
      const afterDiscount = price * (1 - d1) * (1 - d2);
      const afterTax = afterDiscount * (1 + taxRate);
      totalOriginal += price;
      totalAfterDiscount += afterDiscount;
      totalAfterTax += afterTax;
      return { ...item, afterDiscount, afterTax, savings: price - afterDiscount };
    });

    const totalSavings = totalOriginal - totalAfterDiscount;
    return { rows, totalOriginal, totalAfterDiscount, totalAfterTax, totalSavings };
  }, [items, taxRate]);

  const addItem = () => {
    const maxId = items.reduce((m, i) => Math.max(m, i.id), 0);
    setItems([...items, { id: maxId + 1, label: `Item ${maxId + 1}`, price: 0, discount1: 0, discount2: 0 }]);
  };

  const updateItem = (id: number, field: keyof CartItem, value: string) => {
    setItems(items.map((item) =>
      item.id === id
        ? { ...item, [field]: field === 'label' ? value : parseFloat(value) || 0 }
        : item
    ));
  };

  const removeItem = (id: number) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <ShoppingCart size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Bulk Discount Calculator</span>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Sales Tax:</label>
            <div className="relative w-20">
              <input
                type="text"
                inputMode="decimal"
                value={salesTax}
                onChange={(e) => setSalesTax(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full pl-3 pr-6 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
            </div>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold hover:bg-blue-100 transition-colors"
          >
            <Plus size={12} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Item</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Price</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Disc. 1</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Disc. 2</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-600 uppercase tracking-wider text-[10px]">Final</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-600 uppercase tracking-wider text-[10px] hidden sm:table-cell">Saved</th>
                <th scope="col" className="w-8 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {cartTotals.rows.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                      className="w-20 sm:w-28 px-2 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.price ?? ''}
                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        className="w-16 sm:w-20 pl-4 pr-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.discount1 || ''}
                      onChange={(e) => updateItem(item.id, 'discount1', e.target.value)}
                      className="w-14 px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.discount2 || ''}
                      onChange={(e) => updateItem(item.id, 'discount2', e.target.value)}
                      className="w-14 px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-600">${fmt(item.afterTax)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-500 hidden sm:table-cell">${fmt(item.savings)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Original</p>
            <p className="text-lg font-black text-slate-800">${fmt(cartTotals.totalOriginal)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">After Discount</p>
            <p className="text-lg font-black text-emerald-700">${fmt(cartTotals.totalAfterDiscount)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Total You Pay</p>
            <p className="text-lg font-black text-blue-700">${fmt(cartTotals.totalAfterTax)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Total Saved</p>
            <p className="text-lg font-black text-red-600">${fmt(cartTotals.totalSavings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const discountConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'originalPrice',
      label: 'Original Price',
      type: 'number',
      placeholder: '49.99',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'The full price of the item before any discounts are applied.',
    },
    {
      id: 'discount1',
      label: 'Discount 1',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      required: true,
      helpText: 'First discount percentage — applied first',
    },
    {
      id: 'discount2',
      label: 'Discount 2 (Stackable)',
      type: 'number',
      placeholder: '0',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      helpText: 'Second stackable discount — applied to the already-discounted price. Common in clearance sales.',
    },
    {
      id: 'salesTaxRate',
      label: 'Sales Tax',
      type: 'number',
      placeholder: '8.25',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.01,
      helpText: 'Sales tax percentage applied to the final price after all discounts.',
    },
  ],

  calculate: (values) => {
    const price = parseFloat(values.originalPrice);
    const d1 = parseFloat(values.discount1) / 100;
    const d2 = parseFloat(values.discount2) / 100;
    const tax = parseFloat(values.salesTaxRate) / 100 || 0;

    if (isNaN(price) || isNaN(d1) || price <= 0) return [];

    const afterD1 = price * (1 - d1);
    const afterD2 = afterD1 * (1 - d2);
    const totalSavings = price - afterD2;
    const savingsPct = (totalSavings / price) * 100;
    const taxAmount = afterD2 * tax;
    const finalPrice = afterD2 + taxAmount;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      { id: 'finalPrice', label: tax > 0 ? 'Final Price (after discounts and tax)' : 'Final Price (after discounts)', value: `$${fmt(finalPrice)}`, highlight: true, color: 'positive' as const },
      { id: 'totalSavings', label: 'You Save', value: `$${fmt(totalSavings)} (${savingsPct.toFixed(1)}% off)`, color: 'positive' as const },
      { id: 'afterDiscount', label: d2 > 0 ? 'After Stacked Discounts' : 'After Discount', value: `$${fmt(afterD2)}`, color: 'neutral' as const },
    ];
  },

  extraPanel: (_values, results) => {
    if (!results.length) return null;
    return createElement(DiscountPanel, { results });
  },

  educational: {
    formula: 'Final = Price × (1 − d₁) × (1 − d₂) × (1 + tax)',
    formulaDescription:
      'Stacked discounts are applied sequentially, not added. A 20% + 10% stack is NOT 30% off — the 10% applies to the already-reduced price, making the effective discount 28%, not 30%. This is one of the most common pricing misconceptions in retail, and stores rely on it to make discounts appear larger than they actually are. Sales tax is always applied after all discounts, on the final discounted subtotal.',
    diagram: {
      svg: '<svg viewBox="0 0 440 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="20" width="320" height="260" fill="#f8fafc" stroke="#e2e8f0" rx="10"/><rect x="80" y="45" width="280" height="36" rx="6" fill="#f1f5f9"/><text x="100" y="69" font-family="system-ui,sans-serif" font-size="13" fill="#64748b">Original Price</text><text x="340" y="69" font-family="system-ui,sans-serif" font-size="16" fill="#1e293b" text-anchor="end" font-weight="bold">$100.00</text><text x="220" y="105" font-family="system-ui,sans-serif" font-size="14" fill="#ef4444" text-anchor="middle" font-weight="bold">20% OFF</text><rect x="80" y="120" width="280" height="36" rx="6" fill="#fee2e2"/><text x="100" y="144" font-family="system-ui,sans-serif" font-size="13" fill="#dc2626">After 20% Off</text><text x="340" y="144" font-family="system-ui,sans-serif" font-size="16" fill="#dc2626" text-anchor="end" font-weight="bold">$80.00</text><text x="220" y="178" font-family="system-ui,sans-serif" font-size="14" fill="#f59e0b" text-anchor="middle" font-weight="bold">Extra 10% OFF</text><rect x="80" y="195" width="280" height="36" rx="6" fill="#fef3c7"/><text x="100" y="219" font-family="system-ui,sans-serif" font-size="13" fill="#d97706">Final (28% total off)</text><text x="340" y="219" font-family="system-ui,sans-serif" font-size="16" fill="#d97706" text-anchor="end" font-weight="bold">$72.00</text><text x="220" y="260" font-family="system-ui,sans-serif" font-size="12" fill="#64748b" text-anchor="middle">NOT 30% off — math: 100 x 0.80 x 0.90 = 72</text></svg>',
      alt: 'Stacked discount breakdown showing $100 original price, 20% off to $80, then extra 10% off to $72 final, demonstrating that 20% + 10% = 28% not 30%',
      caption: 'Stacked discounts are multiplied, not added — 20% off + extra 10% off = 28% total savings, not 30%',
    },
    variables: [
      { symbol: 'Stacked Discount', name: 'Sequential Application', description: 'Each discount percentage is applied to the balance after the previous discount. 20% off + 10% off = 100 × 0.80 × 0.90 = 72, meaning 28% total off. The order of multiplication does not matter — the same result occurs regardless of which discount is applied first.' },
      { symbol: 'Sales Tax', name: 'Applied After Discounts', description: 'Sales tax is calculated on the final discounted price — one reason to stack discounts before tax. You effectively save a small amount on tax when you get a larger discount.' },
    ],
    howToUse: [
      'Enter the original price of the item.',
      'Enter Discount 1 — this is applied first to the full price.',
      'Enter Discount 2 (optional) — this is applied sequentially to the already-discounted price, not added to the first discount.',
      'Optionally enter a sales tax rate to see the final out-the-door price including all discounts and tax.',
      'Review the effective total discount percentage — this is the actual percentage you saved off the original price.',
      'Use the interactive cart panel below for bulk calculations — add multiple items with their own individual prices and stacked discounts.',
    ],
    quickReference: [
      { label: '10% off $50', value: '$5 saved, pay $45' },
      { label: '25% off $100', value: '$25 saved, pay $75' },
      { label: '50% off $200', value: '$100 saved, pay $100' },
      { label: '20% + 10% off $100', value: '$28 saved (28%), pay $72' },
      { label: '30% + 20% off $100', value: '$44 saved (44%), pay $56' },
      { label: '50% + 20% off $100', value: '$60 saved (60%), pay $40' },
      { label: '$50 + 10% off + 8% tax', value: '$48.60 total' },
      { label: 'Effective: 20% + 10%', value: '28% total, not 30%' },
    ],
    commonUses: [
      'Retail shopping — quickly determine the real price after clearance discounts, coupon codes, and loyalty rewards stacked together',
      'Black Friday planning — evaluate "doorbuster" deals that advertise stacked percentages to understand the actual savings before arriving at the store',
      'Inventory clearance — calculate final prices for marked-down items with additional store-wide discounts applied at the register',
      'Business purchasing — determine out-the-door pricing including trade discounts, volume discounts, and applicable sales tax for procurement decisions',
      'Coupon optimization — compare scenarios: is a 20% off coupon better on a full-price item or can you stack it with an existing sale for maximum savings',
    ],
    explanation:
      'Stackable discounts are common in clearance and retail: "Take an additional 10% off already reduced prices." The key math is that discounts are multiplied, not added. A 20% off clearance tag plus a 10% loyalty discount equals 28% total off, not 30%. Retailers exploit this gap during Black Friday and clearance events by advertising stacked discount percentages that add up to an impressive-sounding number, knowing that the actual effective discount will be lower. For example, "50% off everything, plus an extra 20% for cardholders" sounds like 70% off, but the actual discount is 60% (your final price is 0.50 × 0.80 = 0.40 of the original). This calculator shows the exact math and the effective discount rate so you always know what you are really saving. The interactive bulk cart below lets you apply stacked discounts across an entire shopping trip with line-item detail and a running total.',
    faqs: [
      {
        question: 'Is a 20% + 10% discount the same as 30% off?',
        answer: 'No. 20% off leaves 80% of the original price. Then 10% off the remaining 80% takes off 8% of the original. Total discount = 28%, not 30%. On a $100 item, 20% + 10% saves $28 (you pay $72), while a true 30% off saves $30 (you pay $70). The absolute difference widens with higher prices — on a $500 item, the gap is $10 ($140 saved vs. $150 saved).',
      },
      {
        question: 'Can I combine a coupon with a store-wide sale?',
        answer: 'It depends on the store\'s policy. Some allow "stacking" (applying multiple discounts sequentially), others only allow the greater of the two. This calculator assumes stacking is allowed. Always check the fine print — many stores explicitly exclude coupon stacking on already-reduced items. When they do allow stacking, the order does not matter for pure percentage discounts since multiplication is commutative, but it matters enormously if one discount is a fixed dollar amount.',
      },
      {
        question: 'How do I use the bulk cart feature?',
        answer: 'The interactive panel below the main calculator lets you add multiple items, each with its own price and up to two stacked discounts. You can set a sales tax rate that applies to the entire cart. The cart shows line-item detail including each item\'s final price, itemized savings, and running totals for the whole order. Use the pencil icon to edit item names and the trash icon to remove items. This is especially useful for clearance shopping where different items have different discount levels.',
      },
      {
        question: 'Does the order of discounts matter?',
        answer: 'For percentage-only discounts, the order does not matter — multiplication is commutative. 20% off then 10% off gives the same result as 10% off then 20% off. However, if one discount is a fixed dollar amount (e.g., $10 off), the order matters significantly. Applying a percentage discount first then a fixed discount usually saves more money because the fixed amount comes off a lower base price. Always read the fine print on how the store applies stacking.',
      },
      {
        question: 'How does sales tax interact with discounts?',
        answer: 'Sales tax is always calculated on the final discounted price, not the original price. This means you effectively save a small amount on tax when you get a discount. For example, an $100 item at 20% off costs $80, and 8% tax on $80 = $6.40, totaling $86.40. Without the discount, it would be $100 + $8 = $108. Your total savings including the tax benefit: $108 - $86.40 = $21.60, which is 20% off the pre-tax price plus an extra $1.60 saved on tax. The interactive bulk cart panel automatically includes this effect.',
      },
    ],
  },
};

export default discountConfig;
