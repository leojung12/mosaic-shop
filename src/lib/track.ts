// 방문·호버·클릭 기록. sendBeacon으로 보내서 페이지 이동을 막지 않는다.
// 방문자 id는 이 브라우저에만 저장되는 무작위 값 (개인정보 아님).
type EventType = "view" | "hover" | "click";

function visitorId() {
  try {
    let id = localStorage.getItem("objet-visitor");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("objet-visitor", id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track(type: EventType, productId: string) {
  const body = JSON.stringify({ type, productId, visitor: visitorId() });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

// 같은 세션에서 같은 상품 호버는 한 번만 센다
export function trackOnce(type: EventType, productId: string) {
  const key = `objet-${type}-${productId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  track(type, productId);
}
