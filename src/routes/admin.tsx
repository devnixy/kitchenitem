import { MetaPixelLoader, trackMetaEvent } from "@/components/meta-pixel";
import { SiteContentEditor } from "@/components/site-content-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownUp,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Phone,
  Printer,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Order = Tables<"orders">;
type Product = Tables<"products">;
type Status = Order["status"];

const DEFAULT_INSIDE_FEE = 70;
const DEFAULT_OUTSIDE_FEE = 130;
const DEFAULT_FREE_TEXT = "ফ্রি ডেলিভারি";
const TEST_EVENT_TTL_MS = 24 * 60 * 60 * 1000;
const INVOICE_BRAND = "Admin Panel";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "shipped", label: "Shipped", color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-600" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

type TopTab = "dashboard" | "orders" | "product" | "settings";

type SettingsSection =
  | "delivery"
  | "title"
  | "tracking"
  | "product_section"
  | "contact"
  | "courier"
  | "automation"
  | "faq";

const SETTINGS_NAV: {
  id: SettingsSection;
  label: string;
  icon: typeof Truck;
}[] = [
  { id: "delivery", label: "ডেলিভারি ও চার্জ", icon: Truck },
  { id: "title", label: "টাইটেল ও কনটেন্ট", icon: Sparkles },
  { id: "tracking", label: "Pixel & Tracking", icon: TrendingUp },
  { id: "product_section", label: "প্রোডাক্ট সেকশন", icon: Boxes },
  { id: "contact", label: "যোগাযোগ ও লিংক", icon: Phone },
  { id: "courier", label: "কুরিয়ার API", icon: Package },
  { id: "automation", label: "অটোমেটিক সিস্টেম", icon: Zap },
  { id: "faq", label: "সচরাচর জিজ্ঞাসা", icon: HelpCircle },
];

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [topTab, setTopTab] = useState<TopTab>("dashboard");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("delivery");

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "id" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Product
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productOldPrice, setProductOldPrice] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // Delivery
  const [shipInside, setShipInside] = useState(true);
  const [shipInsidePrice, setShipInsidePrice] = useState(String(DEFAULT_INSIDE_FEE));
  const [shipOutside, setShipOutside] = useState(true);
  const [shipOutsidePrice, setShipOutsidePrice] = useState(String(DEFAULT_OUTSIDE_FEE));
  const [shipFree, setShipFree] = useState(false);
  const [shipFreeText, setShipFreeText] = useState(DEFAULT_FREE_TEXT);
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Tracking
  const [gtmId, setGtmId] = useState("");
  const [gtmInput, setGtmInput] = useState("");
  const [savingGtm, setSavingGtm] = useState(false);

  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaPixelInput, setMetaPixelInput] = useState("");
  const [metaTestCode, setMetaTestCode] = useState("");
  const [metaTestCodeInput, setMetaTestCodeInput] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

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

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .in("key", [
        "gtm_id",
        "meta_pixel_id",
        "meta_test_event_code",
        "meta_test_event_code_expires_at",
        "shipping_inside_enabled",
        "shipping_inside_price",
        "shipping_outside_enabled",
        "shipping_outside_price",
        "shipping_free_enabled",
        "shipping_free_text",
      ]);

    const map: Record<string, string> = {};
    const updatedAtMap: Record<string, string> = {};
    (data ?? []).forEach((row) => {
      if (row.key) {
        map[row.key] = row.value ?? "";
        updatedAtMap[row.key] = row.updated_at ?? "";
      }
    });

    // GTM
    setGtmId(map.gtm_id ?? "");
    setGtmInput(map.gtm_id ?? "");

    // Meta — test code TTL check
    const cleanCode = (s: string) => s.replace(/\s+/g, "").toUpperCase();
    let testCode = cleanCode(map.meta_test_event_code ?? "");
    let expiresMs = Date.parse(map.meta_test_event_code_expires_at ?? "");
    if (testCode && Number.isNaN(expiresMs)) {
      const u = Date.parse(updatedAtMap.meta_test_event_code ?? "");
      if (!Number.isNaN(u)) expiresMs = u + TEST_EVENT_TTL_MS;
    }
    if (testCode && Number.isFinite(expiresMs) && Date.now() >= expiresMs) {
      const now = new Date().toISOString();
      await supabase.from("app_settings").upsert([
        { key: "meta_test_event_code", value: "", updated_at: now },
        { key: "meta_test_event_code_expires_at", value: "", updated_at: now },
      ]);
      testCode = "";
    }
    setMetaPixelId(map.meta_pixel_id ?? "");
    setMetaPixelInput(map.meta_pixel_id ?? "");
    setMetaTestCode(testCode);
    setMetaTestCodeInput(testCode);

    // Delivery
    const parseBool = (v: string | undefined, def: boolean) => {
      if (v == null || v === "") return def;
      return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
    };
    const parseNum = (v: string | undefined, def: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : def;
    };
    setShipInside(parseBool(map.shipping_inside_enabled, true));
    setShipOutside(parseBool(map.shipping_outside_enabled, true));
    setShipFree(parseBool(map.shipping_free_enabled, false));
    setShipInsidePrice(String(parseNum(map.shipping_inside_price, DEFAULT_INSIDE_FEE)));
    setShipOutsidePrice(String(parseNum(map.shipping_outside_price, DEFAULT_OUTSIDE_FEE)));
    setShipFreeText(map.shipping_free_text?.trim() || DEFAULT_FREE_TEXT);
  }, []);

  const loadProduct = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    const p: Product | null = data?.[0] ?? null;
    setProductId(p?.id ?? null);
    setProductName(p?.name ?? "");
    setProductDescription(p?.description ?? "");
    setProductImageUrl(p?.image_url ?? "");
    setProductPrice(p ? String(p.price) : "");
    setProductOldPrice(p?.old_price ? String(p.old_price) : "");
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({ to: "/auth" });
        return;
      }
      const userId = sessionData.session.user.id;
      setAdminEmail(sessionData.session.user.email ?? "");
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
      await Promise.all([loadOrders(), loadSettings(), loadProduct()]);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, loadOrders, loadSettings, loadProduct]);

  // ---------- Save handlers ----------
  const handleSaveGtm = async () => {
    const trimmed = gtmInput.trim();
    if (!/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
      toast.error("সঠিক GTM ID দিন (GTM-XXXXXXX)");
      return;
    }
    setSavingGtm(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "gtm_id", value: trimmed, updated_at: new Date().toISOString() });
    setSavingGtm(false);
    if (error) return toast.error("সেভ ব্যর্থ");
    setGtmId(trimmed);
    toast.success("GTM ID সেভ হয়েছে");
  };

  const handleSaveMeta = async () => {
    const pixelId = metaPixelInput.trim();
    const testCode = metaTestCodeInput.trim().replace(/\s+/g, "").toUpperCase();
    if (!pixelId) return toast.error("Meta Pixel ID দিন");
    if (testCode && !/^[A-Z0-9_-]{4,64}$/i.test(testCode)) {
      return toast.error("Test Event Code: শুধু A-Z, 0-9, _ বা -");
    }
    setSavingMeta(true);
    const now = new Date().toISOString();
    const expiresAt = testCode
      ? new Date(Date.now() + TEST_EVENT_TTL_MS).toISOString()
      : "";
    const { error } = await supabase.from("app_settings").upsert([
      { key: "meta_pixel_id", value: pixelId, updated_at: now },
      { key: "meta_test_event_code", value: testCode, updated_at: now },
      { key: "meta_test_event_code_expires_at", value: expiresAt, updated_at: now },
    ]);
    setSavingMeta(false);
    if (error) return toast.error("সেভ ব্যর্থ");
    setMetaPixelId(pixelId);
    setMetaTestCode(testCode);
    toast.success("Meta Pixel সেটিংস সেভ হয়েছে");
  };

  const handleSaveDelivery = async () => {
    const insidePrice = Number(shipInsidePrice);
    const outsidePrice = Number(shipOutsidePrice);
    if (!shipInside && !shipOutside && !shipFree) {
      return toast.error("কমপক্ষে একটি ডেলিভারি option চালু রাখুন");
    }
    if (shipFree && !shipFreeText.trim()) {
      return toast.error("ফ্রি ডেলিভারির text লিখুন");
    }
    if (!Number.isFinite(insidePrice) || insidePrice < 0) {
      return toast.error("ঢাকার ভিতরের চার্জ ঠিক নেই");
    }
    if (!Number.isFinite(outsidePrice) || outsidePrice < 0) {
      return toast.error("ঢাকার বাইরের চার্জ ঠিক নেই");
    }
    setSavingDelivery(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "shipping_inside_enabled", value: String(shipInside), updated_at: now },
      { key: "shipping_inside_price", value: String(insidePrice), updated_at: now },
      { key: "shipping_outside_enabled", value: String(shipOutside), updated_at: now },
      { key: "shipping_outside_price", value: String(outsidePrice), updated_at: now },
      { key: "shipping_free_enabled", value: String(shipFree), updated_at: now },
      { key: "shipping_free_text", value: shipFreeText.trim(), updated_at: now },
    ]);
    setSavingDelivery(false);
    if (error) return toast.error("সেভ ব্যর্থ");
    toast.success("ডেলিভারি সেটিংস সেভ হয়েছে");
  };

  const handleSaveProduct = async () => {
    const name = productName.trim();
    const price = Number(productPrice);
    const oldPrice = productOldPrice.trim() ? Number(productOldPrice) : null;
    if (!name) return toast.error("প্রোডাক্ট নাম দিন");
    if (!Number.isFinite(price) || price <= 0) return toast.error("সঠিক price দিন");
    if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice <= 0)) {
      return toast.error("পুরনো price ঠিক নেই");
    }
    setSavingProduct(true);
    const payload = {
      name,
      description: productDescription.trim() || null,
      image_url: productImageUrl.trim() || null,
      price,
      old_price: oldPrice,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    const req = productId
      ? supabase.from("products").update(payload).eq("id", productId).select("*").single()
      : supabase.from("products").insert(payload).select("*").single();
    const { data, error } = await req;
    setSavingProduct(false);
    if (error) return toast.error("সেভ ব্যর্থ");
    const saved = data as Product | null;
    if (saved) {
      setProductId(saved.id);
      setProductName(saved.name);
      setProductDescription(saved.description ?? "");
      setProductImageUrl(saved.image_url ?? "");
      setProductPrice(String(saved.price));
      setProductOldPrice(saved.old_price ? String(saved.old_price) : "");
    }
    toast.success("প্রোডাক্ট সেভ হয়েছে");
  };

  // ---------- Order actions ----------
  const handleStatusChange = async (id: string, status: Status) => {
    const target = orders.find((o) => o.id === id);
    const prev = target?.status;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("আপডেট ব্যর্থ");
    setOrders((prevOrders) => prevOrders.map((o) => (o.id === id ? { ...o, status } : o)));

    if (target && prev !== "confirmed" && status === "confirmed" && typeof window !== "undefined") {
      const w = window as Window & {
        dataLayer?: Array<Record<string, unknown>>;
      };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ ecommerce: null });
      w.dataLayer.push({
        event: "purchase",
        ecommerce: {
          currency: "BDT",
          transaction_id: target.id,
          value: target.total,
          shipping: target.shipping_fee,
          tax: 0,
          items: [
            {
              item_id: target.product_id ?? "product",
              item_name: productName || "Product",
              price: target.unit_price,
              quantity: target.quantity,
            },
          ],
        },
      });
      await trackMetaEvent("Purchase", {
        currency: "BDT",
        value: target.total,
        content_name: productName,
        content_ids: [target.product_id ?? "product"],
        content_type: "product",
        num_items: target.quantity,
      });
    }
    toast.success("স্ট্যাটাস আপডেট হয়েছে");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error("ডিলিট ব্যর্থ");
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("অর্ডার ডিলিট হয়েছে");
  };

  const handlePrintInvoice = (order: Order) => {
    const invoiceWindow = window.open("", "_blank", "width=900,height=720");
    if (!invoiceWindow) return toast.error("Pop-up blocked");
    const statusLabel =
      STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? order.status;
    const orderDate = new Date(order.created_at).toLocaleString("bn-BD");
    const fmt = (n: number) =>
      new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }).format(n);
    invoiceWindow.document.open();
    invoiceWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${order.id}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px}.muted{color:#666;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee}.box{border:1px solid #eee;border-radius:12px;padding:14px;margin-top:12px}.row{display:flex;justify-content:space-between;margin:6px 0}.total{font-weight:800;font-size:16px;border-top:1px solid #eee;padding-top:8px;margin-top:8px}@media print{button{display:none}}</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:12px">
<div><h1>${INVOICE_BRAND}</h1><div class="muted">Invoice</div><div class="muted">Order #${order.id.slice(0, 8)}</div><div class="muted">${orderDate}</div></div>
<div style="background:#111;color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700">${statusLabel}</div>
</div>
<div class="box"><strong>Customer</strong><div>${order.customer_name}</div><div class="muted">Phone: ${order.phone}</div><div class="muted">Address: ${order.address}</div><div class="muted">Area: ${order.shipping_area}</div></div>
<table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
<tbody><tr><td>${productName || "Product"}</td><td>${order.quantity}</td><td>${fmt(order.unit_price)}৳</td><td>${fmt(order.unit_price * order.quantity)}৳</td></tr></tbody></table>
<div class="box" style="max-width:320px;margin-left:auto">
<div class="row"><span>Subtotal</span><span>${fmt(order.unit_price * order.quantity)}৳</span></div>
<div class="row"><span>Shipping</span><span>${fmt(order.shipping_fee)}৳</span></div>
<div class="row total"><span>Total</span><span>${fmt(order.total)}৳</span></div>
</div>
<div style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:10px 20px;background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer">Print</button></div>
</body></html>`);
    invoiceWindow.document.close();
    invoiceWindow.focus();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) return <AdminSkeleton />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center rounded-2xl">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h1>
          <p className="text-sm text-muted-foreground mb-4">
            আপনার অ্যাকাউন্টে অ্যাডমিন রোল নেই।
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">হোম</Link>
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-1.5" /> লগআউট
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Dashboard stats ----
  const stats = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: orders.filter((o) => o.status === s.value).length,
  }));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
  const todaysRevenue = todaysOrders
    .filter((o) => o.status === "confirmed" || o.status === "delivered" || o.status === "shipped")
    .reduce((s, o) => s + o.total, 0);
  const totalRevenue = orders
    .filter((o) => o.status === "confirmed" || o.status === "delivered" || o.status === "shipped")
    .reduce((s, o) => s + o.total, 0);

  // ---- Orders filter+sort ----
  const phoneNorm = phoneSearch.replace(/\D/g, "");
  const byStatus = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  let filtered = phoneNorm
    ? byStatus.filter((o) => o.phone.replace(/\D/g, "").includes(phoneNorm))
    : byStatus;
  filtered = [...filtered].sort((a, b) => {
    let v = 0;
    if (sortBy === "id") v = a.id.localeCompare(b.id);
    else if (sortBy === "date")
      v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    else if (sortBy === "total") v = a.total - b.total;
    return sortOrder === "asc" ? v : -v;
  });

  const TOP_TABS: { id: TopTab; label: string; icon: typeof Package }[] = [
    { id: "dashboard", label: "আজকের", icon: LayoutDashboard },
    { id: "orders", label: "অর্ডার", icon: ClipboardList },
    { id: "product", label: "প্রোডাক্ট", icon: ShoppingBag },
    { id: "settings", label: "সেটিংস", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <MetaPixelLoader />
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-base sm:text-lg">আডমিন প্যানেল</h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              ড্যাশবোর্ড ও ম্যানেজমেন্ট
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              onClick={() => loadOrders()}
              disabled={refreshing}
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            <div
              className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold"
              title={adminEmail}
            >
              <User className="w-4 h-4" />
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </Button>
          </div>
        </div>

        {/* Top tabs */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 sm:gap-2">
            {TOP_TABS.map((t) => {
              const Icon = t.icon;
              const active = topTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTopTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {topTab === "dashboard" && (
          <DashboardTab
            todaysOrders={todaysOrders.length}
            todaysRevenue={todaysRevenue}
            totalOrders={orders.length}
            totalRevenue={totalRevenue}
            stats={stats}
          />
        )}

        {topTab === "orders" && (
          <OrdersTab
            phoneSearch={phoneSearch}
            setPhoneSearch={setPhoneSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            stats={stats}
            filter={filter}
            setFilter={setFilter}
            totalCount={orders.length}
            filtered={filtered}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onPrint={handlePrintInvoice}
          />
        )}

        {topTab === "product" && (
          <ProductTab
            productId={productId}
            name={productName}
            setName={setProductName}
            description={productDescription}
            setDescription={setProductDescription}
            imageUrl={productImageUrl}
            setImageUrl={setProductImageUrl}
            price={productPrice}
            setPrice={setProductPrice}
            oldPrice={productOldPrice}
            setOldPrice={setProductOldPrice}
            saving={savingProduct}
            onSave={handleSaveProduct}
          />
        )}

        {topTab === "settings" && (
          <div className="grid lg:grid-cols-[260px_1fr] gap-4">
            {/* Settings sidebar */}
            <Card className="p-2 rounded-xl h-fit lg:sticky lg:top-32">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                {SETTINGS_NAV.map((s) => {
                  const Icon = s.icon;
                  const active = settingsSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSettingsSection(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left transition ${
                        active
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "hover:bg-muted text-foreground/80"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* Settings content */}
            <div className="space-y-4">
              {settingsSection === "delivery" && (
                <DeliverySection
                  shipInside={shipInside}
                  setShipInside={setShipInside}
                  shipInsidePrice={shipInsidePrice}
                  setShipInsidePrice={setShipInsidePrice}
                  shipOutside={shipOutside}
                  setShipOutside={setShipOutside}
                  shipOutsidePrice={shipOutsidePrice}
                  setShipOutsidePrice={setShipOutsidePrice}
                  shipFree={shipFree}
                  setShipFree={setShipFree}
                  shipFreeText={shipFreeText}
                  setShipFreeText={setShipFreeText}
                  saving={savingDelivery}
                  onSave={handleSaveDelivery}
                />
              )}

              {settingsSection === "tracking" && (
                <TrackingSection
                  gtmId={gtmId}
                  gtmInput={gtmInput}
                  setGtmInput={setGtmInput}
                  savingGtm={savingGtm}
                  onSaveGtm={handleSaveGtm}
                  metaPixelId={metaPixelId}
                  metaPixelInput={metaPixelInput}
                  setMetaPixelInput={setMetaPixelInput}
                  metaTestCode={metaTestCode}
                  metaTestCodeInput={metaTestCodeInput}
                  setMetaTestCodeInput={setMetaTestCodeInput}
                  savingMeta={savingMeta}
                  onSaveMeta={handleSaveMeta}
                />
              )}

              {(settingsSection === "title" ||
                settingsSection === "product_section" ||
                settingsSection === "contact" ||
                settingsSection === "faq") && <SiteContentEditor />}

              {settingsSection === "courier" && (
                <ComingSoon
                  icon={<Package className="w-12 h-12 text-muted-foreground" />}
                  title="কুরিয়ার API"
                  desc="Steadfast / Pathao / RedX integration শীঘ্রই আসছে।"
                />
              )}
              {settingsSection === "automation" && (
                <ComingSoon
                  icon={<Zap className="w-12 h-12 text-muted-foreground" />}
                  title="অটোমেটিক সিস্টেম"
                  desc="Auto-confirm, auto-SMS শীঘ্রই আসছে।"
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------- Sub-components ----------------

function DashboardTab({
  todaysOrders,
  todaysRevenue,
  totalOrders,
  totalRevenue,
  stats,
}: {
  todaysOrders: number;
  todaysRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  stats: { value: Status; label: string; color: string; count: number }[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="আজকের অর্ডার"
          value={todaysOrders}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          label="আজকের আয়"
          value={`${todaysRevenue}৳`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="from-emerald-500 to-green-600"
        />
        <StatCard
          label="মোট অর্ডার"
          value={totalOrders}
          icon={<ClipboardList className="w-5 h-5" />}
          color="from-blue-500 to-indigo-600"
        />
        <StatCard
          label="মোট আয়"
          value={`${totalRevenue}৳`}
          icon={<Flame className="w-5 h-5" />}
          color="from-rose-500 to-pink-600"
        />
      </div>

      <Card className="p-4 rounded-xl">
        <h2 className="font-semibold text-sm mb-3">স্ট্যাটাস ব্রেকডাউন</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stats.map((s) => (
            <div key={s.value} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
              </div>
              <div className="text-2xl font-bold mt-1">{s.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="p-4 rounded-xl overflow-hidden relative">
      <div
        className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-20`}
      />
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}

function OrdersTab({
  phoneSearch,
  setPhoneSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  stats,
  filter,
  setFilter,
  totalCount,
  filtered,
  onStatusChange,
  onDelete,
  onPrint,
}: {
  phoneSearch: string;
  setPhoneSearch: (v: string) => void;
  sortBy: "date" | "id" | "total";
  setSortBy: (v: "date" | "id" | "total") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  stats: { value: Status; label: string; color: string; count: number }[];
  filter: Status | "all";
  setFilter: (v: Status | "all") => void;
  totalCount: number;
  filtered: Order[];
  onStatusChange: (id: string, s: Status) => void;
  onDelete: (id: string) => void;
  onPrint: (o: Order) => void;
}) {
  return (
    <div className="space-y-4">
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
            placeholder="01XXXXXXXXX"
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

      <Card className="p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">সর্ট</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={sortBy === "date" ? "default" : "outline"}
            onClick={() => setSortBy("date")}
          >
            তারিখ
          </Button>
          <Button
            size="sm"
            variant={sortBy === "id" ? "default" : "outline"}
            onClick={() => setSortBy("id")}
          >
            ID
          </Button>
          <Button
            size="sm"
            variant={sortBy === "total" ? "default" : "outline"}
            onClick={() => setSortBy("total")}
          >
            মোট
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑ আরোহী" : "↓ অবরোহী"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Card
          className={`p-3 cursor-pointer rounded-xl ${filter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <div className="text-xs text-muted-foreground">সব</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </Card>
        {stats.map((s) => (
          <Card
            key={s.value}
            className={`p-3 cursor-pointer rounded-xl ${filter === s.value ? "ring-2 ring-primary" : ""}`}
            onClick={() => setFilter(s.value)}
          >
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
            </div>
            <div className="text-2xl font-bold">{s.count}</div>
          </Card>
        ))}
      </div>

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
                      <Badge className={`${statusOpt.color} text-white border-0`}>
                        {statusOpt.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("bn-BD")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <a href={`tel:${o.phone}`} className="text-primary font-medium">
                          {o.phone}
                        </a>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{o.address}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span>
                        Qty: <strong>{o.quantity}</strong>
                      </span>
                      <span>
                        Unit: <strong>{o.unit_price}৳</strong>
                      </span>
                      <span>
                        Ship: <strong>{o.shipping_fee}৳</strong> ({o.shipping_area})
                      </span>
                      <span className="text-primary font-bold">Total: {o.total}৳</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Select
                      value={o.status}
                      onValueChange={(v) => onStatusChange(o.id, v as Status)}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      onClick={() => onPrint(o)}
                      aria-label="Print invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
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
                            এই অ্যাকশন undo করা যাবে না।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(o.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
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
    </div>
  );
}

function ProductTab(props: {
  productId: string | null;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  oldPrice: string;
  setOldPrice: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Single product settings</h2>
        {props.productId && (
          <Badge variant="secondary" className="ml-auto gap-1">
            <CheckCircle2 className="w-3 h-3" /> Saved
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        এই সাইটে শুধু একটি প্রোডাক্ট থাকবে। সেভ করলে একই রেকর্ড আপডেট হবে।
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Product name</Label>
          <Input
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            placeholder="Vegetable Push Chopper"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
            placeholder="Product description"
            rows={3}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Image URL
          </Label>
          <Input
            value={props.imageUrl}
            onChange={(e) => props.setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Price (৳)</Label>
          <Input
            value={props.price}
            onChange={(e) => props.setPrice(e.target.value)}
            placeholder="490"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Old price (৳)</Label>
          <Input
            value={props.oldPrice}
            onChange={(e) => props.setOldPrice(e.target.value)}
            placeholder="990"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={props.onSave} disabled={props.saving}>
          <Save className={`w-4 h-4 mr-1.5 ${props.saving ? "animate-pulse" : ""}`} />
          {props.productId ? "Update product" : "Add product"}
        </Button>
      </div>
    </Card>
  );
}

function DeliverySection(props: {
  shipInside: boolean;
  setShipInside: (v: boolean) => void;
  shipInsidePrice: string;
  setShipInsidePrice: (v: string) => void;
  shipOutside: boolean;
  setShipOutside: (v: boolean) => void;
  shipOutsidePrice: string;
  setShipOutsidePrice: (v: string) => void;
  shipFree: boolean;
  setShipFree: (v: boolean) => void;
  shipFreeText: string;
  setShipFreeText: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">ডেলিভারি লোকেশন ও চার্জ</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        এখান থেকে ডেলিভারি লোকেশন চালু/বন্ধ করুন এবং চার্জ সেট করুন।
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">ঢাকার ভিতরে</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {props.shipInside ? "On" : "Off"}
              </span>
              <Switch checked={props.shipInside} onCheckedChange={props.setShipInside} />
            </div>
          </div>
          <Input
            value={props.shipInsidePrice}
            onChange={(e) => props.setShipInsidePrice(e.target.value)}
            placeholder="চার্জ"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">ঢাকার বাইরে</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {props.shipOutside ? "On" : "Off"}
              </span>
              <Switch
                checked={props.shipOutside}
                onCheckedChange={props.setShipOutside}
              />
            </div>
          </div>
          <Input
            value={props.shipOutsidePrice}
            onChange={(e) => props.setShipOutsidePrice(e.target.value)}
            placeholder="চার্জ"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">ফ্রি ডেলিভারি</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {props.shipFree ? "On" : "Off"}
              </span>
              <Switch checked={props.shipFree} onCheckedChange={props.setShipFree} />
            </div>
          </div>
          <Input
            value={props.shipFreeText}
            onChange={(e) => props.setShipFreeText(e.target.value)}
            placeholder="যেমন: সারা বাংলাদেশে ফ্রি"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={props.onSave} disabled={props.saving}>
          <Save className={`w-4 h-4 mr-1.5 ${props.saving ? "animate-pulse" : ""}`} />
          সেভ করুন
        </Button>
      </div>
    </Card>
  );
}

function TrackingSection(props: {
  gtmId: string;
  gtmInput: string;
  setGtmInput: (v: string) => void;
  savingGtm: boolean;
  onSaveGtm: () => void;
  metaPixelId: string;
  metaPixelInput: string;
  setMetaPixelInput: (v: string) => void;
  metaTestCode: string;
  metaTestCodeInput: string;
  setMetaTestCodeInput: (v: string) => void;
  savingMeta: boolean;
  onSaveMeta: () => void;
}) {
  return (
    <>
      <Card className="p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Google Tag Manager</h2>
          {props.gtmId && (
            <Badge variant="secondary" className="ml-auto font-mono text-xs">
              {props.gtmId}
            </Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={props.gtmInput}
            onChange={(e) => props.setGtmInput(e.target.value)}
            placeholder="GTM-XXXXXXX"
            className="font-mono"
          />
          <Button
            onClick={props.onSaveGtm}
            disabled={props.savingGtm || props.gtmInput.trim() === props.gtmId}
          >
            <Save className={`w-4 h-4 mr-1.5 ${props.savingGtm ? "animate-pulse" : ""}`} />
            সেভ
          </Button>
        </div>
      </Card>

      <Card className="p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Meta Pixel</h2>
          {props.metaPixelId && (
            <Badge variant="secondary" className="ml-auto font-mono text-xs">
              {props.metaPixelId}
            </Badge>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Pixel ID</Label>
            <Input
              value={props.metaPixelInput}
              onChange={(e) => props.setMetaPixelInput(e.target.value)}
              placeholder="1234567890"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Test Event Code (optional)</Label>
            <Input
              value={props.metaTestCodeInput}
              onChange={(e) => props.setMetaTestCodeInput(e.target.value)}
              placeholder="TEST12345"
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={props.onSaveMeta} disabled={props.savingMeta}>
            <Save className={`w-4 h-4 mr-1.5 ${props.savingMeta ? "animate-pulse" : ""}`} />
            সেভ করুন
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Test Event Code দিলে Meta Events Manager-এ টেস্ট ইভেন্ট হিসেবে দেখাবে এবং ২৪ ঘন্টা পরে
          স্বয়ংক্রিয়ভাবে মুছে যাবে।
        </p>
      </Card>
    </>
  );
}

function ComingSoon({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-10 rounded-xl text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <Badge variant="outline" className="mt-3">Coming soon</Badge>
    </Card>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    </div>
  );
}
