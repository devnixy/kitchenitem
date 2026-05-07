import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function GtmLoader() {
  const [gtmId, setGtmId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gtm_id")
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data?.value) setGtmId(data.value);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!gtmId) return;
    if (document.getElementById("gtm-script")) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }, [gtmId]);

  return null;
}
