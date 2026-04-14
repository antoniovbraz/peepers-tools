import { useAuth } from "@/context/AuthContext";

export default function TabProfile() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Perfil</h3>
        <p className="text-sm text-muted-foreground">Informações da sua conta</p>
      </div>

      <div className="space-y-4 bg-card border rounded-lg p-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="mt-1">{user?.email || "—"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Provedor de login</label>
          <p className="mt-1 capitalize">{user?.app_metadata?.provider || "email"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">ID do usuário</label>
          <p className="mt-1 text-xs font-mono text-muted-foreground">{user?.id}</p>
        </div>
      </div>

      <button
        onClick={signOut}
        className="text-sm text-destructive hover:underline"
      >
        Sair da conta
      </button>
    </div>
  );
}
