const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const PONS = "https://www.ponsfamily.com";
const PUBLIC_DIR = path.join(__dirname, "public");
const CACHE_MS = 12_000;
const cache = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, Object.assign({
    "content-length": payload.length,
    "cache-control": "no-store",
  }, headers || {}));
  res.end(payload);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "content-type": "application/json; charset=utf-8" });
}

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        accept: "application/json",
        "user-agent": "PonsRadar/1.0",
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error("Pons API " + res.statusCode + ": " + data.slice(0, 180)));
      });
    });
    req.setTimeout(18000, () => { req.destroy(new Error("upstream timeout")); });
    req.on("error", reject);
  });
}

function rewriteLogo(logo) {
  if (!logo) return null;
  if (logo.startsWith("ipfs://")) {
    const cid = logo.replace("ipfs://", "").replace(/^ipfs\//, "");
    return PONS + "/api/ipfs/content/" + cid + "?variant=card";
  }
  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return PONS + "/api/token-image?src=" + encodeURIComponent(logo);
  }
  return logo;
}

function normalize(item) {
  if (!item || typeof item !== "object") return item;
  const factory = String(item.factory || "").toLowerCase();
  return Object.assign({}, item, {
    logoUrl: rewriteLogo(item.logo),
    version: item.version || (factory === "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e" ? "v2" : "v1"),
    ponsUrl: PONS + "/launchpad/" + item.token,
    explorerUrl: "https://robinhoodchain.blockscout.com/token/" + item.token,
    creatorExplorerUrl: "https://robinhoodchain.blockscout.com/address/" + item.deployer,
  });
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.map(normalize);
  if (!payload || typeof payload !== "object") return payload;
  const out = Object.assign({}, payload);
  if (out.active && out.active.items) out.active = Object.assign({}, out.active, { items: out.active.items.map(normalize) });
  if (out.graduated && out.graduated.items) out.graduated = Object.assign({}, out.graduated, { items: out.graduated.items.map(normalize) });
  return out;
}

async function ponsGet(pathnameAndQuery) {
  const cached = cacheGet(pathnameAndQuery);
  if (cached) return cached;
  const raw = await fetchText(PONS + pathnameAndQuery);
  const json = normalizePayload(JSON.parse(raw));
  cache.set(pathnameAndQuery, { at: Date.now(), data: json });
  return json;
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "forbidden");
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "not found");
    send(res, 200, data, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));

  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "pons-radar", time: new Date().toISOString() });
  }

  try {
    if (url.pathname === "/api/launches") {
      const sort = url.searchParams.get("sort") || "marketCap";
      const age = url.searchParams.get("age") || "all";
      const page = url.searchParams.get("page") || "1";
      const pageSize = url.searchParams.get("pageSize") || "50";
      const includeGraduated = url.searchParams.get("includeGraduated") || "0";
      const version = url.searchParams.get("version") || "all";
      const qs = new URLSearchParams({
        explore: "1",
        sort: sort,
        age: age,
        page: page,
        pageSize: pageSize,
        graduatedPage: "1",
        graduatedPageSize: includeGraduated === "1" ? pageSize : "12",
        includeGraduated: includeGraduated,
        version: version,
        v: "22",
      });
      const data = await ponsGet("/api/pons-launches?" + qs.toString());
      return sendJson(res, 200, data);
    }

    if (url.pathname === "/api/graduations") {
      const data = await ponsGet("/api/pons-launches/graduations?catalog=1&v=12");
      return sendJson(res, 200, data);
    }
  } catch (err) {
    return sendJson(res, 502, { error: "upstream_failed", message: String(err.message || err) });
  }

  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Pons Radar running on http://localhost:" + PORT);
});
