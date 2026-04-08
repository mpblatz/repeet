import { type ProblemWithAttempts, formatRelativeDate } from "../lib/database";

interface ProblemCardProps {
    problem: ProblemWithAttempts;
    showRating?: boolean;
    showDelete?: boolean;
    onRate?: (problemId: string, rating: number) => void;
    onDelete?: (problemId: string) => void;
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
    onRate,
    onDelete,
    isAudit = false,
    isMasteryAttempt = false,
    rowNumber,
}: ProblemCardProps) {
    const lastAttempt = problem.attempts[problem.attempts.length - 1];

    return (
        <tr style={{
            borderBottom: "1px solid var(--divider)",
            transition: "background-color 0.15s ease",
            ...(isAudit ? { background: "color-mix(in srgb, var(--link-color) 8%, transparent)" } : {}),
        }}>
            {rowNumber !== undefined && (
                <td style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "var(--text-faint)",
                    padding: "10px 12px",
                }}>
                    {rowNumber}
                </td>
            )}

            {isAudit && (
                <td style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 10,
                    color: "var(--link-color)",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    padding: "10px 12px",
                }}>
                    AUDIT
                </td>
            )}

            {problem.queue_position && (
                <td style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "var(--text-faint)",
                    padding: "10px 12px",
                }}>
                    {problem.queue_position}
                </td>
            )}

            <td style={{
                padding: "10px 12px",
                fontWeight: isMasteryAttempt ? 500 : 400,
                fontStyle: isMasteryAttempt ? "italic" : "normal",
            }}>
                {isMasteryAttempt && (
                    <span style={{ color: "var(--link-color)", marginRight: 4 }}>★</span>
                )}
                {problem.problem_name}
                {isMasteryAttempt && (
                    <span style={{ color: "var(--link-color)", marginLeft: 4 }}>★</span>
                )}
            </td>

            <td style={{ padding: "10px 12px" }}>
                <span className={`difficulty-${problem.difficulty}`}>
                    {problem.difficulty}
                </span>
            </td>

            <td style={{
                padding: "10px 12px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--text-muted)",
            }}>
                {problem.topic || ""}
            </td>

            {lastAttempt && (
                <td style={{
                    padding: "10px 12px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "var(--text-faint)",
                }}>
                    {new Date(lastAttempt.attempted_at).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                    })}
                </td>
            )}

            {lastAttempt && (
                <td style={{
                    padding: "10px 12px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: ratingColors[lastAttempt.rating] || "var(--text-muted)",
                }}>
                    {lastAttempt.rating}
                </td>
            )}

            {problem.next_review_date && (
                <td style={{
                    padding: "10px 12px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "var(--text-muted)",
                }}>
                    {formatRelativeDate(problem.next_review_date)}
                </td>
            )}

            {problem.attempt_count > 0 && (
                <td style={{
                    padding: "10px 12px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "var(--text-faint)",
                }}>
                    {problem.attempt_count}
                </td>
            )}

            <td style={{ padding: "10px 12px" }}>
                {problem.problem_link && (
                    <a
                        href={problem.problem_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 11,
                            textDecoration: "none",
                            color: "var(--text-faint)",
                            transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--link-color)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                    >
                        Open ↗
                    </a>
                )}
            </td>

            {showRating && onRate && (
                <td style={{ padding: "10px 8px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => onRate(problem.id, rating)}
                                title={`Rate ${rating}`}
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 5,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: `color-mix(in srgb, ${ratingColors[rating]} 10%, transparent)`,
                                    color: ratingColors[rating],
                                    border: `1px solid color-mix(in srgb, ${ratingColors[rating]} 20%, transparent)`,
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `color-mix(in srgb, ${ratingColors[rating]} 20%, transparent)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = `color-mix(in srgb, ${ratingColors[rating]} 10%, transparent)`;
                                }}
                            >
                                {rating}
                            </button>
                        ))}
                    </div>
                </td>
            )}

            {showDelete && onDelete && (
                <td style={{ padding: "10px 8px" }}>
                    <button
                        onClick={() => onDelete(problem.id)}
                        title="Delete problem"
                        style={{
                            color: "var(--text-very-faint)",
                            fontSize: 13,
                            padding: "2px 6px",
                            borderRadius: 5,
                            transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--difficulty-hard)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-very-faint)")}
                    >
                        ✕
                    </button>
                </td>
            )}
        </tr>
    );
}
