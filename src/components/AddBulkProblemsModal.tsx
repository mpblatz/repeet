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

const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "var(--modal-bg)",
    zIndex: 50,
    paddingTop: 60,
};

const modalCard: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "32px",
    width: 680,
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
        <div className="animate-fade-in" style={modalOverlay} onClick={onClose}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2>Bulk Add Problems</h2>
                    <button onClick={onClose} style={{ color: "var(--text-faint)", fontSize: 16, padding: "4px 8px" }}>
                        ✕
                    </button>
                </div>

                <div style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 24,
                    lineHeight: 1.7,
                }}>
                    <p style={{ marginBottom: 8 }}>Paste problems in CSV format, one per line:</p>
                    <code style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "var(--text-faint)",
                        background: "var(--btn-bg)",
                        padding: "2px 6px",
                        borderRadius: 4,
                    }}>
                        Name, Difficulty, Topic, URL
                    </code>
                </div>

                <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label htmlFor="problems-text" style={labelStyle}>
                            Problems <span style={{ color: "var(--link-color)" }}>*</span>
                        </label>
                        <textarea
                            id="problems-text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={"Two Sum,Easy,Array,https://leetcode.com/problems/two-sum/\nValid Parentheses,Easy,Stack,https://leetcode.com/problems/valid-parentheses/"}
                            rows={8}
                            required
                            autoFocus
                            style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                        />
                        {problemCount > 0 && (
                            <p style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 11,
                                color: "var(--text-faint)",
                                marginTop: 6,
                            }}>
                                {problemCount} problem{problemCount !== 1 ? "s" : ""} detected
                            </p>
                        )}
                    </div>

                    <div>
                        <p style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 11,
                            color: "var(--text-faint)",
                            marginBottom: 8,
                        }}>
                            Or load a curated problem set:
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" style={btnStyle} onClick={() => setText(neetcode150text)}>
                                Neetcode 150
                            </button>
                            <button type="button" style={btnStyle} onClick={() => setText(grind75text)}>
                                Grind 75
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <button type="button" style={btnStyle} onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={btnPrimary} disabled={loading || problemCount === 0}>
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
