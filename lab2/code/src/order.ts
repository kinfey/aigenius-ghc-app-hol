import { useEffect, useState } from "react";

export type MenuProduct = { id: string; name: string; price: number; icon: string };
export type Draft = {
  version: 1;
  counts: Record<string, number>;
  method: "pickup" | "delivery";
  store: string;
  address: string;
  coupon: "none" | "save5";
  status: "draft" | "confirmed" | "payment-demo";
};

export const STORAGE_KEY = "workshop-order-v1";
export const STORES = ["示例门店 A", "示例门店 B"];
export const ADDRESSES = ["示例路 100 号（虚构）", "演示街 20 号（虚构）"];
const productIds = ["burger", "chicken", "fries", "drink", "coffee", "sundae"];
export const initialDraft = (): Draft => ({
  version: 1, counts: {}, method: "pickup", store: "", address: "", coupon: "none", status: "draft",
});

export function parseDraft(raw: string): Draft {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("草稿格式无效。");
  const d = value as Record<string, unknown>;
  if (d.version !== 1 || !d.counts || typeof d.counts !== "object" || Array.isArray(d.counts)
    || typeof d.method !== "string" || typeof d.store !== "string" || typeof d.address !== "string"
    || typeof d.coupon !== "string" || typeof d.status !== "string"
    || !["pickup", "delivery"].includes(String(d.method))
    || !["", ...STORES].includes(String(d.store))
    || !["", ...ADDRESSES].includes(String(d.address))
    || !["none", "save5"].includes(String(d.coupon))
    || !["draft", "confirmed", "payment-demo"].includes(String(d.status))) {
    throw new Error("保存的草稿无效，请重置草稿。");
  }
  const counts: Record<string, number> = {};
  for (const [id, quantity] of Object.entries(d.counts)) {
    if (!productIds.includes(id) || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
      throw new Error("保存的餐品数量无效，请重置草稿。");
    }
    counts[id] = quantity;
  }
  return {
    version: 1, counts, method: d.method as Draft["method"], store: String(d.store),
    address: String(d.address), coupon: d.coupon as Draft["coupon"], status: d.status as Draft["status"],
  };
}

export function priceOrder(draft: Draft, products: MenuProduct[]) {
  const count = products.reduce((sum, p) => sum + (draft.counts[p.id] || 0), 0);
  const subtotal = products.reduce((sum, p) => sum + Math.round(p.price * 100) * (draft.counts[p.id] || 0), 0);
  const discount = draft.coupon === "save5" && subtotal >= 5000 ? 500 : 0;
  const delivery = draft.method === "delivery" && count > 0 ? 600 : 0;
  return { count, subtotal, discount, delivery, total: subtotal - discount + delivery };
}

export function orderErrors(draft: Draft, products: MenuProduct[]): string[] {
  const errors: string[] = [];
  if (!priceOrder(draft, products).count) errors.push("请先添加餐品。");
  if (!STORES.includes(draft.store)) errors.push("请选择模拟门店。");
  if (draft.method === "delivery" && !ADDRESSES.includes(draft.address)) errors.push("配送需要选择虚构地址。");
  if (Object.keys(draft.counts).some((id) => draft.counts[id] > 0 && !products.some((p) => p.id === id))) {
    errors.push("部分餐品已不可用，请重置草稿后重新选餐。");
  }
  return errors;
}

export const money = (cents: number) => `¥${(cents / 100).toFixed(2)}`;

export function useOrderDraft() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [storageError, setStorageError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft(parseDraft(saved));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "无法读取草稿。");
    }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      try {
        setDraft(event.newValue ? parseDraft(event.newValue) : initialDraft());
        setStorageError("");
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : "无法同步草稿。");
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function save(next: Draft) {
    setDraft(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("草稿保存失败，刷新后可能丢失。请检查浏览器存储权限。");
    }
  }
  return { draft, save, storageError, ready };
}
