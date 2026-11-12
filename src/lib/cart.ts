"use client";

import { useSyncExternalStore } from "react";

// 장바구니 (브라우저 localStorage). 가격·품절은 주문할 때 서버가 DB 기준으로 다시 확인하므로
// 여기 값은 화면 표시용이다.
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  color: string;
  price: number;
  cutout: string;
  quantity: number;
};

const KEY = "mosaic-cart";
const MAX_QTY = 20;
const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v : [];
  } catch {
    cache = [];
  }
  return cache;
}
function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const items = read();
    const found = items.find((i) => i.productId === item.productId);
    write(
      found
        ? items.map((i) =>
            i.productId === item.productId ? { ...item, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
          )
        : [...items, { ...item, quantity: Math.min(MAX_QTY, quantity) }],
    );
  },
  setQuantity(productId: string, quantity: number) {
    write(
      read()
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(MAX_QTY, quantity)) } : i))
        .filter((i) => i.quantity > 0),
    );
  },
  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },
  clear() {
    write([]);
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  // 다른 탭에서 바뀐 것도 반영
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);

// 장바구니 서랍 열기 (헤더 Bag 버튼, 담기 버튼에서)
export const openBag = () => window.dispatchEvent(new Event("mosaic:open-bag"));
