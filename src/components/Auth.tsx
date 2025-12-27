import { useState } from "react";
import { supabase } from "../lib/database";

export default function Auth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setError(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen">
            <div className="flex flex-col m-auto border-1 p-10 space-y-8">
                <div>
                    <p>
                        {"<"}Repeet{"/>"}
                    </p>
                    <p>Master problems through spaced repetition</p>
                </div>

                <h2>{isSignUp ? "Create Account" : "Sign In"}</h2>

                {error && <div>{error}</div>}
                {message && <div>{message}</div>}

                <form onSubmit={handleAuth} className="space-y-4 w-full">
                    <div className="flex space-x-4">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            className="border-1 px-2 w-full"
                        />
                    </div>

                    <div className="flex space-x-4">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            minLength={6}
                            className="border-1 px-2 w-full"
                        />
                    </div>

                    <button className="mt-4 btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Loading..." : isSignUp ? "[ Sign Up ]" : "[ Sign In ]"}
                    </button>
                </form>

                <div>
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError("");
                            setMessage("");
                        }}
                    >
                        {isSignUp ? "[ Sign In ]" : "[ Sign Up ]"}
                    </button>
                </div>
            </div>
        </div>
    );
}
