import { createElement } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS = [
  { value: 'b', label: 'Byte (B)', shortLabel: 'B', factor: 1 },
  { value: 'kb', label: 'Kilobyte (KB)', shortLabel: 'KB', factor: 1000 },
  { value: 'mb', label: 'Megabyte (MB)', shortLabel: 'MB', factor: 1000000 },
  { value: 'gb', label: 'Gigabyte (GB)', shortLabel: 'GB', factor: 1000000000 },
  { value: 'tb', label: 'Terabyte (TB)', shortLabel: 'TB', factor: 1000000000000 },
  { value: 'pb', label: 'Petabyte (PB)', shortLabel: 'PB', factor: 1000000000000000 },
  { value: 'kib', label: 'Kibibyte (KiB)', shortLabel: 'KiB', factor: 1024 },
  { value: 'mib', label: 'Mebibyte (MiB)', shortLabel: 'MiB', factor: 1048576 },
  { value: 'gib', label: 'Gibibyte (GiB)', shortLabel: 'GiB', factor: 1073741824 },
  { value: 'tib', label: 'Tebibyte (TiB)', shortLabel: 'TiB', factor: 1099511627776 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Data storage conversion uses linear scaling factors relative to the byte. The factor depends on whether you use decimal (SI) prefixes where 1 KB = 1,000 bytes, or binary (IEC) prefixes where 1 KiB = 1,024 bytes. The calculator supports both systems and lets you convert between them.',
  formulaSource: 'The byte was coined by Werner Buchholz at IBM in 1956 during the design of the IBM Stretch computer, originally as a group of bits to encode a single character (the term "byte" was a deliberate respelling of "bite" to avoid confusion with "bit"). The 8-bit byte became the industry standard with the IBM System/360 in 1964. SI decimal prefixes (kilo-, mega-, giga-) were adopted by the CGPM starting in 1960 for metric units and extended to computing by hard drive manufacturers. The IEC binary prefixes (kibi-, mebi-, gibi-) were standardized in 1998 (IEC 60027-2) to resolve the ambiguity, but adoption remains inconsistent across the industry.',
  variables: [
    { symbol: 'B', name: 'Byte', description: 'The fundamental unit of digital information storage. One byte = 8 bits, capable of representing 256 distinct values (0-255). A single ASCII character like the letter "A" (0x41) takes 1 byte. A Unicode character takes 1-4 bytes depending on the encoding (UTF-8).' },
    { symbol: 'KB / MB / GB / TB / PB', name: 'Decimal (SI) Storage Units', description: 'SI-prefix units where each step is exactly 1,000. Used by hard drive manufacturers, SSD makers, network transfer rates (MB/s), and cloud storage providers. 1 KB = 1,000 B, 1 MB = 1,000 KB, 1 GB = 1,000 MB, 1 TB = 1,000 GB, 1 PB = 1,000 TB.' },
    { symbol: 'KiB / MiB / GiB / TiB', name: 'Binary (IEC) Storage Units', description: 'IEC-prefix units where each step is exactly 1,024 (2¹⁰). Used by operating systems (Windows, Linux), RAM manufacturers, and programming languages for memory allocation. 1 KiB = 1,024 B, 1 MiB = 1,048,576 B, 1 GiB = 1,073,741,824 B, 1 TiB = 1,099,511,627,776 B.' },
    { symbol: 'KB vs KiB', name: 'The Kilobyte Ambiguity', description: 'Historically "1 KB" could mean either 1,000 or 1,024 bytes, creating a 2.4% discrepancy that compounds with larger prefixes. A "1 TB" hard drive (1,000,000,000,000 B) shows as 0.909 TiB (931 GiB) in Windows — a 9.1% "loss" that confuses consumers. The KiB, MiB, GiB notation was introduced in 1998 to resolve this but remains underused.' },
  ],
  howToUse: [
    'Enter the data size value you want to convert (e.g., 500 for 500 GB, or 16 for 16 GiB of RAM).',
    'Select the current storage unit from the "From" dropdown — decimal units (KB, MB, GB, TB, PB) use steps of 1,000; binary units (KiB, MiB, GiB, TiB) use steps of 1,024.',
    'Select the desired storage unit from the "To" dropdown — the target unit for your calculation.',
    'The converted value appears instantly. Use the quick reference table to verify common conversions like 1 GB to MiB.',
  ],
  quickReference: [
    { label: '1 KB', value: '1,000 B (decimal); ≈ 0.977 KiB (binary)' },
    { label: '1 MB', value: '1,000 KB (decimal); ≈ 0.954 MiB (binary)' },
    { label: '1 GB', value: '1,000 MB (decimal); ≈ 0.931 GiB (binary)' },
    { label: '1 TB', value: '1,000 GB (decimal); ≈ 0.909 TiB (binary)' },
    { label: '1 KiB', value: '1,024 B (binary); ≈ 1.024 KB (decimal)' },
    { label: '1 MiB', value: '1,048,576 B / 1,024 KiB' },
    { label: '1 GiB', value: '1,073,741,824 B / 1,024 MiB' },
    { label: '1 TiB', value: '1,099,511,627,776 B / 1,024 GiB' },
    { label: 'CD (audio)', value: '700 MB = ~650 MiB (74-80 min audio)' },
    { label: 'DVD (single layer)', value: '4.7 GB = ~4.38 GiB' },
    { label: 'Blu-ray (single layer)', value: '25 GB = ~23.3 GiB' },
    { label: '4K UHD movie file', value: '50-100 GB (compressed HEVC)' },
  ],
  commonUses: [
    'Storage planning: calculating how many files fit on a drive by converting between the advertised decimal capacity and the OS-reported binary value',
    'Data transfer estimation: converting file sizes between bits (internet speeds) and bytes (file sizes) — a 100 Mbps connection downloads at ~12.5 MB/s theoretical max',
    'Software development: specifying memory allocation, buffer sizes, and file I/O correctly in code using the appropriate units (programming languages use bytes, not bits)',
    'Cloud computing: understanding cloud storage costs — AWS S3 charges per GB (decimal) per month, while your OS reports usage in GiB (binary), creating billing estimation discrepancies',
    'Photography and video production: estimating storage needs — a 24 MP RAW photo is ~30-50 MB, 1 hour of 4K video at 100 Mbps bitrate is ~45 GB',
    'Enterprise IT: planning data center capacity in TB or PB for backups, archives, and disaster recovery — a full backup of a 100 TB database might need 300+ TB',
  ],
  workedExamples: [
    {
      scenario: 'A photographer bought a "2 TB" external SSD. Windows shows the drive as 1.81 TB available before formatting. The photographer is frustrated, thinking 190 GB was "stolen" by the manufacturer. Explain the discrepancy and calculate what Windows should show in GiB.',
      inputs: { value: '2', from: 'tb', to: 'gib' },
      result: '2 TB (decimal) = 2,000,000,000,000 bytes. Convert to GiB: 2,000,000,000,000 ÷ 1,073,741,824 = 1,862.65 GiB. Windows reports this as "1.81 TB" (mislabeling GiB as TB). The "missing" 190 GB is purely a measurement unit difference, not a defect. This is the #1 customer complaint to drive manufacturers and completely normal.',
      insight: 'Manufacturers are not being dishonest — they are using SI decimal prefixes (1 TB = 1 trillion bytes) as allowed by international standards. Windows uses binary counting but labels it with decimal names. macOS since Snow Leopard (10.6, 2009) calculates in decimal and shows "2 TB" correctly. Linux tools like `ls -lh` can be configured either way with the --si flag. The IEC binary prefixes (KiB, MiB, GiB, TiB) were created specifically to end this confusion, but Windows stubbornly uses "GB" when it means "GiB."',
    },
    {
      scenario: 'A DevOps engineer is provisioning cloud storage on AWS S3. The application stores 500 million JSON records averaging 2 KiB each. How many GB (decimal) of S3 storage should be provisioned? The AWS bill is in GB-months, so use decimal GB.',
      inputs: { value: '500', from: 'mib', to: 'gb' },
      result: '500 million records × 2 KiB = 1,000,000,000 KiB. 1,000,000,000 × 1,024 B = 1,024,000,000,000 B = 1,024 GB. Provision 1.1 TB for growth and metadata overhead (S3 metadata is ~1-3% of object size).',
      insight: 'Cloud providers bill in decimal GB (SI) but most application-level measurements are in binary (KiB, MiB). The 2.4% difference between GiB and GB compounds at scale — on a $100,000/month storage bill, that is $2,400/month in unit conversion alone. Always confirm whether your cloud provider uses GB or GiB in billing: AWS and GCP use GB (decimal), Azure uses GB (decimal) for most services but GiB for some compute memory. Read the fine print.',
    },
    {
      scenario: 'A video editor is estimating storage for a documentary project: 200 hours of raw 4K footage at 400 Mbps (megabits per second) bitrate captured in ProRes 422 HQ. How many TB of storage are needed for the raw footage?',
      inputs: { value: '400', from: 'mb', to: 'tb' },
      result: '400 Mbps bitrate = 50 MB/s (400 ÷ 8). Per hour: 50 MB/s × 3,600 s = 180 GB/h. For 200 hours: 200 × 180 GB = 36,000 GB = 36 TB. Add 20% for proxy and project files: ~43 TB total. About two 22 TB drives or a 4-bay NAS with 22 TB drives in RAID 5 (~44 TB usable).',
      insight: 'Video bitrate is almost always in Mbps (megabits per second), NOT MB/s. The bits-vs-bytes confusion is the most expensive mistake in video storage estimation — mixing them up gives you an 8× error. Always divide Mbps by 8 to get MB/s for file size calculations. Also note: storage manufacturers use decimal TB, so a "22 TB" drive is 22 trillion bytes, and your editing software will show about 20 TiB. Budget for this discrepancy.',
    },
  ],
  proTips: [
    'The "formatted capacity loss" on a new drive is NOT a scam — it is the decimal-to-binary conversion. A "1 TB" drive = 1,000,000,000,000 bytes = 0.909 TiB. Your OS (Windows) calls TiB "TB" and shows 931 GB. You are getting exactly what you paid for. To see the true binary capacity, multiply the advertised TB by 0.909: a "500 GB" drive ≈ 465 GiB, "2 TB" ≈ 1.82 TiB, "4 TB" ≈ 3.64 TiB.',
    'When buying RAM, the "GB" on the box actually means GiB (binary). RAM is always manufactured in binary capacities because memory cells are addressed in powers of 2. An "8 GB" RAM stick is 8 GiB = 8,589,934,592 bytes. RAM is the one product category where "GB" reliably means GiB — the opposite of hard drives.',
    'For downloads: your ISP sells speed in Mbps (megabits per second), but your browser shows MB/s. To estimate download time: divide the file size in GB by (your internet speed in Mbps ÷ 8,000). Example: a 50 GB game on a 100 Mbps connection = 50 × 8,000 ÷ 100 = 4,000 seconds ≈ 67 minutes. Real-world speeds are typically 70-90% of advertised due to protocol overhead.',
    'When provisioning cloud resources, always use the provider\'s own units in cost calculations. AWS EBS volumes are measured in GiB (binary), but S3 buckets are measured in GB (decimal). AWS EC2 instance memory is GiB. Google Cloud Storage uses GB (decimal). Azure generally uses GB decimal but some legacy services use GiB. This inconsistency has caused billion-dollar billing errors in enterprise cloud migrations.',
    'For photographers: a 24 MP RAW file is typically 25-50 MB depending on bit depth and compression. To estimate how many photos fit on a card: take the card\'s usable capacity (advertised GB × 0.93 for GiB) and divide by your typical file size. A "128 GB" card = ~119 GiB usable, holds ~2,400 50 MB RAW files. Always format cards in-camera, not on the computer, for filesystem compatibility.',
    'For programmers: 1 byte = 8 bits (always), but 1 "word" depends on architecture (16 bits on 16-bit systems, 32 on 32-bit, 64 on 64-bit). When declaring integer types, int32 = 4 bytes, int64 = 8 bytes. A null-terminated string in C uses n+1 bytes (extra byte for \'\\0\'). UTF-8 encoding is variable-width: ASCII chars are 1 byte, European chars are 2 bytes, CJK characters are 3 bytes, and emoji are 4 bytes.',
  ],
  limitations: [
    'This calculator handles storage units only (bytes and their multiples). It does not convert between bits and bytes (1 byte = 8 bits) — if you have internet speed in Mbps and need file transfer speed in MB/s, divide Mbps by 8 first, then use this converter for the storage scaling.',
    'File system overhead is not accounted for. A "1 TB" drive formatted with NTFS (Windows) or APFS (macOS) may have 50-100 MB less usable space due to filesystem metadata (allocation tables, journals, superblocks). This is on top of the decimal-to-binary discrepancy. exFAT has minimal overhead; ZFS has significant overhead for checksums and redundancy.',
    'For very large data sets (petabytes and beyond), storage systems use erasure coding, replication, and parity that multiply physical storage needs by 1.3× to 3×. A "100 PB" raw capacity cluster might provide only 40-70 PB of usable capacity after redundancy. This calculator does not account for data protection overhead.',
    'The bit/byte distinction is critical and not handled here. Data transfer rates (Mbps, Gbps) and storage capacity (MB, GB) use different units and different prefixes. 1 Gbps = 125 MB/s. Network speeds are virtually always in bits per second. Storage is virtually always in bytes. Confusing them can result in 8× errors in capacity and transfer time calculations.',
    'Flash storage (SSD, USB drives) often has "over-provisioning" — extra NAND capacity beyond the advertised amount, used for wear leveling and garbage collection. A "1 TB" SSD might physically contain 1.024 TB of NAND, with 0.024 TB reserved for the controller. This is not user-accessible and not part of the unit conversion calculation.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 170" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Data Storage Units — Decimal vs Binary</text>' +
      '<rect x="20" y="35" width="30" height="20" rx="3" fill="var(--svg-3b82f6)" opacity="0.5"/>' +
      '<text x="35" y="49" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 b</text>' +
      '<text x="55" y="49" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-3b82f6)">1 bit (binary digit, 0 or 1)</text>' +
      '<rect x="20" y="65" width="30" height="20" rx="3" fill="var(--svg-ef4444)" opacity="0.5"/>' +
      '<text x="35" y="79" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 B</text>' +
      '<text x="55" y="79" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ef4444)">1 Byte = 8 bits (one ASCII character)</text>' +
      '<rect x="20" y="95" width="60" height="20" rx="3" fill="var(--svg-22c55e)" opacity="0.5"/>' +
      '<text x="50" y="109" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 KB</text>' +
      '<rect x="85" y="95" width="61" height="20" rx="3" fill="var(--svg-22c55e)" opacity="0.3" stroke="var(--svg-22c55e)" stroke-width="1" stroke-dasharray="2,1"/>' +
      '<text x="115" y="109" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">1 KiB</text>' +
      '<text x="155" y="109" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">1 KB = 1,000 B | 1 KiB = 1,024 B (2.4% bigger)</text>' +
      '<rect x="20" y="125" width="120" height="20" rx="3" fill="var(--svg-8b5cf6)" opacity="0.5"/>' +
      '<text x="80" y="139" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 GB (decimal: 10⁹ B)</text>' +
      '<rect x="145" y="125" width="128" height="20" rx="3" fill="var(--svg-8b5cf6)" opacity="0.3" stroke="var(--svg-8b5cf6)" stroke-width="1" stroke-dasharray="2,1"/>' +
      '<text x="209" y="139" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-8b5cf6)" font-weight="600" text-anchor="middle">1 GiB (binary: 2³⁰ B)</text>' +
      '<text x="240" y="162" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">A "500 GB" drive shows ~465 GiB in Windows — the gap is ~7.3% at this scale</text>' +
      '</svg>',
    alt: 'Visual comparison of data storage units from bit to byte to KB, KiB, GB, and GiB showing the growing gap between decimal and binary prefixes',
    caption: 'The decimal-binary gap grows with each prefix. At 1 GB the gap is 7.3%; at 1 TB it is 9.1%; at 1 PB it reaches 12.6%.',
  },
  explanation:
    'Data storage measurement is complicated by two competing standards that coexist in the technology industry: decimal (SI) and binary (IEC). Hard drive and SSD manufacturers use decimal prefixes (1 GB = 1,000,000,000 bytes) because it makes their drives appear larger in advertising. Operating systems traditionally report in binary (1 GiB = 1,073,741,824 bytes), so a "500 GB" drive shows as about 465 GiB in Windows. This discrepancy is NOT false advertising — both measurements are correct within their respective systems. The byte itself emerged in the 1950s at IBM, where Werner Buchholz coined the term during the IBM Stretch project. The 8-bit byte was standardized by the IBM System/360 (1964), which dominated computing for decades and set the de facto standard. The IEC binary prefixes (kibi-, mebi-, gibi-, tebi-) were introduced in 1998 (IEC 60027-2 amendment) to provide unambiguous terms for powers of 1024, but adoption has been slow. Apple switched macOS to decimal units in 2009 (Snow Leopard), showing an advertised "1 TB" drive as "1 TB." Windows continues to use binary counting but labels it with decimal names, perpetuating consumer confusion. Linux distributions vary — Ubuntu uses decimal for file sizes by default, while most server distributions stick with binary. Understanding both systems is essential for IT professionals, photographers, videographers, cloud architects, and anyone managing digital storage. The difference compounds with each prefix: KB vs KiB = 2.4%, MB vs MiB = 4.9%, GB vs GiB = 7.3%, TB vs TiB = 9.1%, PB vs PiB = 12.6%. At data center scale, these differences represent petabytes of capacity that materially affect budgets.',
  faqs: [
    {
      question: 'Why does my hard drive show less capacity than advertised?',
      answer: 'This is the most common storage confusion. Drive manufacturers advertise in decimal: 1 TB = 1,000,000,000,000 bytes. Operating systems use binary: 1 TiB = 1,099,511,627,776 bytes. So a "1 TB" drive has 1,000,000,000,000 bytes ÷ 1,099,511,627,776 ≈ 0.909 TiB. Windows displays this as "931 GB" (mixing the decimal name with binary counting). The "lost" 69 GB is not used by the drive or the OS — it is purely a measurement unit difference. macOS since Snow Leopard (10.6) uses decimal units, so it shows 1,000,000,000,000 bytes as "1 TB." Linux can show either depending on the `--si` flag. Beyond unit conversion, some space is also consumed by the filesystem itself (NTFS, APFS, ext4 all have metadata overhead), but this is typically 0.1-0.5% of total capacity.',
    },
    {
      question: 'What is the difference between bits and bytes in practical terms?',
      answer: 'A bit is the smallest unit of digital data — a single binary digit (0 or 1). A byte is 8 bits. Internet speeds are always measured in bits per second (Mbps, Gbps), while file sizes are in bytes (MB, GB). A 100 Mbps connection downloads at a theoretical maximum of 12.5 MB/s (100 ÷ 8). In practice, protocol overhead (TCP/IP, HTTP) reduces this by 5-10%, so expect 10-11 MB/s real-world. Storage is always in bytes. The confusion between bits and bytes is the most expensive and common mistake in IT: an "800 Mbps" internet connection does NOT download files at 800 MB per second — it is 100 MB/s. When shopping for internet service, always divide the Mbps by 8 to get the theoretical MB/s download speed.',
    },
    {
      question: 'When should I use KiB vs KB, MiB vs MB?',
      answer: 'Use KiB/MiB/GiB (binary) when: dealing with RAM (always binary — it is addressed in powers of 2), operating system storage reports (Windows, Linux `df`), programming memory allocation (`malloc`, buffer sizes), and any specification from a memory or CPU manufacturer. Use KB/MB/GB (decimal) when: reading hard drive and SSD specifications, calculating network transfer rates, dealing with cloud storage billing (AWS S3, Google Cloud Storage), file size displays on macOS, and any specification from a storage hardware manufacturer. When precision matters, always confirm which system is being used. Many tools incorrectly label binary units as decimal — Windows Explorer shows "GB" but counts in GiB. To see the true number of bytes, use `ls -l` on Linux/macOS or check Properties → Size in bytes on Windows.',
    },
    {
      question: 'How much data can common storage media hold?',
      answer: '3.5" floppy disk: 1.44 MB (holds about one compressed digital photo). CD-ROM: 700 MB (holds about 80 minutes of audio or one SD movie). DVD-5 (single layer): 4.7 GB (one HD movie). DVD-9 (dual layer): 8.5 GB. Blu-ray (single layer): 25 GB (one 4K movie). Blu-ray (dual layer): 50 GB. USB flash drive: commonly 8 GB to 1 TB. Consumer SSD: 128 GB to 4 TB. Enterprise SSD: up to 30 TB. Hard drive: 500 GB to 22 TB (consumer), up to 30 TB (enterprise). MicroSD card: up to 1.5 TB. LTO-9 tape: 18 TB native, 45 TB compressed. Cloud storage: unlimited in theory, but measured in TB or PB for billing. The largest data centers hold exabytes (1 EB = 1,000 PB). The entire internet was estimated at about 150 ZB (zettabytes) in 2024.',
    },
    {
      question: 'What is the history of the byte and why is it 8 bits?',
      answer: 'The term "byte" was coined by Werner Buchholz at IBM in 1956 during the IBM Stretch (IBM 7030) project to describe a group of bits used to encode a single character. The spelling was deliberately changed from "bite" to "byte" to avoid accidental confusion with "bit." Early computers used varying byte sizes: 6 bits (enough for uppercase letters and numbers), 7 bits (ASCII), and even 12 bits. The 8-bit byte became the industry standard when IBM launched the System/360 in 1964, which used 8-bit bytes with 32-bit words. The S/360 was so dominant that its architecture became the de facto standard, and by the 1970s virtually all computers used 8-bit bytes. The 8-bit byte can represent 256 values (2⁸), enough for all ASCII characters plus extended character sets. In 1998, the IEC introduced the unambiguous binary prefixes kibi- (Ki), mebi- (Mi), gibi- (Gi), tebi- (Ti), pebi- (Pi), and exbi- (Ei) specifically to distinguish powers of 1024 from powers of 1000.',
    },
    {
      question: 'Why do video games and applications take up so much storage space now?',
      answer: 'Modern games and applications have ballooned in size due to several factors. 4K textures: a single uncompressed 4K texture is ~67 MB (4,096 × 4,096 × 4 bytes RGBA). A modern game uses thousands of unique textures. High-quality audio: uncompressed 7.1 surround audio tracks in multiple languages can consume 30-50 GB. Video cutscenes: pre-rendered 4K HDR cutscenes at 50-100 Mbps bitrate add 10-20 GB per hour. Asset duplication: developers often duplicate assets across game files to reduce loading times on mechanical hard drives — a practice becoming less necessary with SSDs but still common. Red Dead Redemption 2 uses ~120 GB. Call of Duty: Modern Warfare III reached ~230 GB with all content installed. The shift to "live service" games with constant updates also means games are designed for modular expansion rather than static shipped content. Use this converter to check if you have enough free space: subtract the OS-reported free GiB from the game\'s GB requirement (and add 20% for unpacking during installation).',
    },
  ],
  citations: [
    { source: 'IEC 60027-2 - Binary Prefixes Standard', url: 'https://www.iec.ch/prefixes-binary-multiples' },
    { source: 'NIST - SI Units and Binary Prefixes for Computing', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
    { source: 'IBM Archives - Origins of the Byte', url: 'https://www.ibm.com/history/stretch' },
  ],
};

const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter data size (e.g., 500)',
    inputMode: 'numeric' as const,
    required: true,
    helpText: 'The numeric data storage value you want to convert between units',
  },
  {
    id: 'from',
    label: 'From Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'gb',
    helpText: 'The storage unit you are converting from (KB=decimal 1,000; KiB=binary 1,024)',
  },
  {
    id: 'to',
    label: 'To Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'mb',
    showWhen: (values: Record<string, string>) => !!values.value,
    helpText: 'The storage unit you are converting to (e.g., MiB for Windows OS capacity, GB for drive specs)',
  },
];

const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || 'gb';
  const toUnit = values.to || 'mb';

  const fromDef = UNITS.find((u) => u.value === fromUnit);
  const toDef = UNITS.find((u) => u.value === toUnit);
  if (!fromDef || !toDef) return [];
  if (toDef.factor === 0) return [];

  const result = (val * fromDef.factor) / toDef.factor;

  // Decimal (SI) vs binary (IEC) family detection for the interpretation
  const isBinary = (u: string) => u.endsWith('ib') || u === 'kib' || u === 'mib' || u === 'gib' || u === 'tib';
  const crossFamily = isBinary(fromUnit) !== isBinary(toUnit);

  return [
    {
      id: 'result',
      label: `Result (${fromUnit} → ${toUnit})`,
      value: `${val} ${fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toUnit}`,
      highlight: true,
      color: 'positive' as const,
      interpretation: crossFamily
        ? `You converted between decimal (powers of 1,000) and binary (powers of 1,024) units. The gap between the two families grows with each prefix — 2.4% at KB/KiB up to 10% at TB/TiB — which is why a drive sold as "1 TB" shows up as ~931 GB in Windows. Drive makers use decimal units; Windows reports binary units while labeling them "GB". Neither is wrong — they are different standards (SI vs IEC 60027-2).`
        : `Both units are in the same ${isBinary(fromUnit) ? 'binary (×1,024, IEC)' : 'decimal (×1,000, SI)'} family, so this is an exact conversion with no rounding controversy. Watch out when comparing against ${isBinary(fromUnit) ? 'drive-manufacturer specs, which use decimal units' : 'Windows file sizes, which use binary units despite the "KB/MB/GB" labels'}.`,
    },
    {
      id: 'formula',
      label: 'Formula',
      value: `${val} × (${fromDef.factor} ÷ ${toDef.factor}) = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      color: 'neutral' as const,
    },
  ];
};

const configWithPanel = {
  inputs,
  calculate,
  educational: EDUCATIONAL,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Data Storage Conversion' });
  },
};
export default configWithPanel;
