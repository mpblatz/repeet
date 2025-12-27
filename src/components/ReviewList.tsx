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
        return <p>No problems left with a pending review. Attempt problems from your queue to populate this list.</p>;
    }

    return (
        <div>
            <div className="mb-12">
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
                            className="even:bg-surface"
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
