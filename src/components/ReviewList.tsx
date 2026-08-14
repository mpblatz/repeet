import { getTodayDate, type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface ReviewListProps {
    problems: ProblemWithAttempts[];
    auditProblem: ProblemWithAttempts | null;
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
    onEdit: (problem: ProblemWithAttempts) => void;
}

const COLUMN_COUNT = 11;

export default function ReviewList({ problems, auditProblem, onRate, onDelete, onEdit }: ReviewListProps) {
    const today = getTodayDate();

    const problemsWithFlags = problems.map((problem) => ({
        ...problem,
        isMasteryAttempt: problem.consecutive_fives === 1 && problem.last_rating === 5,
    }));

    const dueProblems = problemsWithFlags.filter((p) => !p.next_review_date || p.next_review_date <= today);
    const upcomingProblems = problemsWithFlags.filter((p) => p.next_review_date && p.next_review_date > today);

    const totalProblems = problems.length + (auditProblem ? 1 : 0);

    if (totalProblems === 0) {
        return (
            <p style={{ color: "var(--text-muted)", fontFamily: "IBM Plex Sans, sans-serif" }}>
                No problems left with a pending review. Attempt problems from your queue to populate this list.
            </p>
        );
    }

    let rowNumber = 0;

    return (
        <div>
            <p
                style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    marginBottom: 24,
                }}
            >
                Complete these problems and rate yourself 1-5. Problems marked with ★ are mastery attempts.
            </p>

            <div
                style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "var(--shadow)",
                }}
            >
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
                            <th style={{ width: 60 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditProblem && (
                            <ProblemCard
                                problem={auditProblem}
                                showRating={true}
                                showDelete={true}
                                showEdit={true}
                                onRate={onRate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                isAudit={true}
                                rowNumber={++rowNumber}
                            />
                        )}
                        {dueProblems.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                showDelete={true}
                                showEdit={true}
                                onRate={onRate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                isMasteryAttempt={problem.isMasteryAttempt}
                                rowNumber={++rowNumber}
                            />
                        ))}

                        {dueProblems.length > 0 && upcomingProblems.length > 0 && (
                            <tr aria-hidden="true">
                                <td
                                    colSpan={COLUMN_COUNT}
                                    style={{
                                        padding: 0,
                                        borderBottom:
                                            "2px solid color-mix(in srgb, var(--link-color) 45%, transparent)",
                                    }}
                                />
                            </tr>
                        )}

                        {upcomingProblems.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                showDelete={true}
                                showEdit={true}
                                onRate={onRate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                isMasteryAttempt={problem.isMasteryAttempt}
                                rowNumber={++rowNumber}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
