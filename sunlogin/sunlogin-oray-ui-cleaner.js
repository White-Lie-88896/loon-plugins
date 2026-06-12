/*
Sunlogin / Oray UI campaign cleaner for Loon.
Capture-confirmed targets:
- client-api-v2.oray.com/materials/* returns UI campaigns.
- slapi.oray.net/message/usercases returns discovery articles.
- api-std.sunlogin.oray.com/advertisement/frequency returns ad slot frequency.
- slapi.oray.net/experience can enable full-screen/fallback ad presentation.

It intentionally avoids api-std.sunlogin.oray.com remote/session/login APIs.
*/

let body = $response.body || "";
const url = ($request && $request.url) || "";

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

function writeJson(parsed, value) {
  return parsed.callback
    ? `${parsed.callback}(${JSON.stringify(value)});`
    : JSON.stringify(value);
}

function emptyAdContainers(value) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value.campaigns)) value.campaigns = [];
  if (Array.isArray(value.advertisements)) value.advertisements = [];
  if (Array.isArray(value.advertisement)) value.advertisement = [];
  if (Array.isArray(value.medias)) value.medias = [];
  if (Array.isArray(value.materials)) value.materials = [];
  if (Array.isArray(value.banners)) value.banners = [];
  if (Array.isArray(value.ads)) value.ads = [];
  if (Array.isArray(value.adlist)) value.adlist = [];
  if (Array.isArray(value.ad_list)) value.ad_list = [];

  for (const child of Object.values(value)) {
    if (child && typeof child === "object") emptyAdContainers(child);
  }
}

function disableAdFrequency(obj) {
  if (!obj || typeof obj !== "object") return;

  obj.ad_sunlight_quantity = 0;
  obj.quantity = 0;
  obj.frequency = 0;
  obj.delay = 0;

  if (obj.ad_keys && typeof obj.ad_keys === "object") {
    for (const value of Object.values(obj.ad_keys)) {
      if (value && typeof value === "object") {
        value.frequency = 0;
        value.quantity = 0;
        value.delay = 0;
        value.third_id = "";
      }
    }
  }
}

function disableExperience(obj) {
  if (!obj || typeof obj !== "object") return;

  const containers = [obj, obj.data, obj.datas].filter((item) => item && typeof item === "object");
  for (const item of containers) {
    item.enable = 0;
    item.welfare = 0;
    item.experience = 0;
    item.advertype = "";
    item.ad_type = "";
    item.type = item.type === "fullscreen" ? "" : item.type;
  }
}

try {
  const parsed = parseJsonLike(body);
  const obj = parsed.value;

  if (/^https:\/\/api-std\.sunlogin\.oray\.com\/advertisement\/frequency/i.test(url)) {
    disableAdFrequency(obj);
  }

  if (/^https:\/\/client-api-v2\.oray\.com\/materials\//i.test(url)) {
    if (obj && typeof obj === "object") {
      obj.campaigns = [];
      emptyAdContainers(obj);
    }
  }

  if (/^https:\/\/slapi\.oray\.net\/message\/usercases/i.test(url)) {
    if (obj && obj.datas && Array.isArray(obj.datas.messages)) {
      obj.datas.messages = [];
    }
    if (obj && obj.data && Array.isArray(obj.data.messages)) {
      obj.data.messages = [];
    }
    if (obj && obj.datas && typeof obj.datas === "object") {
      obj.datas.redpoint = 0;
      obj.datas.hasmore = 0;
    }
  }

  if (/^https:\/\/slapi\.oray\.net\/experience/i.test(url)) {
    disableExperience(obj);
  }

  body = writeJson(parsed, obj);
} catch (e) {
  // Keep non-JSON responses untouched.
}

$done({ body });
