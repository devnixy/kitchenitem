-- site_content table
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site content"
  ON public.site_content FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults
INSERT INTO public.site_content (key, value) VALUES
('topbar', '{"text":"সীমিত স্টক! ক্যাশ অন ডেলিভারি সারা বাংলাদেশে"}'::jsonb),
('brand', '{"name":"GadgetZone360","tagline":"Smart Kitchen Store","initials":"GZ"}'::jsonb),
('hero', '{"badge":"বেস্ট সেলিং প্রোডাক্ট","title_1":"Vegetable","title_2":"Push Chopper","subtitle":"এক চাপেই নিখুঁত সবজি কাটুন — দ্রুত, সহজ ও নিরাপদ।","price":580,"old_price":750,"discount_label":"২৩% ছাড়","cta_text":"আজই অর্ডার করুন","image_url":""}'::jsonb),
('contact', '{"phone":"01610356653","whatsapp":"8801610356653","phone_display":"01610-356653"}'::jsonb),
('shipping', '{"inside_fee":70,"outside_fee":130,"inside_label":"ঢাকার ভিতরে","outside_label":"ঢাকার বাইরে"}'::jsonb),
('features', '[
  {"icon":"Zap","title":"এক চাপেই নিখুঁত কাট","desc":"সেকেন্ডেই পেঁয়াজ, রসুন, মরিচ, সবজি কেটে নিন।"},
  {"icon":"Shield","title":"৩টি স্টেইনলেস স্টিল ব্লেড","desc":"সুপার শার্প ও দীর্ঘস্থায়ী ব্লেড।"},
  {"icon":"Check","title":"স্মার্ট লক সিস্টেম","desc":"নিরাপদ ব্যবহারের জন্য সেফটি লক।"},
  {"icon":"Truck","title":"ক্যাশ অন ডেলিভারি","desc":"পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।"},
  {"icon":"Clock","title":"সময় বাঁচান","desc":"রান্নার প্রস্তুতি ১০ গুণ দ্রুত করুন।"},
  {"icon":"Star","title":"মজবুত ও দীর্ঘস্থায়ী","desc":"প্রিমিয়াম BPA-free প্লাস্টিক বডি।"}
]'::jsonb),
('faqs', '[
  {"q":"ঢাকার ভিতরে ডেলিভারি চার্জ কত?","a":"ঢাকার ভিতরে ডেলিভারি চার্জ মাত্র ৭০৳। অর্ডার কনফার্ম করার ২৪ ঘন্টার মধ্যে আপনার পণ্য পৌঁছে যাবে।"},
  {"q":"ঢাকার বাইরে ডেলিভারি চার্জ ও সময় কত?","a":"ঢাকার বাইরে সারা বাংলাদেশে ডেলিভারি চার্জ ১৩০৳। কুরিয়ার সার্ভিসের মাধ্যমে ৪৮-৭২ ঘন্টার মধ্যে পণ্য পৌঁছে যাবে।"},
  {"q":"ক্যাশ অন ডেলিভারি (COD) কি আছে?","a":"হ্যাঁ, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।"},
  {"q":"ডেলিভারির আগে পণ্য চেক করা যাবে?","a":"অবশ্যই। ডেলিভারিম্যানের সামনে বক্স খুলে পণ্য দেখে, চেক করে তারপর টাকা পরিশোধ করতে পারবেন।"},
  {"q":"অর্ডার কীভাবে দিব?","a":"নিচের অর্ডার ফর্মে নাম, ঠিকানা ও মোবাইল নম্বর দিয়ে কনফার্ম বাটনে ক্লিক করুন।"}
]'::jsonb),
('gallery', '{"images":[]}'::jsonb);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true);

CREATE POLICY "Public can view site images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));