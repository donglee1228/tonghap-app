"use strict";

/* ===== Fallback 더미 데이터 (data.json fetch 실패 대비) ===== */
const FALLBACK_DATA = [
  {
    id: "d1", name: "초경량 방수 바람막이 자켓", category: "바람막이", gender: "공용",
    mall: "쿠팡", price: 29900, sizeRange: "S~3XL", sizeMax: "3XL", rating: 4.5,
    reviewSummary: "가볍고 비 와도 안 젖어요. 가성비 미쳤습니다.",
    caution: "정사이즈보다 살짝 크게 나와요. 한 치수 작게!",
    link: "https://www.coupang.com", image: ""
  },
  {
    id: "d2", name: "기능성 등산 아웃도어 팬츠", category: "아웃도어팬츠", gender: "남성",
    mall: "네이버", price: 39900, sizeRange: "M~2XL", sizeMax: "2XL", rating: 4.0,
    reviewSummary: "신축성 좋고 땀 잘 마름. 등산 갈 때 딱이에요.",
    caution: "", link: "https://shopping.naver.com", image: ""
  },
  {
    id: "d3", name: "빅사이즈 오버핏 후드 집업", category: "빅사이즈", gender: "공용",
    mall: "11번가", price: 24900, sizeRange: "L~4XL", sizeMax: "4XL", rating: 3.5,
    reviewSummary: "큰 사이즈도 넉넉해서 좋아요. 두께는 보통.",
    caution: "세탁 후 살짝 줄어든다는 후기 있음.",
    link: "https://www.11st.co.kr", image: ""
  },
  {
    id: "d4", name: "여성용 경량 바람막이 점퍼", category: "바람막이", gender: "여성",
    mall: "알리익스프레스", price: 18900, sizeRange: "S~XL", sizeMax: "XL", rating: 4.0,
    reviewSummary: "색감 예쁘고 가벼워요. 배송이 좀 느린 게 흠.",
    caution: "배송 2~3주 걸릴 수 있어요.",
    link: "https://www.aliexpress.com", image: ""
  }
];

/* ===== 쇼핑몰별 배지 색 ===== */
const MALL_COLORS = {
  "쿠팡": "#e8412c", "네이버": "#2db400", "11번가": "#ff0038",
  "G마켓": "#00a862", "옥션": "#cc1f2e", "알리익스프레스": "#ff4747", "테무": "#fb7701"
};
function mallColor(mall) {
  if (MALL_COLORS[mall]) return MALL_COLORS[mall];
  let h = 0;
  for (let i = 0; i < mall.length; i++) h = (h * 31 + mall.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

const CAT_ICON = { "바람막이": "🧥", "아웃도어팬츠": "👖", "빅사이즈": "👕" };
const CATEGORIES = [
  { key: "바람막이", emoji: "🧥", desc: "방풍·방수·환절기 아우터" },
  { key: "아웃도어팬츠", emoji: "👖", desc: "등산·트레킹·기능성 바지" },
  { key: "빅사이즈", emoji: "👕", desc: "넉넉하게 입는 큰 옷" }
];
const GENDERS = [
  { key: "남자", emoji: "👨", title: "남자 옷", desc: "남성 + 남녀공용" },
  { key: "여자", emoji: "👩", title: "여자 옷", desc: "여성 + 남녀공용" },
  { key: "전체", emoji: "🧑‍🤝‍🧑", title: "전체 보기", desc: "남녀공용 포함 전부" }
];

const PRICE_OPTS = { "전체": Infinity, "3만원 이하": 30000, "5만원 이하": 50000, "10만원 이하": 100000 };

/* ===== 상태 ===== */
let ALL = [];
const sel = { gender: null, category: null };
const filter = { price: "전체", malls: new Set(), sort: "종합별점순" };
let FAVS = loadFavs();

/* ===== DOM ===== */
const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const countEl = $("#count");

init();

async function init() {
  startBackground();
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no data.json");
    const json = await res.json();
    if (Array.isArray(json) && json.length) ALL = json;
    else throw new Error("empty");
  } catch (e) {
    ALL = FALLBACK_DATA;
  }
  buildGenderScreen();
  buildCategoryScreen();
  buildSheet();
  bindNav();
}

/* ===== 배경 실사 사진 10초 회전 ===== */
function startBackground() {
  const seeds = ["jacket1", "outdoor7", "mountain3", "fashion9", "forest5", "trail8", "autumn2", "hiking4"];
  const stage = $("#bg-stage");
  const slides = seeds.map((s) => {
    const div = document.createElement("div");
    div.className = "bg-slide";
    div.style.backgroundImage = `url(https://picsum.photos/seed/${s}/1200/2000)`;
    stage.appendChild(div);
    return div;
  });
  let idx = 0;
  slides[0].classList.add("show");
  setInterval(() => {
    slides[idx].classList.remove("show");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("show");
  }, 10000);
}

/* ===== 1단계: 성별 선택 화면 ===== */
function buildGenderScreen() {
  const box = $("#gender-choices");
  box.innerHTML = "";
  GENDERS.forEach((g) => {
    box.appendChild(choiceBtn(g.emoji, g.title, g.desc, () => {
      sel.gender = g.key;
      $("#crumb-gender").textContent = g.title;
      goTo("category");
    }));
  });
}

/* ===== 2단계: 종류 선택 화면 ===== */
function buildCategoryScreen() {
  const box = $("#category-choices");
  box.innerHTML = "";
  CATEGORIES.forEach((c) => {
    box.appendChild(choiceBtn(c.emoji, c.key, c.desc, () => {
      sel.category = c.key;
      openList();
    }));
  });
}

function choiceBtn(emoji, title, desc, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "choice-btn";
  btn.innerHTML = `
    <span class="choice-emoji" aria-hidden="true">${emoji}</span>
    <span class="choice-text"><b>${esc(title)}</b><span>${esc(desc)}</span></span>
    <span class="choice-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </span>`;
  btn.addEventListener("click", onClick);
  return btn;
}

/* ===== 화면 전환 ===== */
function goTo(step) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("#screen-" + step).classList.add("active");
  $("#fab-filter").hidden = (step !== "list");
  window.scrollTo(0, 0);
}

function bindNav() {
  $("#back-to-gender").addEventListener("click", () => goTo("gender"));
  $("#back-to-category").addEventListener("click", () => goTo("category"));

  $("#fab-filter").addEventListener("click", openSheet);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);
  $("#sheet-reset").addEventListener("click", () => {
    filter.price = "전체"; filter.malls = new Set(); filter.sort = "종합별점순";
    syncSheetUI();
  });
  $("#sheet-apply").addEventListener("click", () => { closeSheet(); render(); });
}

/* ===== 목록 열기 ===== */
function openList() {
  $("#list-title").textContent = `${genderTitle()} · ${sel.category}`;
  goTo("list");
  render();
}
function genderTitle() {
  const g = GENDERS.find((x) => x.key === sel.gender);
  return g ? g.title : "전체";
}

/* 선택 성별이 상품 gender와 맞는지 */
function genderMatch(p) {
  if (sel.gender === "전체") return true;
  if (sel.gender === "남자") return p.gender === "남성" || p.gender === "공용";
  if (sel.gender === "여자") return p.gender === "여성" || p.gender === "공용";
  return true;
}

/* ===== 종합 별점 계산 ===== */
/* 같은 category 안에서 가성비 점수 산출 → composite */
function computeComposite(list) {
  // category별 min/max 가격
  const byCat = {};
  list.forEach((p) => {
    const c = p.category;
    if (!byCat[c]) byCat[c] = { min: Infinity, max: -Infinity };
    const pr = Number(p.price) || 0;
    if (pr < byCat[c].min) byCat[c].min = pr;
    if (pr > byCat[c].max) byCat[c].max = pr;
  });
  list.forEach((p) => {
    const { min, max } = byCat[p.category];
    const pr = Number(p.price) || 0;
    let valueScore;
    if (max === min) valueScore = 5;
    else valueScore = 5 - 4 * ((pr - min) / (max - min)); // 5(최저가)~1(최고가)
    const rating = Math.max(0, Math.min(5, Number(p.rating) || 0));
    let comp = rating * 0.65 + valueScore * 0.35;
    comp = Math.round(comp * 2) / 2;          // 0.5 단위 반올림
    comp = Math.max(0, Math.min(5, comp));    // 클램프
    p._value = Math.round(valueScore * 10) / 10;
    p._composite = comp;
  });
}

/* ===== 필터/정렬 ===== */
function applyFilters() {
  // 1) 성별 + 종류로 1차 풀
  let pool = ALL.filter((p) => p.category === sel.category && genderMatch(p));
  // 2) 종합점수는 같은 category 기준으로 계산 (전체 category 풀 기준)
  const catAll = ALL.filter((p) => p.category === sel.category);
  computeComposite(catAll);

  // 3) 사용자 필터
  let list = pool.filter((p) => {
    if (Number(p.price) > PRICE_OPTS[filter.price]) return false;
    if (filter.malls.size && !filter.malls.has(p.mall)) return false;
    return true;
  });

  // 4) 정렬
  if (filter.sort === "가격낮은순") list.sort((a, b) => a.price - b.price);
  else if (filter.sort === "가격높은순") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => (b._composite || 0) - (a._composite || 0) || (b.rating || 0) - (a.rating || 0));

  return list;
}

/* ===== 렌더 ===== */
function render() {
  const list = applyFilters();
  countEl.innerHTML = `지금 <b>${list.length}</b>개 보고 있어요`;
  renderActiveFilters();
  $("#fab-filter").classList.toggle("dot", filterActive());

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <span class="emoji">🫥</span>
        <p>헉, 조건에 맞는 옷이 없네요.<br>필터를 좀 풀어볼까요?</p>
      </div>
      <footer class="footer"><p>옷싹 · 가격은 변동될 수 있어요. 구매 전 다시 확인해주세요 🙏</p></footer>`;
    return;
  }
  grid.innerHTML = list.map(cardHTML).join("") +
    `<footer class="footer"><p>옷싹 · 가격은 변동될 수 있어요. 구매 전 다시 확인해주세요 🙏</p></footer>`;
  bindHearts();
}

function renderActiveFilters() {
  const tags = [];
  if (filter.price !== "전체") tags.push("💸 " + filter.price);
  if (filter.malls.size) tags.push("🛒 " + Array.from(filter.malls).join(", "));
  tags.push("↕️ " + filter.sort);
  $("#active-filters").innerHTML = tags.map((t) => `<span class="af-tag">${esc(t)}</span>`).join("");
}
function filterActive() {
  return filter.price !== "전체" || filter.malls.size > 0 || filter.sort !== "종합별점순";
}

function genderClass(g) {
  if (g === "남성") return "male";
  if (g === "여성") return "female";
  return "uni";
}

function cardHTML(p) {
  const price = Number(p.price || 0).toLocaleString("ko-KR");
  const icon = CAT_ICON[p.category] || "👚";
  const img = p.image
    ? `<img class="card-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card-img placeholder',textContent:'${icon}'}))" />`
    : `<div class="card-img placeholder">${icon}</div>`;

  const mc = mallColor(p.mall || "");
  const caution = (p.caution && p.caution.trim()) ? `<div class="caution">${esc(p.caution)}</div>` : "";
  const faved = FAVS.has(p.id);

  return `
    <article class="card">
      <button class="heart-btn ${faved ? "on" : ""}" type="button" data-id="${esc(p.id)}" aria-label="찜하기" aria-pressed="${faved}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.2C.3 8.4 1.9 5 5.3 5c2 0 3.4 1.1 4.2 2.4C10.3 6.1 11.7 5 13.7 5c3.4 0 5 3.4 3.3 6.8C19.5 16.4 12 21 12 21z" fill="${faved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      </button>
      ${img}
      <div class="card-body">
        <div class="badges">
          <span class="badge gender ${genderClass(p.gender)}">${esc(p.gender || "")}</span>
          <span class="badge mall" style="background:${mc}">${esc(p.mall || "")}</span>
        </div>
        <h3 class="card-name">${esc(p.name || "")}</h3>
        <div class="price">${price}<small>원</small></div>
        <div class="size">제공 사이즈 · <b>${esc(p.sizeRange || "-")}</b></div>
        ${ratingHTML(p)}
        ${p.reviewSummary ? `<div class="review">${esc(p.reviewSummary)}</div>` : ""}
        ${caution}
        ${p.link ? `<a class="buy-btn" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h13l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7zM9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          구매하러 가기</a>` : ""}
      </div>
    </article>`;
}

function ratingHTML(p) {
  const comp = Math.max(0, Math.min(5, Number(p._composite) || 0));
  const pct = (comp / 5) * 100;
  const reviewR = (Number(p.rating) || 0).toFixed(1);
  const valueR = (Number(p._value) || 0).toFixed(1);
  return `
    <div class="rating">
      <span class="stars" aria-label="종합 별점 ${comp}점">
        <span class="base">★★★★★</span>
        <span class="fill" style="width:${pct}%">★★★★★</span>
      </span>
      <span class="rating-num">${comp.toFixed(1)}</span>
      <span class="rating-sub">리뷰 ${reviewR} · 가성비 ${valueR}</span>
    </div>`;
}

/* ===== 찜 (localStorage) ===== */
function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem("otssak_favs") || "[]")); }
  catch (e) { return new Set(); }
}
function saveFavs() {
  try { localStorage.setItem("otssak_favs", JSON.stringify(Array.from(FAVS))); } catch (e) {}
}
function bindHearts() {
  grid.querySelectorAll(".heart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const on = FAVS.has(id);
      if (on) FAVS.delete(id); else FAVS.add(id);
      btn.classList.toggle("on", !on);
      btn.setAttribute("aria-pressed", String(!on));
      const path = btn.querySelector("path");
      if (path) path.setAttribute("fill", !on ? "currentColor" : "none");
      saveFavs();
    });
  });
}

/* ===== 필터 시트 ===== */
function buildSheet() {
  makeChips("#opt-price", Object.keys(PRICE_OPTS), "price");
  const malls = Array.from(new Set(ALL.map((p) => p.mall).filter(Boolean)));
  makeChips("#opt-mall", malls, "mall");
  makeChips("#opt-sort", ["종합별점순", "가격낮은순", "가격높은순"], "sort");
}

function makeChips(containerSel, values, type) {
  const box = $(containerSel);
  box.innerHTML = "";
  values.forEach((val) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = val;
    chip.dataset.type = type;
    chip.dataset.val = val;
    chip.addEventListener("click", () => {
      if (type === "price") filter.price = val;
      else if (type === "sort") filter.sort = val;
      else if (type === "mall") {
        if (filter.malls.has(val)) filter.malls.delete(val);
        else filter.malls.add(val);
      }
      syncSheetUI();
    });
    box.appendChild(chip);
  });
}

function syncSheetUI() {
  document.querySelectorAll("#opt-price .chip").forEach((c) => c.classList.toggle("active", c.dataset.val === filter.price));
  document.querySelectorAll("#opt-sort .chip").forEach((c) => c.classList.toggle("active", c.dataset.val === filter.sort));
  document.querySelectorAll("#opt-mall .chip").forEach((c) => c.classList.toggle("active", filter.malls.has(c.dataset.val)));
}

function openSheet() {
  syncSheetUI();
  $("#sheet-backdrop").hidden = false;
  $("#filter-sheet").hidden = false;
}
function closeSheet() {
  $("#sheet-backdrop").hidden = true;
  $("#filter-sheet").hidden = true;
}

/* ===== util ===== */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
