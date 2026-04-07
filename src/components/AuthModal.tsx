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
