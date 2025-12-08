import { SignJWT } from "jose";

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

async function generateToken() {
    const secretStr = "train_canvas_secret_key_2025";
    const appId = "train-canvas-app";
    const secretKey = new TextEncoder().encode(secretStr);

    const token = await new SignJWT({
        openId: "test-user-id",
        appId: appId,
        name: "Test User",
    })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
        .sign(secretKey);

    console.log(token);
}

generateToken().catch(console.error);
