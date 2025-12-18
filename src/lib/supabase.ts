import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Check your .env.local file.");
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TypeScript Types
// ============================================================================

export type ProblemStatus = "queued" | "active" | "mastered";
export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
    id: string;
    user_id: string;
    problem_name: string;
    problem_link: string | null;
    difficulty: ProblemDifficulty;
    status: ProblemStatus;
    queue_position: number | null;
    next_review_date: string | null;
    attempt_count: number;
    consecutive_fives: number;
    last_rating: number | null;
    created_at: string;
    mastered_at: string | null;
    source: string | null;
    topic: string | null;
}

export interface Attempt {
    id: string;
    problem_id: string;
    rating: number;
    attempted_at: string;
    notes: string | null;
    time_spent_minutes: number | null;
}

export interface UserSettings {
    user_id: string;
    last_audit_date: string | null;
    audit_problem_id: string | null;
    daily_goal: number;
    enable_audits: boolean;
    theme: string;
}

// Problem with attempts included
export interface ProblemWithAttempts extends Problem {
    attempts: Attempt[];
}

// ============================================================================
// Database Helper Functions
// ============================================================================

/**
 * Calculate next review date based on rating (1-5 days)
 */
export const calculateNextReview = (rating: number): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextReview = new Date(today);
    nextReview.setDate(nextReview.getDate() + rating);
    return nextReview.toISOString().split("T")[0];
};

/**
 * Format date relative to today (e.g., "Today", "In 3 days", "2 days ago")
 */
export const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
    return new Date().toISOString().split("T")[0];
};

// ============================================================================
// API Functions - Problems
// ============================================================================

/**
 * Get all problems for the current user
 */
export const getAllProblems = async (): Promise<ProblemWithAttempts[]> => {
    const { data: problems, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: true });

    if (problemsError) throw problemsError;

    // Fetch attempts for each problem
    const problemsWithAttempts = await Promise.all(
        (problems || []).map(async (problem) => {
            const { data: attempts } = await supabase
                .from("attempts")
                .select("*")
                .eq("problem_id", problem.id)
                .order("attempted_at", { ascending: true });

            return { ...problem, attempts: attempts || [] } as ProblemWithAttempts;
        })
    );

    return problemsWithAttempts;
};

/**
 * Get queue problems (never attempted, ordered by position)
 */
export const getQueueProblems = async (): Promise<ProblemWithAttempts[]> => {
    const { data: problems, error } = await supabase
        .from("problems")
        .select("*")
        .eq("status", "queued")
        .order("queue_position", { ascending: true });

    if (error) throw error;

    return (problems || []).map((p) => ({ ...p, attempts: [] }));
};

/**
 * Get review problems (active and due today or earlier)
 */
export const getReviewProblems = async (): Promise<ProblemWithAttempts[]> => {
    const { data: problems, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .eq("status", "active")
        .order("next_review_date", { ascending: true });

    if (problemsError) throw problemsError;

    // Fetch attempts for sorting
    const problemsWithAttempts = await Promise.all(
        (problems || []).map(async (problem) => {
            const { data: attempts } = await supabase
                .from("attempts")
                .select("*")
                .eq("problem_id", problem.id)
                .order("attempted_at", { ascending: true });

            return { ...problem, attempts: attempts || [] } as ProblemWithAttempts;
        })
    );

    // Sort by: earliest last attempt, then lower rating
    return problemsWithAttempts.sort((a, b) => {
        const aLastAttempt = a.attempts[a.attempts.length - 1];
        const bLastAttempt = b.attempts[b.attempts.length - 1];

        if (aLastAttempt && bLastAttempt) {
            const dateCompare =
                new Date(aLastAttempt.attempted_at).getTime() - new Date(bLastAttempt.attempted_at).getTime();
            if (dateCompare !== 0) return dateCompare;
            return aLastAttempt.rating - bLastAttempt.rating;
        }
        return 0;
    });
};

/**
 * Get mastered problems
 */
export const getMasteredProblems = async (): Promise<ProblemWithAttempts[]> => {
    const { data: problems, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .eq("status", "mastered")
        .order("mastered_at", { ascending: false });

    if (problemsError) throw problemsError;

    const problemsWithAttempts = await Promise.all(
        (problems || []).map(async (problem) => {
            const { data: attempts } = await supabase
                .from("attempts")
                .select("*")
                .eq("problem_id", problem.id)
                .order("attempted_at", { ascending: true });

            return { ...problem, attempts: attempts || [] } as ProblemWithAttempts;
        })
    );

    return problemsWithAttempts;
};

/**
 * Add a new problem to the queue
 */
export const addProblem = async (problem: {
    problem_name: string;
    problem_link?: string;
    difficulty: ProblemDifficulty;
    source?: string;
    topic?: string;
}): Promise<Problem> => {
    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");

    // Get max queue position
    const { data: maxPosData } = await supabase
        .from("problems")
        .select("queue_position")
        .eq("status", "queued")
        .order("queue_position", { ascending: false })
        .limit(1);

    const nextPosition = (maxPosData?.[0]?.queue_position || 0) + 1;

    const { data, error } = await supabase
        .from("problems")
        .insert({
            user_id: user.id,
            problem_name: problem.problem_name,
            problem_link: problem.problem_link || null,
            difficulty: problem.difficulty,
            status: "queued",
            queue_position: nextPosition,
            source: problem.source || null,
            topic: problem.topic || null,
            attempt_count: 0,
            consecutive_fives: 0,
        })
        .select()
        .single();
    console.log("marshall: ", data, error);
    if (error) throw error;
    return data;
};

/**
 * Add multiple problems to the queue at once
 */
export const addProblems = async (
    problems: Array<{
        problem_name: string;
        problem_link?: string;
        difficulty: ProblemDifficulty;
        source?: string;
        topic?: string;
    }>
): Promise<Problem[]> => {
    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");

    // Get max queue position
    const { data: maxPosData } = await supabase
        .from("problems")
        .select("queue_position")
        .eq("status", "queued")
        .order("queue_position", { ascending: false })
        .limit(1);

    const startPosition = (maxPosData?.[0]?.queue_position || 0) + 1;

    // Prepare all problems for insertion
    const problemsToInsert = problems.map((problem, index) => ({
        user_id: user.id,
        problem_name: problem.problem_name,
        problem_link: problem.problem_link || null,
        difficulty: problem.difficulty,
        status: "queued" as ProblemStatus,
        queue_position: startPosition + index,
        source: problem.source || null,
        topic: problem.topic || null,
        attempt_count: 0,
        consecutive_fives: 0,
    }));

    const { data, error } = await supabase.from("problems").insert(problemsToInsert).select();

    if (error) throw error;
    return data;
};

/**
 * Rate a problem after attempting it
 */
export const rateProblem = async (problemId: string, rating: number, notes?: string): Promise<void> => {
    // Get current problem state
    const { data: problem, error: problemError } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .single();

    if (problemError) throw problemError;

    // Add attempt record
    const { error: attemptError } = await supabase.from("attempts").insert({
        problem_id: problemId,
        rating,
        notes: notes || null,
        attempted_at: new Date().toISOString(),
    });

    if (attemptError) throw attemptError;

    // Calculate next review date
    const nextReviewDate = calculateNextReview(rating);

    // Update consecutive fives and status
    let newConsecutiveFives = problem.consecutive_fives || 0;
    let newStatus = problem.status;

    if (rating === 5) {
        newConsecutiveFives += 1;
        if (newConsecutiveFives >= 2) {
            newStatus = "mastered";
        }
    } else {
        newConsecutiveFives = 0;
    }

    // Determine new status if first attempt
    if (problem.status === "queued") {
        newStatus = "active";
    }

    // Update problem
    const { error: updateError } = await supabase
        .from("problems")
        .update({
            status: newStatus,
            queue_position: newStatus === "queued" ? problem.queue_position : null,
            next_review_date: newStatus === "mastered" ? null : nextReviewDate,
            attempt_count: (problem.attempt_count || 0) + 1,
            consecutive_fives: newConsecutiveFives,
            last_rating: rating,
            mastered_at:
                newStatus === "mastered" && problem.status !== "mastered"
                    ? new Date().toISOString()
                    : problem.mastered_at,
        })
        .eq("id", problemId);

    if (updateError) throw updateError;
};

/**
 * Delete a problem and all its attempts
 */
export const deleteProblem = async (problemId: string): Promise<void> => {
    const { error } = await supabase.from("problems").delete().eq("id", problemId);

    if (error) throw error;
};

/**
 * Bulk add problems (e.g., import Neetcode 150)
 */
export const bulkAddProblems = async (
    problems: Array<{
        problem_name: string;
        difficulty: ProblemDifficulty;
        problem_link?: string;
        source?: string;
        topic?: string;
    }>
): Promise<void> => {
    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");

    // Get max queue position
    const { data: maxPosData } = await supabase
        .from("problems")
        .select("queue_position")
        .eq("status", "queued")
        .order("queue_position", { ascending: false })
        .limit(1);

    const startPosition = (maxPosData?.[0]?.queue_position || 0) + 1;

    // Prepare bulk insert
    const problemsToInsert = problems.map((problem, index) => ({
        user_id: user.id,
        problem_name: problem.problem_name,
        problem_link: problem.problem_link || null,
        difficulty: problem.difficulty,
        status: "queued" as ProblemStatus,
        queue_position: startPosition + index,
        source: problem.source || null,
        topic: problem.topic || null,
        attempt_count: 0,
        consecutive_fives: 0,
    }));

    const { error } = await supabase.from("problems").insert(problemsToInsert);

    if (error) throw error;
};

// ============================================================================
// API Functions - User Settings
// ============================================================================

/**
 * Get user settings
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
    const { data, error } = await supabase.from("user_settings").select("*").single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data;
};

/**
 * Update or create user settings
 */
export const upsertUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        ...settings,
    });

    if (error) throw error;
};

/**
 * Check for daily audit (10% chance)
 */
export const checkDailyAudit = async (): Promise<ProblemWithAttempts | null> => {
    const today = getTodayDate();
    const settings = await getUserSettings();

    // Already checked today
    if (settings?.last_audit_date === today) {
        if (settings.audit_problem_id) {
            const { data } = await supabase.from("problems").select("*").eq("id", settings.audit_problem_id).single();
            return data;
        }
        return null;
    }

    // 10% chance for audit
    if (Math.random() < 0.1) {
        const { data: masteredProblems } = await supabase.from("problems").select("*").eq("status", "mastered");

        if (masteredProblems && masteredProblems.length > 0) {
            const randomProblem = masteredProblems[Math.floor(Math.random() * masteredProblems.length)];

            await upsertUserSettings({
                last_audit_date: today,
                audit_problem_id: randomProblem.id,
            });

            return randomProblem;
        }
    }

    // No audit today
    await upsertUserSettings({
        last_audit_date: today,
        audit_problem_id: null,
    });

    return null;
};

// ============================================================================
// Stats Functions
// ============================================================================

/**
 * Get stats for dashboard
 */
export const getStats = async () => {
    const [allProblems, reviewProblems] = await Promise.all([getAllProblems(), getReviewProblems()]);

    const queueCount = allProblems.filter((p) => p.status === "queued").length;
    const activeCount = allProblems.filter((p) => p.status === "active").length;
    const masteredCount = allProblems.filter((p) => p.status === "mastered").length;

    return {
        total: allProblems.length,
        queued: queueCount,
        active: activeCount,
        mastered: masteredCount,
        dueToday: reviewProblems.length,
        masteryRate:
            activeCount + masteredCount > 0 ? Math.round((masteredCount / (activeCount + masteredCount)) * 100) : 0,
    };
};
