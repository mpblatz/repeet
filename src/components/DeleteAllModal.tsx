import { useState } from "react";

interface DeleteAllModalProps {
    count: number;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteAllModal({ count, onClose, onConfirm }: DeleteAllModalProps) {
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const canConfirm = confirmText.trim().toUpperCase() === "DELETE";

    const handleConfirm = async () => {
        if (!canConfirm) return;
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header modal-header--tight">
                    <h2>Delete All Problems</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <p className="modal-copy">
                    This permanently deletes all <strong>{count}</strong> problem{count !== 1 ? "s" : ""} and their
                    attempt history, across your queue, review, and mastered lists. This cannot be undone.
                </p>

                <label htmlFor="confirm-delete-all" className="modal-label">
                    Type DELETE to confirm
                </label>
                <input
                    id="confirm-delete-all"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    className="modal-field modal-field--spaced"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && canConfirm) handleConfirm();
                    }}
                />

                <div className="modal-actions">
                    <button type="button" className="btn" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleConfirm}
                        disabled={!canConfirm || loading}
                    >
                        {loading ? "Deleting..." : "Delete Everything"}
                    </button>
                </div>
            </div>
        </div>
    );
}
