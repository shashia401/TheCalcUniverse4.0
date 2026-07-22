import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import IpSubnetPanel from './IpSubnetPanel';

// ─── IP helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a dotted-decimal IPv4 address string into an array of 4 octets.
 * Returns null for invalid formats (wrong number of octets, values out of range,
 * leading zeros, non-numeric segments).
 */
function parseIP(ip: string): number[] | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    // Reject empty strings and leading zeros (e.g. "01" is invalid)
    if (part.length === 0) return null;
    if (part.length > 1 && part[0] === '0') return null;
    // Must be purely numeric
    if (!/^\d+$/.test(part)) return null;

    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    octets.push(n);
  }

  return octets;
}

/** Convert an array of 4 octets to a 32-bit unsigned integer. */
function ipToNumber(octets: number[]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/** Convert a 32-bit unsigned integer back to a dotted-decimal IP string. */
function numberToIP(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join('.');
}

/** Convert a CIDR prefix length to a 32-bit subnet mask. */
function cidrToMask(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

/** Convert a 32-bit mask to an array of 4 octets. */
function maskToOctets(mask: number): number[] {
  return [
    (mask >>> 24) & 0xff,
    (mask >>> 16) & 0xff,
    (mask >>> 8) & 0xff,
    mask & 0xff,
  ];
}

/** Convert a 32-bit mask to dotted-decimal notation. */
function maskToDottedDecimal(mask: number): string {
  return maskToOctets(mask).join('.');
}

// ─── IP classification ──────────────────────────────────────────────────────────

/** Determine the IP class from the first octet. */
function getIPClass(firstOctet: number): string {
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E';
  return 'Unknown';
}

/** Determine the IP type (Private, Public, Loopback, Link-Local). */
function getIPType(octets: number[]): string {
  const [o1, o2] = octets;
  if (o1 === 10) return 'Private';
  if (o1 === 127) return 'Loopback';
  if (o1 === 169 && o2 === 254) return 'Link-Local';
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'Private';
  if (o1 === 192 && o2 === 168) return 'Private';
  return 'Public';
}

/** Format an IP address in binary dotted notation (each octet is 8 bits). */
function ipToBinary(octets: number[]): string {
  return octets
    .map((o) => (o >>> 0).toString(2).padStart(8, '0'))
    .join('.');
}

// ─── Calculate function ──────────────────────────────────────────────────────────

function calculate(values: Record<string, string>): CalculatorResult[] {
  const ipStr = (values.ipAddress || '').trim();
  const cidrStr = (values.cidr || '').trim();

  if (!ipStr) return [];
  if (!cidrStr) return [];

  const octets = parseIP(ipStr);
  if (!octets) return [];

  const cidr = parseInt(cidrStr, 10);
  if (isNaN(cidr) || cidr < 0 || cidr > 32) return [];

  const ipNum = ipToNumber(octets);
  const mask = cidrToMask(cidr);
  const maskOctets = maskToOctets(mask);

  const networkAddr = (ipNum & mask) >>> 0;
  const broadcastAddr = (ipNum | (~mask >>> 0)) >>> 0;

  let firstHost: number;
  let lastHost: number;
  let totalHosts: number;

  if (cidr === 32) {
    // /32 — single host, no network/broadcast distinction
    firstHost = networkAddr;
    lastHost = networkAddr;
    totalHosts = 1;
  } else if (cidr === 31) {
    // /31 — point-to-point link per RFC 3021, both addresses usable
    firstHost = networkAddr;
    lastHost = broadcastAddr;
    totalHosts = 2;
  } else {
    firstHost = (networkAddr + 1) >>> 0;
    lastHost = (broadcastAddr - 1) >>> 0;
    totalHosts = Math.max(0, Math.pow(2, 32 - cidr) - 2);
  }

  const ipBinary = ipToBinary(octets);
  const maskBinary = ipToBinary(maskOctets);

  const ipClass = getIPClass(octets[0]);
  const ipType = getIPType(octets);

  return [
    {
      id: 'networkAddress',
      label: 'Network Address',
      value: numberToIP(networkAddr),
      highlight: true,
      color: 'positive',
    },
    {
      id: 'broadcastAddress',
      label: 'Broadcast Address',
      value: numberToIP(broadcastAddr),
    },
    {
      id: 'usableRange',
      label: 'Usable Host Range',
      value: `${numberToIP(firstHost)} — ${numberToIP(lastHost)}`,
    },
    {
      id: 'totalHosts',
      label: 'Usable Hosts',
      value: String(Math.max(0, totalHosts)),
      highlight: true,
      color: 'positive',
    },
    {
      id: 'subnetMask',
      label: 'Subnet Mask',
      value: maskToDottedDecimal(mask),
    },
    {
      id: 'cidrNotation',
      label: 'CIDR Notation',
      value: `/${cidr}`,
    },
    {
      id: 'ipBinary',
      label: 'IP Address (Binary)',
      value: ipBinary,
    },
    {
      id: 'maskBinary',
      label: 'Subnet Mask (Binary)',
      value: maskBinary,
    },
    {
      id: 'ipClass',
      label: 'IP Class',
      value: ipClass,
    },
    {
      id: 'ipType',
      label: 'Type',
      value: ipType,
    },
  ];
}

// ─── Config ──────────────────────────────────────────────────────────────────────

const ipSubnetConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'ipAddress',
      label: 'IP Address',
      type: 'text',
      placeholder: '192.168.1.0',
      helpText: 'e.g., 192.168.1.0',
    },
    {
      id: 'cidr',
      label: 'CIDR Prefix',
      type: 'number',
      min: 0,
      max: 32,
      step: 1,
      placeholder: '24',
      helpText: 'e.g., /24 for 255.255.255.0',
    },
  ],

  calculate,

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IpSubnetPanel, { values, results });
  },

  educational: {
    formula: 'Network = IP & Mask | Broadcast = IP | ~Mask | Hosts = 2^(32-CIDR) - 2',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="35" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">IPv4 Subnet — /24 Example</text><rect x="35" y="50" width="110" height="24" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="90" y="66" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Network (24 bits)</text><rect x="145" y="50" width="130" height="24" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="210" y="66" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Host (8 bits)</text><text x="90" y="100" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">192.168.1</text><text x="210" y="100" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">0 - 255</text><text x="90" y="115" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="8">(fixed)</text><text x="210" y="115" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="8">(254 usable)</text><text x="160" y="140" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Usable Hosts: 2^(32-24) - 2 = 254</text><text x="160" y="165" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="10">Network: 192.168.1.0 &emsp; Broadcast: 192.168.1.255</text></svg>',
      alt: 'IP subnet diagram showing network portion (24 bits) and host portion (8 bits) for a /24 subnet',
      caption: 'A /24 subnet has 254 usable host addresses',
    },
    formulaDescription:
      'IP subnetting divides an IP address into network and host portions using a subnet mask. The network address (all host bits = 0) is the first address in the range and identifies the subnet. The broadcast address (all host bits = 1) is the last address, used to send packets to all hosts on that subnet simultaneously. The addresses in between are available for assigning to individual devices (hosts). The subnet mask is applied to the IP address using a bitwise AND operation to extract the network portion.',
    variables: [
      {
        symbol: 'IP & Mask',
        name: 'IP Address & Subnet Mask',
        description:
          'IP address identifies a specific network interface (e.g., 192.168.1.1). The subnet mask separates the network and host portions: 1-bits represent the network, 0-bits the host. Written as dotted decimal (255.255.255.0) or CIDR (/24).',
      },
      {
        symbol: 'CIDR',
        name: 'CIDR Prefix',
        description:
          'The number of leading 1-bits in the subnet mask. Common values: /24 (255.255.255.0, 256 addresses), /16 (255.255.0.0, 65536 addresses), /8 (255.0.0.0, 16.7M addresses).',
      },
      {
        symbol: 'Hosts',
        name: 'Usable Hosts',
        description:
          'The number of available host addresses, calculated as 2^(32 - CIDR) - 2. We subtract 2 because the first address is reserved for the network ID and the last for the broadcast. A /24 network has 254 usable hosts.',
      },
    ],
    howToUse: [
      'Enter an IPv4 address in dotted decimal format (e.g., 192.168.1.0).',
      'Enter the CIDR prefix as a number from 0 to 32 (e.g., 24 for a /24 network).',
      'View the complete subnet breakdown including network address, subnet mask in both formats, usable host range, broadcast address, and total hosts.',
    ],
    explanation:
      'Subnetting is fundamental to network engineering and CCNA certification. It allows network administrators to divide a large network into smaller, more manageable subnetworks, improving security, reducing broadcast traffic, and conserving IP address space. Understanding the binary representation is key: the subnet mask has consecutive 1-bits for the network portion and 0-bits for the host portion. For example, 255.255.255.0 in binary is 24 ones followed by 8 zeros — the first 24 bits identify the network, and the last 8 bits identify individual hosts on that network. This binary operation is why bitwise AND with the mask extracts the network address, and bitwise OR with the inverted mask produces the broadcast address. The practice of subnetting is essential for efficient IP address management in both enterprise networks and cloud infrastructure (AWS VPCs, Azure virtual networks).',
    faqs: [
      {
        question: 'What is CIDR?',
        answer:
          'CIDR (Classless Inter-Domain Routing) is a method for allocating IP addresses and routing that replaces the older classful system (Class A, B, C). Instead of fixed prefix lengths (/8, /16, /24), CIDR allows any prefix length from /0 to /32, enabling more efficient allocation of address space. For example, a /27 network has 32 addresses (30 usable) instead of the rigid 256 addresses of a Class C /24. This flexibility is why we use CIDR notation today for everything from home routers to cloud networking.',
      },
      {
        question: 'Why do we subtract 2 for host addresses?',
        answer:
          'In every subnet, two addresses are reserved and cannot be assigned to hosts. The first address (all host bits = 0) is the network address that identifies the subnet itself. The last address (all host bits = 1) is the broadcast address used to send packets to all hosts on that subnet simultaneously. For example, in a 192.168.1.0/24 network, 192.168.1.0 is the network address and 192.168.1.255 is the broadcast address, leaving 192.168.1.1 through 192.168.1.254 (254 addresses) for hosts. The exception is /31 networks (RFC 3021), which have no separate network or broadcast, so both addresses are usable for point-to-point links like router interconnects.',
      },
      {
        question: 'How do I determine the right subnet size for my network?',
        answer: 'The right subnet size depends on how many hosts you need. A /24 supports 254 hosts (typical for small offices), a /25 supports 126, a /26 supports 62, and a /27 supports 30. For home networks, a /24 is standard. For large organizations, a /16 (65,534 hosts) might be needed. For point-to-point links, a /30 (2 usable hosts) or /31 (2 hosts without broadcast) is common. Always plan for growth — choose a subnet that can accommodate at least double your expected number of devices.',
      },
    ],
    citations: [
      { source: 'RFC 4632 - Classless Inter-domain Routing', url: 'https://datatracker.ietf.org/doc/html/rfc4632' },
      { source: 'Wikipedia - Subnetwork', url: 'https://en.wikipedia.org/wiki/Subnetwork' },
    ],
  },
};

export default ipSubnetConfig;
