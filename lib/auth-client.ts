import { createAuthClient } from "better-auth/react";
import { emailOTPClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://glados.zeedonk-ratio.ts.net",
    plugins: [
        emailOTPClient(),
        adminClient()
    ]
});
