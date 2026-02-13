export interface PaydayConfig {
    clientId: string;
    authUrl: string;
    tokenUrl: string;
    redirectUri: string;
    secretKey?: string;
}

export interface PaydayTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
    created_at?: number;
}
