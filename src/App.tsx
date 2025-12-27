import { useState, useEffect } from "react";
import { supabase, type ProblemWithAttempts } from "./lib/database";
import { storage, type ProblemDifficulty } from "./lib/database";
import AuthModal from "./components/AuthModal";
import QueueList from "./components/QueueList";
import ReviewList from "./components/ReviewList";
import MasteredList from "./components/MasteredList";
import AddProblemModal from "./components/AddProblemModal";
import AddBulkProblemsModal from "./components/AddBulkProblemsModal";
import RatingGuideModal from "./components/RatingGuideModal";

type View = "queue" | "review" | "mastered";

function App() {
    // Auth state
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Data state
    const [queueProblems, setQueueProblems] = useState<ProblemWithAttempts[]>([]);
    const [reviewProblems, setReviewProblems] = useState<ProblemWithAttempts[]>([]);
    const [masteredProblems, setMasteredProblems] = useState<ProblemWithAttempts[]>([]);
    const [auditProblem, setAuditProblem] = useState<ProblemWithAttempts | null>(null);

    // UI state
    const [currentView, setCurrentView] = useState<View>("review");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showRatingGuideModal, setShowRatingGuideModal] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // ============================================================================
    // Auth Effects
    // ============================================================================

    useEffect(() => {
        loadAllData();

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

    useEffect(() => {
        loadAllData();
    }, [session]);

    // ============================================================================
    // Data Loading
    // ============================================================================

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
            await storage.addProblem(problem);
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
            await storage.addProblems(problems);
            await loadAllData();
            setShowBulkAddModal(false);
        } catch (error) {
            console.error("Error adding problem:", error);
            alert("Failed to add problem");
        }
    };

    const handleRateProblem = async (problemId: string, rating: number) => {
        try {
            await storage.rateProblem(problemId, rating);
            await loadAllData();
        } catch (error) {
            console.error("Error rating problem:", error);
            alert("Failed to rate problem");
        }
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;

        try {
            await storage.deleteProblem(problemId);
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

    return (
        <div className="flex w-full bg-bg text-text">
            <div className="flex flex-col space-y-8 m-20 w-full">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <p>Repeet</p>
                    <div>
                        {session ? (
                            <div className="flex space-x-8 items-center">
                                <span className="text-accent">{session.user.email}</span>
                                <button className="bg-surface py-2 px-4 rounded-md" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button className="bg-surface py-2 px-4 rounded-md" onClick={() => setShowAuthModal(true)}>
                                Sign In to Sync
                            </button>
                        )}
                    </div>
                </header>

                {/* Navigation */}
                <nav className="flex space-x-8">
                    <button
                        className={`py-2 px-4 rounded-md ${
                            currentView === "review" ? "border-2 border-accent text-accent" : ""
                        }`}
                        onClick={() => setCurrentView("review")}
                    >
                        Review ({reviewProblems.length})
                    </button>

                    <button
                        className={`py-2 px-4 rounded-md ${
                            currentView === "queue" ? "border-2 border-accent text-accent" : ""
                        }`}
                        onClick={() => setCurrentView("queue")}
                    >
                        Queue ({queueProblems.length})
                    </button>

                    <button
                        className={`py-2 px-4 rounded-md ${
                            currentView === "mastered" ? "border-2 border-accent text-accent" : ""
                        }`}
                        onClick={() => setCurrentView("mastered")}
                    >
                        Mastered ({masteredProblems.length})
                    </button>

                    <button className="bg-surface py-2 px-4 rounded-md" onClick={() => setShowAddModal(true)}>
                        Add Problem
                    </button>

                    <button className="bg-surface py-2 px-4 rounded-md" onClick={() => setShowBulkAddModal(true)}>
                        Bulk Add Problems
                    </button>

                    <button className="bg-surface py-2 px-4 rounded-md" onClick={() => setShowRatingGuideModal(true)}>
                        Show Rating Guide
                    </button>
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

                {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

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
