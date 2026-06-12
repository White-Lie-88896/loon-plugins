/*
Sunlogin / Oray UI campaign cleaner for Loon.
Capture-confirmed targets:
- client-api-v2.oray.com/materials/* returns UI campaigns.
- slapi.oray.net/message/usercases returns discovery articles.

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

try {
  const parsed = parseJsonLike(body);
  const obj = parsed.value;

  if (/^https:\/\/client-api-v2\.oray\.com\/materials\//i.test(url)) {
    if (obj && typeof obj === "object") {
      obj.campaigns = [];
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

  body = writeJson(parsed, obj);
} catch (e) {
  // Keep non-JSON responses untouched.
}

$done({ body });
