import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface ReviewListProps {
    problems: ProblemWithAttempts[];
    auditProblem: ProblemWithAttempts | null;
    onRate: (problemId: string, rating: number) => void;
}

export default function ReviewList({ problems, auditProblem, onRate }: ReviewListProps) {
    const problemsWithFlags = problems.map((problem) => ({
        ...problem,
        isMasteryAttempt: problem.consecutive_fives === 1 && problem.last_rating === 5,
    }));

    const totalProblems = problems.length + (auditProblem ? 1 : 0);

    if (totalProblems === 0) {
        return (
            <p style={{ color: "var(--text-muted)", fontFamily: "IBM Plex Sans, sans-serif" }}>
                No problems left with a pending review. Attempt problems from your queue to populate this list.
            </p>
        );
    }

    return (
        <div>
            <p style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginBottom: 24,
            }}>
                Complete these problems and rate yourself 1-5. Problems marked with ★ are mastery attempts.
            </p>

            <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "var(--shadow)",
            }}>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Problem</th>
                            <th>Difficulty</th>
                            <th>Topic</th>
                            <th>Last Attempt</th>
                            <th>Last Rating</th>
                            <th>Due</th>
                            <th>Attempts</th>
                            <th>Link</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditProblem && (
                            <ProblemCard problem={auditProblem} showRating={true} onRate={onRate} isAudit={true} rowNumber={1} />
                        )}
                        {problemsWithFlags.map((problem, i) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                onRate={onRate}
                                isMasteryAttempt={problem.isMasteryAttempt}
                                rowNumber={auditProblem ? i + 2 : i + 1}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
