const { ponsGet, setCors } = require("./_shared");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const data = await ponsGet("/api/pons-launches/graduations?catalog=1&v=12");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "upstream_failed", message: String(err.message || err) });
  }
};
