import { useState } from "react";
import { supabase } from "../lib/database";

interface AuthModalProps {
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "var(--modal-bg)",
    zIndex: 50,
    paddingTop: 80,
};

const modalCard: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "32px",
    width: 420,
    maxWidth: "90vw",
    boxShadow: "var(--shadow-hover)",
};

const labelStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
};

const btnStyle: React.CSSProperties = {
    background: "var(--btn-bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "7px 14px",
    color: "var(--text-muted)",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
};

const btnPrimary: React.CSSProperties = {
    ...btnStyle,
    background: "color-mix(in srgb, var(--link-color) 10%, transparent)",
    borderColor: "color-mix(in srgb, var(--link-color) 20%, transparent)",
    color: "var(--link-color)",
};

export default function AuthModal({ onClose, onSuccess, onError }: AuthModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormError("");

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                onSuccess("Check your email for the confirmation link!");
                onClose();
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess("Signed in successfully");
                onClose();
            }
        } catch (error: any) {
            const msg = error.message || "An error occurred";
            setFormError(msg);
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        setFormError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin },
            });
            if (error) throw error;
            // Browser redirects to Google; modal closes naturally on navigation.
        } catch (error: any) {
            const msg = error.message || "Failed to sign in with Google";
            setFormError(msg);
            onError(msg);
            setGoogleLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={modalOverlay} onClick={onClose}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <h2>{isSignUp ? "Create Account" : "Sign In"}</h2>
                    <button onClick={onClose} style={{ color: "var(--text-faint)", fontSize: 16, padding: "4px 8px" }}>
                        ✕
                    </button>
                </div>

                {formError && (
                    <div style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "color-mix(in srgb, #ef4444 8%, transparent)",
                        border: "1px solid color-mix(in srgb, #ef4444 15%, transparent)",
                        color: "#ef4444",
                        fontSize: 13,
                        marginBottom: 20,
                    }}>
                        {formError}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading}
                    style={{
                        ...btnStyle,
                        width: "100%",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: "9px 14px",
                        marginBottom: 20,
                    }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.2 3.56-8.84z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.11C3.25 21.3 7.31 24 12 24z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.28 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.4l4.01-3.11z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4.01 3.11c.95-2.83 3.6-4.94 6.72-4.94z"
                        />
                    </svg>
                    {googleLoading ? "Redirecting..." : "Continue with Google"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--divider)" }} />
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--text-very-faint)" }}>
                        OR
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--divider)" }} />
                </div>

                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label htmlFor="email" style={labelStyle}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={labelStyle}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            minLength={6}
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <button type="submit" style={btnPrimary} disabled={loading}>
                        {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
                    </button>
                </form>

                <div style={{
                    marginTop: 20,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setFormError("");
                        }}
                        style={{
                            ...btnStyle,
                            padding: "4px 10px",
                            fontSize: 11,
                        }}
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
