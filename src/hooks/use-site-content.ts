import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Feature = { icon: string; title: string; desc: string };
export type Faq = { q: string; a: string };

export type SiteContent = {
  topbar: { text: string };
  brand: { name: string; tagline: string; initials: string };
  hero: {
    badge: string;
    title_1: string;
    title_2: string;
    subtitle: string;
    price: number;
    old_price: number;
    discount_label: string;
    cta_text: string;
    image_url: string;
  };
  contact: { phone: string; whatsapp: string; phone_display: string };
  shipping: {
    inside_fee: number;
    outside_fee: number;
    inside_label: string;
    outside_label: string;
  };
  features: Feature[];
  faqs: Faq[];
  gallery: { images: string[] };
};

export const DEFAULT_CONTENT: SiteContent = {
  topbar: { text: "সীমিত স্টক! ক্যাশ অন ডেলিভারি সারা বাংলাদেশে" },
  brand: { name: "GadgetZone360", tagline: "Smart Kitchen Store", initials: "GZ" },
  hero: {
    badge: "বেস্ট সেলিং প্রোডাক্ট",
    title_1: "Vegetable",
    title_2: "Push Chopper",
    subtitle: "এক চাপেই নিখুঁত সবজি কাটুন — দ্রুত, সহজ ও নিরাপদ।",
    price: 580,
    old_price: 750,
    discount_label: "২৩% ছাড়",
    cta_text: "আজই অর্ডার করুন",
    image_url: "",
  },
  contact: { phone: "01610356653", whatsapp: "8801610356653", phone_display: "01610-356653" },
  shipping: { inside_fee: 70, outside_fee: 130, inside_label: "ঢাকার ভিতরে", outside_label: "ঢাকার বাইরে" },
  features: [],
  faqs: [],
  gallery: { images: [] },
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("site_content").select("key,value");
      if (!mounted || !data) {
        setLoaded(true);
        return;
      }
      const merged: any = { ...DEFAULT_CONTENT };
      for (const row of data) {
        merged[row.key] = row.value;
      }
      setContent(merged as SiteContent);
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { content, loaded };
}
