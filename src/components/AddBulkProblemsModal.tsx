import { useState } from "react";
import { type ProblemDifficulty } from "../lib/database";
import grind75text from "../assets/grind-75.txt?raw";
import neetcode150text from "../assets/neetcode-150.txt?raw";

interface BulkImportModalProps {
    onClose: () => void;
    onBulkAdd: (
        problems: Array<{
            problem_name: string;
            difficulty: ProblemDifficulty;
            problem_link?: string;
            topic?: string;
            source?: string;
        }>
    ) => Promise<void>;
}

export default function BulkImportModal({ onClose, onBulkAdd }: BulkImportModalProps) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const problemCount = text.split("\n").filter((line) => line.trim()).length;

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const lines = text.split("\n").filter((line) => line.trim());
            const problems = lines
                .map((line) => {
                    const parts = line.split(",").map((part) => part.trim());
                    return {
                        problem_name: parts[0] || "",
                        difficulty: parts[1] as ProblemDifficulty,
                        topic: parts[2] || undefined,
                        problem_link: parts[3] || undefined,
                    };
                })
                .filter((p) => p.problem_name);
            await onBulkAdd(problems);
        } catch (error) {
            console.error("Error importing:", error);
            alert("Failed to import problems");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay modal-overlay--tight animate-fade-in" onClick={onClose}>
            <div className="modal-card modal-card--wider" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Bulk Add Problems</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="bulk-instructions">
                    <p>Paste problems in CSV format, one per line:</p>
                    <code className="bulk-code">Name, Difficulty, Topic, URL</code>
                </div>

                <form onSubmit={handleImport} className="modal-form">
                    <div>
                        <label htmlFor="problems-text" className="modal-label">
                            Problems <span className="modal-required">*</span>
                        </label>
                        <textarea
                            id="problems-text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={"Two Sum,Easy,Array,https://leetcode.com/problems/two-sum/\nValid Parentheses,Easy,Stack,https://leetcode.com/problems/valid-parentheses/"}
                            rows={8}
                            required
                            autoFocus
                            className="modal-field modal-textarea"
                        />
                        {problemCount > 0 && (
                            <p className="bulk-count">
                                {problemCount} problem{problemCount !== 1 ? "s" : ""} detected
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="bulk-hint">Or load a curated problem set:</p>
                        <div className="bulk-presets">
                            <button type="button" className="btn" onClick={() => setText(neetcode150text)}>
                                Neetcode 150
                            </button>
                            <button type="button" className="btn" onClick={() => setText(grind75text)}>
                                Grind 75
                            </button>
                        </div>
                    </div>

                    <div className="modal-actions modal-actions--tight">
                        <button type="button" className="btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || problemCount === 0}>
                            {loading
                                ? "Importing..."
                                : `Import ${problemCount} Problem${problemCount !== 1 ? "s" : ""}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
