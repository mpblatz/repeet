import { useState, useEffect } from "react";
import { bulkAddProblems, supabase, type ProblemWithAttempts } from "./lib/supabase";
import {
    getQueueProblems,
    getReviewProblems,
    getMasteredProblems,
    getStats,
    checkDailyAudit,
    rateProblem,
    addProblem,
    deleteProblem,
    type ProblemDifficulty,
} from "./lib/supabase";
import Auth from "./components/Auth";
import QueueList from "./components/QueueList";
import ReviewList from "./components/ReviewList";
import MasteredList from "./components/MasteredList";
import AddProblemModal from "./components/AddProblemModal";
import StatsBar from "./components/StatsBar";
import AddBulkProblemsModal from "./components/AddBulkProblemsModal";
import RatingGuideModal from "./components/RatingGuideModal";

type View = "queue" | "review" | "mastered";

interface Stats {
    total: number;
    queued: number;
    active: number;
    mastered: number;
    dueToday: number;
    masteryRate: number;
}

function App() {
    // Auth state
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Data state
    const [queueProblems, setQueueProblems] = useState<ProblemWithAttempts[]>([]);
    const [reviewProblems, setReviewProblems] = useState<ProblemWithAttempts[]>([]);
    const [masteredProblems, setMasteredProblems] = useState<ProblemWithAttempts[]>([]);
    const [auditProblem, setAuditProblem] = useState<ProblemWithAttempts | null>(null);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        queued: 0,
        active: 0,
        mastered: 0,
        dueToday: 0,
        masteryRate: 0,
    });

    // UI state
    const [currentView, setCurrentView] = useState<View>("review");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showRatingGuideModal, setShowRatingGuideModal] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // ============================================================================
    // Auth Effects
    // ============================================================================

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load data when user logs in
    useEffect(() => {
        if (session) {
            loadAllData();
        }
    }, [session]);

    // ============================================================================
    // Data Loading
    // ============================================================================

    const loadAllData = async () => {
        setIsLoadingData(true);
        try {
            const [queue, review, mastered, statsData, audit] = await Promise.all([
                getQueueProblems(),
                getReviewProblems(),
                getMasteredProblems(),
                getStats(),
                checkDailyAudit(),
            ]);

            setQueueProblems(queue);
            setReviewProblems(review);
            setMasteredProblems(mastered);
            setStats(statsData);
            setAuditProblem(audit);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // ============================================================================
    // Problem Actions
    // ============================================================================

    const handleAddProblem = async (problem: {
        problem_name: string;
        problem_link?: string;
        difficulty: ProblemDifficulty;
        source?: string;
        topic?: string;
    }) => {
        try {
            await addProblem(problem);
            await loadAllData();
            setShowAddModal(false);
        } catch (error) {
            console.error("Error adding problem:", error);
            alert("Failed to add problem");
        }
    };

    const handleBulkAddProblems = async (
        problems: Array<{
            problem_name: string;
            problem_link?: string;
            difficulty: ProblemDifficulty;
            source?: string;
            topic?: string;
        }>
    ) => {
        try {
            await bulkAddProblems(problems);
            await loadAllData();
            setShowBulkAddModal(false);
        } catch (error) {
            console.error("Error adding problem:", error);
            alert("Failed to add problem");
        }
    };

    const handleRateProblem = async (problemId: string, rating: number) => {
        try {
            await rateProblem(problemId, rating);
            await loadAllData();
        } catch (error) {
            console.error("Error rating problem:", error);
            alert("Failed to rate problem");
        }
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;

        try {
            await deleteProblem(problemId);
            await loadAllData();
        } catch (error) {
            console.error("Error deleting problem:", error);
            alert("Failed to delete problem");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // ============================================================================
    // Render
    // ============================================================================

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!session) {
        return <Auth />;
    }

    return (
        <div className="flex w-full">
            <div className="flex flex-col space-y-8 m-20 w-full">
                {/* Header */}
                <header className="flex justify-between">
                    <p>
                        {"<"} LeetCode Tracker {"/>"}
                    </p>

                    <div className="flex space-x-4">
                        <span>{session.user.email}</span>
                        <button onClick={handleLogout}>[Logout]</button>
                    </div>
                </header>

                {/* Stats Bar */}
                <StatsBar stats={stats} />

                {/* Navigation */}
                <nav className="flex space-x-8">
                    <button
                        className={`p-2 ${currentView === "review" ? "border-1" : ""}`}
                        onClick={() => setCurrentView("review")}
                    >
                        🔄 Review ({reviewProblems.length})
                    </button>

                    <button
                        className={`p-2 ${currentView === "queue" ? "border-1" : ""}`}
                        onClick={() => setCurrentView("queue")}
                    >
                        📋 Queue ({queueProblems.length})
                    </button>

                    <button
                        className={`p-2 ${currentView === "mastered" ? "border-1" : ""}`}
                        onClick={() => setCurrentView("mastered")}
                    >
                        ✅ Mastered ({masteredProblems.length})
                    </button>

                    <button onClick={() => setShowAddModal(true)}>[ Add Problem ]</button>

                    <button onClick={() => setShowBulkAddModal(true)}>[ Bulk Add Problems ]</button>

                    <button onClick={() => setShowRatingGuideModal(true)}>[ Show Rating Guide ]</button>
                </nav>

                {/* Main Content */}
                <main className="main-content">
                    {isLoadingData ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading problems...</p>
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

                {/* Add Problem Modal */}
                {showAddModal && <AddProblemModal onClose={() => setShowAddModal(false)} onAdd={handleAddProblem} />}

                {/* Bulk Add Problems Modal */}
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
