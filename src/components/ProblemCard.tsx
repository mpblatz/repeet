import { PencilIcon, Trash2Icon } from "lucide-react";
import { type ProblemWithAttempts, formatRelativeDate } from "../lib/database";

interface ProblemCardProps {
    problem: ProblemWithAttempts;
    showRating?: boolean;
    showDelete?: boolean;
    showEdit?: boolean;
    onRate?: (problemId: string, rating: number) => void;
    onDelete?: (problemId: string) => void;
    onEdit?: (problem: ProblemWithAttempts) => void;
    isAudit?: boolean;
    isMasteryAttempt?: boolean;
    rowNumber?: number;
    className?: string;
}

const ratingColors: Record<number, string> = {
    1: "#ef4444",
    2: "#f97316",
    3: "#eab308",
    4: "#22c55e",
    5: "#10b981",
};

export default function ProblemCard({
    problem,
    showRating = false,
    showDelete = false,
    showEdit = false,
    onRate,
    onDelete,
    onEdit,
    isAudit = false,
    isMasteryAttempt = false,
    rowNumber,
}: ProblemCardProps) {
    const lastAttempt = problem.attempts[problem.attempts.length - 1];

    return (
        <tr className={`problem-row${isAudit ? " problem-row--audit" : ""}`}>
            {rowNumber !== undefined && <td className="cell-mono">{rowNumber}</td>}

            {isAudit && <td className="cell-audit-badge">AUDIT</td>}

            {problem.queue_position && <td className="cell-mono">{problem.queue_position}</td>}

            <td className={isMasteryAttempt ? "problem-name--mastery" : undefined}>
                {isMasteryAttempt && <span className="mastery-star mastery-star--left">★</span>}
                {problem.problem_name}
                {isMasteryAttempt && <span className="mastery-star mastery-star--right">★</span>}
            </td>

            <td>
                <span className={`difficulty-${problem.difficulty}`}>{problem.difficulty}</span>
            </td>

            <td className="cell-topic">{problem.topic || ""}</td>

            {lastAttempt && (
                <td className="cell-mono">
                    {new Date(lastAttempt.attempted_at).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                    })}
                </td>
            )}

            {lastAttempt && (
                <td
                    className="rating-cell"
                    style={{ "--rating-color": ratingColors[lastAttempt.rating] } as React.CSSProperties}
                >
                    {lastAttempt.rating}
                </td>
            )}

            {problem.next_review_date && <td className="cell-due">{formatRelativeDate(problem.next_review_date)}</td>}

            {problem.attempt_count > 0 && <td className="cell-mono">{problem.attempt_count}</td>}

            <td>
                {problem.problem_link && (
                    <a href={problem.problem_link} target="_blank" rel="noopener noreferrer" className="problem-link">
                        Open ↗
                    </a>
                )}
            </td>

            {showRating && onRate && (
                <td>
                    <div className="rating-buttons">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => onRate(problem.id, rating)}
                                title={`Rate ${rating}`}
                                className="rating-btn"
                                style={{ "--rating-color": ratingColors[rating] } as React.CSSProperties}
                            >
                                {rating}
                            </button>
                        ))}
                    </div>
                </td>
            )}

            {(showEdit || showDelete) && (
                <td>
                    <div className="row-actions">
                        {showEdit && onEdit && (
                            <button onClick={() => onEdit(problem)} title="Edit problem" className="icon-btn">
                                <PencilIcon size={13} />
                            </button>
                        )}
                        {showDelete && onDelete && (
                            <button
                                onClick={() => onDelete(problem.id)}
                                title="Delete problem"
                                className="icon-btn icon-btn--delete"
                            >
                                <Trash2Icon size={13} />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
}
