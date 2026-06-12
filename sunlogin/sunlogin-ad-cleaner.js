/*
Sunlogin / Oray ad response cleaner for Loon.
Purpose: remove splash, popup, banner, promotion, and feed ad objects.
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
  "bannerad",
  "bannerads",
  "displayad",
  "displayads",
  "feedad",
  "feedads",
  "floatad",
  "floatads",
  "floatingad",
  "insertad",
  "interstitialad",
  "launchad",
  "launchads",
  "marketingad",
  "marketingads",
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
  "promotionad",
  "promotionads",
  "recommendad",
  "recommendads",
  "splashad",
  "splashads",
  "startad",
  "startupad",
  "startupads",
  "topad",
  "topads"
]);

const adValue = /^(ad|ads|advert|advertise|advertisement|banner_ad|feed_ad|insert_ad|interstitial|marketing|open_ad|open_screen_ad|popup_ad|pop_ad|promo|promotion|recommend_ad|splash|splash_ad|start_ad|startup_ad)$/i;
const adText = /(\u5e7f\u544a|\u63a8\u5e7f|\u5f00\u5c4f|\u5f39\u7a97|\u8fd0\u8425\u4f4d|\u8425\u9500|\u6d3b\u52a8\u5165\u53e3)/;

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

  const nameKeys = ["name", "title", "desc", "description", "label"];
  for (const key of nameKeys) {
    const current = value[key];
    if (typeof current === "string" && adText.test(current)) return true;
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

