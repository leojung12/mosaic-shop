import Image from "next/image";
import { ViewTransition } from "react";
import { objectName } from "@/lib/motion";
import type { Product } from "@/types/product";

// 누끼 원본 비율 그대로의 상자. 홈 오브제와 같은 이름·같은 비율이라 페이지를 옮길 때 그대로 날아와 맞춰진다.
export default function ObjectFrame({
  product,
  sizes,
  preload,
  morph = true,
}: {
  product: Product;
  sizes: string;
  preload?: boolean;
  morph?: boolean; // 같은 상품이 한 화면에 두 번 나오면 하나만 전환 이름을 가진다
}) {
  const { w, h } = product.cutoutSize;
  const wide = w >= h;
  const box = (
      <div
        className="relative max-h-full max-w-full"
        style={{ aspectRatio: `${w} / ${h}`, width: wide ? "100%" : "auto", height: wide ? "auto" : "100%" }}
      >
        <Image
          src={product.cutout}
          alt={`${product.name} — ${product.color}`}
          fill
          sizes={sizes}
          quality={90}
          preload={preload}
          className="object-contain object-bottom"
        />
      </div>
  );
  if (!morph) return box;
  return (
    <ViewTransition name={objectName(product.slug)} share="morph" default="none">
      {box}
    </ViewTransition>
  );
}
