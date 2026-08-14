import { useState } from "react";

interface DeleteAllModalProps {
    count: number;
    onClose: () => void;
    onConfirm: () => Promise<void>;
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
    width: 420,
    maxWidth: "90vw",
    boxShadow: "var(--shadow-hover)",
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

const btnDanger: React.CSSProperties = {
    ...btnStyle,
    background: "color-mix(in srgb, var(--difficulty-hard) 10%, transparent)",
    borderColor: "color-mix(in srgb, var(--difficulty-hard) 25%, transparent)",
    color: "var(--difficulty-hard)",
};

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
        <div className="animate-fade-in" style={modalOverlay} onClick={onClose}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2>Delete All Problems</h2>
                    <button onClick={onClose} style={{ color: "var(--text-faint)", fontSize: 16, padding: "4px 8px" }}>
                        ✕
                    </button>
                </div>

                <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 20 }}>
                    This permanently deletes all <strong>{count}</strong> problem{count !== 1 ? "s" : ""} and their
                    attempt history, across your queue, review, and mastered lists. This cannot be undone.
                </p>

                <label
                    htmlFor="confirm-delete-all"
                    style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: 6,
                        display: "block",
                    }}
                >
                    Type DELETE to confirm
                </label>
                <input
                    id="confirm-delete-all"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    style={{ width: "100%", boxSizing: "border-box", marginBottom: 24 }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && canConfirm) handleConfirm();
                    }}
                />

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button type="button" style={btnStyle} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        style={{ ...btnDanger, opacity: canConfirm ? 1 : 0.5, cursor: canConfirm ? "pointer" : "not-allowed" }}
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
