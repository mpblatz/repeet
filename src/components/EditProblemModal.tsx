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

const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "var(--modal-bg)",
    zIndex: 50,
    paddingTop: 80,
};

const modalCard: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "32px",
    width: 560,
    maxWidth: "90vw",
    boxShadow: "var(--shadow-hover)",
};

const labelStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
};

const btnStyle: React.CSSProperties = {
    background: "var(--btn-bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "7px 14px",
    color: "var(--text-muted)",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
};

const btnPrimary: React.CSSProperties = {
    ...btnStyle,
    background: "color-mix(in srgb, var(--link-color) 10%, transparent)",
    borderColor: "color-mix(in srgb, var(--link-color) 20%, transparent)",
    color: "var(--link-color)",
};

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
        <div className="animate-fade-in" style={modalOverlay} onClick={onClose}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <h2>Edit Problem</h2>
                    <button onClick={onClose} style={{ color: "var(--text-faint)", fontSize: 16, padding: "4px 8px" }}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label htmlFor="edit-problem-name" style={labelStyle}>
                            Problem Name <span style={{ color: "var(--link-color)" }}>*</span>
                        </label>
                        <input
                            id="edit-problem-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Two Sum"
                            required
                            autoFocus
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-problem-link" style={labelStyle}>
                            LeetCode Link
                        </label>
                        <input
                            id="edit-problem-link"
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://leetcode.com/problems/two-sum/"
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-difficulty" style={labelStyle}>
                            Difficulty <span style={{ color: "var(--link-color)" }}>*</span>
                        </label>
                        <select
                            id="edit-difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                            required
                            style={{ width: "100%", boxSizing: "border-box" }}
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-topic" style={labelStyle}>
                            Topic
                        </label>
                        <input
                            id="edit-topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Arrays, Trees, Dynamic Programming..."
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <button type="button" style={btnStyle} onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={btnPrimary} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
