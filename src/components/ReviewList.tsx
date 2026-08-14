import { getTodayDate, type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface ReviewListProps {
    problems: ProblemWithAttempts[];
    auditProblem: ProblemWithAttempts | null;
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
    onEdit: (problem: ProblemWithAttempts) => void;
}

const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
};

const sectionCountStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    color: "var(--text-very-faint)",
};

function ReviewTable({
    problems,
    auditProblem,
    onRate,
    onDelete,
    onEdit,
}: {
    problems: (ProblemWithAttempts & { isMasteryAttempt: boolean })[];
    auditProblem: ProblemWithAttempts | null;
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
    onEdit: (problem: ProblemWithAttempts) => void;
}) {
    return (
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
                            rowNumber={1}
                        />
                    )}
                    {problems.map((problem, i) => (
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
                            rowNumber={auditProblem ? i + 2 : i + 1}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

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

            {(dueProblems.length > 0 || auditProblem) && (
                <div style={{ marginBottom: upcomingProblems.length > 0 ? 40 : 0 }}>
                    <div style={sectionHeaderStyle}>
                        <span style={sectionTitleStyle}>Due Now</span>
                        <span style={sectionCountStyle}>
                            {dueProblems.length + (auditProblem ? 1 : 0)}
                        </span>
                    </div>
                    <ReviewTable
                        problems={dueProblems}
                        auditProblem={auditProblem}
                        onRate={onRate}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </div>
            )}

            {upcomingProblems.length > 0 && (
                <div>
                    <div style={sectionHeaderStyle}>
                        <span style={sectionTitleStyle}>Not Due Yet</span>
                        <span style={sectionCountStyle}>{upcomingProblems.length}</span>
                    </div>
                    <ReviewTable
                        problems={upcomingProblems}
                        auditProblem={null}
                        onRate={onRate}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </div>
            )}
        </div>
    );
}
