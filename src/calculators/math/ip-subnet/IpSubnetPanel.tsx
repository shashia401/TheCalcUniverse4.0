import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/**
 * Split a binary octet into network-bits and host-bits portions.
 * fullOctets = number of whole octets consumed by network bits.
 * partialBits = how many of the next octet's 8 bits are network bits.
 */
function splitBinary(
  binaryDotted: string,
  cidr: number,
): { network: string[]; host: string[] } {
  const octets = binaryDotted.split('.');
  const fullOctets = Math.floor(cidr / 8);
  const partialBits = cidr % 8;

  const network: string[] = [];
  const host: string[] = [];

  for (let i = 0; i < octets.length; i++) {
    if (i < fullOctets) {
      network.push(octets[i]);
      host.push('');
    } else if (i === fullOctets && partialBits > 0) {
      network.push(octets[i].slice(0, partialBits));
      host.push(octets[i].slice(partialBits));
    } else {
      network.push('');
      host.push(octets[i]);
    }
  }

  return { network, host };
}

/** Format an octet in monospace, padding with spaces for alignment. */
function formatOctet(bits: string, align: 'left' | 'right'): string {
  if (bits.length === 0) return ' '.repeat(8);
  if (align === 'right') return bits.padStart(8, ' ');
  return bits.padEnd(8, ' ');
}

// ─── IP class / type badge colors ───────────────────────────────────────────────

const CLASS_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 border-blue-200',
  B: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-purple-100 text-purple-700 border-purple-200',
  E: 'bg-rose-100 text-rose-700 border-rose-200',
};

const TYPE_COLORS: Record<string, string> = {
  Private: 'bg-violet-100 text-violet-700 border-violet-200',
  Public: 'bg-slate-100 text-slate-700 border-slate-200',
  Loopback: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Link-Local': 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function IpSubnetPanel({ values, results }: Props) {
  const networkAddress = results.find((r) => r.id === 'networkAddress');
  const broadcastAddress = results.find((r) => r.id === 'broadcastAddress');
  const usableRange = results.find((r) => r.id === 'usableRange');
  const totalHosts = results.find((r) => r.id === 'totalHosts');
  const subnetMask = results.find((r) => r.id === 'subnetMask');
  const cidrNotation = results.find((r) => r.id === 'cidrNotation');
  const ipBinary = results.find((r) => r.id === 'ipBinary');
  const maskBinary = results.find((r) => r.id === 'maskBinary');
  const ipClass = results.find((r) => r.id === 'ipClass');
  const ipType = results.find((r) => r.id === 'ipType');

  if (!networkAddress || !subnetMask) return null;

  const cidr = parseInt(values.cidr || '24', 10);
  const hostBits = 32 - cidr;

  const ipBinSplit = ipBinary ? splitBinary(ipBinary.value, cidr) : null;
  const maskBinSplit = maskBinary ? splitBinary(maskBinary.value, cidr) : null;

  const classColor = CLASS_COLORS[ipClass?.value || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
  const typeColor = TYPE_COLORS[ipType?.value || ''] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Subnet Breakdown
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Hosts Highlight */}
        {totalHosts && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-500 mb-1">{totalHosts.label}</p>
            <p className="text-4xl font-bold text-blue-700">{totalHosts.value}</p>
            {cidrNotation && (
              <p className="text-xs text-slate-500 mt-1">
                {hostBits} host bit{hostBits !== 1 ? 's' : ''} (2<sup>{hostBits}</sup>
                {cidr >= 0 && cidr <= 30 ? ' − 2' : ''})
              </p>
            )}
          </div>
        )}

        {/* Address Details Table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <TableRow label="Network Address" value={networkAddress.value} highlight />
              <TableRow label="Usable Host Range" value={usableRange?.value || '—'} />
              <TableRow label="Broadcast Address" value={broadcastAddress?.value || '—'} />
              <TableRow label="Subnet Mask" value={subnetMask.value} />
              <TableRow label="CIDR Notation" value={cidrNotation?.value || ''} />
            </tbody>
          </table>
        </div>

        {/* Binary Representation */}
        {(ipBinary || maskBinary) && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Binary Representation
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-x-auto">
              {/* Labels */}
              <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  Network Bits ({cidr})
                </span>
                <span className="text-slate-300">/</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                  Host Bits ({hostBits})
                </span>
              </div>

              {/* IP Binary */}
              {ipBinary && ipBinSplit && (
                <BinaryRow
                  label="IP"
                  networkOctets={ipBinSplit.network}
                  hostOctets={ipBinSplit.host}
                />
              )}

              {/* Mask Binary */}
              {maskBinary && maskBinSplit && (
                <BinaryRow
                  label="Mask"
                  networkOctets={maskBinSplit.network}
                  hostOctets={maskBinSplit.host}
                />
              )}
            </div>
          </div>
        )}

        {/* IP Class & Type Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {ipClass && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${classColor}`}>
              Class {ipClass.value}
            </span>
          )}
          {ipType && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${typeColor}`}>
              {ipType.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function TableRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-slate-100 last:border-b-0 ${highlight ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-2.5 text-slate-500 text-xs font-medium whitespace-nowrap w-1/2">
        {label}
      </td>
      <td className={`px-4 py-2.5 font-mono text-sm ${highlight ? 'font-bold text-blue-700' : 'text-slate-700'}`}>
        {value}
      </td>
    </tr>
  );
}

function BinaryRow({
  label,
  networkOctets,
  hostOctets,
}: {
  label: string;
  networkOctets: string[];
  hostOctets: string[];
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase w-8 shrink-0">
        {label}
      </span>
      <span className="font-mono text-xs tracking-wider">
        {networkOctets.map((bits, i) => (
          <span key={`n-${i}`}>
            {i > 0 && <span className="text-blue-300">.</span>}
            <span className="text-blue-600 font-medium">
              {formatOctet(bits, 'left')}
            </span>
          </span>
        ))}
        {hostOctets.some((b) => b.length > 0) && (
          <>
            <span className="text-slate-300 mx-0.5">|</span>
            {hostOctets.map((bits, i) => (
              <span key={`h-${i}`}>
                {i > 0 && <span className="text-amber-300">.</span>}
                <span className="text-amber-600 font-medium">
                  {formatOctet(bits, 'left')}
                </span>
              </span>
            ))}
          </>
        )}
      </span>
    </div>
  );
}
