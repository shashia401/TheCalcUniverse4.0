// "Should I refinance?" island: the generic DecisionTool configured with the refinance engine.
// (An island's props must be serialisable, so the engine is imported here rather than passed in from the page.)
import DecisionTool from './DecisionTool';
import { refinanceEngine } from './refinanceEngine';

export default function RefinanceDecision() {
  return <DecisionTool engine={refinanceEngine} />;
}
