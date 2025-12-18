import { useState } from "react";
import { type ProblemDifficulty } from "../lib/supabase";

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
        <div className="fixed inset-0 flex justify-center" onClick={onClose}>
            <div
                className="flex flex-col border-1 p-10 bg-zinc-800 space-y-10 w-[800px] h-fit mt-20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex w-full justify-between">
                    <h2>Add Problem</h2>
                    <button className="px-1" onClick={onClose}>
                        X
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-col space-y-4">
                    <div className="flex space-x-2">
                        <label htmlFor="problem-name" className="whitespace-nowrap">
                            Problem Name <span className="text-orange-500">*</span>
                        </label>
                        <input
                            id="problem-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Two Sum"
                            required
                            autoFocus
                            className="border-1 px-2 w-full"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <label htmlFor="problem-link" className="whitespace-nowrap">
                            LeetCode Link (optional)
                        </label>
                        <input
                            id="problem-link"
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://leetcode.com/problems/two-sum/"
                            className="border-1 px-2 w-full"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <label htmlFor="difficulty" className="whitespace-nowrap">
                            Difficulty <span className="text-orange-500">*</span>
                        </label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                            className="border-1 px-2 w-full"
                            required
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <label htmlFor="topic" className="whitespace-nowrap">
                            Topic (optional)
                        </label>
                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Arrays, Trees, Dynamic Programming, etc."
                            className="border-1 px-2 w-full"
                        />
                    </div>

                    <div className="flex space-x-2 mt-10 justify-between">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            [ Cancel ]
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Adding..." : "[ Add Problem ]"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
