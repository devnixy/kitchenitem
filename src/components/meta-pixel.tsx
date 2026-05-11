import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    __metaPixelId?: string;
    __metaTestEventCode?: string;
  }
}

let initialized = false;

async function loadConfig() {
  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ["meta_pixel_id", "meta_test_event_code"]);
  const map: Record<string, string> = {};
  (data ?? []).forEach((r) => {
    if (r.key) map[r.key] = r.value ?? "";
  });
  return {
    pixelId: map.meta_pixel_id ?? "",
    testCode: map.meta_test_event_code ?? "",
  };
}

function injectPixelScript(pixelId: string) {
  if (typeof window === "undefined") return;
  if (window.fbq) return;
  // Standard Meta Pixel base code
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  (window.fbq as ((...args: unknown[]) => void) | undefined)?.("init", pixelId);
  (window.fbq as ((...args: unknown[]) => void) | undefined)?.("track", "PageView");
}

export function MetaPixelLoader() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    loadConfig().then(({ pixelId, testCode }) => {
      if (!pixelId) return;
      window.__metaPixelId = pixelId;
      window.__metaTestEventCode = testCode;
      injectPixelScript(pixelId);
    });
  }, []);
  return null;
}

export async function trackMetaEvent(
  eventName: string,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  // Lazy-load config if MetaPixelLoader hasn't run yet (e.g. admin page)
  if (!window.__metaPixelId) {
    const { pixelId, testCode } = await loadConfig();
    if (!pixelId) return;
    window.__metaPixelId = pixelId;
    window.__metaTestEventCode = testCode;
    injectPixelScript(pixelId);
  }
  const opts: Record<string, unknown> = {};
  if (window.__metaTestEventCode) opts.test_event_code = window.__metaTestEventCode;
  try {
    (window.fbq as ((...args: unknown[]) => void) | undefined)?.(
      "track",
      eventName,
      params,
      opts,
    );
  } catch {
    // Ignore pixel errors
  }
}
