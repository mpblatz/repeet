import { useState } from "react";
import { supabase } from "../lib/database";

interface AuthModalProps {
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export default function AuthModal({ onClose, onError }: AuthModalProps) {
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formError, setFormError] = useState("");

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
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Sign In</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {formError && <div className="modal-error">{formError}</div>}

                <p className="modal-copy">Sign in with Google to sync your problems across devices.</p>

                <button type="button" className="btn btn-full" onClick={handleGoogleAuth} disabled={googleLoading}>
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
            </div>
        </div>
    );
}
