import { useState, useEffect, useCallback } from "react";
import { supabase, type ProblemWithAttempts } from "./lib/database";
import { storage, type ProblemDifficulty } from "./lib/database";
import AuthModal from "./components/AuthModal";
import QueueList from "./components/QueueList";
import ReviewList from "./components/ReviewList";
import MasteredList from "./components/MasteredList";
import AddProblemModal from "./components/AddProblemModal";
import AddBulkProblemsModal from "./components/AddBulkProblemsModal";
import RatingGuideModal from "./components/RatingGuideModal";
import { MoonIcon, SunIcon } from "lucide-react";

type View = "queue" | "review" | "mastered";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

function getInitialTheme(): string {
    const stored = localStorage.getItem("repeet-theme");
    if (stored === "light" || stored === "dark") return stored;
    return "light";
}

function applyTheme(theme: string) {
    document.getElementById("root")?.setAttribute("data-theme", theme);
    document.documentElement.style.backgroundColor = theme === "dark" ? "#09090b" : "#f8f8f8";
    localStorage.setItem("repeet-theme", theme);
}

function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);

    const toggle = (t: string) => {
        setTheme(t);
        applyTheme(t);
    };

    return (
        <div
            style={{
                display: "flex",
                background: "var(--toggle-bg)",
                borderRadius: 8,
                padding: 3,
                gap: 2,
            }}
        >
            <button
                onClick={() => toggle("light")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 26,
                    borderRadius: 6,
                    background: theme === "light" ? "var(--toggle-active)" : "transparent",
                    boxShadow: theme === "light" ? "var(--toggle-shadow)" : "none",
                    color: theme === "light" ? "var(--text)" : "var(--text-faint)",
                    transition: "all 0.15s ease",
                }}
            >
                <SunIcon size={14} />
            </button>
            <button
                onClick={() => toggle("dark")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 26,
                    borderRadius: 6,
                    background: theme === "dark" ? "var(--toggle-active)" : "transparent",
                    boxShadow: theme === "dark" ? "var(--toggle-shadow)" : "none",
                    color: theme === "dark" ? "var(--text)" : "var(--text-faint)",
                    transition: "all 0.15s ease",
                }}
            >
                <MoonIcon size={14} />
            </button>
        </div>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="animate-fade-in"
                    style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        maxWidth: 360,
                        cursor: "pointer",
                        background:
                            toast.type === "error"
                                ? "color-mix(in srgb, #ef4444 10%, var(--card-bg))"
                                : "color-mix(in srgb, #22c55e 10%, var(--card-bg))",
                        border: `1px solid ${
                            toast.type === "error"
                                ? "color-mix(in srgb, #ef4444 20%, transparent)"
                                : "color-mix(in srgb, #22c55e 20%, transparent)"
                        }`,
                        color: toast.type === "error" ? "#ef4444" : "#22c55e",
                        boxShadow: "var(--shadow-hover)",
                    }}
                    onClick={() => onDismiss(toast.id)}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

function App() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [queueProblems, setQueueProblems] = useState<ProblemWithAttempts[]>([]);
    const [reviewProblems, setReviewProblems] = useState<ProblemWithAttempts[]>([]);
    const [masteredProblems, setMasteredProblems] = useState<ProblemWithAttempts[]>([]);
    const [auditProblem, setAuditProblem] = useState<ProblemWithAttempts | null>(null);

    const [currentView, setCurrentView] = useState<View>("review");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showRatingGuideModal, setShowRatingGuideModal] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Apply stored theme on mount
    useEffect(() => {
        applyTheme(getInitialTheme());
    }, []);

    const addToast = useCallback((message: string, type: "success" | "error") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        loadAllData();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        loadAllData();
    }, [session]);

    const loadAllData = async () => {
        setIsLoadingData(true);
        try {
            const [queue, review, mastered, _statsData, audit] = await Promise.all([
                storage.getQueueProblems(),
                storage.getReviewProblems(),
                storage.getMasteredProblems(),
                storage.getStats(),
                storage.checkDailyAudit(),
            ]);
            setQueueProblems(queue);
            setReviewProblems(review);
            setMasteredProblems(mastered);
            setAuditProblem(audit);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleAddProblem = async (problem: {
        problem_name: string;
        problem_link?: string;
        difficulty: ProblemDifficulty;
        source?: string;
        topic?: string;
    }) => {
        try {
            await storage.addProblem(problem);
            await loadAllData();
            setShowAddModal(false);
            addToast(`Added "${problem.problem_name}" to queue`, "success");
        } catch (error: any) {
            console.error("Error adding problem:", error);
            addToast(error?.message || "Failed to add problem", "error");
        }
    };

    const handleBulkAddProblems = async (
        problems: Array<{
            problem_name: string;
            problem_link?: string;
            difficulty: ProblemDifficulty;
            source?: string;
            topic?: string;
        }>,
    ) => {
        try {
            await storage.addProblems(problems);
            await loadAllData();
            setShowBulkAddModal(false);
            addToast(`Imported ${problems.length} problem${problems.length !== 1 ? "s" : ""} to queue`, "success");
        } catch (error: any) {
            console.error("Error adding problems:", error);
            addToast(error?.message || "Failed to import problems", "error");
        }
    };

    const handleRateProblem = async (problemId: string, rating: number) => {
        try {
            await storage.rateProblem(problemId, rating);
            await loadAllData();
        } catch (error: any) {
            console.error("Error rating problem:", error);
            addToast(error?.message || "Failed to rate problem", "error");
        }
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;
        try {
            await storage.deleteProblem(problemId);
            await loadAllData();
            addToast("Problem deleted", "success");
        } catch (error: any) {
            console.error("Error deleting problem:", error);
            addToast(error?.message || "Failed to delete problem", "error");
        }
    };

    const handleAuthSuccess = (message: string) => {
        addToast(message, "success");
    };

    const handleAuthError = (message: string) => {
        addToast(message, "error");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Clear local problem data so signed-out view is clean
        localStorage.removeItem("repeet-problems");
        localStorage.removeItem("repeet-audit");
        addToast("Signed out", "success");
    };

    const views: { key: View; label: string; count: number }[] = [
        { key: "review", label: "Review", count: reviewProblems.length },
        { key: "queue", label: "Queue", count: queueProblems.length },
        { key: "mastered", label: "Mastered", count: masteredProblems.length },
    ];

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    color: "var(--text-muted)",
                }}
            >
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>
                {/* Header */}
                <header
                    className="animate-fade-in-up"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}
                >
                    <h1 style={{ fontFamily: "Space Mono, monospace" }}>Repeet</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <ThemeToggle />
                        {session ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span
                                    style={{
                                        fontFamily: "JetBrains Mono, monospace",
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {session.user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        background: "var(--btn-bg)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 8,
                                        padding: "6px 12px",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                style={{
                                    background: "var(--btn-bg)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    padding: "6px 12px",
                                    color: "var(--text-muted)",
                                }}
                            >
                                Sign In to Sync
                            </button>
                        )}
                    </div>
                </header>

                {/* Navigation */}
                <nav
                    className="animate-fade-in-up"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 48,
                        flexWrap: "wrap",
                        animationDelay: "0.08s",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            background: "var(--toggle-bg)",
                            borderRadius: 8,
                            padding: 3,
                            gap: 2,
                        }}
                    >
                        {views.map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setCurrentView(v.key)}
                                style={{
                                    padding: "7px 14px",
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: currentView === v.key ? 600 : 400,
                                    background: currentView === v.key ? "var(--toggle-active)" : "transparent",
                                    boxShadow: currentView === v.key ? "var(--toggle-shadow)" : "none",
                                    color: currentView === v.key ? "var(--text)" : "var(--text-faint)",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {v.label}
                                <span
                                    style={{
                                        marginLeft: 6,
                                        fontSize: 10,
                                        color: currentView === v.key ? "var(--text-muted)" : "var(--text-very-faint)",
                                    }}
                                >
                                    {v.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1 }} />

                    {[
                        { label: "+ Add", action: () => setShowAddModal(true) },
                        { label: "+ Bulk Add", action: () => setShowBulkAddModal(true) },
                        { label: "? Guide", action: () => setShowRatingGuideModal(true) },
                    ].map((btn) => (
                        <button
                            key={btn.label}
                            onClick={btn.action}
                            style={{
                                background: "var(--btn-bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "6px 12px",
                                color: "var(--text-muted)",
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <main className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
                    {isLoadingData ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: 64,
                                color: "var(--text-faint)",
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 12,
                            }}
                        >
                            Loading problems...
                        </div>
                    ) : (
                        <>
                            {currentView === "review" && (
                                <ReviewList
                                    problems={reviewProblems}
                                    auditProblem={auditProblem}
                                    onRate={handleRateProblem}
                                />
                            )}
                            {currentView === "queue" && (
                                <QueueList
                                    problems={queueProblems}
                                    onRate={handleRateProblem}
                                    onDelete={handleDeleteProblem}
                                />
                            )}
                            {currentView === "mastered" && (
                                <MasteredList problems={masteredProblems} onRate={handleRateProblem} />
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer
                    style={{
                        marginTop: 64,
                        paddingTop: 24,
                        borderTop: "1px solid var(--divider)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 11,
                            color: "var(--text-very-faint)",
                            letterSpacing: "0.03em",
                        }}
                    >
                        Repeet — spaced repetition for LeetCode
                    </span>
                </footer>

                {showAuthModal && (
                    <AuthModal
                        onClose={() => setShowAuthModal(false)}
                        onSuccess={handleAuthSuccess}
                        onError={handleAuthError}
                    />
                )}
                {showAddModal && <AddProblemModal onClose={() => setShowAddModal(false)} onAdd={handleAddProblem} />}
                {showBulkAddModal && (
                    <AddBulkProblemsModal
                        onClose={() => setShowBulkAddModal(false)}
                        onBulkAdd={handleBulkAddProblems}
                    />
                )}
                {showRatingGuideModal && <RatingGuideModal onClose={() => setShowRatingGuideModal(false)} />}
            </div>
        </div>
    );
}

export default App;
