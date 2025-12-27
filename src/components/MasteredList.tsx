import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface MasteredListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
}

export default function MasteredList({ problems, onRate }: MasteredListProps) {
    if (problems.length === 0) {
        return <p>No mastered problems yet. Keep practicing! Rate a problem 5 twice in a row to master it.</p>;
    }

    return (
        <div>
            <div className="mb-12">
                <p>
                    Your trophy case! These problems have been rated 5 twice in a row. They may appear as random audits
                    (10% daily chance).
                </p>
            </div>

            <table className="w-fit border-collapse text-center">
                <thead>
                    <tr className="border-b border-white">
                        <th className="w-64">Problem</th>
                        <th className="w-24">Difficulty</th>
                        <th className="w-32">Topic</th>
                        <th className="w-48">Mastered Date</th>
                        <th className="w-48">Last Rating</th>
                        <th className="w-48"># of Attempts</th>
                        <th className="w-32">Link</th>
                        <th className="w-48">Rate</th>
                        <th className="w-16"></th>
                    </tr>
                </thead>
                <tbody></tbody>
                {problems.map((problem) => (
                    <ProblemCard
                        key={problem.id}
                        problem={problem}
                        showRating={true}
                        onRate={onRate}
                        className="even:bg-surface"
                    />
                ))}
            </table>
        </div>
    );
}
