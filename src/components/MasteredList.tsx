import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface MasteredListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
}

export default function MasteredList({ problems, onRate }: MasteredListProps) {
    if (problems.length === 0) {
        return (
            <p style={{ color: "var(--text-muted)", fontFamily: "IBM Plex Sans, sans-serif" }}>
                No mastered problems yet. Keep practicing! Rate a problem 5 twice in a row to master it.
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
                Your trophy case! These problems have been rated 5 twice in a row. They may appear as random audits (10% daily chance).
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
                            <th>Problem</th>
                            <th>Difficulty</th>
                            <th>Topic</th>
                            <th>Mastered</th>
                            <th>Last Rating</th>
                            <th>Attempts</th>
                            <th>Link</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                onRate={onRate}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
