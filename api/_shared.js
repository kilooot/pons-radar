const PONS = "https://www.ponsfamily.com";

function rewriteLogo(logo) {
  if (!logo) return null;
  if (logo.startsWith("ipfs://")) {
    const cid = logo.replace("ipfs://", "").replace(/^ipfs\//, "");
    return `${PONS}/api/ipfs/content/${cid}?variant=card`;
  }
  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return `${PONS}/api/token-image?src=${encodeURIComponent(logo)}`;
  }
  return logo;
}

function normalize(item) {
  if (!item || typeof item !== "object") return item;
  const factory = String(item.factory || "").toLowerCase();
  return {
    ...item,
    logoUrl: rewriteLogo(item.logo),
    version: item.version || (factory === "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e" ? "v2" : "v1"),
    ponsUrl: `${PONS}/launchpad/${item.token}`,
    explorerUrl: `https://robinhoodchain.blockscout.com/token/${item.token}`,
    creatorExplorerUrl: `https://robinhoodchain.blockscout.com/address/${item.deployer}`,
  };
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.map(normalize);
  if (!payload || typeof payload !== "object") return payload;
  const out = { ...payload };
  if (out.active?.items) out.active = { ...out.active, items: out.active.items.map(normalize) };
  if (out.graduated?.items) out.graduated = { ...out.graduated, items: out.graduated.items.map(normalize) };
  return out;
}

async function ponsGet(pathnameAndQuery) {
  const res = await fetch(`${PONS}${pathnameAndQuery}`, {
    headers: {
      accept: "application/json",
      "user-agent": "PonsRadar/1.0",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pons API ${res.status}: ${text.slice(0, 180)}`);
  }
  return normalizePayload(await res.json());
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=12, stale-while-revalidate=30");
}

module.exports = { ponsGet, setCors };
