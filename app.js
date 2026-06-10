"use strict";

const SHOW_FEMALE = false;  // 나중에 true면 여성 그룹 다시 노출

// ===== 문의 폼: Google Forms 연결 설정 (실제 폼 생성 후 값 채울 것) =====
// TODO: 아래 4개 자리표시자를 실제 구글폼 값으로 교체하면 전송이 활성화된다.
const INQUIRY_FORM = {
  FORM_ID: "TODO_FORM_ID",          // docs.google.com/forms/d/e/<여기>/formResponse
  ENTRY_분류: "entry.TODO_CATEGORY", // 분류 질문 entry ID
  ENTRY_내용: "entry.TODO_CONTENT",  // 내용 질문 entry ID
  ENTRY_연락처: "entry.TODO_CONTACT",// 연락처 질문 entry ID
};

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

/* ============================================================
   ===== DOMAIN_CONFIG 레지스트리 (도메인을 "데이터"로 정의) =====
   ============================================================
   향후 도메인/카테고리 추가는 이 레지스트리에 엔트리/맵만 추가하면 끝.
   각 엔트리:
     key          : 상품의 domain 값(판정 기준)
     emoji,title  : 홈 패널 표시
     name         : 짧은 이름(홈 타일)
     desc         : 보조 설명
     categoryKey  : 상품의 카테고리 필드명(garmentType/foodCategory/roomCategory/
                    healthCategory/beautyCategory/techCategory/fitCategory)
     scoreFields  : [{field,label,weight}] 종합별점에 들어가는 점수 항목들
     valueWeight  : 가성비(같은 카테고리 풀 정규화) 비중
     extraFields  : 카드/상세에 노출할 보조필드 [{key,icon,label,where}]
                      where: "card"=카드 보조줄에도, "detail"=상세에만
     defaultEmoji : 카테고리 이모지 맵에 없을 때 쓸 기본 이모지
     special      : "cloth"=의류 특수 흐름(성별×사이즈, rating 단일점수)
   주의: scoreFields.weight 합 + valueWeight = 1.0 이 되도록 둔다. */
const DOMAIN_CONFIG = [
  {
    key: "의류", emoji: "👕", name: "옷", title: "👕 옷", desc: "성별·사이즈별 의류",
    categoryKey: "garmentType", special: "cloth", defaultEmoji: "👚",
    // 의류는 rating 단일 점수 특수 처리(아래 computeComposite에서 분기). 표기용으로만 둠.
    scoreFields: [{ field: "rating", label: "리뷰", weight: 0.65 }],
    valueWeight: 0.35,
    extraFields: []
  },
  {
    key: "음식", emoji: "🍱", name: "음식", title: "🍱 음식", desc: "1인가구 간편식·꿀템",
    categoryKey: "foodCategory", defaultEmoji: "🍱",
    scoreFields: [
      { field: "scoreTaste",   label: "맛",   weight: 0.40 },
      { field: "scoreSatisfy", label: "만족", weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [{ key: "unitNote", icon: "🏷️", label: "개당·단가", where: "card" }, { key: "ketoNote", icon: "🥑", label: "순탄수·성분", where: "detail" }]
  },
  {
    key: "생활용품", emoji: "🧹", name: "생활용품", title: "🧹 생활용품", desc: "원룸 살림 꿀템",
    categoryKey: "roomCategory", defaultEmoji: "🧹",
    scoreFields: [
      { field: "scoreSafety",  label: "안전", weight: 0.35 },
      { field: "scoreSatisfy", label: "만족", weight: 0.30 },
      { field: "scoreSpace",   label: "공간", weight: 0.15 }
    ],
    valueWeight: 0.20,
    extraFields: [{ key: "safetyNote", icon: "🛡️", label: "안전·내구 근거", where: "card" }]
  },
  {
    key: "건강", emoji: "💊", name: "건강", title: "💊 건강·영양제", desc: "영양제·건강식품 꿀템",
    categoryKey: "healthCategory", defaultEmoji: "💊",
    scoreFields: [
      { field: "scoreIngredient", label: "성분", weight: 0.40 },
      { field: "scoreSatisfy",    label: "만족", weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [
      { key: "unitNote",       icon: "🏷️", label: "1일분·단가", where: "card" },
      { key: "ingredientNote", icon: "🧪", label: "성분·함량",   where: "detail" }
    ]
  },
  {
    key: "뷰티", emoji: "🧴", name: "뷰티", title: "🧴 뷰티·그루밍", desc: "남성 스킨케어·면도·헤어",
    categoryKey: "beautyCategory", defaultEmoji: "🧴",
    scoreFields: [
      { field: "scoreEffect",  label: "효과", weight: 0.40 },
      { field: "scoreSatisfy", label: "만족", weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [
      { key: "skinNote", icon: "🧴", label: "피부타입·성분", where: "card" },
      { key: "unitNote", icon: "🏷️", label: "용량당 단가",   where: "detail" }
    ]
  },
  {
    key: "디지털", emoji: "🔌", name: "디지털", title: "🔌 디지털·가젯", desc: "자취 남자 필수 가젯",
    categoryKey: "techCategory", defaultEmoji: "🔌",
    scoreFields: [
      { field: "scorePerf",    label: "성능", weight: 0.40 },
      { field: "scoreSatisfy", label: "만족", weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [{ key: "specNote", icon: "⚙️", label: "핵심 스펙", where: "card" }]
  },
  {
    key: "운동", emoji: "🏋️", name: "운동", title: "🏋️ 운동·홈트", desc: "홈트·헬스 소품·보충제",
    categoryKey: "fitCategory", defaultEmoji: "🏋️",
    scoreFields: [
      { field: "scoreQuality", label: "품질", weight: 0.40 },
      { field: "scoreSatisfy", label: "만족", weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [
      { key: "specNote", icon: "⚙️", label: "스펙·재질", where: "card" },
      { key: "unitNote", icon: "🏷️", label: "회당 단가", where: "detail" }
    ]
  },
  {
    key: "중고차", emoji: "🚗", name: "중고차", title: "🚗 중고차 (LPG)", desc: "300만원대 LPG 실속차 — 냉정 분석",
    categoryKey: "carCategory", defaultEmoji: "🚗",
    scoreFields: [
      { field: "scoreReliability", label: "내구·신뢰", weight: 0.40 },
      { field: "scoreSatisfy",     label: "만족",     weight: 0.35 }
    ],
    valueWeight: 0.25,
    extraFields: [
      { key: "priceNote",   icon: "💰", label: "차량가·총비용·등급",  where: "card" },
      { key: "specNote",    icon: "🚗", label: "차량 정보",           where: "detail" },
      { key: "prosNote",    icon: "👍", label: "장점",                where: "detail" },
      { key: "consNote",    icon: "👎", label: "냉정한 단점",         where: "detail" },
      { key: "recordNote",  icon: "📋", label: "성능점검기록부 분석", where: "detail" },
      { key: "lifeNote",    icon: "⏳", label: "얼마나 더 탈 수 있나", where: "detail" },
      { key: "cheapReason", icon: "🏷️", label: "저렴한 이유",         where: "detail" },
      { key: "partsNote",   icon: "🔩", label: "부품·재생품 수급",     where: "detail" },
      { key: "costNote",    icon: "💸", label: "부대비용 포함 총비용", where: "detail" },
      { key: "checkNote",   icon: "✅", label: "살 때 체크포인트",     where: "detail" }
    ]
  }
];

/* 레지스트리 빠른 조회용 맵 (key → config) */
const DOMAIN_MAP = {};
DOMAIN_CONFIG.forEach((d) => { DOMAIN_MAP[d.key] = d; });

/* 홈 패널 노출 순서(=레지스트리 순서). 향후 추가도 자동 반영. */
const DOMAINS = DOMAIN_CONFIG;

/* 도메인 판정에 쓰는 별칭(옛 데이터 호환): 옛 "원룸" → 생활용품 */
const DOMAIN_ALIAS = { "원룸": "생활용품" };

/* 상품의 도메인 판정 (의류는 domain 없으면 "의류"로 간주, 옛 "원룸"도 생활용품으로) */
function domainOf(p) {
  let d = (p && p.domain) ? String(p.domain).trim() : "";
  if (DOMAIN_ALIAS[d]) d = DOMAIN_ALIAS[d];
  return DOMAIN_MAP[d] ? d : "의류";
}
/* 도메인 config 가져오기 (없으면 의류) */
function domainCfg(domain) { return DOMAIN_MAP[domain] || DOMAIN_MAP["의류"]; }
/* 도메인별 카테고리 키 필드명 */
function categoryField(domain) { return domainCfg(domain).categoryKey; }

/* ============================================================
   ===== 카테고리 순서/이모지 맵 (도메인 categoryKey 기준) =====
   ============================================================
   신규 카테고리는 해당 맵에 추가만 하면 자동 노출. 맵에 없는 카테고리는
   순서 끝으로 밀고, 이모지는 도메인 defaultEmoji 사용. */
const CATEGORY_ORDER = {
  garmentType:    ["바람막이", "청바지", "티셔츠", "아웃도어팬츠", "져지", "트레이닝복",
                   "후드·맨투맨", "셔츠·니트", "패딩·코트", "속옷·양말·홈웨어",
                   "신발·운동화", "가방·잡화"],
  foodCategory:   ["즉석밥·간편식", "라면·면류", "냉동식품", "단백질·계란·가공육", "국·찌개·반찬", "간식·안주", "음료·커피·물", "조미료·소스·기름", "건강키토", "더티키토", "간식키토"],
  roomCategory:   ["조명", "수납·정리", "멀티탭·전기", "행거·건조", "벽선반·거치", "청소용품", "주방용품·조리도구", "욕실·위생", "세탁·세제", "소형가전", "침구·베개"],
  healthCategory: ["마그네슘", "오메가3", "종합비타민", "비타민D", "유산균(프로바이오틱스)", "밀크씨슬(간)", "아연·미네랄", "루테인(눈)", "수면(테아닌·멜라토닌)"],
  beautyCategory: ["스킨·로션·올인원", "에센스·세럼", "선크림", "클렌징·폼", "토너·패드", "면도·셰이빙", "헤어·스타일링", "샴푸·바디워시", "데오드란트·향", "립밤·핸드바디"],
  techCategory:   ["보조배터리", "충전기·멀티충전", "케이블", "블루투스 이어폰", "마우스·키보드", "모니터·받침대", "웹캠·마이크", "USB허브·독·메모리"],
  fitCategory:    ["덤벨·중량", "폼롤러·마사지", "요가매트", "푸쉬업·철봉·밴드", "프로틴·보충제", "쉐이커·소품"],
  carCategory:    ["경·소형 LPG", "준중형 LPG", "중형 LPG", "준대형·승합 LPG"]
};
const CATEGORY_EMOJI = {
  garmentType: {
    "바람막이": "🧥", "청바지": "👖", "티셔츠": "👕", "아웃도어팬츠": "🥾", "져지": "🏃",
    "트레이닝복": "🩳", "후드·맨투맨": "👕", "셔츠·니트": "👔", "패딩·코트": "🧥", "속옷·양말·홈웨어": "🧦",
    "신발·운동화": "👟", "가방·잡화": "🎒"
  },
  foodCategory: {
    "즉석밥·간편식": "🍚", "라면·면류": "🍜", "냉동식품": "🧊", "단백질·계란·가공육": "🍗",
    "국·찌개·반찬": "🍲", "간식·안주": "🍪", "음료·커피·물": "☕", "조미료·소스·기름": "🧂",
    "건강키토": "🥑", "더티키토": "🥓", "간식키토": "🍫"
  },
  roomCategory: {
    "조명": "💡", "수납·정리": "📦", "멀티탭·전기": "⚡", "행거·건조": "🧺", "벽선반·거치": "🧱",
    "청소용품": "🧹", "주방용품·조리도구": "🍳", "욕실·위생": "🚿", "세탁·세제": "🧼", "소형가전": "🍳", "침구·베개": "🛏️",
    // 실제 data.json 단축 라벨 호환(기본 🧹로 빠지던 것 보강)
    "수납": "🗄️", "멀티탭": "⚡", "벽선반": "🧱", "행거": "🧺", "주방": "🍳"
  },
  healthCategory: {
    "마그네슘": "💊", "오메가3": "🐟", "종합비타민": "💊", "비타민D": "☀️", "유산균(프로바이오틱스)": "🦠",
    "밀크씨슬(간)": "🌿", "아연·미네랄": "🧱", "루테인(눈)": "👁️", "수면(테아닌·멜라토닌)": "😴"
  },
  beautyCategory: {
    "스킨·로션·올인원": "🧴", "에센스·세럼": "💧", "선크림": "🌞", "클렌징·폼": "🧼", "토너·패드": "🧫",
    "면도·셰이빙": "🪒", "헤어·스타일링": "💈", "샴푸·바디워시": "🚿", "데오드란트·향": "🌬️", "립밤·핸드바디": "💄"
  },
  techCategory: {
    "보조배터리": "🔋", "충전기·멀티충전": "🔌", "케이블": "🪢", "블루투스 이어폰": "🎧",
    "마우스·키보드": "🖱️", "모니터·받침대": "🖥️", "웹캠·마이크": "🎙️", "USB허브·독·메모리": "💾",
    // 실제 data.json 단축 라벨 호환
    "케이블·USB허브": "🪢"
  },
  fitCategory: {
    "덤벨·중량": "🏋️", "폼롤러·마사지": "💆", "요가매트": "🧘", "푸쉬업·철봉·밴드": "💪",
    "프로틴·보충제": "🥤", "쉐이커·소품": "🧴"
  },
  carCategory: {
    "경·소형 LPG": "🚙", "준중형 LPG": "🚗", "중형 LPG": "🚘", "준대형·승합 LPG": "🚐"
  }
};
/* 카테고리 정렬 순서 가져오기 (없으면 빈 배열) */
function categoryOrderOf(domain) { return CATEGORY_ORDER[categoryField(domain)] || []; }
/* 카테고리 이모지 (없으면 도메인 기본 이모지) */
function categoryEmoji(domain, cat) {
  const map = CATEGORY_EMOJI[categoryField(domain)] || {};
  return map[cat] || domainCfg(domain).defaultEmoji || "🛒";
}

/* ===== 그룹(성별+사이즈) 정의 — 순서 고정 (남성 먼저) ===== */
const GROUPS = [
  { gender: "남성", sizeClass: "일반",    emoji: "👨",   title: "남성 · 일반",            desc: "남성 일반 사이즈" },
  { gender: "남성", sizeClass: "빅사이즈", emoji: "🧔",   title: "남성 · 빅사이즈 (100kg↑)", desc: "큰 체형 남성 추천" },
  { gender: "여성", sizeClass: "일반",    emoji: "👩",   title: "여성 · 일반",            desc: "여성 일반 사이즈" },
  { gender: "여성", sizeClass: "빅사이즈", emoji: "👩‍🦰", title: "여성 · 빅사이즈 (70kg↑)",  desc: "큰 체형 여성 추천" }
];

/* (종류/카테고리 순서·이모지는 위 CATEGORY_ORDER / CATEGORY_EMOJI 레지스트리로 통합됨) */

/* 가격 필터: 현재 풀(선택된 종류)의 분포로 동적 생성된다. "전체"는 항상 첫 칸. */
let PRICE_OPTS = { "전체": Infinity };

/* 천원 단위 보기 좋은 값으로 올림 (3.2만 → 3.5만 식) */
function niceRoundUp(v) {
  if (v <= 0) return 0;
  let step;
  if (v < 10000) step = 1000;
  else if (v < 50000) step = 5000;
  else if (v < 100000) step = 10000;
  else step = 50000;
  return Math.ceil(v / step) * step;
}
function priceLabel(won) {
  if (won >= 10000) {
    const man = won / 10000;
    const txt = Number.isInteger(man) ? man : man.toFixed(1);
    return `${txt}만원 이하`;
  }
  return `${won.toLocaleString("ko-KR")}원 이하`;
}

/* 현재 풀의 가격 분포에 맞춰 가격 구간(분위수 기반) 동적 생성 */
function buildPriceOpts(pool) {
  PRICE_OPTS = { "전체": Infinity };
  const prices = pool.map((p) => Number(p.price) || 0).filter((v) => v > 0).sort((a, b) => a - b);
  if (prices.length < 2) return;        // 표본 부족 → "전체"만
  const min = prices[0], max = prices[prices.length - 1];
  if (max - min < 1000) return;          // 가격이 거의 동일 → 구간 의미 없음

  const quantile = (q) => {
    const pos = (prices.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return prices[lo] + (prices[hi] - prices[lo]) * (pos - lo);
  };
  // 33% / 66% 분위수 기반 두 컷 + 최대(=상한)까지 포함
  const cuts = [];
  [0.34, 0.67].forEach((q) => {
    const v = niceRoundUp(quantile(q));
    if (v > min && v < max) cuts.push(v);
  });
  // 마지막 칸: 전체 상한 (반올림)
  cuts.push(niceRoundUp(max));

  // 중복 제거 + 오름차순
  const seen = new Set();
  cuts.filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; })
      .sort((a, b) => a - b)
      .forEach((v) => { PRICE_OPTS[priceLabel(v)] = v; });
}

/* ===== 정렬 옵션 (라벨=상태값) — 추천순이 기본 ===== */
const SORT_OPTS = ["추천순", "가격 낮은순", "가격 높은순", "별점 높은순"];
const SORT_DEFAULT = "추천순";

/* ===== 상태 ===== */
let ALL = [];          // 이미지 있는 상품만 보관
/* domain: 현재 도메인("의류"|"음식"|"생활용품")
   category: 음식/생활용품의 선택 카테고리(foodCategory/roomCategory 값)
   gender/sizeClass/garmentType: 의류 전용 */
const sel = { domain: null, category: null, gender: null, sizeClass: null, garmentType: null };
const filter = { price: "전체", malls: new Set(), sort: SORT_DEFAULT };
/* 현재 종류 풀에 실제 존재하는 몰 목록(빈도 내림차순) — 종류 진입 시 갱신 */
let CUR_MALLS = [];
/* mall 칩 더보기 펼침 상태 */
let mallExpanded = false;
let FAVS = loadFavs();
let COMPARE = loadCompare();        // 비교 담은 상품 id (찜과 별개)
const COMPARE_MAX = 4;              // 권장 최대 담기 개수
let compareDiffOnly = false;        // 비교 뷰 "차이만 보기" 토글 (세션 동안 유지, 기본 전체 보기)

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

  // ★ 여성 그룹 숨김(UI 한정): SHOW_FEMALE=false면 옷 도메인 여성 상품을 데이터 사용 시점에서 제외.
  //    여기 한 곳에서 거르면 도메인/그룹 카운트, 목록, 검색, 비교, 찜 등 모든 흐름에 일관 적용된다.
  //    (data.json 원본은 그대로 — 메모리상 ALL에서만 제외)
  if (!SHOW_FEMALE) {
    ALL = ALL.filter((p) => !(domainOf(p) === "의류" && p.gender === "여성"));
  }

  buildDomainScreen();
  buildSheet();
  buildSortBar();
  bindNav();
  bindTabs();
  bindCompare();
  buildScoreInfo();
  bindInquiry();
  updateCompareBar();
}

/* ===== 정보 탭: 건의/수정 요청 폼 (구글폼 formResponse로 POST · 숨은 iframe target) ===== */
function bindInquiry() {
  const form = document.getElementById("inquiry-form");
  if (!form) return;
  const msg = document.getElementById("inq-msg");

  function showMsg(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("ok", !!ok);
    msg.classList.toggle("err", !ok);
    msg.hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = (document.getElementById("inq-category") || {}).value || "";
    const content = ((document.getElementById("inq-content") || {}).value || "").trim();
    const contact = ((document.getElementById("inq-contact") || {}).value || "").trim();

    if (!content) {
      showMsg("내용을 적어주세요", false);
      return;
    }

    // 자리표시자 상태면 실제 전송하지 않고 안내만 (깨진 POST 방지)
    if (INQUIRY_FORM.FORM_ID === "TODO_FORM_ID") {
      showMsg("문의 접수는 준비 중이에요. 곧 열릴게요 🙏", true);
      return;
    }

    // 숨은 iframe을 target으로 하는 동적 폼으로 POST (CORS·페이지 이동 없음)
    const gForm = document.createElement("form");
    gForm.action = "https://docs.google.com/forms/d/e/" + INQUIRY_FORM.FORM_ID + "/formResponse";
    gForm.method = "POST";
    gForm.target = "otssak-inquiry-sink";
    gForm.style.display = "none";

    const fields = [
      [INQUIRY_FORM.ENTRY_분류, category],
      [INQUIRY_FORM.ENTRY_내용, content],
      [INQUIRY_FORM.ENTRY_연락처, contact],
    ];
    fields.forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      gForm.appendChild(input);
    });

    document.body.appendChild(gForm);
    gForm.submit();
    gForm.remove();

    form.reset();
    showMsg("보냈어요! 확인하고 반영할게요 🙆", true);
  });
}

/* ===== 정보 탭: 종합별점·가성비 점수 산식 시각화 카드 (JS로 주입, index.html 미수정) =====
   실제 산식과 일치: 가성비 점수 = (가격 정규화 ↓1~5점) , 종합별점 = 리뷰별점×0.65 + 가성비×0.35.
   사용자 눈높이의 친근한 한국어 + 인라인 SVG/CSS 막대로 신뢰감만, 과장 없이. */
function buildScoreInfo() {
  const wrap = document.querySelector("#tab-info .info-wrap");
  if (!wrap) return;
  if (document.getElementById("score-info-card")) return;   // 중복 주입 방지

  // 도넛형 가중치 그래픽용 인라인 SVG (리뷰 65% / 가성비 35%)
  const ratio = 0.65;                // 종합별점 중 리뷰 비중
  const C = 2 * Math.PI * 42;        // 반지름 42 원 둘레
  const reviewLen = (C * ratio).toFixed(1);
  const valueLen = (C * (1 - ratio)).toFixed(1);
  const donut =
    '<svg class="si-donut" viewBox="0 0 100 100" role="img" aria-label="종합별점 가중치: 리뷰 65퍼센트, 가성비 35퍼센트">' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="#3a3358" stroke-width="13"/>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="#b072ff" stroke-width="13" stroke-linecap="round"' +
        ' stroke-dasharray="' + reviewLen + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="#6dc2c0" stroke-width="13" stroke-linecap="round"' +
        ' stroke-dasharray="' + valueLen + ' ' + C.toFixed(1) + '"' +
        ' stroke-dashoffset="' + (-reviewLen) + '" transform="rotate(-90 50 50)"/>' +
      '<text x="50" y="47" text-anchor="middle" font-size="15" font-weight="800" fill="#f3f0ff">종합</text>' +
      '<text x="50" y="63" text-anchor="middle" font-size="11" fill="#cec7e8">별점</text>' +
    '</svg>';

  const card = document.createElement("div");
  card.className = "info-card si-card";
  card.id = "score-info-card";
  card.innerHTML =
    '<div class="info-emoji">📊</div>' +
    '<h3>종합별점·가성비 점수는 이렇게 계산해요</h3>' +
    '<p>옷싹 별점은 <b>실제 후기 평점</b>에다가, 같은 카테고리끼리 비교한 <b>가성비</b>를 섞어서 매겨요. 비싸기만 하면 깎이고, 싸고 평 좋으면 올라가는 구조예요. (아래 그림은 <b>옷</b> 기준이고, 음식·생활용품은 항목이 조금 달라요 — 위 카드 참고!)</p>' +

    '<div class="si-formula">' +
      donut +
      '<div class="si-legend">' +
        '<div class="si-leg"><span class="si-dot" style="background:#b072ff"></span><span><b>리뷰 평점</b> 65%<br><small>실착 후기 별점 그대로</small></span></div>' +
        '<div class="si-leg"><span class="si-dot" style="background:#6dc2c0"></span><span><b>가성비 점수</b> 35%<br><small>같은 종류 안 가격 비교</small></span></div>' +
      '</div>' +
    '</div>' +

    '<h4 class="si-sub">💸 가성비 점수는요</h4>' +
    '<p>같은 종류(예: 남성 일반 바람막이)끼리 모아놓고, <b>제일 싼 옷은 5점</b>, <b>제일 비싼 옷은 1점</b>으로 가격을 1~5점으로 환산해요. 그 사이는 비례해서 나눠 갖고요.</p>' +
    '<div class="si-bars" aria-hidden="true">' +
      '<div class="si-bar"><span class="si-bar-k">제일 싼 옷</span><span class="si-bar-track"><i style="width:100%"></i></span><span class="si-bar-v">5.0</span></div>' +
      '<div class="si-bar"><span class="si-bar-k">중간 가격</span><span class="si-bar-track"><i style="width:60%"></i></span><span class="si-bar-v">3.0</span></div>' +
      '<div class="si-bar"><span class="si-bar-k">제일 비싼 옷</span><span class="si-bar-track"><i style="width:20%"></i></span><span class="si-bar-v">1.0</span></div>' +
    '</div>' +

    '<h4 class="si-sub">⭐ 후기 평점은 이런 걸 봐요</h4>' +
    '<ul class="si-chk">' +
      '<li>실물이 사진보다 <b>괜찮다</b>는 후기</li>' +
      '<li>원단이 <b>질 좋고 튼튼</b>하다는 평</li>' +
      '<li>가격 대비 <b>잘 샀다(쌈)</b>는 만족도</li>' +
      '<li>사이즈·핏이 설명대로인지</li>' +
    '</ul>' +
    '<p class="si-note">점수는 옷 고르는 걸 도와주는 참고용이에요. 최종 판단은 후기랑 실측 보고 직접 해주세요 🙂</p>';

  // 종합별점 안내 카드(⭐) 바로 뒤에 끼워넣기 — 없으면 맨 끝 직전(문의 카드 앞)에 추가
  const afterCard = Array.from(wrap.querySelectorAll(".info-card")).find((c) => {
    const h = c.querySelector("h3");
    return h && h.textContent.indexOf("종합별점") !== -1;
  });
  if (afterCard && afterCard.nextSibling) {
    wrap.insertBefore(card, afterCard.nextSibling);
  } else if (afterCard) {
    wrap.appendChild(card);
  } else {
    const foot = wrap.querySelector(".info-foot");
    if (foot) wrap.insertBefore(card, foot); else wrap.appendChild(card);
  }
}

/* ===== 목록 상단 정렬 바 (필터 시트와 상태 공유) ===== */
function buildSortBar() {
  const box = $("#sortbar");
  if (!box) return;
  box.innerHTML = "";
  SORT_OPTS.forEach((val) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sort-chip";
    btn.textContent = val;
    btn.dataset.val = val;
    btn.setAttribute("aria-pressed", String(filter.sort === val));
    btn.addEventListener("click", () => {
      if (filter.sort === val) return;
      filter.sort = val;
      syncSortBar();
      syncSheetUI();   // 시트가 떠있을 수 있으니 동기화
      render();
    });
    box.appendChild(btn);
  });
  syncSortBar();
}
function syncSortBar() {
  document.querySelectorAll("#sortbar .sort-chip").forEach((c) => {
    const on = c.dataset.val === filter.sort;
    c.classList.toggle("active", on);
    c.setAttribute("aria-pressed", String(on));
  });
}

/* ===== 인라인 SVG 플레이스홀더 (다크 톤, 외부 자원 X) =====
   weserv가 원본을 못 가져왔을 때 default 폴백 + 타임아웃 폴백에 공용 사용.
   배경 #1a2236(.card-img 배경과 동일) + 옷걸이 실루엣 + "이미지 준비중" 문구 */
const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
  '<rect width="300" height="300" fill="#1a2236"/>' +
  '<g fill="#46527a" opacity="0.9">' +
  '<path d="M150 96c-12 0-21 9-21 21 0 8 4 14 11 18l-78 41c-6 3-9 8-9 14v6h194v-6c0-6-3-11-9-14l-78-41c7-4 11-10 11-18 0-12-9-21-21-21zm0 12a9 9 0 0 1 0 18 9 9 0 0 1 0-18z"/>' +
  '</g>' +
  '<text x="150" y="232" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="18" fill="#7e8ab5" text-anchor="middle">이미지 준비중</text>' +
  '</svg>';
/* data: URI 로 인코딩 (한글 포함 → encodeURIComponent) */
const PLACEHOLDER_URI =
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(PLACEHOLDER_SVG);

/* 이미지 로드 타임아웃(ms): 이 안에 못 끝나면 폴백 플레이스홀더로 대체 */
const IMG_TIMEOUT_MS = 8000;

/* ===== weserv 프록시 이미지 URL =====
   타일은 3열(폭 ~125px) → 2배 화면 기준 w=300이면 충분. (기존 600은 과대)
   개선:
   - &maxage=30d : weserv CDN에 30일 캐시 → 재진입/스크롤 시 즉시 응답(다나와 등 느린 핫링크 출처 체감 개선)
   - &default=<placeholder> : weserv가 원본을 끝내 못 가져오면 다크 톤 플레이스홀더로 우아하게 대체 */
function proxiedImg(url) {
  return "https://images.weserv.nl/?url=" + encodeURIComponent(url) +
    "&w=300&dpr=2&output=webp&q=82&maxage=30d" +
    "&default=" + encodeURIComponent(PLACEHOLDER_URI);
}

/* ===== 1단계: 홀로그램 홈 화면 — 도메인 패널 3개(👕 옷 / 🍱 음식 / 🧹 생활용품) ===== */
function buildDomainScreen() {
  const box = $("#domain-choices");
  if (!box) return;
  box.innerHTML = "";

  const domainCount = (key) => ALL.filter((p) => domainOf(p) === key).length;

  DOMAINS.forEach((d) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "group-tile domain-tile";
    card.innerHTML = `
      <span class="gt-emoji" aria-hidden="true">${d.emoji}</span>
      <span class="gt-name">${esc(d.name)}</span>
      <span class="gt-count">${domainCount(d.key)}개</span>`;
    card.addEventListener("click", () => enterDomain(d.key));
    box.appendChild(card);
  });
}

/* 도메인 패널 클릭 → 옷은 성별×사이즈 그룹, 음식/생활용품은 카테고리 패널 */
function enterDomain(domainKey) {
  sel.domain = domainKey;
  sel.category = null;
  sel.gender = null; sel.sizeClass = null; sel.garmentType = null;

  if (domainCfg(domainKey).special === "cloth") {
    buildClothGroupScreen();
    goTo("clothgroup");
  } else {
    buildCategoryScreen();
    goTo("category");
  }
}

/* ===== 2단계(옷): 성별×사이즈 그룹 선택 화면 (기존 흐름) ===== */
function buildClothGroupScreen() {
  const box = $("#clothgroup-choices");
  if (!box) return;
  box.innerHTML = "";

  const groupCount = (g) =>
    ALL.filter((p) => domainOf(p) === "의류" && p.gender === g.gender && p.sizeClass === g.sizeClass).length;

  // SHOW_FEMALE=false면 여성 그룹 타일은 아예 노출하지 않는다 (남성만)
  const groups = SHOW_FEMALE ? GROUPS : GROUPS.filter((g) => g.gender !== "여성");

  groups.forEach((g) => {
    const emoji = g.emoji || "👕";
    box.appendChild(choiceBtn(emoji, g.title, `${groupCount(g)}개`, () => enterGroup(g)));
  });
}

/* 그룹 타일 클릭 → 종류 선택 화면으로 드릴다운 */
function enterGroup(g) {
  sel.domain = "의류";
  sel.gender = g.gender;
  sel.sizeClass = g.sizeClass;
  sel.garmentType = null;
  sel.category = null;
  const crumb = $("#crumb-group");
  if (crumb) crumb.textContent = g.title;
  buildCategoryScreen();
  goTo("category");
}

/* ===== 2단계: 카테고리 선택 화면 (도메인별 분기) =====
   - 의류: 현재 성별·사이즈 그룹의 garmentType
   - 음식: foodCategory / 생활용품: roomCategory */
function buildCategoryScreen() {
  const box = $("#category-choices");
  box.innerHTML = "";
  const qEl = $("#category-q");

  const cfg = domainCfg(sel.domain);

  // 의류: 현재 성별·사이즈 그룹의 garmentType (특수 흐름)
  if (cfg.special === "cloth") {
    if (qEl) qEl.textContent = "어떤 옷 보실래요?";
    const crumb = $("#crumb-group");
    const g = GROUPS.find((x) => x.gender === sel.gender && x.sizeClass === sel.sizeClass);
    if (crumb && g) crumb.textContent = g.title;

    const pool = ALL.filter((p) => domainOf(p) === "의류" && p.gender === sel.gender && p.sizeClass === sel.sizeClass);
    const order = categoryOrderOf("의류");
    const counts = {};
    pool.forEach((p) => { counts[p.garmentType] = (counts[p.garmentType] || 0) + 1; });
    const types = order.filter((t) => counts[t] > 0)
      .concat(Object.keys(counts).filter((t) => t && order.indexOf(t) === -1));

    if (!types.length) {
      box.innerHTML = `<div class="empty"><span class="emoji">🫥</span><p>이 분류엔 아직 옷이 없어요.</p></div>`;
      return;
    }
    types.forEach((t) => {
      box.appendChild(choiceBtn(categoryEmoji("의류", t), t, `${counts[t]}개`, () => {
        sel.garmentType = t;
        sel.category = t;
        openList();
      }));
    });
    return;
  }

  // 그 외 모든 도메인 — 레지스트리 기반 일반화(카테고리 = categoryKey 필드)
  const qByDomain = { "음식": "뭐 드실래요?", "건강": "어디에 좋은 거 찾아요?", "뷰티": "뭐 발라볼까요?",
                      "디지털": "뭐가 필요하세요?", "운동": "뭐로 운동해볼까요?" };
  if (qEl) qEl.textContent = qByDomain[sel.domain] || "뭐가 필요하세요?";
  const crumb = $("#crumb-group");
  if (crumb) crumb.textContent = `${cfg.emoji} ${cfg.name}`;

  const field = cfg.categoryKey;
  const order = categoryOrderOf(sel.domain);

  const pool = ALL.filter((p) => domainOf(p) === sel.domain);
  const counts = {};
  pool.forEach((p) => { const c = p[field]; if (c) counts[c] = (counts[c] || 0) + 1; });
  const cats = order.filter((c) => counts[c] > 0)
    .concat(Object.keys(counts).filter((c) => order.indexOf(c) === -1));

  if (!cats.length) {
    box.innerHTML = `<div class="empty"><span class="emoji">🫥</span><p>이 도메인엔 아직 상품이 없어요.</p></div>`;
    return;
  }
  cats.forEach((c) => {
    box.appendChild(choiceBtn(categoryEmoji(sel.domain, c), c, `${counts[c]}개`, () => {
      sel.category = c;
      sel.garmentType = null;
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
  // 도메인 홈으로 (옷 그룹 화면에서)
  const backToDomain = $("#back-to-domain");
  if (backToDomain) backToDomain.addEventListener("click", () => goTo("domain"));
  // 카테고리 화면 뒤로: 옷이면 그룹 화면, 음식/생활용품이면 도메인 홈
  $("#back-to-group").addEventListener("click", () => {
    if (sel.domain === "의류") goTo("clothgroup"); else goTo("domain");
  });
  $("#back-to-category").addEventListener("click", () => goTo("category"));

  $("#filter-btn").addEventListener("click", openSheet);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);
  $("#sheet-reset").addEventListener("click", () => {
    filter.price = "전체"; filter.malls = new Set(); filter.sort = SORT_DEFAULT;
    syncSheetUI();
    syncSortBar();
  });
  $("#sheet-apply").addEventListener("click", () => { closeSheet(); syncSortBar(); render(); });

  const moreBtn = $("#mall-more");
  if (moreBtn) moreBtn.addEventListener("click", () => { mallExpanded = !mallExpanded; renderMallChips(); });

  $("#detail-close").addEventListener("click", closeDetail);
  $("#detail-backdrop").addEventListener("click", closeDetail);
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
  navs.forEach((n, i) => {
    const el = $(n);
    el.classList.toggle("active", i === idx);
    if (i === idx) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  pages.forEach((p, i) => $(p).classList.toggle("active", i === idx));
  if (idx === 1) renderFavs();      // 찜 탭 들어올 때마다 갱신
  window.scrollTo(0, 0);
}

/* ===== 목록 열기 ===== */
function openList() {
  $("#list-title").textContent = listTitle();
  // 현재 카테고리의 실제 가격 분포로 가격 필터 구간 재생성
  buildPriceOpts(currentPool());
  if (!(filter.price in PRICE_OPTS)) filter.price = "전체";  // 이전 구간이 사라졌으면 초기화
  rebuildPriceChips();
  rebuildMallChips();   // 현재 카테고리의 몰만, 단일몰이면 숨김
  syncSortBar();
  goTo("list");
  render();
}
function listTitle() {
  if (domainCfg(sel.domain).special === "cloth") return `${groupTitle()} · ${sel.garmentType}`;
  return sel.category || sel.domain || "상품";
}
function groupTitle() {
  const g = GROUPS.find((x) => x.gender === sel.gender && x.sizeClass === sel.sizeClass);
  return g ? `${g.gender}·${g.sizeClass}` : "전체";
}

/* 현재 선택에 맞는 풀 (가성비 정규화 풀과 동일)
   - 의류: 같은 성별+사이즈+종류
   - 음식/생활용품: 같은 카테고리(foodCategory/roomCategory) */
function currentPool() {
  if (domainCfg(sel.domain).special === "cloth") {
    return ALL.filter((p) =>
      domainOf(p) === "의류" &&
      p.gender === sel.gender &&
      p.sizeClass === sel.sizeClass &&
      p.garmentType === sel.garmentType
    );
  }
  const field = categoryField(sel.domain);
  return ALL.filter((p) => domainOf(p) === sel.domain && p[field] === sel.category);
}

/* 어떤 상품이 속한 "가성비 정규화 풀" (자기 카테고리 동료들) */
function poolOf(p) {
  const dom = domainOf(p);
  if (domainCfg(dom).special === "cloth") {
    return ALL.filter((x) => domainOf(x) === "의류" &&
      x.gender === p.gender && x.sizeClass === p.sizeClass && x.garmentType === p.garmentType);
  }
  const field = categoryField(dom);
  return ALL.filter((x) => domainOf(x) === dom && x[field] === p[field]);
}

/* 점수(1~5) 안전 변환 */
function clampScore(v) { return Math.max(0, Math.min(5, Number(v) || 0)); }

/* ===== 종합 별점 계산 (DOMAIN_CONFIG 레지스트리 기반, 같은 카테고리 풀 안에서 가성비) =====
   종합 = Σ(scoreFields[i].field × weight) + 가성비 × valueWeight
   - 의류는 rating 단일 점수라 특수 처리 유지(rating×0.65 + 가성비×0.35).
   - 신규/음식/생활용품은 레지스트리 scoreFields를 그대로 가중합.
   가성비 = 같은 풀 안 최저가 5.0 ~ 최고가 1.0 선형 정규화. */
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
    valueScore = Math.max(1, Math.min(5, valueScore));

    const cfg = domainCfg(domainOf(p));
    let comp = valueScore * cfg.valueWeight;
    cfg.scoreFields.forEach((f) => { comp += clampScore(p[f.field]) * f.weight; });

    comp = Math.round(comp * 2) / 2;          // 0.5 단위 반올림
    comp = Math.max(0, Math.min(5, comp));    // 클램프
    p._value = Math.round(valueScore * 10) / 10;
    p._composite = comp;
  });
}

/* 어떤 상품의 종합별점을 (자기 카테고리 풀 기준으로) 계산해두기 */
function computeFor(p) {
  computeComposite(poolOf(p));
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

  // "별점 높은순": 의류는 리뷰별점, 그 외 도메인은 종합별점 기준
  const ratingKey = (p) => (domainCfg(domainOf(p)).special === "cloth") ? (Number(p.rating) || 0) : (Number(p._composite) || 0);
  if (filter.sort === "가격 낮은순") list.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (filter.sort === "가격 높은순") list.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (filter.sort === "별점 높은순") list.sort((a, b) => ratingKey(b) - ratingKey(a) || (b._composite || 0) - (a._composite || 0));
  else list.sort((a, b) => (b._composite || 0) - (a._composite || 0) || ratingKey(b) - ratingKey(a)); // 추천순(기본)

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
  bindCompareBtns(grid);
  bindDetails(grid);
  watchImages(grid, updateCount);
}

function updateCount(n) {
  countEl.innerHTML = `지금 <b>${n}</b>개 보고 있어요`;
}

function renderActiveFilters() {
  const tags = [];
  if (filter.price !== "전체") tags.push("💸 " + filter.price);
  if (filter.malls.size) tags.push("🛒 " + Array.from(filter.malls).join(", "));
  if (filter.sort !== SORT_DEFAULT) tags.push("↕️ " + filter.sort);
  $("#active-filters").innerHTML = tags.map((t) => `<span class="af-tag">${esc(t)}</span>`).join("");
}
function filterActive() {
  return filter.price !== "전체" || filter.malls.size > 0 || filter.sort !== SORT_DEFAULT;
}

/* ===== 찜 탭 렌더 ===== */
function renderFavs() {
  const list = ALL.filter((p) => FAVS.has(p.id));
  // 각 상품의 종합별점을 자기 분류 풀 기준으로 계산
  list.forEach(computeFor);

  $("#fav-count").innerHTML = list.length ? `<b>${list.length}</b>개 담겨있어요` : "";
  renderFavCompareBtn(list);

  if (!list.length) {
    favGrid.innerHTML = emptyHTML("아직 찜한 옷이 없어요.<br>마음에 드는 옷에 ❤️ 눌러봐요!");
    return;
  }
  favGrid.innerHTML = list.map(cardHTML).join("");
  bindHearts(favGrid, true);   // 찜 탭에서 하트 해제 시 즉시 제거
  bindCompareBtns(favGrid);
  bindDetails(favGrid);
  watchImages(favGrid);
}

/* 찜→비교 빠른 담기: 찜 탭 헤더 아래에 "찜한 옷 비교하기" 버튼을 JS로 생성.
   - 찜이 2개 이상일 때만 노출
   - 누르면 찜 목록 앞에서부터 최대 COMPARE_MAX개를 비교에 담고 비교 뷰 열기 */
function renderFavCompareBtn(list) {
  const head = document.querySelector("#tab-favs .page-head");
  if (!head) return;
  let btn = $("#fav-compare-all");
  if (!list || list.length < 2) {
    if (btn) btn.remove();
    return;
  }
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "fav-compare-all";
    btn.type = "button";
    btn.className = "fav-cmp-all";
    head.appendChild(btn);
    btn.addEventListener("click", sendFavsToCompare);
  }
  const n = Math.min(list.length, COMPARE_MAX);
  btn.textContent = `⚖️ 찜한 옷 비교하기 (${n}개)`;
}

/* 찜 목록을 비교로 한 번에 보내기 (최대 COMPARE_MAX 존중) */
function sendFavsToCompare() {
  const ids = ALL.filter((p) => FAVS.has(p.id)).map((p) => p.id);
  if (!ids.length) return;
  COMPARE = new Set(ids.slice(0, COMPARE_MAX));   // 앞에서부터 최대 4개
  saveCompare();
  updateCompareBar();
  syncCompareBtns();
  syncDetailCompareBtn();
  openCompare();
}

function emptyHTML(msg) {
  return `<div class="empty"><span class="emoji">🫥</span><p>${msg}</p></div>`;
}

function genderClass(g) {
  if (g === "남성") return "male";
  if (g === "여성") return "female";
  return "uni";
}

/* 가격 표기: 백만원 이상(중고차 등)은 만원 단위로 환산해 한눈에 보이게.
   일반 상품(<100만원)은 기존처럼 원단위 그대로. */
function priceInnerHTML(won) {
  won = Number(won || 0);
  if (won >= 1000000) return `${Math.round(won / 10000).toLocaleString("ko-KR")}<small>만원</small>`;
  return `${won.toLocaleString("ko-KR")}<small>원</small>`;
}
function priceText(won) {
  won = Number(won || 0);
  if (won >= 1000000) return `${Math.round(won / 10000).toLocaleString("ko-KR")}만원`;
  return `${won.toLocaleString("ko-KR")}원`;
}

function cardHTML(p) {
  const mc = mallColor(p.mall || "");
  const faved = FAVS.has(p.id);
  const src = proxiedImg(p.image);
  const dom = domainOf(p);
  const isCloth = domainCfg(dom).special === "cloth";
  const isBig = isCloth && p.sizeClass === "빅사이즈";
  const href = p.link ? esc(p.link) : "";
  const cmp = COMPARE.has(p.id);

  return `
    <article class="card" data-id="${esc(p.id)}" data-rating="${Number(p.rating) || 0}" data-price="${Number(p.price) || 0}">
      <button class="heart-btn ${faved ? "on" : ""}" type="button" data-id="${esc(p.id)}" aria-label="찜하기" aria-pressed="${faved}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.2C.3 8.4 1.9 5 5.3 5c2 0 3.4 1.1 4.2 2.4C10.3 6.1 11.7 5 13.7 5c3.4 0 5 3.4 3.3 6.8C19.5 16.4 12 21 12 21z" fill="${faved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      </button>
      <button class="cmp-btn ${cmp ? "on" : ""}" type="button" data-cmp="${esc(p.id)}" aria-label="비교 담기" aria-pressed="${cmp}" title="비교 담기">⚖️</button>
      <a class="card-img-link is-loading" ${href ? `href="${href}" target="_blank" rel="noopener noreferrer"` : ""} aria-label="${esc(p.name)} 보러가기">
        <span class="img-skeleton" aria-hidden="true"></span>
        <img class="card-img" src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-card-img="1" />
      </a>
      <button class="card-body" type="button" data-detail="${esc(p.id)}" aria-expanded="false" aria-label="${esc(p.name)} 상세 보기">
        <h3 class="card-name">${esc(p.name || "")}</h3>
        <div class="card-line">
          <span class="price">${priceInnerHTML(p.price)}</span>
          ${ratingHTML(p)}
        </div>
        <div class="card-mallrow">
          <span class="ship-mall" style="background:${mc}">${esc(p.mall || "")}</span>
          <span class="ship-ico">${overseasIcon(p.mall)}</span>
        </div>
        ${isBig ? bigFitChip(p) : ""}
        <div class="card-sub">${esc(subLine(p, dom, isBig))}</div>
        <span class="card-more" aria-hidden="true">자세히 ▾</span>
      </button>
    </article>`;
}

/* 빅사이즈 카드: 체중추천핏을 한눈에 보이도록 칩으로 노출 (fitText의 앞 체중 부분만 추출) */
function bigFitChip(p) {
  const raw = (p.fitText && String(p.fitText).trim()) ? String(p.fitText).trim() : "";
  if (!raw) return "";
  const kg = fitKgPart(raw);
  return `<span class="fit-chip">🧍 ${esc(kg)}</span>`;
}
/* fitText에서 "남 100~140kg 추천" 같은 체중 핵심만 뽑기 (없으면 원문) */
function fitKgPart(raw) {
  const t = raw.replace(/^🧍\s*/, "");
  const m = t.match(/^[^()]*추천/);   // 괄호(세부사이즈) 앞까지
  return (m ? m[0] : t).trim();
}

/* 보조 회색 1줄(타일): DOMAIN_CONFIG extraFields(where:"card") 기반 일반화
   - 의류(특수): 사이즈 · 실측 요약
   - 그 외: 레지스트리의 첫 card extraField(unitNote/safetyNote/skinNote/specNote 등),
     없으면 카테고리명 폴백 */
function subLine(p, dom, isBig) {
  const cfg = domainCfg(dom);
  if (cfg.special === "cloth") {
    const parts = [];
    if (p.sizeRange) parts.push(`📏 ${p.sizeRange}`);
    // 빅사이즈는 실측 한 항목을 추가로 (가슴/허리)
    if (isBig) {
      if (p.chest != null) parts.push(`가슴${p.chest}`);
      else if (p.waist != null) parts.push(`허리${p.waist}`);
    }
    if (!parts.length) parts.push(p.type || "");
    return parts.join(" · ");
  }
  // 일반 도메인: where:"card" 보조필드 중 값 있는 첫 항목
  const cardField = cfg.extraFields.find((f) => f.where === "card" && p[f.key] && String(p[f.key]).trim());
  if (cardField) return `${cardField.icon} ${String(p[cardField.key]).trim()}`;
  return p[cfg.categoryKey] || "";
}

/* 이미지 로드 완료 시 스켈레톤 제거 / 실패 시 카드 통째로 제거 + 카운트 갱신
   + 8초 타임아웃 폴백: load도 error도 안 나는(영영 안 끝나는) 이미지는
     인라인 SVG 플레이스홀더로 우아하게 교체하고 스켈레톤을 거둔다. */
function watchImages(container, onChange) {
  container.querySelectorAll("img[data-card-img]").forEach((img) => {
    let timer = null;
    const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const clearSkeleton = () => {
      const link = img.closest(".card-img-link");
      if (link) link.classList.remove("is-loading");
    };

    const onError = () => {
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
    };

    // 타임아웃 폴백: 시간 내 로드 못 끝내면 플레이스홀더로 교체(카드는 유지)
    const onTimeout = () => {
      timer = null;
      if (img.complete && img.naturalWidth > 0) { clearSkeleton(); return; }
      if (img.dataset.fallback === "1") return;   // 이미 폴백 적용됨
      img.dataset.fallback = "1";
      // 폴백 이미지 자체는 즉시 로드되므로 load 핸들러가 스켈레톤을 거둠
      img.src = PLACEHOLDER_URI;
      img.classList.add("is-fallback");
      clearSkeleton();
    };

    if (img.complete && img.naturalWidth > 0) {
      clearSkeleton();
    } else {
      img.addEventListener("load", () => { stopTimer(); clearSkeleton(); }, { once: true });
      img.addEventListener("error", () => {
        stopTimer();
        // 이미 폴백(플레이스홀더) 시도였다면 카드 제거까지 가지 말고 스켈레톤만 정리
        if (img.dataset.fallback === "1") { clearSkeleton(); return; }
        onError();
      }, { once: true });
      timer = setTimeout(onTimeout, IMG_TIMEOUT_MS);
    }
  });
}

function ratingHTML(p) {
  const comp = Math.max(0, Math.min(5, Number(p._composite) || 0));
  const pct = (comp / 5) * 100;
  const valueR = (Number(p._value) || 0).toFixed(1);
  const cfg = domainCfg(domainOf(p));
  // 레지스트리 scoreFields로 점수 툴팁 일반화 (의류는 "리뷰 …"로 동일하게 표기됨)
  const parts = cfg.scoreFields.map((f) => `${f.label} ${clampScore(p[f.field]).toFixed(1)}`);
  parts.push(`가성비 ${valueR}`);
  const title = parts.join(" · ");
  return `
    <span class="rating" title="${esc(title)}">
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

/* ===== 상품 상세 시트 (카드 본문 탭 시 펼침) ===== */
function bindDetails(container) {
  container.querySelectorAll("[data-detail]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDetail(btn.dataset.detail);
    });
  });
}

/* 상세 시트 보조: 상품의 출처/근거를 짧고 정직한 한 줄로. 비영리·자체평가 기준 */
function sourceBlock(p) {
  const checkedRaw = (p.priceCheckedAt && String(p.priceCheckedAt).trim()) ? String(p.priceCheckedAt).trim() : "";
  const checked = (checkedRaw && checkedRaw !== "미확인") ? checkedRaw : "";
  let line = "📄 정보·사진 출처: 각 쇼핑몰 · 별점·후기·사이즈: 옷싹 자체 평가";
  if (checked) line += ` · 가격확인: ${esc(checked)}`;
  return `<div class="dt-sec dt-source"><p class="dt-source-line">${line}</p></div>`;
}

/* 상세 시트 보조: seller(판매자)가 있으면 "판매: <seller>" 작게 노출. 없으면 아무것도 안 띄움(회귀 방지) */
function sellerLine(p) {
  const s = (p.seller && String(p.seller).trim()) ? String(p.seller).trim() : "";
  if (!s) return "";
  return `<div class="dt-seller"><span class="dt-seller-k">판매</span><span class="dt-seller-v">${esc(s)}</span></div>`;
}

function fullMeasureHTML(p) {
  const rows = [];
  if (p.sizeRange) rows.push(["사이즈 범위", esc(p.sizeRange)]);
  if (p.chest != null) rows.push(["가슴단면/둘레", esc(p.chest) + "cm"]);
  if (p.waist != null) rows.push(["허리둘레", esc(p.waist) + "cm"]);
  if (p.length != null) rows.push(["총장", esc(p.length) + "cm"]);
  if (!rows.length) return "";
  return `<dl class="dt-measure">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

function openDetail(id) {
  const p = ALL.find((x) => x.id === id);
  if (!p) return;
  computeFor(p);                       // 자기 분류 풀 기준 종합별점 계산
  const dom = domainOf(p);
  const cfg = domainCfg(dom);
  const isCloth = cfg.special === "cloth";
  const isBig = isCloth && p.sizeClass === "빅사이즈";
  const mc = mallColor(p.mall || "");
  const href = p.link ? esc(p.link) : "";

  // 의류 전용: 핏/실측 (그 외 도메인은 숨김)
  const fitBlock = (isBig && p.fitText && String(p.fitText).trim())
    ? `<div class="dt-fit"><span class="dt-fit-ico">🧍</span><span>${esc(String(p.fitText).replace(/^🧍\s*/, ""))}</span></div>`
    : "";
  const measureBlock = (isCloth && fullMeasureHTML(p))
    ? `<div class="dt-sec"><h4>📏 실측 사이즈</h4>${fullMeasureHTML(p)}</div>` : "";

  // 도메인 보조필드(extraFields) 전체를 레지스트리 순서대로 노출
  // (음식 단가, 건강 단가+성분, 디지털 스펙, 뷰티 피부·성분, 운동 스펙·단가 …)
  const extraBlocks = cfg.extraFields.map((f) => {
    const v = p[f.key];
    if (v == null || !String(v).trim()) return "";
    return `<div class="dt-sec"><h4>${f.icon} ${esc(f.label)}</h4><p>${esc(String(v).trim())}</p></div>`;
  }).join("");

  const reviewBlock = (p.reviewSummary && String(p.reviewSummary).trim())
    ? `<div class="dt-sec"><h4>⭐ 현실 후기 요약</h4><p>${esc(p.reviewSummary)}</p></div>` : "";
  const cautionBlock = (p.caution && String(p.caution).trim())
    ? `<div class="dt-sec dt-warn"><h4>⚠️ 이건 알아두세요</h4><p>${esc(p.caution)}</p></div>` : "";

  $("#detail-body").innerHTML = `
    <div class="dt-head">
      <h3 class="dt-name">${esc(p.name || "")}</h3>
      <div class="dt-meta">
        <span class="price">${priceInnerHTML(p.price)}</span>
        ${ratingHTML(p)}
      </div>
      <div class="dt-mallrow">
        <span class="ship-mall" style="background:${mc}">${esc(p.mall || "")}</span>
        <span class="dt-ship">${domainOf(p) === "중고차" ? "📄 시세 기준 · 실매물 아님" : esc(shipHint(p.mall))}</span>
      </div>
      ${sellerLine(p)}
    </div>
    ${fitBlock}
    ${extraBlocks}
    ${reviewBlock}
    ${measureBlock}
    ${cautionBlock}
    ${sourceBlock(p)}`;

  const buyBtn = $("#detail-buy");
  if (href) { buyBtn.href = href; buyBtn.style.display = ""; }
  else { buyBtn.removeAttribute("href"); buyBtn.style.display = "none"; }

  // 상세 시트의 비교 담기 버튼: 현재 상품 id로 토글
  const cmpBtn = $("#detail-compare");
  if (cmpBtn) {
    cmpBtn.dataset.cmp = p.id;
    syncDetailCompareBtn();
  }

  $("#detail-backdrop").hidden = false;
  $("#detail-sheet").hidden = false;
  document.body.classList.add("sheet-open");
  document.addEventListener("keydown", onDetailKey);
}
function closeDetail() {
  $("#detail-backdrop").hidden = true;
  $("#detail-sheet").hidden = true;
  document.body.classList.remove("sheet-open");
  document.removeEventListener("keydown", onDetailKey);
}
function onDetailKey(e) { if (e.key === "Escape") closeDetail(); }

/* ===== 상품 비교 (Compare) — localStorage, 찜과 별개 키 ===== */
function loadCompare() {
  try { return new Set(JSON.parse(localStorage.getItem("otssak_compare") || "[]")); }
  catch (e) { return new Set(); }
}
function saveCompare() {
  try { localStorage.setItem("otssak_compare", JSON.stringify(Array.from(COMPARE))); } catch (e) {}
}

/* 비교 담기/빼기 토글. 가득 차면(권장 최대 초과) 안내 후 무시 */
function toggleCompare(id) {
  if (!id) return false;
  if (COMPARE.has(id)) {
    COMPARE.delete(id);
  } else {
    if (COMPARE.size >= COMPARE_MAX) {
      flashCompareBar(`최대 ${COMPARE_MAX}개까지 비교할 수 있어요`);
      return false;
    }
    COMPARE.add(id);
  }
  saveCompare();
  updateCompareBar();
  syncCompareBtns();
  syncDetailCompareBtn();
  return true;
}

/* 화면에 떠있는 모든 카드 비교 버튼 상태 동기화 */
function syncCompareBtns() {
  document.querySelectorAll(".cmp-btn[data-cmp]").forEach((btn) => {
    const on = COMPARE.has(btn.dataset.cmp);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}
/* 상세 시트 안의 비교 담기 버튼 상태 동기화 */
function syncDetailCompareBtn() {
  const btn = $("#detail-compare");
  if (!btn || !btn.dataset.cmp) return;
  const on = COMPARE.has(btn.dataset.cmp);
  btn.classList.toggle("on", on);
  btn.setAttribute("aria-pressed", String(on));
  btn.textContent = on ? "⚖️ 비교에서 빼기" : "⚖️ 비교 담기";
}

/* 카드 비교 버튼 클릭 바인딩 (둘러보기/찜 그리드 공용) */
function bindCompareBtns(container) {
  container.querySelectorAll(".cmp-btn[data-cmp]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCompare(btn.dataset.cmp);
    });
  });
}

/* 하단 비교 바 갱신 (0개면 숨김) */
function updateCompareBar() {
  const bar = $("#compare-bar");
  if (!bar) return;
  const n = COMPARE.size;
  const cnt = $("#cb-count");
  if (cnt) cnt.textContent = String(n);
  bar.hidden = n === 0;
  document.body.classList.toggle("has-compare-bar", n > 0);

  // 1개만 담겼을 때 친근한 힌트 노출 (2개↑면 안내 제거)
  const txt = bar.querySelector(".cb-text");
  if (txt && !txt.dataset.orig) {   // flash 중이면 건드리지 않음
    let hint = txt.querySelector(".cb-hint");
    if (n === 1) {
      if (!hint) {
        hint = document.createElement("span");
        hint.className = "cb-hint";
        txt.appendChild(hint);
      }
      hint.textContent = " · 1개 더 담으면 비교 가능!";
    } else if (hint) {
      hint.remove();
    }
  }
}

/* 비교 바에 잠깐 안내 메시지 깜빡(가득 찼을 때 등) */
let cbFlashTimer = null;
function flashCompareBar(msg) {
  const bar = $("#compare-bar");
  if (!bar) return;
  bar.classList.add("flash");
  const txt = bar.querySelector(".cb-text");
  if (txt) {
    if (!txt.dataset.orig) txt.dataset.orig = txt.innerHTML;
    txt.textContent = msg;
  }
  if (cbFlashTimer) clearTimeout(cbFlashTimer);
  cbFlashTimer = setTimeout(() => {
    bar.classList.remove("flash");
    if (txt && txt.dataset.orig) { txt.innerHTML = txt.dataset.orig; delete txt.dataset.orig; updateCompareBar(); }
  }, 1600);
}

/* 비교 바 / 비교 뷰 이벤트 바인딩 */
function bindCompare() {
  const openBtn = $("#cb-open");
  const clearBtn = $("#cb-clear");
  if (openBtn) openBtn.addEventListener("click", openCompare);
  if (clearBtn) clearBtn.addEventListener("click", clearCompare);

  const closeBtn = $("#compare-close");
  const backdrop = $("#compare-backdrop");
  const fullClear = $("#compare-clear");
  if (closeBtn) closeBtn.addEventListener("click", closeCompare);
  if (backdrop) backdrop.addEventListener("click", closeCompare);
  if (fullClear) fullClear.addEventListener("click", () => { clearCompare(); closeCompare(); });

  const dc = $("#detail-compare");
  if (dc) dc.addEventListener("click", () => { toggleCompare(dc.dataset.cmp); });
}

/* 비교 목록 전체 비우기 */
function clearCompare() {
  COMPARE.clear();
  saveCompare();
  updateCompareBar();
  syncCompareBtns();
  syncDetailCompareBtn();
}

/* 비교 뷰 열기 */
function openCompare() {
  renderCompareView();
  $("#compare-backdrop").hidden = false;
  $("#compare-sheet").hidden = false;
  document.body.classList.add("sheet-open");
  document.addEventListener("keydown", onCompareKey);
}
function closeCompare() {
  $("#compare-backdrop").hidden = true;
  $("#compare-sheet").hidden = true;
  document.body.classList.remove("sheet-open");
  document.removeEventListener("keydown", onCompareKey);
}
function onCompareKey(e) { if (e.key === "Escape") closeCompare(); }

/* 비교 뷰 본문: 세로 항목 × 가로 상품 표 (가로 스크롤) */
function renderCompareView() {
  const body = $("#compare-body");
  if (!body) return;

  // 담은 순서 유지하며 실제 존재하는 상품만
  const items = Array.from(COMPARE).map((id) => ALL.find((p) => p.id === id)).filter(Boolean);

  if (!items.length) {
    body.innerHTML = `<div class="empty"><span class="emoji">⚖️</span><p>담은 상품이 없어요.<br>카드의 ⚖️ 를 눌러 담아봐요!</p></div>`;
    return;
  }

  // 각 상품의 종합별점을 자기 분류 풀 기준으로 계산
  items.forEach(computeFor);

  // 강조 기준값: 최저가 / 최고 종합별점
  const prices = items.map((p) => Number(p.price) || Infinity);
  const minPrice = Math.min.apply(null, prices.filter((v) => isFinite(v)));
  const comps = items.map((p) => Number(p._composite) || 0);
  const maxComp = Math.max.apply(null, comps);

  // 가성비 픽 1개 선정 (담은 상품들 안에서만, 별점/가격 정규화 균형 점수)
  const bestPick = pickValuePick(items);

  // 어떤 실측 행을 보여줄지 — 하나라도 값이 있는 항목만 행 노출
  const measureDefs = [
    { key: "unitNote",       label: "단가",       unit: "" },
    { key: "specNote",       label: "스펙",       unit: "" },
    { key: "ingredientNote", label: "성분",       unit: "" },
    { key: "skinNote",       label: "피부·성분",  unit: "" },
    { key: "safetyNote",     label: "안전",       unit: "" },
    { key: "sizeRange",      label: "사이즈범위", unit: "" },
    { key: "chest",          label: "가슴",       unit: "cm" },
    { key: "waist",          label: "허리",       unit: "cm" },
    { key: "length",         label: "총장",       unit: "cm" }
  ];
  const shownMeasures = measureDefs.filter((m) => items.some((p) => p[m.key] != null && p[m.key] !== ""));
  const anyBig = items.some((p) => p.sizeClass === "빅사이즈");

  const cell = (inner, cls) => `<td class="${cls || ""}">${inner}</td>`;

  // 행 값들이 서로 다른지 판정 → 다르면 강조(diff), 모두 같으면 흐리게(same).
  // (2개 이상일 때만 의미. 1개면 강조/흐림 없음)
  function rowClass(vals) {
    if (items.length < 2) return "";
    const norm = vals.map((v) => (v == null || v === "" ) ? "" : String(v).trim());
    const real = norm.filter((v) => v !== "" && v !== "-");
    if (real.length < 2) return "";              // 비교할 값이 1개 이하 → 판정 보류
    const allSame = real.every((v) => v === real[0]) && norm.every((v) => v !== "");
    return allSame ? "row-same" : "row-diff";
  }
  const trOpen = (cls) => `<tr class="${cls || ""}">`;

  // 헤더(썸네일+제거 버튼) 행
  const thumbRow = items.map((p) => {
    const src = proxiedImg(p.image);
    return `<th scope="col" class="cmp-col">
      <button class="cmp-remove" type="button" data-cmp-remove="${esc(p.id)}" aria-label="비교에서 빼기" title="빼기">✕</button>
      <span class="cmp-thumb"><img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-card-img="1" /></span>
    </th>`;
  }).join("");

  // 행 빌더
  const rows = [];
  // 이름 (차이 판정 제외 — 이름은 보통 다 다름)
  rows.push(`<tr><th scope="row">이름</th>${items.map((p) => cell(`<span class="cmp-name">${esc(p.name || "")}</span>`)).join("")}</tr>`);
  // 몰
  rows.push(`${trOpen(rowClass(items.map((p) => p.mall)))}<th scope="row">쇼핑몰</th>${items.map((p) => {
    const mc = mallColor(p.mall || "");
    return cell(`<span class="ship-mall" style="background:${mc}">${esc(p.mall || "-")}</span>`);
  }).join("")}</tr>`);
  // 가격 (최저가 강조)
  rows.push(`${trOpen(rowClass(items.map((p) => Number(p.price) || "")) + " js-row-price")}<th scope="row">가격</th>${items.map((p) => {
    const pr = Number(p.price) || 0;
    const best = isFinite(minPrice) && pr === minPrice;
    const txt = pr ? priceText(pr) : "-";
    return cell(`<span class="cmp-price">${esc(txt)}</span>${best ? `<span class="cmp-best">최저가</span>` : ""}`, best ? "is-best" : "");
  }).join("")}</tr>`);
  // 종합별점 (최고 강조)
  rows.push(`${trOpen(rowClass(items.map((p) => Math.max(0, Math.min(5, Number(p._composite) || 0)).toFixed(1))) + " js-row-rate")}<th scope="row">종합별점</th>${items.map((p) => {
    const comp = Math.max(0, Math.min(5, Number(p._composite) || 0));
    const best = maxComp > 0 && comp === maxComp;
    return cell(`<span class="cmp-rate">⭐ ${comp.toFixed(1)}</span>${best ? `<span class="cmp-best">최고</span>` : ""}`, best ? "is-best" : "");
  }).join("")}</tr>`);
  // 실측 행들
  shownMeasures.forEach((m) => {
    rows.push(`${trOpen(rowClass(items.map((p) => (p[m.key] != null && p[m.key] !== "") ? p[m.key] + m.unit : "")))}<th scope="row">${esc(m.label)}</th>${items.map((p) => {
      const v = (p[m.key] != null && p[m.key] !== "") ? esc(p[m.key]) + m.unit : "-";
      return cell(`<span class="cmp-meas">${v}</span>`);
    }).join("")}</tr>`);
  });
  // 핏(빅사이즈 체중추천) — 빅 상품이 하나라도 있을 때만 행 노출
  if (anyBig) {
    rows.push(`${trOpen(rowClass(items.map((p) => (p.fitText && String(p.fitText).trim()) ? fitKgPart(String(p.fitText).trim()) : "")))}<th scope="row">추천핏</th>${items.map((p) => {
      const raw = (p.fitText && String(p.fitText).trim()) ? fitKgPart(String(p.fitText).trim()) : "-";
      return cell(`<span class="cmp-fit">${esc(raw)}</span>`);
    }).join("")}</tr>`);
  }
  // 구매 버튼
  rows.push(`<tr><th scope="row">구매</th>${items.map((p) => {
    const href = p.link ? esc(p.link) : "";
    return cell(href
      ? `<a class="cmp-buy" href="${href}" target="_blank" rel="noopener noreferrer">🛒 사러가기</a>`
      : `<span class="cmp-meas">-</span>`);
  }).join("")}</tr>`);

  // 상단 안내: 2개↑면 가성비 픽 한 줄(+근거), 1개면 "더 담으면 좋아요" 힌트
  let topNote = "";
  if (items.length >= 2 && bestPick) {
    const reason = pickReason(items, bestPick);
    topNote = `<div class="cmp-pick">💡 이 중엔 <b>${esc(shortName(bestPick.name))}</b>이 가성비 갓벽이에요!` +
      (reason ? `<span class="cmp-pick-why">${esc(reason)}</span>` : "") +
      `</div>`;
  } else if (items.length === 1) {
    topNote = `<div class="cmp-hint">🙂 하나만 담겼어요. <b>2개 이상</b> 담으면 가격·별점을 나란히 비교할 수 있어요!</div>`;
  }

  // 자동 하이라이트: 가장 차이 큰 항목(가격 폭 vs 별점 폭) 한 줄 + 해당 행 잠깐 강조
  const hi = pickBiggestDiff(items);

  // "차이만 보기" 토글 — 같은 값 행(row-same)을 접어 화면 절약. 2개↑ 비교일 때만 노출.
  const hasSameRow = rows.some((r) => r.indexOf("row-same") !== -1);
  const showToggle = items.length >= 2 && hasSameRow;
  const toggleHTML = showToggle
    ? `<div class="cmp-toggle" role="group" aria-label="비교 표 보기 방식">
         <button type="button" class="cmp-tg-btn ${compareDiffOnly ? "" : "on"}" data-diff="0" aria-pressed="${!compareDiffOnly}">전체 보기</button>
         <button type="button" class="cmp-tg-btn ${compareDiffOnly ? "on" : ""}" data-diff="1" aria-pressed="${compareDiffOnly}">차이만 보기</button>
       </div>`
    : "";

  body.innerHTML = `
    ${topNote}
    ${hi ? `<div class="cmp-spotlight" data-hi-row="${esc(hi.rowKey)}">${esc(hi.msg)}</div>` : ""}
    ${toggleHTML}
    <div class="cmp-scroll">
      <table class="cmp-table ${compareDiffOnly && showToggle ? "diff-only" : ""}">
        <thead><tr><th scope="col" class="cmp-corner">${items.length}개 비교</th>${thumbRow}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;

  // "차이만 보기" 토글 바인딩 (세션 동안 상태 유지)
  body.querySelectorAll(".cmp-tg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const want = btn.dataset.diff === "1";
      if (want === compareDiffOnly) return;
      compareDiffOnly = want;
      const tbl = body.querySelector(".cmp-table");
      if (tbl) tbl.classList.toggle("diff-only", compareDiffOnly);
      body.querySelectorAll(".cmp-tg-btn").forEach((b) => {
        const on = (b.dataset.diff === "1") === compareDiffOnly;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  });

  // 개별 제거 버튼
  body.querySelectorAll("[data-cmp-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      COMPARE.delete(btn.dataset.cmpRemove);
      saveCompare();
      updateCompareBar();
      syncCompareBtns();
      syncDetailCompareBtn();
      if (COMPARE.size === 0) { closeCompare(); return; }
      renderCompareView();
    });
  });
  // 비교 표 썸네일도 폴백 적용 (깨진 이미지 → 플레이스홀더)
  body.querySelectorAll("img[data-card-img]").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallback === "1") return;
      img.dataset.fallback = "1";
      img.src = PLACEHOLDER_URI;
    }, { once: true });
  });

  // 자동 하이라이트: 가장 차이 큰 행을 잠깐 은은하게 강조 (모션감소 존중)
  if (hi && hi.rowKey) {
    const tr = body.querySelector("tr.js-row-" + hi.rowKey);
    if (tr) {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        // 모션 줄이기: 깜빡임 없이 정적 표식만 잠깐 유지 후 제거
        tr.classList.add("cmp-hi-static");
        setTimeout(() => tr.classList.remove("cmp-hi-static"), 2600);
      } else {
        tr.classList.add("cmp-hi");
        setTimeout(() => tr.classList.remove("cmp-hi"), 2600);
      }
    }
  }
}

/* 가성비 픽 선정: 담은 상품들 안에서 가격(낮을수록↑)·종합별점(높을수록↑)을
   각각 0~1로 정규화해 균형 점수(별점 0.5 + 저가 0.5)가 가장 높은 1개.
   가격/별점이 전부 동일하면 의미 없으므로 null 반환(추천 생략). */
function pickValuePick(items) {
  if (!Array.isArray(items) || items.length < 2) return null;
  const prices = items.map((p) => Number(p.price) || 0);
  const comps = items.map((p) => Math.max(0, Math.min(5, Number(p._composite) || 0)));
  const minP = Math.min.apply(null, prices), maxP = Math.max.apply(null, prices);
  const minC = Math.min.apply(null, comps), maxC = Math.max.apply(null, comps);
  // 가격도 별점도 전부 같으면 우열을 가릴 수 없음 → 추천 생략
  if (maxP === minP && maxC === minC) return null;

  let best = null, bestScore = -Infinity;
  items.forEach((p, i) => {
    // 가격: 최저가=1, 최고가=0 / 별점: 최고=1, 최저=0
    const cheapScore = (maxP === minP) ? 1 : (maxP - prices[i]) / (maxP - minP);
    const rateScore  = (maxC === minC) ? 1 : (comps[i] - minC) / (maxC - minC);
    const score = rateScore * 0.5 + cheapScore * 0.5;
    if (score > bestScore) { bestScore = score; best = p; }
  });
  return best;
}

/* 추천 한 줄용 짧은 이름 (너무 길면 말줄임) */
function shortName(name) {
  const s = String(name || "").trim();
  return s.length > 22 ? s.slice(0, 21) + "…" : s;
}

/* 가성비 픽 근거 한 줄: 담은 상품들 안에서 픽의 가격 순위·별점(종합) 순위를 계산해
   왜 가성비 갓벽인지 친근하게 설명. (1=가장 쌈/가장 높음)
   - 가격은 낮을수록 좋은 순위, 별점은 높을수록 좋은 순위
   - 동점은 같은 순위로 묶어 계산 */
function pickReason(items, pick) {
  if (!Array.isArray(items) || items.length < 2 || !pick) return "";
  const n = items.length;
  const price = (p) => Number(p.price) || 0;
  const comp = (p) => Math.max(0, Math.min(5, Number(p._composite) || 0));

  // 가격 순위 (낮은 가격 = 1위). 동점은 같은 순위.
  const myPrice = price(pick);
  const cheaperCnt = items.filter((p) => price(p) < myPrice).length;
  const priceRank = cheaperCnt + 1;
  // 별점 순위 (높은 별점 = 1위)
  const myComp = comp(pick);
  const higherCnt = items.filter((p) => comp(p) > myComp).length;
  const rateRank = higherCnt + 1;

  const isCheapest = priceRank === 1;
  const isTopRated = rateRank === 1;
  const cheapTop = priceRank <= Math.ceil(n / 2);   // 가격 상위권(저렴한 쪽)
  const rateTop = rateRank <= Math.ceil(n / 2);      // 별점 상위권

  // 케이스별 친근한 근거 문구
  if (isCheapest && isTopRated) {
    return "제일 싼데 별점도 제일 높아서, 두말할 거 없죠!";
  }
  if (isCheapest && rateTop) {
    return `최저가에 별점도 ${rateRank}위라 만족도 좋아요.`;
  }
  if (isTopRated && cheapTop) {
    return `별점 1위인데 가격은 ${priceRank}위로 저렴한 편이라 효율 최고예요.`;
  }
  if (isCheapest) {
    return "이 중 제일 저렴해서 부담이 제일 적어요.";
  }
  if (isTopRated) {
    return `가격은 ${priceRank}위지만 별점이 제일 높아서 후회 적은 선택이에요.`;
  }
  // 일반: 가격·별점 순위를 솔직하게 풀어줌
  if (priceRank < rateRank) {
    return `가격은 ${priceRank}위인데 별점은 ${rateRank}위라, 값 대비 만족도가 좋아요.`;
  }
  if (rateRank < priceRank) {
    return `별점은 ${rateRank}위인데 가격은 ${priceRank}위라, 가성비 균형이 제일 좋아요.`;
  }
  return `가격 ${priceRank}위·별점 ${rateRank}위로 균형이 제일 좋아요.`;
}

/* 자동 하이라이트: 가격 폭과 별점 폭 중 "상대적으로 더 큰 차이"가 나는 항목 선정.
   - 가격: (최대-최소)/최대  / 별점: (최대-최소)/5  로 정규화해 비교
   - 차이가 거의 없으면 null (강조 생략) */
function pickBiggestDiff(items) {
  if (!Array.isArray(items) || items.length < 2) return null;
  const prices = items.map((p) => Number(p.price) || 0).filter((v) => v > 0);
  const comps = items.map((p) => Math.max(0, Math.min(5, Number(p._composite) || 0)));

  let priceSpread = 0, priceGap = 0;
  if (prices.length >= 2) {
    const minP = Math.min.apply(null, prices), maxP = Math.max.apply(null, prices);
    priceGap = maxP - minP;
    priceSpread = maxP > 0 ? priceGap / maxP : 0;
  }
  let rateSpread = 0, rateGap = 0;
  if (comps.length >= 2) {
    const minC = Math.min.apply(null, comps), maxC = Math.max.apply(null, comps);
    rateGap = maxC - minC;
    rateSpread = rateGap / 5;
  }

  // 둘 다 사실상 차이 없음 → 강조 생략
  if (priceSpread < 0.08 && rateSpread < 0.06) return null;

  if (priceSpread >= rateSpread) {
    const man = (priceGap / 10000);
    const gapTxt = priceGap >= 10000
      ? (Number.isInteger(man) ? man : man.toFixed(1)) + "만원"
      : priceGap.toLocaleString("ko-KR") + "원";
    return { rowKey: "price", msg: `💰 가격 차이가 제일 커요 (최대 ${gapTxt} 차이)` };
  }
  return { rowKey: "rate", msg: `⭐ 종합별점 차이가 제일 커요 (최대 ${rateGap.toFixed(1)}점 차이)` };
}

/* ===== 필터 시트 ===== */
function buildSheet() {
  rebuildPriceChips();
  rebuildMallChips();
  makeChips("#opt-sort", SORT_OPTS, "sort");
}

/* mall 칩 기본 노출 개수 (이 이상이면 "더보기"로 접음) */
const MALL_VISIBLE = 8;

/* 현재 종류 풀에 실제 있는 몰만, 빈도 내림차순(동률은 가나다)으로 칩 생성.
   - 몰이 1개뿐이면 mall 필터 행 자체를 숨기고 안내문구 노출 (소규모 가격필터와 동일 톤)
   - 8개 초과면 상위 8개만 노출 + "더보기 (+N)" 토글 */
function rebuildMallChips() {
  const box = $("#opt-mall");
  if (!box) return;
  const grp = $("#grp-mall");
  const note = $("#mall-note");
  const moreBtn = $("#mall-more");

  // 현재 컨텍스트가 정해져 있으면 그 풀, 아니면 전체 기준
  const pool = (sel.gender && sel.sizeClass && sel.garmentType) ? currentPool() : ALL;
  const mallCount = {};
  pool.forEach((p) => { if (p.mall) mallCount[p.mall] = (mallCount[p.mall] || 0) + 1; });
  CUR_MALLS = Object.keys(mallCount).sort((a, b) =>
    (mallCount[b] - mallCount[a]) || a.localeCompare(b, "ko"));

  // 현재 풀에 없는 몰은 선택 해제 (유령 필터 방지)
  Array.from(filter.malls).forEach((m) => { if (!CUR_MALLS.includes(m)) filter.malls.delete(m); });

  // 단일 몰 종류 → mall 필터 무의미: 행 숨김 + 안내
  const singleMall = CUR_MALLS.length <= 1;
  if (grp) grp.hidden = false;            // 그룹 자체는 유지, 내부만 토글
  if (singleMall) {
    box.innerHTML = "";
    box.hidden = true;
    if (moreBtn) moreBtn.hidden = true;
    if (note) {
      note.hidden = false;
      note.textContent = CUR_MALLS.length === 1
        ? `이 종류는 '${CUR_MALLS[0]}' 한 곳에서만 팔아요. 쇼핑몰 필터는 생략했어요.`
        : "쇼핑몰 정보가 없어 필터를 생략했어요.";
    }
    return;
  }

  if (note) note.hidden = true;
  box.hidden = false;
  mallExpanded = false;
  renderMallChips();
}

/* mallExpanded 상태에 맞춰 칩 노출(상위 8 또는 전체) + 더보기 버튼 갱신 */
function renderMallChips() {
  const box = $("#opt-mall");
  const moreBtn = $("#mall-more");
  if (!box) return;
  const total = CUR_MALLS.length;
  const shown = mallExpanded ? CUR_MALLS : CUR_MALLS.slice(0, MALL_VISIBLE);
  makeChips("#opt-mall", shown, "mall");

  if (moreBtn) {
    if (total <= MALL_VISIBLE) {
      moreBtn.hidden = true;
    } else {
      moreBtn.hidden = false;
      const rest = total - MALL_VISIBLE;
      moreBtn.textContent = mallExpanded ? "접기 ▴" : `더보기 +${rest} ▾`;
      moreBtn.setAttribute("aria-expanded", String(mallExpanded));
    }
  }
  syncSheetUI();
}

/* 현재 PRICE_OPTS 기준으로 가격 칩 다시 그리기 (종류 진입 시마다 호출)
   구간이 "전체" 하나뿐(표본 적음)이면 칩 행 숨기고 안내문구 노출 */
function rebuildPriceChips() {
  const box = $("#opt-price");
  if (!box) return;
  const keys = Object.keys(PRICE_OPTS);
  const onlyAll = keys.length <= 1;            // "전체"만 있음 → 구간 의미 없음
  makeChips("#opt-price", keys, "price");

  const note = $("#price-note");
  if (note) note.hidden = !onlyAll;
  box.hidden = onlyAll;                          // 칩 1개("전체")만이면 행 숨김
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
  syncSortBar();
}

function openSheet() {
  syncSheetUI();
  $("#sheet-backdrop").hidden = false;
  $("#filter-sheet").hidden = false;
  document.body.classList.add("sheet-open");        // 배경 스크롤 잠금
  document.addEventListener("keydown", onSheetKey);
}
function closeSheet() {
  $("#sheet-backdrop").hidden = true;
  $("#filter-sheet").hidden = true;
  document.body.classList.remove("sheet-open");
  document.removeEventListener("keydown", onSheetKey);
}
function onSheetKey(e) {
  if (e.key === "Escape") closeSheet();
}

/* ===== util ===== */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
