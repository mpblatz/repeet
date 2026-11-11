import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

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

export interface NewProblem {
    problem_name: string;
    problem_link?: string;
    difficulty: ProblemDifficulty;
    source?: string;
    topic?: string;
}

export interface ProblemUpdates {
    problem_name: string;
    problem_link?: string;
    difficulty: ProblemDifficulty;
    topic?: string;
}

export interface LoadedData {
    problems: ProblemWithAttempts[];
    auditProblemId: string | null;
}

// ============================================================================
// Pure Helper Functions
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

/**
 * Apply a rating to a problem, returning the updated problem with the new attempt appended
 */
export const applyRating = (problem: ProblemWithAttempts, rating: number): ProblemWithAttempts => {
    const attempt: Attempt = {
        id: crypto.randomUUID(),
        problem_id: problem.id,
        rating,
        attempted_at: new Date().toISOString(),
        notes: null,
        time_spent_minutes: null,
    };

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

    return {
        ...problem,
        attempts: [...problem.attempts, attempt],
        status: newStatus,
        queue_position: newStatus === "queued" ? problem.queue_position : null,
        next_review_date: newStatus === "mastered" ? null : calculateNextReview(rating),
        attempt_count: (problem.attempt_count || 0) + 1,
        consecutive_fives: newConsecutiveFives,
        last_rating: rating,
        mastered_at:
            newStatus === "mastered" && problem.status !== "mastered" ? new Date().toISOString() : problem.mastered_at,
    };
};

const getLastAttempt = (problem: ProblemWithAttempts): Attempt | undefined =>
    problem.attempts[problem.attempts.length - 1];

/**
 * Split problems into the queue, review, and mastered lists, each in display order
 */
export const partitionProblems = (problems: ProblemWithAttempts[]) => {
    const queue = problems
        .filter((p) => p.status === "queued")
        .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));

    // Sort by next review date, then (stably) by earliest last attempt, then lower rating
    const review = problems
        .filter((p) => p.status === "active")
        .sort((a, b) => (a.next_review_date || "").localeCompare(b.next_review_date || ""))
        .sort((a, b) => {
            const aLastAttempt = getLastAttempt(a);
            const bLastAttempt = getLastAttempt(b);

            if (aLastAttempt && bLastAttempt) {
                const dateCompare =
                    new Date(aLastAttempt.attempted_at).getTime() - new Date(bLastAttempt.attempted_at).getTime();
                if (dateCompare !== 0) return dateCompare;
                return aLastAttempt.rating - bLastAttempt.rating;
            }
            return 0;
        });

    const mastered = problems
        .filter((p) => p.status === "mastered")
        .sort((a, b) => {
            const aDate = a.mastered_at ? new Date(a.mastered_at).getTime() : 0;
            const bDate = b.mastered_at ? new Date(b.mastered_at).getTime() : 0;
            return bDate - aDate;
        });

    return { queue, review, mastered };
};

/**
 * Roll for today's audit (10% chance), picking a random mastered problem
 */
const pickAuditProblemId = (problems: ProblemWithAttempts[]): string | null => {
    if (Math.random() >= 0.1) return null;
    const mastered = problems.filter((p) => p.status === "mastered");
    if (mastered.length === 0) return null;
    return mastered[Math.floor(Math.random() * mastered.length)].id;
};

/**
 * Fields that change when a problem is rated
 */
const ratingFields = (problem: ProblemWithAttempts) => ({
    status: problem.status,
    queue_position: problem.queue_position,
    next_review_date: problem.next_review_date,
    attempt_count: problem.attempt_count,
    consecutive_fives: problem.consecutive_fives,
    last_rating: problem.last_rating,
    mastered_at: problem.mastered_at,
});

// ============================================================================
// API Functions - Problems
// ============================================================================

/**
 * Get all problems for the current user, with attempts embedded, in a single request
 */
const getAllProblems = async (): Promise<ProblemWithAttempts[]> => {
    const { data, error } = await supabase
        .from("problems")
        .select("*, attempts(*)")
        .order("created_at", { ascending: true })
        .order("attempted_at", { referencedTable: "attempts", ascending: true });

    if (error) throw error;
    return (data || []) as ProblemWithAttempts[];
};

const getNextQueuePosition = async (): Promise<number> => {
    const { data } = await supabase
        .from("problems")
        .select("queue_position")
        .eq("status", "queued")
        .order("queue_position", { ascending: false })
        .limit(1);

    return (data?.[0]?.queue_position || 0) + 1;
};

/**
 * Add problems to the end of the queue
 */
const addProblems = async (userId: string, problems: NewProblem[]): Promise<ProblemWithAttempts[]> => {
    const startPosition = await getNextQueuePosition();

    const problemsToInsert = problems.map((problem, index) => ({
        user_id: userId,
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
    return (data || []).map((p) => ({ ...p, attempts: [] }));
};

/**
 * Persist a problem that has already had applyRating() applied
 */
const saveRating = async (problem: ProblemWithAttempts): Promise<void> => {
    const attempt = getLastAttempt(problem)!;

    const [{ error: attemptError }, { error: updateError }] = await Promise.all([
        supabase.from("attempts").insert({
            id: attempt.id,
            problem_id: problem.id,
            rating: attempt.rating,
            notes: attempt.notes,
            attempted_at: attempt.attempted_at,
        }),
        supabase.from("problems").update(ratingFields(problem)).eq("id", problem.id),
    ]);

    if (attemptError) throw attemptError;
    if (updateError) throw updateError;
};

/**
 * Delete a problem and all its attempts
 */
const deleteProblem = async (problemId: string): Promise<void> => {
    const { error } = await supabase.from("problems").delete().eq("id", problemId);

    if (error) throw error;
};

/**
 * Delete every problem (and their attempts) belonging to the user
 */
const deleteAllProblems = async (userId: string): Promise<void> => {
    const { error } = await supabase.from("problems").delete().eq("user_id", userId);

    if (error) throw error;
};

/**
 * Update a problem's editable fields
 */
const updateProblem = async (problemId: string, updates: ProblemUpdates): Promise<void> => {
    const { error } = await supabase
        .from("problems")
        .update({
            problem_name: updates.problem_name,
            problem_link: updates.problem_link || null,
            difficulty: updates.difficulty,
            topic: updates.topic || null,
        })
        .eq("id", problemId);

    if (error) throw error;
};

// ============================================================================
// API Functions - User Settings
// ============================================================================

const getUserSettings = async (): Promise<UserSettings | null> => {
    const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();

    if (error) throw error;
    return data;
};

const upsertUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
    const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        ...settings,
    });

    if (error) throw error;
};

// ============================================================================
// Storage Abstraction Layer (Supabase OR localStorage)
// ============================================================================

// Logs how long a storage call takes in dev, to track down slow requests
const timed = async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (!import.meta.env.DEV) return fn();
    const start = performance.now();
    try {
        return await fn();
    } finally {
        console.log(`[repeet] ${label}: ${Math.round(performance.now() - start)}ms`);
    }
};

const LOCAL_PROBLEMS_KEY = "repeet-problems";
const LOCAL_AUDIT_KEY = "repeet-audit";

class StorageAdapter {
    // Signed-in user, kept in sync by the app's auth listener so no call needs an auth round trip
    private userId: string | null = null;
    private resolveReady!: () => void;
    private ready = new Promise<void>((resolve) => (this.resolveReady = resolve));

    setUser(userId: string | null): void {
        if (import.meta.env.DEV) {
            console.log(`[repeet] auth resolved (${userId ? "signed in" : "signed out"}) at ${Math.round(performance.now())}ms`);
        }
        this.userId = userId;
        this.resolveReady();
    }

    // Resolves to the user id, or null when signed out (localStorage mode)
    private async getUserId(): Promise<string | null> {
        await this.ready;
        return this.userId;
    }

    // ========== localStorage helpers ==========

    private getLocalProblems(): ProblemWithAttempts[] {
        const data = localStorage.getItem(LOCAL_PROBLEMS_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveLocalProblems(problems: ProblemWithAttempts[]): void {
        localStorage.setItem(LOCAL_PROBLEMS_KEY, JSON.stringify(problems));
    }

    // ========== Public API (works with both Supabase and localStorage) ==========

    /**
     * Load every problem plus today's audit, rolling a new audit on the first load of the day
     */
    async loadAll(): Promise<LoadedData> {
        const userId = await this.getUserId();
        const today = getTodayDate();

        if (userId) {
            const [problems, settings] = await Promise.all([
                timed("load problems", getAllProblems),
                timed("load settings", getUserSettings),
            ]);

            if (settings?.last_audit_date === today) {
                return { problems, auditProblemId: settings.audit_problem_id };
            }

            // Save today's roll in the background rather than holding up the first render
            const auditProblemId = pickAuditProblemId(problems);
            upsertUserSettings(userId, { last_audit_date: today, audit_problem_id: auditProblemId }).catch((error) =>
                console.error("Error saving daily audit:", error),
            );
            return { problems, auditProblemId };
        } else {
            const problems = this.getLocalProblems();
            const storedAudit = localStorage.getItem(LOCAL_AUDIT_KEY);
            const auditData = storedAudit ? JSON.parse(storedAudit) : null;

            if (auditData?.last_audit_date === today) {
                return { problems, auditProblemId: auditData.audit_problem_id };
            }

            const auditProblemId = pickAuditProblemId(problems);
            localStorage.setItem(
                LOCAL_AUDIT_KEY,
                JSON.stringify({ last_audit_date: today, audit_problem_id: auditProblemId }),
            );
            return { problems, auditProblemId };
        }
    }

    async addProblem(problem: NewProblem): Promise<ProblemWithAttempts> {
        const [added] = await this.addProblems([problem]);
        return added;
    }

    async addProblems(problemsList: NewProblem[]): Promise<ProblemWithAttempts[]> {
        const userId = await this.getUserId();
        if (userId) {
            return addProblems(userId, problemsList);
        } else {
            const existingProblems = this.getLocalProblems();
            const maxPosition = Math.max(...existingProblems.map((p) => p.queue_position || 0), 0);

            const newProblems: ProblemWithAttempts[] = problemsList.map((problem, index) => ({
                id: crypto.randomUUID(),
                user_id: "local",
                problem_name: problem.problem_name,
                problem_link: problem.problem_link || null,
                difficulty: problem.difficulty,
                status: "queued",
                queue_position: maxPosition + 1 + index,
                next_review_date: null,
                attempt_count: 0,
                consecutive_fives: 0,
                last_rating: null,
                created_at: new Date().toISOString(),
                mastered_at: null,
                source: problem.source || null,
                topic: problem.topic || null,
                attempts: [],
            }));

            this.saveLocalProblems([...existingProblems, ...newProblems]);
            return newProblems;
        }
    }

    /**
     * Persist a problem that has already had applyRating() applied
     */
    async rateProblem(ratedProblem: ProblemWithAttempts): Promise<void> {
        if (await this.getUserId()) {
            return timed("save rating", () => saveRating(ratedProblem));
        } else {
            const problems = this.getLocalProblems();
            this.saveLocalProblems(problems.map((p) => (p.id === ratedProblem.id ? ratedProblem : p)));
        }
    }

    async deleteProblem(problemId: string): Promise<void> {
        if (await this.getUserId()) {
            return deleteProblem(problemId);
        } else {
            const problems = this.getLocalProblems();
            this.saveLocalProblems(problems.filter((p) => p.id !== problemId));
        }
    }

    async deleteAllProblems(): Promise<void> {
        const userId = await this.getUserId();
        if (userId) {
            return deleteAllProblems(userId);
        } else {
            this.saveLocalProblems([]);
            localStorage.removeItem(LOCAL_AUDIT_KEY);
        }
    }

    async updateProblem(problemId: string, updates: ProblemUpdates): Promise<void> {
        if (await this.getUserId()) {
            return updateProblem(problemId, updates);
        } else {
            const problems = this.getLocalProblems();
            this.saveLocalProblems(
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
            );
        }
    }

    /**
     * Migrate local problems to Supabase after sign-in/sign-up.
     * Returns the number of problems migrated, or 0 if none.
     */
    async migrateLocalData(): Promise<number> {
        const localProblems = this.getLocalProblems();
        if (localProblems.length === 0) return 0;

        const userId = await this.getUserId();
        if (!userId) return 0;

        let nextPosition = await getNextQueuePosition();

        const problemsToInsert = localProblems.map((p) => ({
            user_id: userId,
            problem_name: p.problem_name,
            problem_link: p.problem_link,
            difficulty: p.difficulty,
            status: p.status,
            queue_position: p.status === "queued" ? nextPosition++ : null,
            next_review_date: p.next_review_date,
            attempt_count: p.attempt_count,
            consecutive_fives: p.consecutive_fives,
            last_rating: p.last_rating,
            created_at: p.created_at,
            mastered_at: p.mastered_at,
            source: p.source,
            topic: p.topic,
        }));

        const { data: insertedProblems, error } = await supabase.from("problems").insert(problemsToInsert).select();

        if (error) throw error;

        // Migrate attempts - map old local IDs to new server IDs
        if (insertedProblems) {
            const attemptsToInsert = localProblems.flatMap((localProblem, i) =>
                (localProblem.attempts || []).map((attempt) => ({
                    problem_id: insertedProblems[i].id,
                    rating: attempt.rating,
                    attempted_at: attempt.attempted_at,
                    notes: attempt.notes,
                    time_spent_minutes: attempt.time_spent_minutes,
                })),
            );

            if (attemptsToInsert.length > 0) {
                await supabase.from("attempts").insert(attemptsToInsert);
            }
        }

        // Clear local data after successful migration
        localStorage.removeItem(LOCAL_PROBLEMS_KEY);
        localStorage.removeItem(LOCAL_AUDIT_KEY);

        return localProblems.length;
    }
}

// Export the storage adapter instance
export const storage = new StorageAdapter();
