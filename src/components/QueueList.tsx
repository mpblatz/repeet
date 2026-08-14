import { type ProblemWithAttempts } from "../lib/database";
import ProblemCard from "./ProblemCard";

interface QueueListProps {
    problems: ProblemWithAttempts[];
    onRate: (problemId: string, rating: number) => void;
    onDelete: (problemId: string) => void;
    onEdit: (problem: ProblemWithAttempts) => void;
}

export default function QueueList({ problems, onRate, onDelete, onEdit }: QueueListProps) {
    if (problems.length === 0) {
        return (
            <p className="empty-state">
                Add problems to your queue to get started. Try importing Neetcode 150 or Grind 75!
            </p>
        );
    }

    return (
        <div>
            <p className="list-description">
                These are problems you haven't attempted yet. Work through them in order, or jump ahead to any problem.
            </p>

            <div className="list-card">
                <table>
                    <thead>
                        <tr>
                            <th className="col-narrow">#</th>
                            <th>Problem</th>
                            <th>Difficulty</th>
                            <th>Topic</th>
                            <th>Link</th>
                            <th>Rate</th>
                            <th className="col-actions"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                showRating={true}
                                showDelete={true}
                                showEdit={true}
                                onRate={onRate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
