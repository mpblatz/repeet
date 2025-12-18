import { useState } from "react";
import { type ProblemDifficulty } from "../lib/supabase";
import grind75text from "../lib/grind-75.txt?raw";
import neetcode150text from "../lib/neetcode-150.txt?raw";

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
            // Parse text - one problem per line
            const lines = text.split("\n").filter((line) => line.trim());
            const problems = lines
                .map((line) => {
                    // Split by comma to get CSV values
                    const parts = line.split(",").map((part) => part.trim());

                    // Extract: Name, Difficulty, Topic, URL
                    return {
                        problem_name: parts[0] || "",
                        difficulty: parts[1] as ProblemDifficulty,
                        topic: parts[2] || undefined,
                        problem_link: parts[3] || undefined,
                    };
                })
                .filter((p) => p.problem_name); // Remove any empty entries

            await onBulkAdd(problems);
        } catch (error) {
            console.error("Error importing:", error);
            alert("Failed to import problems");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex justify-center" onClick={onClose}>
            <div
                className="flex flex-col border-1 p-10 bg-zinc-800 space-y-8 w-[900px] h-fit mt-20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex w-full justify-between">
                    <h2>Bulk Add Problems</h2>
                    <button className="px-1" onClick={onClose}>
                        X
                    </button>
                </div>

                <div>
                    <p>💡 Quick Tips:</p>
                    <ul>
                        <li>• Copy problems from Neetcode 150, Grind 75, or any list</li>
                        <li>• One problem per line</li>
                        <li>• Set difficulty and topic that applies to all problems</li>
                        <li>• You can always edit individual problems later</li>
                    </ul>
                </div>

                <form onSubmit={handleImport} className="modal-form">
                    <div className="input-group">
                        <label htmlFor="problems-text">
                            Problems <span className="text-orange-500">*</span>
                        </label>
                        <textarea
                            id="problems-text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Two Sum,Easy,Array,https://leetcode.com/problems/two-sum/&#10;Valid Parentheses,Easy,Stack,https://leetcode.com/problems/valid-parentheses/&#10;Merge Intervals,Medium,Array,https://leetcode.com/problems/merge-intervals/&#10;..."
                            rows={8}
                            required
                            autoFocus
                            className="w-full p-3 border"
                        />
                        <p className="text-sm text-gray-200 mt-1">
                            Paste problems in csv format, one per line.{" "}
                            {problemCount > 0 && `(${problemCount} problems)`}
                        </p>
                    </div>

                    <div className="flex space-x-8 mt-10">
                        <button onClick={() => setText(neetcode150text)}>[ Automatically Add Neetcode 150 ]</button>
                        <button onClick={() => setText(grind75text)}>[ Automatically Add Grind 75 ]</button>
                    </div>

                    <div className="flex space-x-2 mt-10 justify-between">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            [ Cancel ]
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || problemCount === 0}>
                            {loading
                                ? "Importing..."
                                : `[ Import ${problemCount} Problem${problemCount !== 1 ? "s" : ""} ]`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
