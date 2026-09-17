export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { code, verifier } = req.body || {};

    if (!code || !verifier) {
      return res.status(400).json({
        error: "Missing authorization code or PKCE verifier."
      });
    }

    const clientId = process.env.DERIV_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        error: "DERIV_CLIENT_ID is not configured."
      });
    }

    const redirectUri = "https://apex-digit.vercel.app/callback";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: code,
      code_verifier: verifier,
      redirect_uri: redirectUri
    });

    const tokenResponse = await fetch(
      "https://auth.deriv.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    const data = await tokenResponse.json();

    if (!tokenResponse.ok || !data.access_token) {
      return res.status(400).json({
        error: data.error || "Token exchange failed.",
        details: data.error_description || null
      });
    }

    const maxAge = Number(data.expires_in || 3600);

    res.setHeader(
      "Set-Cookie",
      `deriv_access_token=${encodeURIComponent(data.access_token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

    return res.status(200).json({
      connected: true
    });
  } catch (error) {
    return res.status(500).json({
      error: "OAuth exchange failed.",
      details: error.message
    });
  }
}
