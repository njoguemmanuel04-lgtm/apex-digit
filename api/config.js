export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.DERIV_CLIENT_ID) {
    return res.status(500).json({
      error: "DERIV_CLIENT_ID is not configured."
    });
  }

  return res.status(200).json({
    clientId: process.env.DERIV_CLIENT_ID
  });
}
