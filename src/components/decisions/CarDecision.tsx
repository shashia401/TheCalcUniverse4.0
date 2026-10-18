// "Can I afford this car?" island: the generic DecisionTool configured with the car engine.
// (An island's props must be serialisable, so the engine is imported here rather than passed in from the page.)
import DecisionTool from './DecisionTool';
import { carEngine } from './carEngine';

export default function CarDecision() {
  return <DecisionTool engine={carEngine} />;
}
