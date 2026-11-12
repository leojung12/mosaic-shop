// DB 행 타입 (supabase/migrations 와 맞춘다)
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  price: number;
  tint: string;
  tint_is_dark: boolean;
  cutout: string;
  cutout_w: number;
  cutout_h: number;
  images: string[];
  curator_note: string;
  size_w: number;
  size_d: number;
  size_h: number;
  weight_g: number;
  material: string;
  lead_min: number;
  lead_max: number;
  external_url: string | null;
  notice: Record<string, string>;
  sort_order: number;
  is_visible: boolean;
  sold_out: boolean;
  badge: string | null;
  category: string;
  field: string | null;
};

export type WaitlistRow = {
  id: number;
  product_id: string | null;
  contact: string;
  created_at: string;
  notified_at: string | null;
};

export type InquiryRow = {
  id: number;
  product_id: string | null;
  name: string;
  contact: string;
  body: string;
  answer: string | null;
  status: "open" | "answered" | "closed";
  created_at: string;
  answered_at: string | null;
  user_id: string | null;
};

export type ProfileRow = {
  id: string;
  name: string;
  phone: string;
  terms_version: string;
  terms_agreed_at: string;
  privacy_agreed_at: string;
  age_confirmed_at: string;
  marketing_email: boolean;
  marketing_sms: boolean;
  marketing_agreed_at: string | null;
  created_at: string;
};
