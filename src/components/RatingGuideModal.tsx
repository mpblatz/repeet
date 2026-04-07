interface RatingGuideModalProps {
    onClose: () => void;
}

const ratings = [
    { rating: 1, meaning: "Couldn't solve", next: "1 day", color: "#ef4444" },
    { rating: 2, meaning: "Significant struggle", next: "2 days", color: "#f97316" },
    { rating: 3, meaning: "Minor struggle", next: "3 days", color: "#eab308" },
    { rating: 4, meaning: "Solved smoothly", next: "4 days", color: "#22c55e" },
    { rating: 5, meaning: "Perfect solve", next: "5 days", color: "#10b981" },
];

export default function RatingGuideModal({ onClose }: RatingGuideModalProps) {
    return (
        <div
            className="animate-fade-in"
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                background: "var(--modal-bg)",
                zIndex: 50,
                paddingTop: 80,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "32px",
                    width: 440,
                    maxWidth: "90vw",
                    boxShadow: "var(--shadow-hover)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <h2>Rating Guide</h2>
                    <button onClick={onClose} style={{ color: "var(--text-faint)", fontSize: 16, padding: "4px 8px" }}>
                        ✕
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ratings.map((r) => (
                        <div
                            key={r.rating}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 14px",
                                borderRadius: 8,
                                background: `color-mix(in srgb, ${r.color} 6%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${r.color} 12%, transparent)`,
                            }}
                        >
                            <span style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 14,
                                fontWeight: 700,
                                color: r.color,
                                width: 20,
                                textAlign: "center",
                            }}>
                                {r.rating}
                            </span>
                            <span style={{ flex: 1, fontSize: 14 }}>
                                {r.meaning}
                            </span>
                            <span style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 11,
                                color: "var(--text-faint)",
                            }}>
                                → {r.next}
                            </span>
                        </div>
                    ))}
                </div>

                <p style={{
                    marginTop: 20,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.01em",
                }}>
                    Rate 5 twice → Mastered
                </p>
            </div>
        </div>
    );
}
