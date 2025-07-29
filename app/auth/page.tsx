"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
    const router = useRouter();
    const [step, setStep] = React.useState<"email" | "otp">("email");
    const [email, setEmail] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [checkingAuth, setCheckingAuth] = React.useState(true);

    // Check if user is already authenticated
    React.useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await authClient.getSession();
                if (session?.data?.user) {
                    router.push("/dashboard");
                    return;
                }
            } catch (error) {
                console.error("Failed to check session:", error);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkSession();
    }, [router]);

    // Send OTP to email
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "sign-in",
            });
            setStep("otp");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to send OTP";
            setError(errorMessage);
        }
        setLoading(false);
    };

    // Sign in with OTP
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await authClient.signIn.emailOtp({
                email,
                otp,
            });
            if (!error) {
                router.push("/dashboard");
            } else {
                setError(error?.message || "Invalid OTP");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Sign in failed";
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {checkingAuth ? (
                <Card className="w-full max-w-sm">
                    <CardContent className="pt-6">
                        <div className="text-center">Checking authentication...</div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Sign In / Sign Up</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {step === "email" ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Sending OTP..." : "Send OTP"}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Verifying..." : "Verify & Sign In"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep("email")}
                                    disabled={loading}
                                >
                                    Change Email
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
