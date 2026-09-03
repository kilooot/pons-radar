const { ponsGet, setCors } = require("./_shared");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const url = new URL(req.url, "http://localhost");
    const sort = url.searchParams.get("sort") || "marketCap";
    const age = url.searchParams.get("age") || "all";
    const page = url.searchParams.get("page") || "1";
    const pageSize = url.searchParams.get("pageSize") || "50";
    const includeGraduated = url.searchParams.get("includeGraduated") || "0";
    const version = url.searchParams.get("version") || "all";
    const qs = new URLSearchParams({
      explore: "1",
      sort,
      age,
      page,
      pageSize,
      graduatedPage: "1",
      graduatedPageSize: includeGraduated === "1" ? pageSize : "12",
      includeGraduated,
      version,
      v: "22",
    });
    const data = await ponsGet(`/api/pons-launches?${qs.toString()}`);
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "upstream_failed", message: String(err.message || err) });
  }
};
