import { type ProblemWithAttempts } from "../lib/supabase";
import ProblemCard from "./ProblemCard";

interface MasteredListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
}

export default function MasteredList({ problems, onRate }: MasteredListProps) {
    if (problems.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No Mastered Problems Yet</h3>
                <p>Keep practicing! Rate a problem 5 twice in a row to master it.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-12">
                <h2>
                    Mastered — {problems.length} {problems.length === 1 ? "Problem" : "Problems"}
                </h2>
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
                    <ProblemCard key={problem.id} problem={problem} showRating={true} onRate={onRate} />
                ))}
            </table>
        </div>
    );
}
