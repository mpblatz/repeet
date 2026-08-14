import { useState } from "react";
import { type ProblemDifficulty, type ProblemWithAttempts } from "../lib/database";

interface EditProblemModalProps {
    problem: ProblemWithAttempts;
    onClose: () => void;
    onSave: (
        problemId: string,
        updates: {
            problem_name: string;
            problem_link?: string;
            difficulty: ProblemDifficulty;
            topic?: string;
        }
    ) => Promise<void>;
}

export default function EditProblemModal({ problem, onClose, onSave }: EditProblemModalProps) {
    const [name, setName] = useState(problem.problem_name);
    const [link, setLink] = useState(problem.problem_link || "");
    const [difficulty, setDifficulty] = useState<ProblemDifficulty>(problem.difficulty);
    const [topic, setTopic] = useState(problem.topic || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(problem.id, {
                problem_name: name,
                problem_link: link || undefined,
                difficulty,
                topic: topic || undefined,
            });
        } catch (error) {
            console.error("Error updating problem:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Problem</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div>
                        <label htmlFor="edit-problem-name" className="modal-label">
                            Problem Name <span className="modal-required">*</span>
                        </label>
                        <input
                            id="edit-problem-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Two Sum"
                            required
                            autoFocus
                            className="modal-field"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-problem-link" className="modal-label">
                            LeetCode Link
                        </label>
                        <input
                            id="edit-problem-link"
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://leetcode.com/problems/two-sum/"
                            className="modal-field"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-difficulty" className="modal-label">
                            Difficulty <span className="modal-required">*</span>
                        </label>
                        <select
                            id="edit-difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                            required
                            className="modal-field"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-topic" className="modal-label">
                            Topic
                        </label>
                        <input
                            id="edit-topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Arrays, Trees, Dynamic Programming..."
                            className="modal-field"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
