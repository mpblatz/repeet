import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface ReviewListProps {
    problems: ProblemWithAttempts[];
    auditProblem: ProblemWithAttempts | null;
    onRate: (problemId: string, rating: number) => void;
}

export default function ReviewList({ problems, auditProblem, onRate }: ReviewListProps) {
    // Check if problems are mastery attempts (last rating was 5, consecutive_fives = 1)
    const problemsWithFlags = problems.map((problem) => ({
        ...problem,
        isMasteryAttempt: problem.consecutive_fives === 1 && problem.last_rating === 5,
    }));

    const totalProblems = problems.length + (auditProblem ? 1 : 0);

    if (totalProblems === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>All Done!</h3>
                <p>No problems due today. Check back tomorrow or add new problems to your queue.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-12">
                <h2>
                    Review — {totalProblems} {totalProblems === 1 ? "Problem" : "Problems"} Due Today
                </h2>
                <p>Complete these problems and rate yourself 1-5. Problems marked with ★ are mastery attempts.</p>
            </div>

            {/* Audit Problem (shown first if exists) */}
            {auditProblem && <ProblemCard problem={auditProblem} showRating={true} onRate={onRate} isAudit={true} />}
            <table className="w-fit border-collapse text-center">
                <thead>
                    <tr className="border-b border-white">
                        <th className="w-96">Problem</th>
                        <th className="w-32">Difficulty</th>
                        <th className="w-48">Topic</th>
                        <th className="w-48">Last Attempt</th>
                        <th className="w-48">Last Rating</th>
                        <th className="w-32">Due Date</th>
                        <th className="w-48"># of Attempts</th>
                        <th className="w-48">Link</th>
                        <th className="w-24">Rate</th>
                        <th className="w-16"></th>
                    </tr>
                </thead>
                <tbody>
                    {/* Regular Review Problems */}
                    {problemsWithFlags.map((problem) => (
                        <ProblemCard
                            key={problem.id}
                            problem={problem}
                            showRating={true}
                            onRate={onRate}
                            isMasteryAttempt={problem.isMasteryAttempt}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
