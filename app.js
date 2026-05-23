"use strict";

/* ===== Fallback 더미 데이터 (data.json fetch 실패 대비) ===== */
const FALLBACK_DATA = [
  {
    id: "d1",
    name: "초경량 방수 바람막이 자켓",
    category: "바람막이",
    gender: "공용",
    mall: "쿠팡",
    price: 29900,
    sizeRange: "S~3XL",
    sizeMax: "3XL",
    rating: 4.5,
    reviewSummary: "가볍고 비 와도 안 젖어요. 가성비 미쳤습니다.",
    caution: "정사이즈보다 살짝 크게 나와요. 한 치수 작게!",
    link: "https://www.coupang.com",
    image: ""
  },
  {
    id: "d2",
    name: "기능성 등산 아웃도어 팬츠",
    category: "아웃도어팬츠",
    gender: "남성",
    mall: "네이버",
    price: 39900,
    sizeRange: "M~2XL",
    sizeMax: "2XL",
    rating: 4.0,
    reviewSummary: "신축성 좋고 땀 잘 마름. 등산 갈 때 딱이에요.",
    caution: "",
    link: "https://shopping.naver.com",
    image: ""
  },
  {
    id: "d3",
    name: "빅사이즈 오버핏 후드 집업",
    category: "빅사이즈",
    gender: "공용",
    mall: "11번가",
    price: 24900,
    sizeRange: "L~4XL",
    sizeMax: "4XL",
    rating: 3.5,
    reviewSummary: "큰 사이즈도 넉넉해서 좋아요. 두께는 보통.",
    caution: "세탁 후 살짝 줄어든다는 후기 있음.",
    link: "https://www.11st.co.kr",
    image: ""
  },
  {
    id: "d4",
    name: "여성용 경량 바람막이 점퍼",
    category: "바람막이",
    gender: "여성",
    mall: "알리익스프레스",
    price: 18900,
    sizeRange: "S~XL",
    sizeMax: "XL",
    rating: 4.0,
    reviewSummary: "색감 예쁘고 가벼워요. 배송이 좀 느린 게 흠.",
    caution: "배송 2~3주 걸릴 수 있어요.",
    link: "https://www.aliexpress.com",
    image: ""
  }
];

/* ===== 쇼핑몰별 배지 색 ===== */
const MALL_COLORS = {
  "쿠팡": "#e8412c",
  "네이버": "#2db400",
  "11번가": "#ff0038",
  "G마켓": "#00a862",
  "옥션": "#cc1f2e",
  "알리익스프레스": "#ff4747",
  "테무": "#fb7701"
};
function mallColor(mall) {
  if (MALL_COLORS[mall]) return MALL_COLORS[mall];
  // 이름 기반 안정적 색상 fallback
  let h = 0;
  for (let i = 0; i < mall.length; i++) h = (h * 31 + mall.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

const CAT_ICON = {
  "바람막이": "🧥",
  "아웃도어팬츠": "👖",
  "빅사이즈": "👕"
};

/* ===== 상태 ===== */
let ALL = [];
const state = {
  category: "전체",
  gender: "전체",
  price: "전체",
  mall: "전체",
  sort: "별점높은순",
  q: ""
};

const PRICE_OPTS = {
  "전체": Infinity,
  "3만원 이하": 30000,
  "5만원 이하": 50000,
  "10만원 이하": 100000
};

/* ===== DOM ===== */
const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const countEl = $("#count");

/* ===== 초기화 ===== */
init();

async function init() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no data.json");
    const json = await res.json();
    if (Array.isArray(json) && json.length) {
      ALL = json;
    } else {
      throw new Error("empty");
    }
  } catch (e) {
    ALL = FALLBACK_DATA;
  }
  buildFilters();
  bindEvents();
  render();
}

/* ===== 필터 칩 생성 ===== */
function buildFilters() {
  makeChips("#filter-category", ["전체", "바람막이", "아웃도어팬츠", "빅사이즈"], "category");
  makeChips("#filter-gender", ["전체", "남성", "여성", "공용"], "gender");
  makeChips("#filter-price", ["전체", "3만원 이하", "5만원 이하", "10만원 이하"], "price");

  const malls = ["전체", ...Array.from(new Set(ALL.map((p) => p.mall).filter(Boolean)))];
  makeChips("#filter-mall", malls, "mall");

  makeChips("#filter-sort", ["별점높은순", "가격낮은순", "가격높은순"], "sort");
}

function makeChips(containerSel, values, key) {
  const box = $(containerSel);
  box.innerHTML = "";
  values.forEach((val) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (state[key] === val ? " active" : "");
    chip.textContent = val;
    chip.dataset.key = key;
    chip.dataset.val = val;
    chip.addEventListener("click", () => {
      state[key] = val;
      box.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      render();
    });
    box.appendChild(chip);
  });
}

function bindEvents() {
  $("#search").addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  $("#reset").addEventListener("click", () => {
    state.category = "전체";
    state.gender = "전체";
    state.price = "전체";
    state.mall = "전체";
    state.sort = "별점높은순";
    state.q = "";
    $("#search").value = "";
    document.querySelectorAll(".chips").forEach((box) => {
      box.querySelectorAll(".chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.val === state[c.dataset.key]);
      });
    });
    render();
  });
}

/* ===== 필터/정렬 적용 ===== */
function applyFilters() {
  let list = ALL.filter((p) => {
    if (state.category !== "전체" && p.category !== state.category) return false;
    if (state.gender !== "전체" && p.gender !== state.gender) return false;
    if (state.mall !== "전체" && p.mall !== state.mall) return false;
    if (Number(p.price) > PRICE_OPTS[state.price]) return false;
    if (state.q && !(p.name || "").toLowerCase().includes(state.q)) return false;
    return true;
  });

  if (state.sort === "가격낮은순") list.sort((a, b) => a.price - b.price);
  else if (state.sort === "가격높은순") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // 별점높은순 기본

  return list;
}

/* ===== 렌더 ===== */
function render() {
  const list = applyFilters();
  countEl.innerHTML = `지금 <b>${list.length}</b>개 보고 있어요`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <span class="emoji">🫥</span>
        <p>헉, 조건에 맞는 옷이 없어요.<br>필터 좀 풀어볼까요?</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(cardHTML).join("");
}

function cardHTML(p) {
  const price = Number(p.price || 0).toLocaleString("ko-KR");
  const img = p.image
    ? `<img class="card-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card-img placeholder',textContent:'${CAT_ICON[p.category] || "👚"}'}))" />`
    : `<div class="card-img placeholder">${CAT_ICON[p.category] || "👚"}</div>`;

  const mc = mallColor(p.mall || "");
  const caution = (p.caution && p.caution.trim())
    ? `<div class="caution">${esc(p.caution)}</div>`
    : "";

  return `
    <article class="card">
      ${img}
      <div class="card-body">
        <div class="badges">
          <span class="badge cat">${esc(p.category || "")}</span>
          <span class="badge gender">${esc(p.gender || "")}</span>
          <span class="badge mall" style="background:${mc}">${esc(p.mall || "")}</span>
        </div>
        <h2 class="card-name">${esc(p.name || "")}</h2>
        <div class="price">${price}<small>원</small></div>
        <div class="size">제공 사이즈 · <b>${esc(p.sizeRange || "-")}</b></div>
        ${ratingHTML(p.rating)}
        ${p.reviewSummary ? `<div class="review">${esc(p.reviewSummary)}</div>` : ""}
        ${caution}
        ${p.link ? `<a class="buy-btn" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">구매하러 가기</a>` : ""}
      </div>
    </article>`;
}

function ratingHTML(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const pct = (r / 5) * 100;
  return `
    <div class="rating">
      <span class="stars" aria-label="별점 ${r}점">
        <span class="base">★★★★★</span>
        <span class="fill" style="width:${pct}%">★★★★★</span>
      </span>
      <span class="rating-num">${r.toFixed(1)}</span>
    </div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
