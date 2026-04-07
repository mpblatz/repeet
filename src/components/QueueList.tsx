import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface QueueListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
}

export default function QueueList({ problems, onRate, onDelete }: QueueListProps) {
    if (problems.length === 0) {
        return (
            <p style={{ color: "var(--text-muted)", fontFamily: "IBM Plex Sans, sans-serif" }}>
                Add problems to your queue to get started. Try importing Neetcode 150 or Grind 75!
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
                These are problems you haven't attempted yet. Work through them in order, or jump ahead to any problem.
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
                            <th style={{ width: 50 }}>#</th>
                            <th>Problem</th>
                            <th>Difficulty</th>
                            <th>Topic</th>
                            <th>Link</th>
                            <th>Rate</th>
                            <th style={{ width: 40 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                showDelete={true}
                                onRate={onRate}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
