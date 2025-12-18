import { type ProblemWithAttempts, formatRelativeDate } from "../lib/supabase";

interface ProblemCardProps {
    problem: ProblemWithAttempts;
    showRating?: boolean;
    showDelete?: boolean;
    onRate?: (problemId: string, rating: number) => void;
    onDelete?: (problemId: string) => void;
    isAudit?: boolean;
    isMasteryAttempt?: boolean;
}

export default function ProblemCard({
    problem,
    showRating = false,
    showDelete = false,
    onRate,
    onDelete,
    isAudit = false,
    isMasteryAttempt = false,
}: ProblemCardProps) {
    const lastAttempt = problem.attempts[problem.attempts.length - 1];

    return (
        <tr className={`${isAudit ? "bg-amber-900" : ""}`}>
            {isAudit && <span>🔍 AUDIT</span>}

            {problem.queue_position && <td className="mr-8">{problem.queue_position}</td>}

            <td className={`py-4 ${isMasteryAttempt ? "italic" : ""}`}>
                {isMasteryAttempt && "★ "}
                {problem.problem_name}
                {isMasteryAttempt && " ★"}
            </td>

            <td className={`difficulty-${problem.difficulty}`}>{problem.difficulty}</td>

            {problem.topic ? <td>{problem.topic}</td> : <td></td>}

            {lastAttempt && (
                <td>
                    {new Date(lastAttempt.attempted_at).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                    })}
                </td>
            )}

            {lastAttempt && <td>{lastAttempt.rating}</td>}

            {problem.next_review_date && <td>{formatRelativeDate(problem.next_review_date)}</td>}

            {problem.attempt_count > 0 && <td>{problem.attempt_count}</td>}

            <td>
                {problem.problem_link && (
                    <a href={problem.problem_link} target="_blank" rel="noopener noreferrer" className="problem-link">
                        [ Open 🔗 ]
                    </a>
                )}
            </td>

            {showRating && onRate && (
                <td className="flex px-1 py-4 justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                            key={rating}
                            className={`rating-btn rating-btn-${rating} px-1`}
                            onClick={() => onRate(problem.id, rating)}
                            title={`Rate ${rating}`}
                        >
                            {rating}
                        </button>
                    ))}
                </td>
            )}

            {showDelete && onDelete && (
                <td>
                    <button className="px-1" onClick={() => onDelete(problem.id)} title="Delete problem">
                        🗑️
                    </button>
                </td>
            )}
        </tr>
    );
}
