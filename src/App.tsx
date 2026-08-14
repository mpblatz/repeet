import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, type ProblemWithAttempts } from "./lib/database";
import { storage, type ProblemDifficulty } from "./lib/database";
import AuthModal from "./components/AuthModal";
import QueueList from "./components/QueueList";
import ReviewList from "./components/ReviewList";
import MasteredList from "./components/MasteredList";
import AddProblemModal from "./components/AddProblemModal";
import AddBulkProblemsModal from "./components/AddBulkProblemsModal";
import EditProblemModal from "./components/EditProblemModal";
import DeleteAllModal from "./components/DeleteAllModal";
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
    document.documentElement.style.backgroundColor = theme === "dark" ? "#0e0e11" : "#f8f8f8";
    localStorage.setItem("repeet-theme", theme);
}

function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);

    const toggle = (t: string) => {
        setTheme(t);
        applyTheme(t);
    };

    return (
        <div className="theme-toggle">
            <button
                onClick={() => toggle("light")}
                className={`theme-toggle-btn${theme === "light" ? " active" : ""}`}
            >
                <SunIcon size={14} />
            </button>
            <button
                onClick={() => toggle("dark")}
                className={`theme-toggle-btn${theme === "dark" ? " active" : ""}`}
            >
                <MoonIcon size={14} />
            </button>
        </div>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast--${toast.type} animate-fade-in`}
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
    const previousSessionRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);

    const [queueProblems, setQueueProblems] = useState<ProblemWithAttempts[]>([]);
    const [reviewProblems, setReviewProblems] = useState<ProblemWithAttempts[]>([]);
    const [masteredProblems, setMasteredProblems] = useState<ProblemWithAttempts[]>([]);
    const [auditProblem, setAuditProblem] = useState<ProblemWithAttempts | null>(null);

    const [currentView, setCurrentView] = useState<View>("review");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showRatingGuideModal, setShowRatingGuideModal] = useState(false);
    const [editingProblem, setEditingProblem] = useState<ProblemWithAttempts | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
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

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const wasSignedOut = !previousSessionRef.current;
            previousSessionRef.current = session;
            setSession(session);
            setLoading(false);

            // Skip the initial session restore — the mount-time loadAllData() above already covers it
            if (_event === "INITIAL_SESSION") return;

            // Migrate local data when user signs in for the first time this session
            if (session && wasSignedOut && (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED")) {
                try {
                    const migrated = await storage.migrateLocalData();
                    if (migrated > 0) {
                        addToast(
                            `Merged ${migrated} local problem${migrated !== 1 ? "s" : ""} into your account`,
                            "success",
                        );
                    }
                } catch (error) {
                    console.error("Error migrating local data:", error);
                }
                loadAllData(true);
            } else if (_event === "SIGNED_OUT") {
                loadAllData(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // silent = refresh data in the background without blanking the current view
    const loadAllData = async (silent = false) => {
        if (!silent) setIsLoadingData(true);
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
            if (!silent) setIsLoadingData(false);
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
            await loadAllData(true);
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
            await loadAllData(true);
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
            await loadAllData(true);
        } catch (error: any) {
            console.error("Error rating problem:", error);
            addToast(error?.message || "Failed to rate problem", "error");
        }
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;
        try {
            await storage.deleteProblem(problemId);
            await loadAllData(true);
            addToast("Problem deleted", "success");
        } catch (error: any) {
            console.error("Error deleting problem:", error);
            addToast(error?.message || "Failed to delete problem", "error");
        }
    };

    const handleDeleteAllProblems = async () => {
        try {
            await storage.deleteAllProblems();
            await loadAllData(true);
            setShowDeleteAllModal(false);
            addToast("Deleted all problems", "success");
        } catch (error: any) {
            console.error("Error deleting all problems:", error);
            addToast(error?.message || "Failed to delete all problems", "error");
        }
    };

    const handleUpdateProblem = async (
        problemId: string,
        updates: {
            problem_name: string;
            problem_link?: string;
            difficulty: ProblemDifficulty;
            topic?: string;
        },
    ) => {
        try {
            await storage.updateProblem(problemId, updates);
            await loadAllData(true);
            setEditingProblem(null);
            addToast(`Updated "${updates.problem_name}"`, "success");
        } catch (error: any) {
            console.error("Error updating problem:", error);
            addToast(error?.message || "Failed to update problem", "error");
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
            <div className="app-loading">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <div className="app-container">
                {/* Header */}
                <header className="app-header animate-fade-in-up">
                    <h1 className="brand">Repeet</h1>
                    <div className="header-actions">
                        <ThemeToggle />
                        {session ? (
                            <div className="session-info">
                                <span className="session-email">{session.user.email}</span>
                                <button className="btn-ghost" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button className="btn-ghost" onClick={() => setShowAuthModal(true)}>
                                Sign In to Sync
                            </button>
                        )}
                    </div>
                </header>

                {/* Navigation */}
                <nav className="app-nav animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
                    <div className="view-tabs">
                        {views.map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setCurrentView(v.key)}
                                className={`view-tab${currentView === v.key ? " active" : ""}`}
                            >
                                {v.label}
                                <span className="view-tab-count">{v.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="nav-spacer" />

                    {[
                        { label: "+ Add", action: () => setShowAddModal(true) },
                        { label: "+ Bulk Add", action: () => setShowBulkAddModal(true) },
                        { label: "? Rating Guide", action: () => setShowRatingGuideModal(true) },
                    ].map((btn) => (
                        <button key={btn.label} className="btn-ghost" onClick={btn.action}>
                            {btn.label}
                        </button>
                    ))}

                    {queueProblems.length + reviewProblems.length + masteredProblems.length > 0 && (
                        <button className="btn-ghost-danger" onClick={() => setShowDeleteAllModal(true)}>
                            Delete All
                        </button>
                    )}
                </nav>

                {/* Main Content */}
                <main className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
                    {isLoadingData ? (
                        <div className="loading-state">Loading problems...</div>
                    ) : (
                        <>
                            {currentView === "review" && (
                                <ReviewList
                                    problems={reviewProblems}
                                    auditProblem={auditProblem}
                                    onRate={handleRateProblem}
                                    onDelete={handleDeleteProblem}
                                    onEdit={setEditingProblem}
                                />
                            )}
                            {currentView === "queue" && (
                                <QueueList
                                    problems={queueProblems}
                                    onRate={handleRateProblem}
                                    onDelete={handleDeleteProblem}
                                    onEdit={setEditingProblem}
                                />
                            )}
                            {currentView === "mastered" && (
                                <MasteredList
                                    problems={masteredProblems}
                                    onRate={handleRateProblem}
                                    onDelete={handleDeleteProblem}
                                    onEdit={setEditingProblem}
                                />
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="app-footer">
                    <span className="footer-text">Repeet — spaced repetition for LeetCode</span>
                    <span className="footer-text">
                        Great companion to{" "}
                        <a href="https://neetcode.io" target="_blank" rel="noopener noreferrer">
                            neetcode.io
                        </a>
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
                {editingProblem && (
                    <EditProblemModal
                        problem={editingProblem}
                        onClose={() => setEditingProblem(null)}
                        onSave={handleUpdateProblem}
                    />
                )}
                {showDeleteAllModal && (
                    <DeleteAllModal
                        count={queueProblems.length + reviewProblems.length + masteredProblems.length}
                        onClose={() => setShowDeleteAllModal(false)}
                        onConfirm={handleDeleteAllProblems}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
