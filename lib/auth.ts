
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { emailOTP, admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      // Generate hardcoded OTP for testing
      generateOTP: () => {
        if (process.env.TEST_ENV === "development") {
          console.log("[TESTING] Generated hardcoded OTP: 123456");
          return "123456";
        }
        // For production, generate a random 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`Send OTP ${otp} to ${email} for ${type}`);
        if (process.env.TEST_ENV === "development") {
          console.log(`[TESTING] Use this OTP to verify: ${otp}`);
        }
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
