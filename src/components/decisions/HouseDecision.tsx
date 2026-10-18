// "Can I afford this house?" island: the generic DecisionTool configured with the house engine.
// (An island's props must be serialisable, so the engine is imported here rather than passed in from the page.)
import DecisionTool from './DecisionTool';
import { houseEngine } from './houseEngine';

export default function HouseDecision() {
  return <DecisionTool engine={houseEngine} />;
}
