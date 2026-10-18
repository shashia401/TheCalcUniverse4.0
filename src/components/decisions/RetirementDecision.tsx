// "Am I saving enough to retire?" island: the generic DecisionTool configured with the retirement engine.
// (An island's props must be serialisable, so the engine is imported here rather than passed in from the page.)
import DecisionTool from './DecisionTool';
import { retirementEngine } from './retirementEngine';

export default function RetirementDecision() {
  return <DecisionTool engine={retirementEngine} />;
}
