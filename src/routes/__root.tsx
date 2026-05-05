import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vegetable Push Chopper - মাত্র ৫৮০ টাকা | Cash on Delivery" },
      { name: "description", content: "ভেজিটেবল পুষ চাপার - এক চাপেই নিখুঁত সবজি কাটুন। ৩টি স্টেইনলেস স্টিল ব্লেড। মাত্র ৫৮০ টাকা। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।" },
      { property: "og:title", content: "Vegetable Push Chopper - মাত্র ৫৮০ টাকা | Cash on Delivery" },
      { property: "og:description", content: "ভেজিটেবল পুষ চাপার - এক চাপেই নিখুঁত সবজি কাটুন। ৩টি স্টেইনলেস স্টিল ব্লেড। মাত্র ৫৮০ টাকা। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Vegetable Push Chopper - মাত্র ৫৮০ টাকা | Cash on Delivery" },
      { name: "twitter:description", content: "ভেজিটেবল পুষ চাপার - এক চাপেই নিখুঁত সবজি কাটুন। ৩টি স্টেইনলেস স্টিল ব্লেড। মাত্র ৫৮০ টাকা। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a5d7f0c8-df91-4933-9ce2-22a054dfd114" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a5d7f0c8-df91-4933-9ce2-22a054dfd114" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
