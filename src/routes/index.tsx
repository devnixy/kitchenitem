import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ShoppingCart, Phone, MessageCircle, Check, Zap, Shield,
  Truck, Clock, Star, Minus, Plus, Flame, HelpCircle,
} from "lucide-react";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { MetaPixelLoader } from "@/components/meta-pixel";
import { useSiteContent } from "@/hooks/use-site-content";
import heroImg from "@/assets/chopper-hero.jpg";
import actionImg from "@/assets/chopper-action.jpg";
import boxImg from "@/assets/chopper-box.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const ICON_MAP: Record<string, any> = {
  Zap, Shield, Check, Truck, Clock, Star,
};

function Index() {
  const { content } = useSiteContent();
  const { hero, contact, shipping: ship, features, faqs, gallery, brand, topbar } = content;

  const PRICE = hero.price;
  const heroImage = hero.image_url || heroImg;
  const galleryImages = gallery.images.length > 0
    ? gallery.images
    : [heroImg, actionImg, boxImg, actionImg, heroImg, boxImg];

  const [qty, setQty] = useState(1);
  const [shipping, setShipping] = useState<"inside" | "outside">("inside");
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const shippingFee = shipping === "inside" ? ship.inside_fee : ship.outside_fee;
  const subtotal = PRICE * qty;
  const total = subtotal + shippingFee;

  const scrollToOrder = () => {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
    if (typeof window !== "undefined") {
      const dl = ((window as any).dataLayer = (window as any).dataLayer || []);
      dl.push({ ecommerce: null });
      dl.push({
        event: "begin_checkout",
        ecommerce: {
          currency: "BDT",
          value: PRICE * qty,
          items: [{
            item_id: "push-chopper",
            item_name: `${hero.title_1} ${hero.title_2}`.trim(),
            item_category: "Kitchen",
            price: PRICE,
            quantity: qty,
          }],
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      toast.error("দয়া করে সব তথ্য পূরণ করুন");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("orders").insert({
      customer_name: form.name.trim().slice(0, 100),
      address: form.address.trim().slice(0, 500),
      phone: form.phone.trim().slice(0, 20),
      quantity: qty,
      unit_price: PRICE,
      shipping_fee: shippingFee,
      total,
      shipping_area: shipping === "inside" ? ship.inside_label : ship.outside_label,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error("অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      return;
    }
    if (typeof window !== "undefined") {
      const item = {
        item_id: "push-chopper",
        item_name: `${hero.title_1} ${hero.title_2}`.trim(),
        item_category: "Kitchen",
        price: PRICE,
        quantity: qty,
      };
      const dl = ((window as any).dataLayer = (window as any).dataLayer || []);
      dl.push({ ecommerce: null });
      dl.push({
        event: "purchase",
        new_customer: true,
        orderData: {
          attributes: {
            date: new Date().toISOString(),
            order_number: inserted?.id,
            payment_method: "cod",
            payment_method_title: "Cash on delivery",
            status: "pending",
          },
          totals: {
            currency: "BDT",
            shipping_total: shippingFee,
            total: total,
            subtotal: subtotal,
          },
          customer: {
            billing: {
              first_name: form.name.trim(),
              address_1: form.address.trim(),
              phone: form.phone.trim(),
              country: "BD",
            },
          },
          items: [item],
        },
        ecommerce: {
          currency: "BDT",
          transaction_id: inserted?.id,
          value: total,
          tax: 0,
          shipping: shippingFee,
          coupon: "",
          items: [item],
        },
      });
    }
    toast.success("অর্ডার কনফার্ম হয়েছে! আমরা শীঘ্রই কল করব।");
    setForm({ name: "", address: "", phone: "" });
    setQty(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <MetaPixelLoader />
      <Toaster position="top-center" richColors />

      {/* Top bar */}
      <div className="bg-gradient-cta text-white text-center py-2 text-xs sm:text-sm font-medium px-3">
        <Flame className="inline w-4 h-4 mr-1" /> {topbar.text}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-bold">
              {brand.initials}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base">{brand.name}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{brand.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-primary px-2">
              <Phone className="w-4 h-4" /> <span className="hidden xs:inline">কল করুন</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-warm pb-8">
        <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-10">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 bg-accent/30 text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Star className="w-3.5 h-3.5 fill-current" /> {hero.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                {hero.title_1} <span className="text-gradient">{hero.title_2}</span>
              </h1>
              <p className="mt-3 text-muted-foreground text-base sm:text-lg">
                {hero.subtitle}
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="text-muted-foreground line-through text-lg">{hero.old_price}৳</span>
                <span className="text-4xl sm:text-5xl font-extrabold text-primary">{hero.price}৳</span>
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-bold mb-1">
                  {hero.discount_label}
                </span>
              </div>

              <Button
                onClick={scrollToOrder}
                size="lg"
                className="mt-5 w-full sm:w-auto bg-gradient-cta text-white shadow-cta hover:opacity-95 animate-pulse-cta text-base font-bold rounded-xl px-8 py-6"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {hero.cta_text}
              </Button>

              <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-secondary" /> ক্যাশ অন ডেলিভারি</span>
                <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-secondary" /> ১০০% অরিজিনাল</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-secondary" /> ২৪-৭২ ঘন্টা ডেলিভারি</span>
              </div>
            </div>

            <div className="order-1 md:order-2 relative">
              <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt={`${hero.title_1} ${hero.title_2}`}
                width={1024}
                height={1024}
                className="relative rounded-3xl shadow-glow w-full animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            কেন <span className="text-gradient">{hero.title_2}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = ICON_MAP[f.icon] || Star;
              return (
                <Card key={i} className="p-5 border-border hover:shadow-soft transition-all hover:-translate-y-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-hero flex items-center justify-center text-white mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      <section className="bg-muted/40 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            প্রোডাক্ট গ্যালারি
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Product view ${i + 1}`}
                width={1024}
                height={1024}
                loading="lazy"
                className="w-full aspect-square object-cover rounded-2xl shadow-soft hover:scale-[1.02] transition"
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button onClick={scrollToOrder} size="lg" className="bg-gradient-cta text-white shadow-cta rounded-xl px-8 font-bold">
              <ShoppingCart className="w-5 h-5 mr-2" /> অর্ডার করুন
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">যোগাযোগ করুন</h2>
        <p className="text-muted-foreground mb-6">যেকোন প্রয়োজনে আমাদের সাথে যোগাযোগ করুন</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild size="lg" variant="outline" className="rounded-xl border-2">
            <a href={`tel:${contact.phone}`}><Phone className="w-5 h-5 mr-2" /> {contact.phone_display}</a>
          </Button>
          <Button asChild size="lg" className="rounded-xl bg-secondary hover:bg-secondary/90">
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
            </a>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/30 text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5" /> সাধারণ জিজ্ঞাসা
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              অর্ডারের আগে <span className="text-gradient">জেনে নিন</span>
            </h2>
          </div>

          <Card className="p-2 sm:p-4 shadow-soft rounded-2xl">
            <Accordion type="single" collapsible defaultValue="q0" className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q${i}`} className="border-border px-3">
                  <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>
      )}

      {/* Order Form */}
      <section id="order" className="bg-gradient-warm py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">
              অর্ডার <span className="text-gradient">কনফার্ম করুন</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              নিচের ফর্মে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন
            </p>
          </div>

          <Card className="p-5 sm:p-7 shadow-soft rounded-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <img src={heroImage} alt="" width={80} height={80} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base">{hero.title_1} {hero.title_2}</div>
                <div className="text-primary font-bold">{PRICE}৳</div>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-sm">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <Label htmlFor="name">আপনার নাম *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 rounded-xl h-11" placeholder="পূর্ণ নাম" />
              </div>
              <div>
                <Label htmlFor="address">ডেলিভারি ঠিকানা *</Label>
                <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 rounded-xl" placeholder="বাসা/রোড/থানা/জেলা" rows={3} />
              </div>
              <div>
                <Label htmlFor="phone">মোবাইল নম্বর *</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 rounded-xl h-11" placeholder="01XXXXXXXXX" />
              </div>

              <div>
                <Label className="block mb-2">⚠️ ডেলিভারি লোকেশন</Label>
                <RadioGroup value={shipping} onValueChange={(v) => setShipping(v as "inside" | "outside")} className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${shipping === "inside" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="inside" />
                    <div className="text-sm"><div className="font-semibold">{ship.inside_label}</div><div className="text-xs text-muted-foreground">{ship.inside_fee}৳</div></div>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${shipping === "outside" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="outside" />
                    <div className="text-sm"><div className="font-semibold">{ship.outside_label}</div><div className="text-xs text-muted-foreground">{ship.outside_fee}৳</div></div>
                  </label>
                </RadioGroup>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal}৳</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shippingFee}৳</span></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span>Total</span><span className="text-primary">{total}৳</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-secondary/10 text-secondary p-3 rounded-xl">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</span>
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-cta text-white shadow-cta hover:opacity-95 rounded-xl text-base font-bold py-6">
                {submitting ? "প্রসেসিং..." : `⚡ অর্ডার কনফার্ম করুন (${total}৳)`}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background/80 py-8 text-center text-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="font-bold text-background mb-1">{brand.name}</div>
          <p>© 2026 {brand.name}. All rights reserved.</p>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden p-3 bg-background/95 backdrop-blur border-t border-border">
        <Button onClick={scrollToOrder} size="lg" className="w-full bg-gradient-cta text-white shadow-cta rounded-xl font-bold">
          <ShoppingCart className="w-5 h-5 mr-2" /> অর্ডার করুন — {PRICE}৳
        </Button>
      </div>
      <div className="md:hidden h-20" />
    </div>
  );
}
