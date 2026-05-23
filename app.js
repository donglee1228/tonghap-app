"use strict";

/* ===== Fallback 더미 데이터 (data.json fetch 실패 대비 · 각 그룹 대표 · 이미지 있는 것만) ===== */
const FALLBACK_DATA = [
  {
    id: "d1", name: "초경량 방수 바람막이 자켓", gender: "남성", sizeClass: "일반",
    garmentType: "바람막이", type: "아우터", mall: "쿠팡", price: 29900,
    sizeRange: "S~XL", sizeMax: "XL", chest: null, waist: null, length: null,
    fitMinKg: null, fitMaxKg: null, fitText: null, rating: 4.5,
    reviewSummary: "가볍고 비 와도 안 젖어요. 가성비 미쳤습니다.",
    caution: "정사이즈보다 살짝 크게 나와요. 한 치수 작게!",
    link: "https://www.coupang.com",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3"
  },
  {
    id: "d2", name: "남성 빅사이즈 무지 반팔 티셔츠 (~6XL)", gender: "남성", sizeClass: "빅사이즈",
    garmentType: "티셔츠", type: "상의", mall: "네이버", price: 14900,
    sizeRange: "L~6XL", sizeMax: "6XL", chest: 138, waist: null, length: 80,
    fitMinKg: 100, fitMaxKg: 150, fitText: "남 100~150kg 추천", rating: 4.0,
    reviewSummary: "100kg 넘는데 6XL 딱 맞아요. 기장도 넉넉해서 배 안 보여요!",
    caution: "흰색은 살짝 비치는 편이에요.",
    link: "https://shopping.naver.com",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
  },
  {
    id: "d3", name: "여성 등산 아웃도어 팬츠", gender: "여성", sizeClass: "일반",
    garmentType: "아웃도어팬츠", type: "하의", mall: "네이버", price: 39000,
    sizeRange: "XS~XL", sizeMax: "XL", chest: null, waist: null, length: null,
    fitMinKg: null, fitMaxKg: null, fitText: null, rating: 4.5,
    reviewSummary: "가볍고 빨리 마르고 여성핏 살아서 데일리로도 잘 입어요.",
    caution: "인기 사이즈는 금방 품절돼요.",
    link: "https://shopping.naver.com",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d"
  },
  {
    id: "d4", name: "여성 빅사이즈 와이드 데님 청바지", gender: "여성", sizeClass: "빅사이즈",
    garmentType: "청바지", type: "하의", mall: "G마켓", price: 33900,
    sizeRange: "28~40inch", sizeMax: "40inch", chest: null, waist: 102, length: 98,
    fitMinKg: 70, fitMaxKg: 110, fitText: "여 70~110kg 추천", rating: 4.2,
    reviewSummary: "와이드핏이라 허벅지 안 끼고 다리 길어 보여요.",
    caution: "데님이라 처음엔 빳빳해요.",
    link: "https://www.gmarket.co.kr",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d"
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

/* ===== 쇼핑몰별 배송속도 힌트 ===== */
const SHIP_HINTS = {
  "쿠팡": "🚚 국내 빠른배송",
  "네이버": "🚚 국내배송", "11번가": "🚚 국내배송", "G마켓": "🚚 국내배송", "옥션": "🚚 국내배송",
  "알리익스프레스": "✈️ 해외배송 · 느림(1~3주)",
  "테무": "✈️ 해외배송 · 느림(1~2주)"
};
function shipHint(mall) {
  return SHIP_HINTS[mall] || "🚚 배송 정보 확인";
}
/* 타일용 배송 아이콘만 (해외=✈️, 국내=🚚) */
function overseasIcon(mall) {
  return (mall === "알리익스프레스" || mall === "테무") ? "✈️" : "🚚";
}

/* ===== 그룹(성별+사이즈) 정의 — 순서 고정 (남성 먼저) ===== */
const GROUPS = [
  { gender: "남성", sizeClass: "일반",    emoji: "👨",   title: "남성 · 일반",            desc: "남성 일반 사이즈" },
  { gender: "남성", sizeClass: "빅사이즈", emoji: "🧔",   title: "남성 · 빅사이즈 (100kg↑)", desc: "큰 체형 남성 추천" },
  { gender: "여성", sizeClass: "일반",    emoji: "👩",   title: "여성 · 일반",            desc: "여성 일반 사이즈" },
  { gender: "여성", sizeClass: "빅사이즈", emoji: "👩‍🦰", title: "여성 · 빅사이즈 (70kg↑)",  desc: "큰 체형 여성 추천" }
];

/* ===== 종류(garmentType) 정렬 순서 + 이모지 ===== */
const GARMENT_ORDER = ["바람막이", "청바지", "티셔츠", "아웃도어팬츠", "져지", "트레이닝복"];
const GARMENT_EMOJI = {
  "바람막이": "🧥", "청바지": "👖", "티셔츠": "👕",
  "아웃도어팬츠": "🥾", "져지": "🏃", "트레이닝복": "🩳"
};

const PRICE_OPTS = { "전체": Infinity, "3만원 이하": 30000, "5만원 이하": 50000, "10만원 이하": 100000 };

/* ===== 상태 ===== */
let ALL = [];          // 이미지 있는 상품만 보관
const sel = { gender: null, sizeClass: null, garmentType: null };
const filter = { price: "전체", malls: new Set(), sort: "종합별점순" };
let FAVS = loadFavs();

/* ===== DOM ===== */
const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const favGrid = $("#fav-grid");
const countEl = $("#count");

init();

async function init() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no data.json");
    const json = await res.json();
    if (Array.isArray(json) && json.length) ALL = json;
    else throw new Error("empty");
  } catch (e) {
    ALL = FALLBACK_DATA;
  }
  // ★ 이미지 있는 상품만 남긴다
  ALL = ALL.filter((p) => p.image && String(p.image).trim());

  buildGroupScreen();
  buildSheet();
  bindNav();
  bindTabs();
}

/* ===== weserv 프록시 이미지 URL ===== */
function proxiedImg(url) {
  return "https://images.weserv.nl/?url=" + encodeURIComponent(url) + "&w=600&output=webp";
}

/* ===== 1단계: 그룹(성별+사이즈) 선택 화면 ===== */
function buildGroupScreen() {
  const box = $("#group-choices");
  box.innerHTML = "";
  GROUPS.forEach((g) => {
    const n = ALL.filter((p) => p.gender === g.gender && p.sizeClass === g.sizeClass).length;
    box.appendChild(choiceBtn(g.emoji, g.title, `${n}개`, () => {
      sel.gender = g.gender;
      sel.sizeClass = g.sizeClass;
      $("#crumb-group").textContent = g.title;
      buildCategoryScreen();
      goTo("category");
    }));
  });
}

/* ===== 2단계: 종류 선택 화면 (해당 그룹에 실제 있는 garmentType만) ===== */
function buildCategoryScreen() {
  const box = $("#category-choices");
  box.innerHTML = "";
  const pool = ALL.filter((p) => p.gender === sel.gender && p.sizeClass === sel.sizeClass);

  // garmentType별 개수
  const counts = {};
  pool.forEach((p) => { counts[p.garmentType] = (counts[p.garmentType] || 0) + 1; });

  // 지정 순서로, 상품 있는 것만
  const types = GARMENT_ORDER.filter((t) => counts[t] > 0);

  if (!types.length) {
    box.innerHTML = `<div class="empty"><span class="emoji">🫥</span><p>이 분류엔 아직 옷이 없어요.</p></div>`;
    return;
  }

  types.forEach((t) => {
    const emoji = GARMENT_EMOJI[t] || "👚";
    box.appendChild(choiceBtn(emoji, t, `${counts[t]}개`, () => {
      sel.garmentType = t;
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
    <span class="choice-title">${esc(title)}</span>
    <span class="choice-badge">${esc(desc)}</span>`;
  btn.addEventListener("click", onClick);
  return btn;
}

/* ===== 둘러보기 내부 단계 전환 ===== */
function goTo(step) {
  document.querySelectorAll("#tab-browse .screen").forEach((s) => s.classList.remove("active"));
  $("#screen-" + step).classList.add("active");
  window.scrollTo(0, 0);
}

function bindNav() {
  $("#back-to-group").addEventListener("click", () => goTo("group"));
  $("#back-to-category").addEventListener("click", () => goTo("category"));

  $("#filter-btn").addEventListener("click", openSheet);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);
  $("#sheet-reset").addEventListener("click", () => {
    filter.price = "전체"; filter.malls = new Set(); filter.sort = "종합별점순";
    syncSheetUI();
  });
  $("#sheet-apply").addEventListener("click", () => { closeSheet(); render(); });
}

/* ===== 하단 탭바 ===== */
function bindTabs() {
  const tabs = [
    { nav: "#nav-browse", page: "#tab-browse" },
    { nav: "#nav-favs",   page: "#tab-favs"   },
    { nav: "#nav-info",   page: "#tab-info"   }
  ];
  tabs.forEach((t, idx) => {
    $(t.nav).addEventListener("click", () => switchTab(idx));
  });
}
function switchTab(idx) {
  const navs = ["#nav-browse", "#nav-favs", "#nav-info"];
  const pages = ["#tab-browse", "#tab-favs", "#tab-info"];
  navs.forEach((n, i) => $(n).classList.toggle("active", i === idx));
  pages.forEach((p, i) => $(p).classList.toggle("active", i === idx));
  if (idx === 1) renderFavs();      // 찜 탭 들어올 때마다 갱신
  window.scrollTo(0, 0);
}

/* ===== 목록 열기 ===== */
function openList() {
  const cnt = currentPool().length;
  $("#list-title").textContent = `${groupTitle()} · ${sel.garmentType}`;
  goTo("list");
  render();
}
function groupTitle() {
  const g = GROUPS.find((x) => x.gender === sel.gender && x.sizeClass === sel.sizeClass);
  return g ? `${g.gender}·${g.sizeClass}` : "전체";
}

/* 현재 선택(성별+사이즈+종류)에 맞는 풀 */
function currentPool() {
  return ALL.filter((p) =>
    p.gender === sel.gender &&
    p.sizeClass === sel.sizeClass &&
    p.garmentType === sel.garmentType
  );
}

/* ===== 종합 별점 계산 (같은 종류 풀 안에서 가성비) ===== */
function computeComposite(list) {
  let min = Infinity, max = -Infinity;
  list.forEach((p) => {
    const pr = Number(p.price) || 0;
    if (pr < min) min = pr;
    if (pr > max) max = pr;
  });
  list.forEach((p) => {
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

/* 어떤 상품의 종합별점을 (자기 그룹+종류 풀 기준으로) 계산해두기 */
function computeFor(p) {
  computeComposite(ALL.filter((x) =>
    x.gender === p.gender && x.sizeClass === p.sizeClass && x.garmentType === p.garmentType
  ));
}

/* ===== 필터/정렬 ===== */
function applyFilters() {
  const pool = currentPool();
  computeComposite(pool);   // 같은 분류 풀 기준 종합별점

  let list = pool.filter((p) => {
    if (Number(p.price) > PRICE_OPTS[filter.price]) return false;
    if (filter.malls.size && !filter.malls.has(p.mall)) return false;
    return true;
  });

  if (filter.sort === "가격낮은순") list.sort((a, b) => a.price - b.price);
  else if (filter.sort === "가격높은순") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => (b._composite || 0) - (a._composite || 0) || (b.rating || 0) - (a.rating || 0));

  return list;
}

/* ===== 둘러보기 렌더 ===== */
function render() {
  const list = applyFilters();
  updateCount(list.length);
  renderActiveFilters();
  $("#filter-btn").classList.toggle("dot", filterActive());

  if (!list.length) {
    grid.innerHTML = emptyHTML("헉, 조건에 맞는 옷이 없네요.<br>필터를 좀 풀어볼까요?");
    return;
  }
  grid.innerHTML = list.map(cardHTML).join("");
  bindHearts(grid);
  watchImages(grid, updateCount);
}

function updateCount(n) {
  countEl.innerHTML = `지금 <b>${n}</b>개 보고 있어요`;
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

/* ===== 찜 탭 렌더 ===== */
function renderFavs() {
  const list = ALL.filter((p) => FAVS.has(p.id));
  // 각 상품의 종합별점을 자기 분류 풀 기준으로 계산
  list.forEach(computeFor);

  $("#fav-count").innerHTML = list.length ? `<b>${list.length}</b>개 담겨있어요` : "";

  if (!list.length) {
    favGrid.innerHTML = emptyHTML("아직 찜한 옷이 없어요.<br>마음에 드는 옷에 ❤️ 눌러봐요!");
    return;
  }
  favGrid.innerHTML = list.map(cardHTML).join("");
  bindHearts(favGrid, true);   // 찜 탭에서 하트 해제 시 즉시 제거
  watchImages(favGrid);
}

function emptyHTML(msg) {
  return `<div class="empty"><span class="emoji">🫥</span><p>${msg}</p></div>`;
}

function genderClass(g) {
  if (g === "남성") return "male";
  if (g === "여성") return "female";
  return "uni";
}

function cardHTML(p) {
  const price = Number(p.price || 0).toLocaleString("ko-KR");
  const mc = mallColor(p.mall || "");
  const faved = FAVS.has(p.id);
  const src = proxiedImg(p.image);
  const isBig = p.sizeClass === "빅사이즈";
  const href = p.link ? esc(p.link) : "";

  return `
    <article class="card" data-id="${esc(p.id)}">
      <button class="heart-btn ${faved ? "on" : ""}" type="button" data-id="${esc(p.id)}" aria-label="찜하기" aria-pressed="${faved}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.2C.3 8.4 1.9 5 5.3 5c2 0 3.4 1.1 4.2 2.4C10.3 6.1 11.7 5 13.7 5c3.4 0 5 3.4 3.3 6.8C19.5 16.4 12 21 12 21z" fill="${faved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      </button>
      <a class="card-img-link" ${href ? `href="${href}" target="_blank" rel="noopener noreferrer"` : ""} aria-label="${esc(p.name)} 보러가기">
        <img class="card-img" src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" data-card-img="1" />
      </a>
      <a class="card-body" ${href ? `href="${href}" target="_blank" rel="noopener noreferrer"` : ""}>
        <h3 class="card-name">${esc(p.name || "")}</h3>
        <div class="card-line">
          <span class="price">${price}<small>원</small></span>
          ${ratingHTML(p)}
        </div>
        <div class="card-mallrow">
          <span class="ship-mall" style="background:${mc}">${esc(p.mall || "")}</span>
          <span class="ship-ico">${overseasIcon(p.mall)}</span>
        </div>
        <div class="card-sub">${esc(subLine(p, isBig))}</div>
      </a>
    </article>`;
}

/* 보조 회색 1줄(타일): 사이즈 · (빅이면 핏 요약). 배송/쇼핑몰은 위 mallrow에서 표기 */
function subLine(p, isBig) {
  const parts = [];
  if (p.sizeRange) parts.push(`📏 ${p.sizeRange}`);
  if (isBig && p.fitText && String(p.fitText).trim()) parts.push(String(p.fitText).trim());
  if (!parts.length) parts.push(p.type || "");
  return parts.join(" · ");
}

/* 이미지 로드 실패 시 카드 통째로 제거 + 카운트 갱신 */
function watchImages(container, onChange) {
  container.querySelectorAll("img[data-card-img]").forEach((img) => {
    img.addEventListener("error", () => {
      const card = img.closest(".card");
      if (card) card.remove();
      if (typeof onChange === "function") {
        const left = container.querySelectorAll(".card").length;
        onChange(left);
        if (!left) container.innerHTML = emptyHTML("헉, 보여줄 옷이 없네요.");
      } else {
        // 찜 탭: 다 사라지면 빈 안내
        if (!container.querySelectorAll(".card").length) {
          container.innerHTML = emptyHTML("아직 찜한 옷이 없어요.<br>마음에 드는 옷에 ❤️ 눌러봐요!");
        }
      }
    });
  });
}

/* ===== 실측 + 체중핏 표시 (빅사이즈 카드 전용) ===== */
function fitHTML(p) {
  const badge = (p.fitText && String(p.fitText).trim())
    ? `<span class="fit-badge">🧍 ${esc(p.fitText)}</span>` : "";

  const parts = [];
  if (p.type === "하의") {
    if (p.waist != null) parts.push(`허리 ${esc(p.waist)}cm`);
  } else {
    if (p.chest != null) parts.push(`가슴 ${esc(p.chest)}cm`);
  }
  if (p.length != null) parts.push(`총장 ${esc(p.length)}cm`);
  const measure = parts.length ? `<div class="measure">${parts.join(" · ")}</div>` : "";

  if (!badge && !measure) return "";
  return `<div class="fit-wrap">${badge}${measure}</div>`;
}

function ratingHTML(p) {
  const comp = Math.max(0, Math.min(5, Number(p._composite) || 0));
  const pct = (comp / 5) * 100;
  const reviewR = (Number(p.rating) || 0).toFixed(1);
  const valueR = (Number(p._value) || 0).toFixed(1);
  return `
    <span class="rating" title="리뷰 ${reviewR} · 가성비 ${valueR}">
      <span class="stars" aria-label="종합 별점 ${comp}점">
        <span class="base">★★★★★</span>
        <span class="fill" style="width:${pct}%">★★★★★</span>
      </span>
      <span class="rating-num">${comp.toFixed(1)}</span>
    </span>`;
}

/* ===== 찜 (localStorage) ===== */
function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem("otssak_favs") || "[]")); }
  catch (e) { return new Set(); }
}
function saveFavs() {
  try { localStorage.setItem("otssak_favs", JSON.stringify(Array.from(FAVS))); } catch (e) {}
}
function bindHearts(container, removeOnUnfav) {
  container.querySelectorAll(".heart-btn").forEach((btn) => {
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

      // 찜 탭에서 해제하면 카드 즉시 제거
      if (removeOnUnfav && on) {
        const card = btn.closest(".card");
        if (card) card.remove();
        const left = container.querySelectorAll(".card").length;
        $("#fav-count").innerHTML = left ? `<b>${left}</b>개 담겨있어요` : "";
        if (!left) container.innerHTML = emptyHTML("아직 찜한 옷이 없어요.<br>마음에 드는 옷에 ❤️ 눌러봐요!");
      }
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
