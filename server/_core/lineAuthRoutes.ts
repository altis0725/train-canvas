import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getLineAuthUrl, getLineToken, getLineProfile, verifyLineToken } from "./lineAuth";
import { ENV } from "./env";
import { nanoid } from "nanoid";

export function registerLineAuthRoutes(app: Express) {
    // Start Login
    app.get("/api/auth/line", (req: Request, res: Response) => {
        // Generate state for CSRF protection
        const state = nanoid();
        // Use the callback URL relative to the current host
        // Since we are behind a proxy (vite/manusOr we want to be explicit), we should use the configured OAUTH_SERVER_URL
        // If not configured, fallback to request headers (but this is risky behind proxies)
        const callbackPath = "/api/auth/line/callback";

        let baseUrl = "";
        if (ENV.oAuthServerUrl) {
            baseUrl = ENV.oAuthServerUrl;
        } else {
            const host = req.headers.host;
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            baseUrl = `${protocol}://${host}`;
        }

        const redirectUri = `${baseUrl}${callbackPath}`;

        // Store state and redirectUri in cookie to verify in callback.
        // SameSite=None で LINE ドメインからのリダイレクトでも送信されるようにする。
        const cookieOptions = {
            httpOnly: true,
            maxAge: 300000, // 5 min
            sameSite: "none" as const,
            secure: req.protocol === "https" || req.headers["x-forwarded-proto"] === "https",
        };
        res.cookie("line_auth_state", state, cookieOptions);
        res.cookie("line_redirect_uri", redirectUri, cookieOptions);

        const authUrl = getLineAuthUrl(state, redirectUri);
        res.redirect(authUrl);
    });

    // Callback
    app.get("/api/auth/line/callback", async (req: Request, res: Response) => {
        const code = req.query.code as string;
        const state = req.query.state as string;
        const error = req.query.error as string;

        const storedState = req.cookies.line_auth_state;
        const storedRedirectUri = req.cookies.line_redirect_uri;

        if (error) {
            console.error("LINE Login Error:", error, req.query.error_description);
            res.redirect("/?error=line_login_failed");
            return;
        }

        if (!code || !state || state !== storedState || !storedRedirectUri) {
            console.error("Invalid state or missing params", { code: !!code, state, storedState });
            res.status(400).send("Invalid request");
            return;
        }

        try {
            // Clear temp cookies
            res.clearCookie("line_auth_state");
            res.clearCookie("line_redirect_uri");

            const tokenData = await getLineToken(code, storedRedirectUri);

            // Verify ID Token (optional but good for getting email if in scope)
            const idTokenData = await verifyLineToken(tokenData.id_token);
            const email = idTokenData.email;

            const profile = await getLineProfile(tokenData.access_token);

            await db.upsertUser({
                openId: profile.userId,
                name: profile.displayName,
                email: email || null,
                loginMethod: "line",
                lastSignedIn: new Date(),
            });

            const sessionToken = await sdk.createSessionToken(profile.userId, {
                name: profile.displayName,
                expiresInMs: ONE_YEAR_MS,
            });

            const cookieOptions = getSessionCookieOptions(req);
            res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

            res.redirect("/");

        } catch (e: any) {
            console.error("LINE Login Callback Failed:", e.response?.data || e.message);
            res.redirect("/?error=line_login_exception");
        }
    });
}
