import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuroraBackground } from "@/components/moodverse/AuroraBackground";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Неверный email").max(255),
  password: z.string().min(6, "Минимум 6 символов").max(72),
});

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { if (user) nav("/", { replace: true }); }, [user, nav]);
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (mode: "in" | "up") => {
    const v = schema.safeParse({ email, password });
    if (!v.success) { toast.error(v.error.issues[0].message); return; }
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Добро пожаловать!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Не удалось войти через Google"); setBusy(false); return; }
    if (result.redirected) return;
  };

  return (
    <>
      <AuroraBackground />
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="font-serif text-2xl italic">MoodVerse</span>
            </div>
            <h1 className="text-3xl italic font-serif">Войди, чтобы помнить</h1>
            <p className="text-muted-foreground mt-2 font-serif italic text-sm">
              Сохраняй отрывки и веди журнал состояний
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-card backdrop-blur-md border border-border/60 p-7 shadow-card">
            <Tabs defaultValue="in">
              <TabsList className="grid grid-cols-2 w-full mb-5 rounded-full bg-secondary/50">
                <TabsTrigger value="in" className="rounded-full">Войти</TabsTrigger>
                <TabsTrigger value="up" className="rounded-full">Создать</TabsTrigger>
              </TabsList>
              <TabsContent value="in" className="space-y-4">
                <Auth_Fields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <Button onClick={() => submit("in")} disabled={busy} className="w-full rounded-full bg-gradient-button">
                  Войти
                </Button>
              </TabsContent>
              <TabsContent value="up" className="space-y-4">
                <Auth_Fields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <Button onClick={() => submit("up")} disabled={busy} className="w-full rounded-full bg-gradient-button">
                  Создать аккаунт
                </Button>
              </TabsContent>
            </Tabs>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted-foreground italic">или</span></div>
            </div>
            <Button variant="outline" onClick={google} disabled={busy} className="w-full rounded-full">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Войти через Google
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

const Auth_Fields = ({ email, setEmail, password, setPassword }: any) => (
  <>
    <div className="space-y-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="pw">Пароль</Label>
      <Input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" />
    </div>
  </>
);

export default Auth;
