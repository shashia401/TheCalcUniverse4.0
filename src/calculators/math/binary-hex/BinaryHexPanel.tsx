import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface BreakdownRow {
  digit: string;
  digitValue: number;
  position: number;
  basePower: number;
  contribution: string;
}

export default function BinaryHexPanel({ values, results }: Props) {
  const mode = values.mode;

  if (mode === 'Convert') return <ConversionPanel results={results} />;
  if (mode === 'Calculate') return <CalculationPanel results={results} />;
  return null;
}

// ─── Conversion Panel ───────────────────────────────────────────────────────
function ConversionPanel({ results }: { results: CalculatorResult[] }) {
  const inputRow = results.find((r) => r.id === 'inputDisplay');
  const convertedRow = results.find((r) => r.id === 'convertedResult');
  const formulaRow = results.find((r) => r.id === 'formulaString');
  const positionalData = results.find((r) => r.id === '_positionalData');
  const decimalRow = results.find((r) => r.id === 'resultDecimal');
  const binaryRow = results.find((r) => r.id === 'resultBinary');
  const hexRow = results.find((r) => r.id === 'resultHex');
  const octalRow = results.find((r) => r.id === 'resultOctal');

  const paddedBinaryRow = results.find((r) => r.id === 'resultPaddedBinary');
  const paddedHexRow = results.find((r) => r.id === 'resultPaddedHex');
  const signedRow = results.find((r) => r.id === 'resultSigned');
  const unsignedRow = results.find((r) => r.id === 'resultUnsigned');
  const widthBinaryRow = results.find((r) => r.id === 'resultBinaryWidth');

  const hasWidth = !!(paddedBinaryRow || signedRow);

  if (!convertedRow || !inputRow) return null;

  let breakdownRows: BreakdownRow[] = [];
  if (positionalData?.value) {
    try {
      breakdownRows = JSON.parse(positionalData.value);
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Base Conversion Steps
        </span>
        {hasWidth && <BitWidthBadge results={results} />}
      </div>

      <div className="p-4 space-y-3">
        {/* Result Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">{inputRow.label}</p>
          <p className="text-xl font-bold text-slate-700 font-mono mb-3">
            {inputRow.value}
          </p>
          <div className="border-t border-blue-200 pt-3 mt-3">
            <p className="text-sm text-slate-500 mb-1">{convertedRow.label}</p>
            <p className="text-3xl font-bold text-blue-700 font-mono">
              {convertedRow.value}
            </p>
          </div>
        </div>

        {/* Bit-width context: signed/unsigned + padded binary */}
        {hasWidth && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Signed / Unsigned Interpretation
            </p>
            {signedRow && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 font-semibold">Signed:</span>
                <span className="text-emerald-700">{signedRow.value}</span>
              </div>
            )}
            {unsignedRow && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 font-semibold">Unsigned:</span>
                <span className="text-emerald-700">{unsignedRow.value}</span>
              </div>
            )}
            {widthBinaryRow && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 font-semibold">Two's Complement:</span>
                <span className="text-emerald-700 break-all">{widthBinaryRow.value}₂</span>
              </div>
            )}
          </div>
        )}

        {/* Positional breakdown table */}
        {breakdownRows.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Positional Value Breakdown
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th scope="col" className="text-left py-1 pr-3">Digit</th>
                      <th scope="col" className="text-right px-2">Digit Value</th>
                      <th scope="col" className="text-right px-2">Position</th>
                      <th scope="col" className="text-right px-2">Base<sup>Pos</sup></th>
                      <th scope="col" className="text-right pl-2">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row) => (
                      <tr key={`${row.digit}-${row.position}`} className="border-b border-slate-100 text-slate-700">
                        <td className="py-1 pr-3 font-bold text-blue-700">{row.digit}</td>
                        <td className="text-right px-2">{row.digitValue}</td>
                        <td className="text-right px-2 text-slate-500">{row.position}</td>
                        <td className="text-right px-2 text-slate-500">
                          {row.basePower}<sup>{superscript(row.position)}</sup>
                        </td>
                        <td className="text-right pl-2 font-bold text-blue-700">
                          {row.contribution}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-300 font-bold text-slate-800">
                      <td className="py-1 pr-3" colSpan={4}>Sum (Decimal)</td>
                      <td className="text-right pl-2 text-blue-700">
                        {(() => {
                          try {
                            return breakdownRows.reduce((s, r) => s + BigInt(r.contribution), 0n).toString();
                          } catch {
                            return 'Error';
                          }
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Formula string */}
            {formulaRow && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Positional Formula
                </p>
                <p className="text-xs font-mono text-slate-700 mt-1 whitespace-pre-wrap break-all">
                  {formulaRow.value}
                </p>
              </div>
            )}
          </div>
        )}

        {/* All 4 bases display */}
        {(decimalRow || binaryRow || hexRow || octalRow) && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Value in All Bases
            </p>
            <div className="grid grid-cols-2 gap-2">
              {decimalRow && <BaseCard label={decimalRow.label} value={decimalRow.value} />}
              {binaryRow && <BaseCard label={binaryRow.label} value={binaryRow.value} />}
              {hexRow && <BaseCard label={hexRow.label} value={hexRow.value} />}
              {octalRow && <BaseCard label={octalRow.label} value={octalRow.value} />}
            </div>
          </div>
        )}

        {/* Padded binary/hex at bit width */}
        {paddedBinaryRow && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Padded to Selected Width
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paddedBinaryRow && <BaseCard label={paddedBinaryRow.label} value={paddedBinaryRow.value} />}
              {paddedHexRow && <BaseCard label={paddedHexRow.label} value={paddedHexRow.value} />}
            </div>
          </div>
        )}

        {/* Byte layout (endianness) */}
        <ByteLayoutSection results={results} />

        {/* Reference: base prefixes */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Common Base Prefixes
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">0b</p>
              <p className="text-slate-500">Binary</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">0o</p>
              <p className="text-slate-500">Octal</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">0x</p>
              <p className="text-slate-500">Hexadecimal</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">none</p>
              <p className="text-slate-500">Decimal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calculation Panel ──────────────────────────────────────────────────────
function CalculationPanel({ results }: { results: CalculatorResult[] }) {
  const operationRow = results.find((r) => r.id === 'operationDisplay');
  const calcRow = results.find((r) => r.id === 'calcResult');
  const stepRow = results.find((r) => r.id === 'stepDetail');
  const decimalRow = results.find((r) => r.id === 'resultDecimal');
  const binaryRow = results.find((r) => r.id === 'resultBinary');
  const hexRow = results.find((r) => r.id === 'resultHex');
  const octalRow = results.find((r) => r.id === 'resultOctal');

  const signedRow = results.find((r) => r.id === 'signedDecimal');
  const unsignedRow = results.find((r) => r.id === 'unsignedDecimal');
  const flagsRow = results.find((r) => r.id === 'flags');
  const addData = results.find((r) => r.id === '_binaryAddDetail');
  const addOps = results.find((r) => r.id === '_binaryAddOperands');
  const paddedBinaryRow = results.find((r) => r.id === 'resultPaddedBinary');
  const paddedHexRow = results.find((r) => r.id === 'resultPaddedHex');

  const hasWidth = !!(signedRow || unsignedRow);

  if (!calcRow) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 0v10m0-10V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m0 0H5m14 0h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Step-by-Step Calculation
        </span>
        {hasWidth && <BitWidthBadge results={results} />}
      </div>

      <div className="p-4 space-y-3">
        {/* Operation display */}
        {operationRow && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Operation</p>
            <p className="text-sm font-mono text-slate-700 mt-1 font-bold">
              {operationRow.value}
            </p>
          </div>
        )}

        {/* Result Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3 text-center">
          <p className="text-[9px] text-slate-500 mb-0.5">{calcRow.label}</p>
          <p className="text-base font-bold text-blue-700 font-mono break-all leading-tight">
            {calcRow.value}
          </p>
        </div>

        {/* Flags */}
        {flagsRow && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">CPU Flags</p>
            <p className="text-xs font-mono text-amber-800 whitespace-pre-wrap">
              {flagsRow.value}
            </p>
          </div>
        )}

        {/* Signed/unsigned section */}
        {hasWidth && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Signed / Unsigned Interpretation
            </p>
            {signedRow && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 font-semibold">Signed:</span>
                <span className="text-emerald-700">{signedRow.value}</span>
              </div>
            )}
            {unsignedRow && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 font-semibold">Unsigned:</span>
                <span className="text-emerald-700">{unsignedRow.value}</span>
              </div>
            )}
          </div>
        )}

        {/* Binary addition detail with carry */}
        {addData && addOps && (() => {
          let detail: Record<string, string> = {};
          let ops: { a: string; b: string } = { a: '', b: '' };
          try {
            detail = JSON.parse(addData.value);
            ops = JSON.parse(addOps.value);
          } catch {
            return null;
          }
          return (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Binary Addition
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <pre className="text-xs font-mono text-slate-700 leading-relaxed">
                  <span className="text-amber-600">{detail.carryBits}</span>  <span className="text-[10px] text-amber-500">(carry bits)</span>{'\n'}
                  {ops.a}  <span className="text-[10px] text-slate-400">(operand 1)</span>{'\n'}
                  {ops.b}  <span className="text-[10px] text-slate-400">(operand 2)</span>{'\n'}
                  <span className="text-slate-300">{'─'.repeat(Math.max(ops.a.length, 16))}</span>{'\n'}
                  <span className="text-blue-700 font-bold">{detail.sumBits}</span>  <span className="text-[10px] text-blue-500">(sum)</span>
                </pre>
                <p className="text-[10px] text-slate-500 mt-1">
                  Carry-out: <span className="font-mono font-bold">{detail.finalCarry}</span>
                </p>
              </div>
            </div>
          );
        })()}

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Calculation Steps
          </p>

          {/* Step details */}
          {stepRow && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-500 uppercase">Details</p>
              <pre className="text-sm font-mono text-blue-700 mt-1 whitespace-pre-wrap">
                {stepRow.value}
              </pre>
            </div>
          )}
        </div>

        {/* All bases display */}
        {(decimalRow || binaryRow || hexRow || octalRow) && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Result in All Bases
            </p>
            <div className="grid grid-cols-2 gap-2">
              {decimalRow && <BaseCard label={decimalRow.label} value={decimalRow.value} />}
              {binaryRow && <BaseCard label={binaryRow.label} value={binaryRow.value} />}
              {hexRow && <BaseCard label={hexRow.label} value={hexRow.value} />}
              {octalRow && <BaseCard label={octalRow.label} value={octalRow.value} />}
            </div>
          </div>
        )}

        {/* Padded binary/hex at bit width */}
        {paddedBinaryRow && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Padded to Selected Width
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paddedBinaryRow && <BaseCard label={paddedBinaryRow.label} value={paddedBinaryRow.value} />}
              {paddedHexRow && <BaseCard label={paddedHexRow.label} value={paddedHexRow.value} />}
            </div>
          </div>
        )}

        {/* Byte layout (endianness) */}
        <ByteLayoutSection results={results} />

        {/* Bitwise truth table reference */}
        <BitwiseReference />
      </div>
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function BitWidthBadge({ results }: { results: CalculatorResult[] }) {
  // Infer the width from the value of resultPaddedBinary or similar
  const paddedBin = results.find((r) => r.id === 'resultPaddedBinary');
  const width = paddedBin?.value.length;
  if (!width) return null;
  return (
    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
      {width}-bit
    </span>
  );
}

function BaseCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-bold font-mono text-slate-700 mt-0.5 break-all leading-tight">
        {value}
      </p>
    </div>
  );
}

function BitwiseReference() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        Bitwise Truth Table
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono text-center">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th scope="col" className="py-1 pr-2">A</th>
              <th scope="col" className="py-1 px-2">B</th>
              <th scope="col" className="py-1 px-2">A&amp;B</th>
              <th scope="col" className="py-1 px-2">A|B</th>
              <th scope="col" className="py-1 px-2">A^B</th>
              <th scope="col" className="py-1 pl-2">~A</th>
            </tr>
          </thead>
          <tbody>
            {[
              [0, 0, 0, 0, 0, 1],
              [0, 1, 0, 1, 1, 1],
              [1, 0, 0, 1, 1, 0],
              [1, 1, 1, 1, 0, 0],
            ].map((row) => (
              <tr key={row.join('-')} className="border-b border-slate-100 text-slate-700">
                {row.map((v, j) => (
                  <td
                    key={`col-${j}`}
                    className={`py-1 ${j === 0 ? 'pr-2' : j === 5 ? 'pl-2' : 'px-2'} ${j >= 2 ? 'font-bold text-blue-700' : ''}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Byte Layout (Endianness) ───────────────────────────────────────────────

function ByteLayoutSection({ results }: { results: CalculatorResult[] }) {
  const data = results.find((r) => r.id === '_byteLayout');
  if (!data) return null;

  let layout: { bigEndian: string[]; littleEndian: string[]; numBytes: number; bits: number };
  try {
    layout = JSON.parse(data.value);
  } catch {
    return null;
  }

  const { bigEndian, littleEndian, numBytes, bits } = layout;
  const isSame = bigEndian.every((b, i) => b === littleEndian[i]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
        Byte Layout &mdash; Big Endian vs. Little Endian
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                <th scope="col" className="text-left py-2 px-3">Address</th>
                <th scope="col" className="text-left py-2 px-3">Big Endian (BE)</th>
                <th scope="col" className="text-left py-2 px-3">Little Endian (LE)</th>
                <th scope="col" className="text-left py-2 px-3">Value</th>
              </tr>
            </thead>
            <tbody>
              {bigEndian.map((byteBE, i) => {
                const byteLE = littleEndian[i];
                const addr = `+${i}`;
                const valBE = `0x${byteBE}`;
                const valLE = `0x${byteLE}`;
                // Highlight bytes that differ between the two orders
                const isDiff = byteBE !== byteLE;
                return (
                  <tr
                    key={`byte-${i}`}
                    className={`border-b border-slate-100 ${isDiff ? 'bg-amber-50/60' : ''}`}
                  >
                    <td className="py-1.5 px-3 text-slate-400">{addr}</td>
                    <td className={`py-1.5 px-3 font-bold ${isDiff ? 'text-amber-700' : 'text-slate-700'}`}>
                      {valBE}
                    </td>
                    <td className={`py-1.5 px-3 font-bold ${isDiff ? 'text-blue-700' : 'text-slate-700'}`}>
                      {valLE}
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">
                      {parseInt(byteBE, 16)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-100/50">
                <td className="py-2 px-3 text-slate-500 text-[11px] font-bold" colSpan={4}>
                  Full hex: 0x{bigEndian.join('')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-white">
          <div className="flex items-start gap-2 text-[11px] text-slate-600">
            <span className="font-bold whitespace-nowrap">BE {`->`}</span>
            <span className="font-mono">{bigEndian.map((b) => `0x${b}`).join(' ')}</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-slate-600 mt-0.5">
            <span className="font-bold whitespace-nowrap">LE {`->`}</span>
            <span className="font-mono">{littleEndian.map((b) => `0x${b}`).join(' ')}</span>
          </div>
        </div>

        {/* Explanation */}
        {!isSame && (
          <div className="px-3 py-2 border-t border-slate-200 bg-indigo-50 text-[11px] text-indigo-700 leading-relaxed">
            <span className="font-bold">Note:</span> Bytes differ between BE and LE because the CPU stores multi-byte
            values with the <span className="font-semibold">{bits === 8 ? 'only' : bigEndian[0] === littleEndian[0] ? 'same first byte — this value is byte-order symmetric' : 'opposite byte first'}</span>.
            x86/x64 CPUs use <strong>little-endian</strong>. Network protocols use <strong>big-endian</strong> (network byte order).
          </div>
        )}
        {numBytes === 1 && (
          <div className="px-3 py-2 border-t border-slate-200 bg-indigo-50 text-[11px] text-indigo-700">
            <span className="font-bold">Note:</span> Single-byte values have identical BE and LE representation — endianness only matters for multi-byte values (16-bit and wider).
          </div>
        )}
      </div>
    </div>
  );
}

/** Return a superscript numeral string (via unicode superscript characters). */
function superscript(n: number): string {
  const sups: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
  };
  return String(n).split('').map((c) => sups[c] || c).join('');
}
