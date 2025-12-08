import axios from "axios";
import { ENV } from "./env";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export interface LineTokenResponse {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
}

export interface LineProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
    email?: string;
}

export function getLineAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: ENV.lineChannelId,
        redirect_uri: redirectUri,
        state: state,
        scope: "profile openid email",
    });
    return `${LINE_AUTH_URL}?${params.toString()}`;
}

export async function getLineToken(
    code: string,
    redirectUri: string
): Promise<LineTokenResponse> {
    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: ENV.lineChannelId,
        client_secret: ENV.lineChannelSecret,
    });

    const response = await axios.post<LineTokenResponse>(
        LINE_TOKEN_URL,
        params,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data;
}

export async function getLineProfile(accessToken: string): Promise<LineProfile> {
    const response = await axios.get<LineProfile>(LINE_PROFILE_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.data;
}

export async function verifyLineToken(idToken: string): Promise<any> {
    const params = new URLSearchParams({
        id_token: idToken,
        client_id: ENV.lineChannelId,
    });
    const response = await axios.post(LINE_VERIFY_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    return response.data;
}
