import { useState } from "react";
import { User, Cpu, BarChart3 } from "lucide-react";
import TabButton from "./settings/TabButton";
import TabProfile from "./settings/TabProfile";
import TabProviders from "./settings/TabProviders";
import TabUsage from "./settings/TabUsage";

type Tab = "profile" | "providers" | "usage";

export default function Settings() {
  const [tab, setTab] = useState<Tab>("providers");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label="Perfil" />
        <TabButton active={tab === "providers"} onClick={() => setTab("providers")} icon={Cpu} label="Provedores IA" />
        <TabButton active={tab === "usage"} onClick={() => setTab("usage")} icon={BarChart3} label="Uso" />
      </div>

      {tab === "profile" && <TabProfile />}
      {tab === "providers" && <TabProviders />}
      {tab === "usage" && <TabUsage />}
    </div>
  );
}
