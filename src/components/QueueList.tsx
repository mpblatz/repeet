import { type ProblemWithAttempts } from "../lib/supabase";
import ProblemCard from "./ProblemCard";

interface QueueListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
}

export default function QueueList({ problems, onRate, onDelete }: QueueListProps) {
    if (problems.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Queue is Empty</h3>
                <p>Add problems to your queue to get started. Try importing Neetcode 150 or Grind 75!</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-12">
                <h2>
                    Queue — {problems.length} {problems.length === 1 ? "Problem" : "Problems"}
                </h2>
                <p className="list-description">
                    These are problems you haven't attempted yet. Work through them in order, or jump ahead to any
                    problem.
                </p>
            </div>
            <table className="w-fit border-collapse text-center">
                <thead>
                    <tr className="border-b border-white">
                        <th className="text-left py-2 px-4 w-16">#</th>
                        <th className="w-96">Problem</th>
                        <th className="w-24">Difficulty</th>
                        <th className="w-80">Topic</th>
                        <th className="w-32">Link</th>
                        <th className="w-48">Rate</th>
                        <th className="w-16"></th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem) => (
                        <ProblemCard
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
    );
}
