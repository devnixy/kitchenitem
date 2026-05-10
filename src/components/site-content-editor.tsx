import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, Upload, ImageIcon, Loader2 } from "lucide-react";
import { DEFAULT_CONTENT, type SiteContent, type Feature, type Faq } from "@/hooks/use-site-content";

const ICONS = ["Zap", "Shield", "Check", "Truck", "Clock", "Star"];

export function SiteContentEditor() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("key,value");
      if (data) {
        const merged: any = { ...DEFAULT_CONTENT };
        for (const row of data) merged[row.key] = row.value;
        setContent(merged);
      }
      setLoading(false);
    })();
  }, []);

  const saveSection = async (key: keyof SiteContent, value: any) => {
    setSavingKey(key);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    setSavingKey(null);
    if (error) {
      toast.error("সেভ ব্যর্থ: " + error.message);
      return false;
    }
    toast.success(`${key} সেভ হয়েছে`);
    return true;
  };

  const update = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-xl flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="p-4 rounded-xl">
      <h2 className="font-semibold text-base mb-3">সাইট কন্টেন্ট এডিটর</h2>
      <Tabs defaultValue="hero">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faqs">FAQ</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="topbar">Top bar</TabsTrigger>
        </TabsList>

        {/* TOPBAR */}
        <TabsContent value="topbar" className="space-y-3 pt-4">
          <Field label="Top bar text">
            <Input
              value={content.topbar.text}
              onChange={(e) => update("topbar", { text: e.target.value })}
            />
          </Field>
          <SaveBtn busy={savingKey === "topbar"} onClick={() => saveSection("topbar", content.topbar)} />
        </TabsContent>

        {/* BRAND */}
        <TabsContent value="brand" className="space-y-3 pt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Brand name">
              <Input value={content.brand.name} onChange={(e) => update("brand", { ...content.brand, name: e.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={content.brand.tagline} onChange={(e) => update("brand", { ...content.brand, tagline: e.target.value })} />
            </Field>
            <Field label="Initials (logo)">
              <Input value={content.brand.initials} onChange={(e) => update("brand", { ...content.brand, initials: e.target.value })} />
            </Field>
          </div>
          <SaveBtn busy={savingKey === "brand"} onClick={() => saveSection("brand", content.brand)} />
        </TabsContent>

        {/* HERO */}
        <TabsContent value="hero" className="space-y-3 pt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Badge text"><Input value={content.hero.badge} onChange={(e) => update("hero", { ...content.hero, badge: e.target.value })} /></Field>
            <Field label="CTA button text"><Input value={content.hero.cta_text} onChange={(e) => update("hero", { ...content.hero, cta_text: e.target.value })} /></Field>
            <Field label="Title (part 1)"><Input value={content.hero.title_1} onChange={(e) => update("hero", { ...content.hero, title_1: e.target.value })} /></Field>
            <Field label="Title (part 2 - highlighted)"><Input value={content.hero.title_2} onChange={(e) => update("hero", { ...content.hero, title_2: e.target.value })} /></Field>
          </div>
          <Field label="Subtitle">
            <Textarea rows={2} value={content.hero.subtitle} onChange={(e) => update("hero", { ...content.hero, subtitle: e.target.value })} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Price (৳)"><Input type="number" value={content.hero.price} onChange={(e) => update("hero", { ...content.hero, price: Number(e.target.value) })} /></Field>
            <Field label="Old price (৳)"><Input type="number" value={content.hero.old_price} onChange={(e) => update("hero", { ...content.hero, old_price: Number(e.target.value) })} /></Field>
            <Field label="Discount label"><Input value={content.hero.discount_label} onChange={(e) => update("hero", { ...content.hero, discount_label: e.target.value })} /></Field>
          </div>
          <Field label="Hero image">
            <ImagePicker
              value={content.hero.image_url}
              onChange={(url) => update("hero", { ...content.hero, image_url: url })}
            />
          </Field>
          <SaveBtn busy={savingKey === "hero"} onClick={() => saveSection("hero", content.hero)} />
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact" className="space-y-3 pt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Phone (dial)"><Input value={content.contact.phone} onChange={(e) => update("contact", { ...content.contact, phone: e.target.value })} /></Field>
            <Field label="Phone (display)"><Input value={content.contact.phone_display} onChange={(e) => update("contact", { ...content.contact, phone_display: e.target.value })} /></Field>
            <Field label="WhatsApp (with country code)"><Input value={content.contact.whatsapp} onChange={(e) => update("contact", { ...content.contact, whatsapp: e.target.value })} placeholder="8801..." /></Field>
          </div>
          <SaveBtn busy={savingKey === "contact"} onClick={() => saveSection("contact", content.contact)} />
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping" className="space-y-3 pt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Inside Dhaka label"><Input value={content.shipping.inside_label} onChange={(e) => update("shipping", { ...content.shipping, inside_label: e.target.value })} /></Field>
            <Field label="Inside Dhaka fee (৳)"><Input type="number" value={content.shipping.inside_fee} onChange={(e) => update("shipping", { ...content.shipping, inside_fee: Number(e.target.value) })} /></Field>
            <Field label="Outside Dhaka label"><Input value={content.shipping.outside_label} onChange={(e) => update("shipping", { ...content.shipping, outside_label: e.target.value })} /></Field>
            <Field label="Outside Dhaka fee (৳)"><Input type="number" value={content.shipping.outside_fee} onChange={(e) => update("shipping", { ...content.shipping, outside_fee: Number(e.target.value) })} /></Field>
          </div>
          <SaveBtn busy={savingKey === "shipping"} onClick={() => saveSection("shipping", content.shipping)} />
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features" className="space-y-3 pt-4">
          {content.features.map((f, i) => (
            <Card key={i} className="p-3 space-y-2">
              <div className="grid sm:grid-cols-[140px_1fr_auto] gap-2 items-end">
                <Field label="Icon">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={f.icon}
                    onChange={(e) => updateFeature(i, { ...f, icon: e.target.value })}
                  >
                    {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </Field>
                <Field label="Title">
                  <Input value={f.title} onChange={(e) => updateFeature(i, { ...f, title: e.target.value })} />
                </Field>
                <Button variant="destructive" size="icon" onClick={() => removeFeature(i)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <Field label="Description">
                <Textarea rows={2} value={f.desc} onChange={(e) => updateFeature(i, { ...f, desc: e.target.value })} />
              </Field>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => update("features", [...content.features, { icon: "Star", title: "নতুন ফিচার", desc: "" }])}>
              <Plus className="w-4 h-4 mr-1" /> ফিচার যোগ
            </Button>
            <SaveBtn busy={savingKey === "features"} onClick={() => saveSection("features", content.features)} />
          </div>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs" className="space-y-3 pt-4">
          {content.faqs.map((f, i) => (
            <Card key={i} className="p-3 space-y-2">
              <div className="flex gap-2 items-end">
                <Field label={`প্রশ্ন ${i + 1}`}>
                  <Input value={f.q} onChange={(e) => updateFaq(i, { ...f, q: e.target.value })} />
                </Field>
                <Button variant="destructive" size="icon" onClick={() => removeFaq(i)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <Field label="উত্তর">
                <Textarea rows={3} value={f.a} onChange={(e) => updateFaq(i, { ...f, a: e.target.value })} />
              </Field>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => update("faqs", [...content.faqs, { q: "নতুন প্রশ্ন", a: "" }])}>
              <Plus className="w-4 h-4 mr-1" /> FAQ যোগ
            </Button>
            <SaveBtn busy={savingKey === "faqs"} onClick={() => saveSection("faqs", content.faqs)} />
          </div>
        </TabsContent>

        {/* GALLERY */}
        <TabsContent value="gallery" className="space-y-3 pt-4">
          <p className="text-xs text-muted-foreground">কমপক্ষে ৩-৬টি image যোগ করুন। খালি থাকলে ডিফল্ট image দেখাবে।</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {content.gallery.images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => update("gallery", { images: content.gallery.images.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <ImagePicker
            value=""
            onChange={(url) => update("gallery", { images: [...content.gallery.images, url] })}
            buttonLabel="Gallery image যোগ করুন"
          />
          <SaveBtn busy={savingKey === "gallery"} onClick={() => saveSection("gallery", content.gallery)} />
        </TabsContent>
      </Tabs>
    </Card>
  );

  function updateFeature(i: number, f: Feature) {
    update("features", content.features.map((x, j) => (j === i ? f : x)));
  }
  function removeFeature(i: number) {
    update("features", content.features.filter((_, j) => j !== i));
  }
  function updateFaq(i: number, f: Faq) {
    update("faqs", content.faqs.map((x, j) => (j === i ? f : x)));
  }
  function removeFaq(i: number) {
    update("faqs", content.faqs.filter((_, j) => j !== i));
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SaveBtn({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
      সেভ
    </Button>
  );
}

function ImagePicker({
  value, onChange, buttonLabel = "Image upload",
}: { value: string; onChange: (url: string) => void; buttonLabel?: string }) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("site-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      setUploading(false);
      toast.error("Upload failed: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("site-images").getPublicUrl(path);
    setUploading(false);
    onChange(data.publicUrl);
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-2">
      {value && (
        <img src={value} alt="" className="w-32 h-32 object-cover rounded-lg border" />
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          {buttonLabel}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="অথবা image URL paste করুন"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (urlInput.trim()) {
                onChange(urlInput.trim());
                setUrlInput("");
                toast.success("URL set");
              }
            }}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
