import { useState } from "react";
import { type ProblemDifficulty } from "../lib/database";

interface AddProblemModalProps {
    onClose: () => void;
    onAdd: (problem: {
        problem_name: string;
        problem_link?: string;
        difficulty: ProblemDifficulty;
        source?: string;
        topic?: string;
    }) => Promise<void>;
}

export default function AddProblemModal({ onClose, onAdd }: AddProblemModalProps) {
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [difficulty, setDifficulty] = useState<ProblemDifficulty>("Easy");
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd({
                problem_name: name,
                problem_link: link || undefined,
                difficulty,
                topic: topic || undefined,
                source: "custom",
            });
        } catch (error) {
            console.error("Error adding problem:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Problem</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div>
                        <label htmlFor="problem-name" className="modal-label">
                            Problem Name <span className="modal-required">*</span>
                        </label>
                        <input
                            id="problem-name"
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
                        <label htmlFor="problem-link" className="modal-label">
                            LeetCode Link
                        </label>
                        <input
                            id="problem-link"
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://leetcode.com/problems/two-sum/"
                            className="modal-field"
                        />
                    </div>

                    <div>
                        <label htmlFor="difficulty" className="modal-label">
                            Difficulty <span className="modal-required">*</span>
                        </label>
                        <select
                            id="difficulty"
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
                        <label htmlFor="topic" className="modal-label">
                            Topic
                        </label>
                        <input
                            id="topic"
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
                            {loading ? "Adding..." : "Add Problem"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
