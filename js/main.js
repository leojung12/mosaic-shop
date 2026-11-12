// 공통 스크립트 — 담당: 김민주 팀장

// 숫자 가격을 "18,000원" 형식으로 바꾼다.
function formatPrice(price) {
  return price.toLocaleString("ko-KR") + "원";
}

// id로 상품 하나를 찾는다. 없으면 undefined.
function findProductById(id) {
  return products.find(function (p) { return p.id === Number(id); });
}

// 주소의 ?id= 값을 읽는다. (product.html?id=1 → "1")
function getQueryId() {
  return new URLSearchParams(window.location.search).get("id");
}
