import React from 'react';
import { CalculatorResult } from '../../../types/calculator';


interface GravelPanelProps {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const MATERIAL_NAMES: Record<string, string> = {
  'pea-gravel': 'Pea Gravel',
  'crushed-limestone': 'Crushed Limestone',
  'river-rock': 'River Rock',
  'decomposed-granite': 'Decomposed Granite',
};

const GravelPanel: React.FC<GravelPanelProps> = ({ values, results }) => {
  const cubicYards = results.find((r) => r.id === 'cubic-yards');
  const tons = results.find((r) => r.id === 'tons');
  const weedBarrier = results.find((r) => r.id === 'weed-barrier');
  const depth = values.depth || '?';
  const materialName = MATERIAL_NAMES[values.material] || 'Unknown';

  return (
    <div style={{ padding: '16px 0' }}>
      {/* ---- Gravel Depth Profile SVG ---- */}
      <svg
        viewBox="0 0 600 280"
        className="w-full max-w-[600px]"
        role="img"
        aria-label="Gravel depth profile diagram showing material layer depth over native soil with weed barrier"
      >
        <text
          x="300"
          y="30"
          textAnchor="middle"
          fill="#1a1a1a"
          fontSize="18"
          fontWeight="bold"
        >
          Gravel Depth Profile
        </text>

        {/* Native soil */}
        <rect x="50" y="170" width="500" height="70" fill="#8B4513" rx="2" />
        <text x="300" y="210" textAnchor="middle" className="fill-white" fontSize="14">
          Native Soil
        </text>

        {/* Gravel layer */}
        <rect x="50" y="135" width="500" height="35" fill="#B0BEC5" rx="2" />
        <text
          x="300"
          y="157"
          textAnchor="middle"
          fill="#263238"
          fontSize="13"
          fontWeight="bold"
        >
          {materialName} — {depth} inch layer
        </text>

        {/* Weed barrier fabric */}
        <line
          x1="50"
          y1="135"
          x2="550"
          y2="135"
          stroke="#2E7D32"
          strokeWidth="3"
          strokeDasharray="8,4"
        />
        <text x="555" y="133" fill="#2E7D32" fontSize="11">
          Weed Barrier
        </text>

        {/* Depth arrow */}
        <line
          x1="30"
          y1="135"
          x2="30"
          y2="170"
          stroke="#555"
          strokeWidth="2"
        />
        <polygon points="30,135 25,143 35,143" fill="#555" />
        <polygon points="30,170 25,162 35,162" fill="#555" />
        <text x="20" y="156" textAnchor="end" fill="#555" fontSize="12">
          {depth}"
        </text>
      </svg>

      {/* ---- Material Density Comparison Bar Chart ---- */}
      <svg
        viewBox="0 0 600 280"
        className="w-full max-w-[600px] mt-6"
        role="img"
        aria-label="Material density comparison bar chart showing pounds per cubic yard for different gravel types"
      >
        <text
          x="300"
          y="30"
          textAnchor="middle"
          fill="#1a1a1a"
          fontSize="18"
          fontWeight="bold"
        >
          Material Density (lbs / cubic yard)
        </text>

        <g transform="translate(20, 55)">
          {/* Grid lines */}
          <line
            x1="140"
            y1="0"
            x2="140"
            y2="170"
            stroke="#ccc"
            strokeWidth="1"
          />
          <line
            x1="240"
            y1="0"
            x2="240"
            y2="170"
            stroke="#ccc"
            strokeWidth="1"
          />
          <line
            x1="340"
            y1="0"
            x2="340"
            y2="170"
            stroke="#ccc"
            strokeWidth="1"
          />
          <line
            x1="440"
            y1="0"
            x2="440"
            y2="170"
            stroke="#ccc"
            strokeWidth="1"
          />

          {/* Tick labels */}
          <text x="140" y="178" textAnchor="middle" fill="#999" fontSize="10">
            1400
          </text>
          <text x="240" y="178" textAnchor="middle" fill="#999" fontSize="10">
            2400
          </text>
          <text x="340" y="178" textAnchor="middle" fill="#999" fontSize="10">
            3400
          </text>
          <text x="440" y="178" textAnchor="middle" fill="#999" fontSize="10">
            4400
          </text>

          {/* Pea Gravel — 2700 lbs */}
          <rect x="140" y="0" width="130" height="28" fill="#9E9E9E" rx="4" />
          <text x="8" y="19" fill="#333" fontSize="12">
            Pea Gravel
          </text>
          <text x="278" y="19" fill="#333" fontSize="12" fontWeight="bold">
            2700
          </text>

          {/* Crushed Limestone — 2600 lbs */}
          <rect x="140" y="36" width="120" height="28" fill="#BDBDBD" rx="4" />
          <text x="8" y="55" fill="#333" fontSize="12">
            Crushed Limestone
          </text>
          <text x="268" y="55" fill="#333" fontSize="12" fontWeight="bold">
            2600
          </text>

          {/* River Rock — 2800 lbs */}
          <rect x="140" y="72" width="140" height="28" fill="#757575" rx="4" />
          <text x="8" y="91" className="fill-white" fontSize="12">
            River Rock
          </text>
          <text x="288" y="91" fill="#333" fontSize="12" fontWeight="bold">
            2800
          </text>

          {/* Decomposed Granite — 2650 lbs */}
          <rect
            x="140"
            y="108"
            width="125"
            height="28"
            fill="#A1887F"
            rx="4"
          />
          <text x="8" y="127" className="fill-white" fontSize="12">
            Decomposed Granite
          </text>
          <text x="273" y="127" fill="#333" fontSize="12" fontWeight="bold">
            2650
          </text>
        </g>
      </svg>

      {/* ---- "What You Need" Shopping List ---- */}
      {results.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: 18,
            border: '2px solid #1976D2',
            borderRadius: 8,
            backgroundColor: '#E3F2FD',
            maxWidth: 420,
          }}
        >
          <h3
            style={{
              margin: '0 0 14px 0',
              color: '#1565C0',
              fontSize: 18,
            }}
          >
            What You Need
          </h3>

          {cubicYards && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #BBDEFB',
              }}
            >
              <span>Gravel Volume</span>
              <strong>
                {parseFloat(cubicYards.value).toFixed(2)} cu yd
              </strong>
            </div>
          )}

          {tons && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #BBDEFB',
              }}
            >
              <span>Material Weight</span>
              <strong>
                {parseFloat(tons.value).toFixed(2)} tons
              </strong>
            </div>
          )}

          {weedBarrier && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #BBDEFB',
              }}
            >
              <span>Weed Barrier Fabric</span>
              <strong>
                {parseFloat(weedBarrier.value).toFixed(0)} sq ft
              </strong>
            </div>
          )}

          <div
            className="text-white"
            style={{
              marginTop: 14,
              padding: '10px 14px',
              backgroundColor: '#1565C0',
              borderRadius: 4,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Tip: Order 10–15% extra to account for compaction and settling.
          </div>
        </div>
      )}
    </div>
  );
};

export default GravelPanel;
