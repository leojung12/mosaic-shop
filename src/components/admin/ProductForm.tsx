"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { AdminField, adminButton, adminInput } from "@/components/admin/ui";
import { CATEGORIES } from "@/config/categories";
import { browserClient } from "@/lib/supabase/browser";
import type { ProductRow } from "@/lib/supabase/types";
import { isDarkHex } from "@/lib/tint";

const NOTICE_KEYS = [
  "품명 및 모델명",
  "재질",
  "구성품",
  "크기",
  "제조자/수입자",
  "제조국",
  "품질보증기준",
  "A/S 책임자와 전화번호",
];

// Supabase Storage(products 버킷)에 올리고 공개 URL을 돌려준다
async function upload(file: File, slug: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const path = `${slug || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const supabase = browserClient();
  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
}

export default function ProductForm({ product: p }: { product: ProductRow | null }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const [slug, setSlug] = useState(p?.slug ?? "");
  const [tint, setTint] = useState(p?.tint ?? "#CFC3AE");
  const [tintIsDark, setTintIsDark] = useState(p?.tint_is_dark ?? false);
  const [cutout, setCutout] = useState({ url: p?.cutout ?? "", w: p?.cutout_w ?? 0, h: p?.cutout_h ?? 0 });
  const [images, setImages] = useState<string[]>(p?.images ?? []);
  const [notice, setNotice] = useState<Record<string, string>>(
    Object.fromEntries(NOTICE_KEYS.map((k) => [k, p?.notice?.[k] ?? ""])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const onCutout = async (file?: File) => {
    if (!file) return;
    setBusy("누끼 올리는 중…");
    try {
      const bmp = await createImageBitmap(file);
      const url = await upload(file, slug);
      setCutout({ url, w: bmp.width, h: bmp.height });
    } catch (e) {
      alertLike(e);
    } finally {
      setBusy(null);
    }
  };
  const onImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("이미지 올리는 중…");
    try {
      const urls = await Promise.all([...files].map((f) => upload(f, slug)));
      setImages((prev) => [...prev, ...urls].slice(0, 4));
    } catch (e) {
      alertLike(e);
    } finally {
      setBusy(null);
    }
  };
  const alertLike = (e: unknown) =>
    setBusy(`업로드 실패: ${e instanceof Error ? e.message : String(e)}`);

  return (
    <form action={action} className="grid max-w-5xl gap-10 md:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <input type="hidden" name="cutout" value={cutout.url} />
      <input type="hidden" name="cutout_w" value={cutout.w} />
      <input type="hidden" name="cutout_h" value={cutout.h} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="notice" value={JSON.stringify(notice)} />

      <div className="space-y-8">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Name" name="name" required defaultValue={p?.name} placeholder="HALO VASE" />
            <AdminField label="Color" name="color" required defaultValue={p?.color} placeholder="SAND" />
            <AdminField
              label="Slug (URL)"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="halo-vase-sand"
              hint="영문 소문자·숫자·하이픈"
            />
            <AdminField label="Price (₩)" name="price" type="number" min={0} required defaultValue={p?.price} />
          </div>
          <label className="block space-y-1">
            <span className="label text-muted">Curator note</span>
            <textarea
              name="curator_note"
              defaultValue={p?.curator_note}
              rows={3}
              className={adminInput}
              placeholder="왜 골랐는지 2~3줄"
            />
          </label>
        </Section>

        <Section title="Size · material · shipping">
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminField label="W (cm)" name="size_w" type="number" step="0.1" min="0.1" required defaultValue={p?.size_w} />
            <AdminField label="D (cm)" name="size_d" type="number" step="0.1" min="0.1" required defaultValue={p?.size_d} />
            <AdminField
              label="H (cm)"
              name="size_h"
              type="number"
              step="0.1"
              min="0.1"
              required
              defaultValue={p?.size_h}
              hint="홈 화면 크기가 이 높이에 비례합니다"
            />
            <AdminField label="Weight (g)" name="weight_g" type="number" min={0} defaultValue={p?.weight_g ?? 0} />
            <AdminField label="Material" name="material" defaultValue={p?.material} placeholder="세라믹" />
            <div className="grid grid-cols-2 gap-2">
              <AdminField label="Lead min" name="lead_min" type="number" min={0} defaultValue={p?.lead_min ?? 2} />
              <AdminField label="Lead max" name="lead_max" type="number" min={0} defaultValue={p?.lead_max ?? 5} />
            </div>
          </div>
          <AdminField
            label="External URL"
            name="external_url"
            type="url"
            pattern="https://.*"
            defaultValue={p?.external_url ?? ""}
            placeholder="https://smartstore.naver.com/..."
            hint="CHECKOUT_MODE='external'일 때 BUY 버튼이 이 주소로 이동합니다"
          />
        </Section>

        <Section title="상품정보제공고시">
          <div className="grid gap-3 sm:grid-cols-2">
            {NOTICE_KEYS.map((k) => (
              <AdminField
                key={k}
                label={k}
                value={notice[k]}
                onChange={(e) => setNotice((n) => ({ ...n, [k]: e.target.value }))}
              />
            ))}
          </div>
        </Section>
      </div>

      <aside className="space-y-8">
        <Section title="Cutout (home)">
          <div
            className="relative grid aspect-square place-items-center transition-colors"
            style={{ background: tint }}
          >
            {cutout.url ? (
              <Image src={cutout.url} alt="" fill sizes="320px" className="object-contain p-6" />
            ) : (
              <span className="label text-muted">No image</span>
            )}
          </div>
          <input
            type="file"
            accept="image/webp,image/png"
            onChange={(e) => onCutout(e.target.files?.[0])}
            className="text-[12px]"
          />
          <p className="text-[12px] text-muted">
            투명 배경, 여백 없이 크롭한 WebP/PNG. scripts/prepare-product-image.py로 만들면 됩니다.
            {cutout.w > 0 && ` (${cutout.w}×${cutout.h}px)`}
          </p>
        </Section>

        <Section title="Tint (hover background)">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={tint}
              onChange={(e) => {
                setTint(e.target.value.toUpperCase());
                setTintIsDark(isDarkHex(e.target.value));
              }}
              className="h-10 w-14 cursor-pointer border border-ink/15 bg-transparent"
            />
            <input
              name="tint"
              value={tint}
              onChange={(e) => setTint(e.target.value)}
              pattern="#[0-9a-fA-F]{6}"
              required
              className={adminInput}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              name="tint_is_dark"
              checked={tintIsDark}
              onChange={(e) => setTintIsDark(e.target.checked)}
            />
            어두운 배경 (글자를 밝게)
          </label>
          <p className="text-[12px] text-muted">제품 대표색보다 채도·명도를 낮춘 톤으로.</p>
        </Section>

        <Section title="Detail images (max 4)">
          <ul className="grid grid-cols-4 gap-2">
            {images.map((src) => (
              <li key={src} className="relative aspect-square bg-white/60">
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
                <button
                  type="button"
                  onClick={() => setImages((list) => list.filter((s) => s !== src))}
                  className="label absolute top-0 right-0 bg-bg px-1"
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <input
            type="file"
            accept="image/webp,image/png,image/jpeg"
            multiple
            onChange={(e) => onImages(e.target.files)}
            className="text-[12px]"
          />
        </Section>

        <Section title="Display">
          <label className="block space-y-1">
            <span className="label text-muted">Category</span>
            <select name="category" defaultValue={p?.category ?? "object"} className={adminInput}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label} · {c.ko}
                </option>
              ))}
            </select>
          </label>
          <AdminField label="Order" name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} />
          <AdminField label="Field color" hint="홈 패널·상세 페이지 배경색 (#RRGGBB). 오브제와 대비되는 강한 색. 비우면 Tint" name="field" pattern="#[0-9a-fA-F]{6}" defaultValue={p?.field ?? ""} />
          <AdminField label="Sticker" hint="홈 오브제에 붙는 원형 스티커. NEW, PICK 등 12자 이내, 비우면 없음" name="badge" maxLength={12} defaultValue={p?.badge ?? ""} />
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="is_visible" defaultChecked={p?.is_visible ?? true} /> 사이트에 노출
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="sold_out" defaultChecked={p?.sold_out ?? false} /> 품절
          </label>
        </Section>

        <div className="space-y-2">
          <button disabled={pending || !!busy?.endsWith("…")} className={`${adminButton} w-full py-3`}>
            {pending ? "Saving…" : "Save"}
          </button>
          {busy && <p className="text-[12px]">{busy}</p>}
          {state && <p className="text-[13px]">{state.message}</p>}
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="label border-b border-ink/15 pb-2 text-muted">{title}</h2>
      {children}
    </section>
  );
}
