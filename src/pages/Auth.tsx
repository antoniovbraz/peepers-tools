import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, LogIn, KeyRound } from "lucide-react";

export default function Auth() {
  const { session, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Listen for PASSWORD_RECOVERY auth state — must be above any conditional returns
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Password recovery flow — show new-password form
  if (isRecovery) {
    const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmNewPassword) {
        toast({ title: "As senhas não coincidem", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
        return;
      }
      setUpdatingPassword(true);
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast({ title: "Senha atualizada!", description: "Sua nova senha foi definida com sucesso." });
        setIsRecovery(false);
      } catch (err: unknown) {
        toast({ title: "Erro", description: (err as Error).message || "Não foi possível atualizar a senha.", variant: "destructive" });
      } finally {
        setUpdatingPassword(false);
      }
    };

    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Redefinir Senha</h1>
            <p className="text-sm text-muted-foreground">Digite sua nova senha abaixo</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pl-10 h-12"
                required
                minLength={6}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="pl-10 h-12"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={updatingPassword} className="w-full h-12 gap-2 font-semibold">
              <KeyRound className="w-4 h-4" />
              {updatingPassword ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (session) return <Navigate to="/create" replace />;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      }
    } catch (err: unknown) {
      const msg = (err as Error).message?.includes("Invalid login") ? "Email ou senha incorretos." 
        : (err as Error).message?.includes("Email not confirmed") ? "Confirme seu email antes de entrar."
        : (err as Error).message?.includes("already registered") ? "Este email já está cadastrado."
        : (err as Error).message || "Erro desconhecido";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Informe seu email", description: "Digite seu email acima para redefinir a senha.", variant: "destructive" });
      return;
    }
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
    } catch (err: unknown) {
      toast({ title: "Erro", description: (err as Error).message || "Não foi possível enviar o email.", variant: "destructive" });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) {
      toast({ title: "Erro com Google", description: "Não foi possível conectar com o Google. Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100dvh] flex">
      {/* Desktop branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6">
          <img src={logo} alt="Peepers Shop" className="h-20 mx-auto" />
          <h2 className="font-display text-3xl font-bold text-foreground">Peepers Shop</h2>
          <p className="text-muted-foreground">Crie anúncios profissionais com IA para Mercado Livre e Shopee em minutos.</p>
        </div>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2 md:text-left">
            <img src={logo} alt="Peepers Shop" className="h-12 mx-auto md:mx-0 md:hidden" />
            <h1 className="font-display text-2xl font-bold text-foreground">Peepers Shop</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>

      <Button
        variant="outline"
        className="w-full h-12 gap-2 text-sm font-medium"
        onClick={handleGoogleLogin}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Entrar com Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 h-12"
            required
            minLength={6}
          />
        </div>
        {isLogin && (
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resettingPassword}
              className="text-xs text-primary hover:underline"
            >
              {resettingPassword ? "Enviando..." : "Esqueceu a senha?"}
            </button>
          </div>
        )}
        <Button type="submit" disabled={submitting} className="w-full h-12 gap-2 font-semibold">
          <LogIn className="w-4 h-4" />
          {submitting ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
        <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
          {isLogin ? "Criar conta" : "Fazer login"}
        </button>
      </p>
        </div>
      </div>
    </div>
  );
}
