import Screener from "./Screener";
import { DATA } from "@/lib/data";

export default function Page() {
  return <Screener candidates={DATA.candidates} builtAt={DATA.builtAt} />;
}
