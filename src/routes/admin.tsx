import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  LogOut, Trash2, Phone, MapPin, Package, RefreshCw, ShieldAlert, Save, Settings, Search, X,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Order = Tables<"orders">;
type Status = Order["status"];

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "shipped", label: "Shipped", color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-600" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [gtmId, setGtmId] = useState("");
  const [gtmInput, setGtmInput] = useState("");
  const [savingGtm, setSavingGtm] = useState(false);

  const [phoneSearch, setPhoneSearch] = useState("");

  const loadOrders = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setRefreshing(false);
    if (error) {
      toast.error("অর্ডার লোড করতে সমস্যা হয়েছে");
      return;
    }
    setOrders(data ?? []);
  }, []);

  const loadGtm = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gtm_id")
      .maybeSingle();
    const v = data?.value ?? "";
    setGtmId(v);
    setGtmInput(v);
  }, []);

  const handleSaveGtm = async () => {
    const trimmed = gtmInput.trim();
    if (!/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
      toast.error("সঠিক GTM ID দিন (যেমন GTM-XXXXXXX)");
      return;
    }
    setSavingGtm(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "gtm_id", value: trimmed, updated_at: new Date().toISOString() });
    setSavingGtm(false);
    if (error) return toast.error("সেভ ব্যর্থ");
    setGtmId(trimmed);
    toast.success("GTM ID সেভ হয়েছে। পরবর্তী পেজ লোড থেকে কার্যকর হবে।");
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({ to: "/auth" });
        return;
      }
      const userId = sessionData.session.user.id;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      if (!roleData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      await Promise.all([loadOrders(), loadGtm()]);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, loadOrders, loadGtm]);

  const handleStatusChange = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("আপডেট ব্যর্থ");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("স্ট্যাটাস আপডেট হয়েছে");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error("ডিলিট ব্যর্থ");
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("অর্ডার ডিলিট হয়েছে");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center rounded-2xl">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h1>
          <p className="text-sm text-muted-foreground mb-4">
            আপনার অ্যাকাউন্টে অ্যাডমিন রোল নেই। ব্যাকেন্ড ড্যাশবোর্ড থেকে আপনার ইউজারের জন্য
            <code className="mx-1 px-1.5 py-0.5 rounded bg-muted">user_roles</code>
            টেবিলে <code className="mx-1 px-1.5 py-0.5 rounded bg-muted">role = 'admin'</code> যোগ করুন।
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild><Link to="/">হোম</Link></Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-1.5" /> লগআউট
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const stats = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: orders.filter((o) => o.status === s.value).length,
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster position="top-center" richColors />

      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="font-bold text-base sm:text-lg truncate">অ্যাডমিন প্যানেল</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => loadOrders()} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 sm:mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/">হোম</Link>
            </Button>
            <Button size="sm" variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* GTM Settings */}
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Google Tag Manager ID</h2>
            {gtmId && (
              <Badge variant="secondary" className="ml-auto font-mono text-xs">{gtmId}</Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={gtmInput}
              onChange={(e) => setGtmInput(e.target.value)}
              placeholder="GTM-XXXXXXX"
              className="font-mono"
            />
            <Button onClick={handleSaveGtm} disabled={savingGtm || gtmInput.trim() === gtmId}>
              <Save className={`w-4 h-4 mr-1.5 ${savingGtm ? "animate-pulse" : ""}`} />
              সেভ
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            পরিবর্তন সাইটের পরবর্তী পেজ লোড থেকে কার্যকর হবে।
          </p>
        </Card>

        {/* Phone Search */}
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">ফোন নম্বর দিয়ে অর্ডার খুঁজুন</h2>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="যেমন: 01XXXXXXXXX"
              className="pl-9 pr-9"
              inputMode="tel"
            />
            {phoneSearch && (
              <button
                type="button"
                onClick={() => setPhoneSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                aria-label="Clear"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
          <Card
            className={`p-3 cursor-pointer transition rounded-xl ${filter === "all" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setFilter("all")}
          >
            <div className="text-xs text-muted-foreground">সব অর্ডার</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </Card>
          {stats.map((s) => (
            <Card
              key={s.value}
              className={`p-3 cursor-pointer transition rounded-xl ${filter === s.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(s.value)}
            >
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
              </div>
              <div className="text-2xl font-bold">{s.count}</div>
            </Card>
          ))}
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground rounded-xl">
            কোনো অর্ডার নেই।
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const statusOpt = STATUS_OPTIONS.find((s) => s.value === o.status)!;
              return (
                <Card key={o.id} className="p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">{o.customer_name}</h3>
                        <Badge className={`${statusOpt.color} text-white border-0`}>{statusOpt.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString("bn-BD")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <a href={`tel:${o.phone}`} className="text-primary font-medium">{o.phone}</a>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{o.address}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span>Qty: <strong>{o.quantity}</strong></span>
                        <span>Unit: <strong>{o.unit_price}৳</strong></span>
                        <span>Ship: <strong>{o.shipping_fee}৳</strong> ({o.shipping_area})</span>
                        <span className="text-primary font-bold">Total: {o.total}৳</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v as Status)}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive" className="h-9 w-9">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>অর্ডার ডিলিট করবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              এই অ্যাকশন undo করা যাবে না। {o.customer_name}-এর অর্ডারটি স্থায়ীভাবে মুছে যাবে।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              ডিলিট
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <Card className="p-4 rounded-xl space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3 rounded-xl space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
