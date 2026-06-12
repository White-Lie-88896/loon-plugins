/*
Sunlogin / Oray safe ad response cleaner for Loon.
Purpose: remove obvious splash, popup, banner, promotion, and notice payloads.
It intentionally avoids device, session, membership, subscription, license, account,
remote-control, relay, tunnel, login, and auth fields.
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
  "banner",
  "banners",
  "bannerad",
  "bannerads",
  "bannerlist",
  "carousel",
  "carousels",
  "displayad",
  "displayads",
  "floatad",
  "floatads",
  "floatingad",
  "insertad",
  "interstitialad",
  "launchad",
  "launchads",
  "marketingad",
  "marketingads",
  "marquee",
  "marquees",
  "notice",
  "noticebar",
  "notices",
  "openscreenad",
  "openad",
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
  "rollnotice",
  "rollingnotice",
  "splashad",
  "splashads",
  "startad",
  "startupad",
  "startupads",
  "swiper",
  "swipers",
  "topad",
  "topads"
]);

const adValue = /^(ad|ads|advert|advertise|advertisement|banner|banner_ad|carousel|display_ad|float_ad|insert_ad|interstitial|launch_ad|marketing|marquee|notice|open_ad|open_screen_ad|popup_ad|pop_ad|promo|promotion|splash|splash_ad|start_ad|startup_ad|swiper)$/i;
const adText = /(\u5e7f\u544a|\u63a8\u5e7f|\u5f00\u5c4f|\u5f39\u7a97|\u8fd0\u8425\u4f4d|\u8425\u9500|\u6d3b\u52a8\u5165\u53e3|618|\u8d85\u7ea7\u4f1a\u5458|\u66f4\u9ad8\u5e27\u7387|\u66f4\u4f4e\u5ef6\u8fdf)/;

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
    "materialType"
  ];

  for (const key of typeKeys) {
    const current = value[key];
    if (typeof current === "string" && (adValue.test(current) || adText.test(current))) {
      return true;
    }
  }

  const textKeys = ["name", "title", "desc", "description", "label", "content", "text"];
  for (const key of textKeys) {
    const current = value[key];
    if (typeof current === "string" && adText.test(current)) return true;
  }

  return false;
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
  const cleaned = clean(parsed.value, 0);
  body = parsed.callback
    ? `${parsed.callback}(${JSON.stringify(cleaned)});`
    : JSON.stringify(cleaned);
} catch (e) {
  // Keep non-JSON responses untouched.
}

$done({ body });
