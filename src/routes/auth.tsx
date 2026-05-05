import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! অ্যাডমিন রোল পেতে সাপোর্টে যোগাযোগ করুন।");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center px-4">
      <Toaster position="top-center" richColors />
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-soft rounded-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center text-white mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">অ্যাডমিন {mode === "login" ? "লগইন" : "সাইনআপ"}</h1>
          <p className="text-sm text-muted-foreground mt-1">অর্ডার ম্যানেজ করতে লগইন করুন</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">ইমেইল</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-xl h-11" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-cta text-white shadow-cta rounded-xl font-bold">
            {loading ? "প্রসেসিং..." : mode === "login" ? "লগইন" : "সাইনআপ"}
          </Button>
        </form>
        <div className="text-center mt-4 text-sm">
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-semibold">
            {mode === "login" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন"}
          </button>
        </div>
        <div className="text-center mt-2">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← হোমে ফিরে যান</Link>
        </div>
      </Card>
    </div>
  );
}
