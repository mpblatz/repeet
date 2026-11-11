import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import {
    supabase,
    storage,
    applyRating,
    partitionProblems,
    type ProblemWithAttempts,
    type NewProblem,
    type ProblemUpdates,
} from "./lib/database";
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

// Last data seen while signed in, so the app can render instantly while it refreshes
const CACHE_KEY = "repeet-cache";

interface CachedData {
    email: string | undefined;
    problems: ProblemWithAttempts[];
    auditProblemId: string | null;
}

function readCache(): CachedData | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
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
    const [cache] = useState(readCache);
    const [session, setSession] = useState<Session | null>(null);
    const previousSessionRef = useRef<Session | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    // Only block on a loading screen when there's no cached data to show
    const [loading, setLoading] = useState(!cache);
    const loadIdRef = useRef(0);

    const [problems, setProblems] = useState<ProblemWithAttempts[]>(cache?.problems ?? []);
    const [auditProblemId, setAuditProblemId] = useState<string | null>(cache?.auditProblemId ?? null);

    const [currentView, setCurrentView] = useState<View>("review");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showRatingGuideModal, setShowRatingGuideModal] = useState(false);
    const [editingProblem, setEditingProblem] = useState<ProblemWithAttempts | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const {
        queue: queueProblems,
        review: reviewProblems,
        mastered: masteredProblems,
    } = useMemo(() => partitionProblems(problems), [problems]);
    const auditProblem = useMemo(
        () => problems.find((p) => p.id === auditProblemId) ?? null,
        [problems, auditProblemId],
    );

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

    // Refresh data in the background; results from an older, superseded load are dropped
    const loadAllData = useCallback(async () => {
        const loadId = ++loadIdRef.current;
        try {
            const data = await storage.loadAll();
            if (loadId !== loadIdRef.current) return;
            setProblems(data.problems);
            setAuditProblemId(data.auditProblemId);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            if (loadId === loadIdRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const wasSignedOut = !previousSessionRef.current;
            previousSessionRef.current = session;
            storage.setUser(session?.user.id ?? null);
            setSession(session);
            setAuthResolved(true);

            // Defer Supabase calls out of the auth callback — awaiting them inside it can deadlock the client
            setTimeout(async () => {
                if (_event === "INITIAL_SESSION") {
                    loadAllData();
                } else if (session && wasSignedOut && (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED")) {
                    // Migrate local data when user signs in for the first time this session
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
                    loadAllData();
                } else if (_event === "SIGNED_OUT") {
                    loadAllData();
                }
            }, 0);
        });
        return () => subscription.unsubscribe();
    }, [loadAllData, addToast]);

    // Keep the startup cache in sync with what a signed-in user is looking at
    useEffect(() => {
        if (!authResolved) return;
        if (session) {
            const data: CachedData = { email: session.user.email, problems, auditProblemId };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(CACHE_KEY);
        }
    }, [authResolved, session, problems, auditProblemId]);

    // Show a change immediately, then persist it; on failure roll back and resync from storage
    const applyOptimistic = async (
        next: ProblemWithAttempts[],
        persist: () => Promise<void>,
        errorMessage: string,
    ): Promise<boolean> => {
        const previous = problems;
        setProblems(next);
        try {
            await persist();
            return true;
        } catch (error: any) {
            console.error(`${errorMessage}:`, error);
            setProblems(previous);
            addToast(error?.message || errorMessage, "error");
            loadAllData();
            return false;
        }
    };

    const handleAddProblem = async (problem: NewProblem) => {
        try {
            const added = await storage.addProblem(problem);
            setProblems((prev) => [...prev, added]);
            setShowAddModal(false);
            addToast(`Added "${problem.problem_name}" to queue`, "success");
        } catch (error: any) {
            console.error("Error adding problem:", error);
            addToast(error?.message || "Failed to add problem", "error");
        }
    };

    const handleBulkAddProblems = async (newProblems: NewProblem[]) => {
        try {
            const added = await storage.addProblems(newProblems);
            setProblems((prev) => [...prev, ...added]);
            setShowBulkAddModal(false);
            addToast(
                `Imported ${newProblems.length} problem${newProblems.length !== 1 ? "s" : ""} to queue`,
                "success",
            );
        } catch (error: any) {
            console.error("Error adding problems:", error);
            addToast(error?.message || "Failed to import problems", "error");
        }
    };

    const handleRateProblem = async (problemId: string, rating: number) => {
        const problem = problems.find((p) => p.id === problemId);
        if (!problem) return;
        const rated = applyRating(problem, rating);
        await applyOptimistic(
            problems.map((p) => (p.id === problemId ? rated : p)),
            () => storage.rateProblem(rated),
            "Failed to rate problem",
        );
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;
        const ok = await applyOptimistic(
            problems.filter((p) => p.id !== problemId),
            () => storage.deleteProblem(problemId),
            "Failed to delete problem",
        );
        if (ok) addToast("Problem deleted", "success");
    };

    const handleDeleteAllProblems = async () => {
        setShowDeleteAllModal(false);
        const ok = await applyOptimistic([], () => storage.deleteAllProblems(), "Failed to delete all problems");
        if (ok) addToast("Deleted all problems", "success");
    };

    const handleUpdateProblem = async (problemId: string, updates: ProblemUpdates) => {
        setEditingProblem(null);
        const ok = await applyOptimistic(
            problems.map((p) =>
                p.id === problemId
                    ? {
                          ...p,
                          problem_name: updates.problem_name,
                          problem_link: updates.problem_link || null,
                          difficulty: updates.difficulty,
                          topic: updates.topic || null,
                      }
                    : p,
            ),
            () => storage.updateProblem(problemId, updates),
            "Failed to update problem",
        );
        if (ok) addToast(`Updated "${updates.problem_name}"`, "success");
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

    // Until auth resolves, assume the cached user is still signed in
    const email = authResolved ? session?.user.email : cache?.email;

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
                        {email ? (
                            <div className="session-info">
                                <span className="session-email">{email}</span>
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

                    {problems.length > 0 && (
                        <button className="btn-ghost-danger" onClick={() => setShowDeleteAllModal(true)}>
                            Delete All
                        </button>
                    )}
                </nav>

                {/* Main Content */}
                <main className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
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
                        count={problems.length}
                        onClose={() => setShowDeleteAllModal(false)}
                        onConfirm={handleDeleteAllProblems}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
