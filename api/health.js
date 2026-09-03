module.exports = (_req, res) => {
  res.status(200).json({ ok: true, service: "pons-radar", time: new Date().toISOString() });
};
