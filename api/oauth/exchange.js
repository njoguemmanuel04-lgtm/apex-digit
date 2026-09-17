export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, verifier } = req.body || {};

    if (!code || !verifier) {
      return res.status(400).json({
        error: "Missing authorization code or verifier."
      });
    }

    const clientId = process.env.DERIV_CLIENT_ID;
    const clientSecret = process.env.DERIV_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: "Deriv OAuth environment variables are not configured."
      });
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      code_verifier: verifier,
      redirect_uri: "https://apex-digit.vercel.app/callback"
    });

    const response = await fetch(
      "https://auth.deriv.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error_description || data.error || "OAuth exchange failed."
      });
    }

    const token = data.access_token;
    const expiresIn = Number(data.expires_in || 3600);

    res.setHeader(
      "Set-Cookie",
      `deriv_access_token=${encodeURIComponent(token)}; Max-Age=${expiresIn}; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

    return res.status(200).json({
      connected: true
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error during Deriv connection."
    });
  }
}
