/*
Sunlogin / Oray ad response cleaner for Loon.
Purpose: remove splash, popup, banner, device-page notice, discover content, and feed ad objects.
It intentionally does not modify membership, subscription, license, or account fields.
*/

let body = $response.body || "";

const dropKeys = new Set([
  "ad",
  "ads",
  "adlist",
  "adlists",
  "adinfo",
  "adinfos",
  "addata",
  "advert",
  "adverts",
  "advertise",
  "advertisement",
  "advertisements",
  "announcement",
  "announcements",
  "announce",
  "announces",
  "article",
  "articles",
  "articlelist",
  "activity",
  "activities",
  "activitylist",
  "banner",
  "banners",
  "bannerad",
  "bannerads",
  "bannerlist",
  "broadcast",
  "broadcasts",
  "carousel",
  "carousels",
  "discover",
  "discoverpage",
  "discovery",
  "displayad",
  "displayads",
  "feedad",
  "feedads",
  "find",
  "findpage",
  "floatad",
  "floatads",
  "floatingad",
  "guide",
  "guides",
  "insertad",
  "interstitialad",
  "launchad",
  "launchads",
  "marketingad",
  "marketingads",
  "marquee",
  "marquees",
  "messagead",
  "messageads",
  "news",
  "newslist",
  "notice",
  "noticebar",
  "notices",
  "openscreenad",
  "openad",
  "operationad",
  "operationads",
  "operatead",
  "operateads",
  "popupad",
  "popupads",
  "popad",
  "popads",
  "promoad",
  "promoads",
  "promotion",
  "promotions",
  "promotionad",
  "promotionads",
  "recommend",
  "recommends",
  "recommendad",
  "recommendads",
  "recommendlist",
  "rollnotice",
  "rollingnotice",
  "splashad",
  "splashads",
  "startad",
  "strategy",
  "strategies",
  "swiper",
  "swipers",
  "startupad",
  "startupads",
  "topad",
  "topads"
]);

const adValue = /^(ad|ads|advert|advertise|advertisement|article|banner|banner_ad|carousel|discover|discovery|feed_ad|find|guide|insert_ad|interstitial|marketing|marquee|news|notice|open_ad|open_screen_ad|popup_ad|pop_ad|promo|promotion|recommend|recommend_ad|splash|splash_ad|start_ad|startup_ad|strategy|swiper)$/i;
const adText = /(\u5e7f\u544a|\u63a8\u5e7f|\u5f00\u5c4f|\u5f39\u7a97|\u8fd0\u8425\u4f4d|\u8425\u9500|\u6d3b\u52a8\u5165\u53e3|618|\u8d85\u7ea7\u4f1a\u5458|\u66f4\u9ad8\u5e27\u7387|\u66f4\u4f4e\u5ef6\u8fdf|\u4f1a\u5fc3\u653b\u7565|\u6700\u65b0\u63a8\u8350)/;
const discoverText = /^(\u53d1\u73b0|discover|discovery|find)$/i;
const discoverRoute = /(discover|discovery|find|article|news|strategy|recommend|promotion|activity)/i;

function normalizeKey(key) {
  return String(key).replace(/[\s_\-.]/g, "").toLowerCase();
}

function shouldDropKey(key) {
  return dropKeys.has(normalizeKey(key));
}

function looksLikeAdItem(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const trueFlags = [
    "is_ad",
    "isAd",
    "is_ads",
    "isAds",
    "isAdvert",
    "isAdvertisement",
    "show_ad",
    "showAd",
    "has_ad",
    "hasAd"
  ];

  for (const key of trueFlags) {
    if (value[key] === true || value[key] === 1 || value[key] === "1") return true;
  }

  const typeKeys = [
    "type",
    "card_type",
    "cardType",
    "item_type",
    "itemType",
    "module",
    "template",
    "style",
    "source",
    "scene",
    "slot",
    "material_type",
    "materialType",
    "page_type",
    "pageType"
  ];

  for (const key of typeKeys) {
    const current = value[key];
    if (typeof current === "string" && (adValue.test(current) || adText.test(current))) {
      return true;
    }
  }

  const nameKeys = ["name", "title", "desc", "description", "label"];
  for (const key of nameKeys) {
    const current = value[key];
    if (typeof current === "string" && adText.test(current)) return true;
    if (typeof current === "string" && discoverText.test(current.trim())) return true;
  }

  const routeKeys = [
    "url",
    "uri",
    "link",
    "route",
    "path",
    "page",
    "scheme",
    "target",
    "deeplink",
    "deepLink",
    "jump_url",
    "jumpUrl"
  ];

  for (const key of routeKeys) {
    const current = value[key];
    if (typeof current === "string" && discoverRoute.test(current)) return true;
  }

  return Object.keys(value).some(shouldDropKey);
}

function clean(value, depth) {
  if (depth > 24 || value == null) return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => !looksLikeAdItem(item))
      .map((item) => clean(item, depth + 1))
      .filter((item) => !looksLikeAdItem(item));
  }

  if (typeof value !== "object") return value;

  const output = {};
  for (const [key, current] of Object.entries(value)) {
    if (shouldDropKey(key)) continue;
    output[key] = clean(current, depth + 1);
  }

  return output;
}

function parseJsonLike(text) {
  const trimmed = text.trim();
  const jsonp = trimmed.match(/^([\w.$]+)\(([\s\S]*)\);?$/);
  if (jsonp) {
    return {
      callback: jsonp[1],
      value: JSON.parse(jsonp[2])
    };
  }
  return { callback: "", value: JSON.parse(trimmed) };
}

try {
  const parsed = parseJsonLike(body);
  let cleaned = clean(parsed.value, 0);

  if (looksLikeAdItem(cleaned)) {
    cleaned = Array.isArray(cleaned) ? [] : {};
  }

  body = parsed.callback
    ? `${parsed.callback}(${JSON.stringify(cleaned)});`
    : JSON.stringify(cleaned);
} catch (e) {
  // Keep non-JSON responses untouched.
}

$done({ body });
