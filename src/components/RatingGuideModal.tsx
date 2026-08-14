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
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Rating Guide</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="rating-guide-list">
                    {ratings.map((r) => (
                        <div
                            key={r.rating}
                            className="rating-guide-row"
                            style={{ "--rating-color": r.color } as React.CSSProperties}
                        >
                            <span className="rating-guide-number">{r.rating}</span>
                            <span className="rating-guide-meaning">{r.meaning}</span>
                            <span className="rating-guide-next">→ {r.next}</span>
                        </div>
                    ))}
                </div>

                <p className="rating-guide-footer">Rate 5 twice → Mastered</p>
            </div>
        </div>
    );
}
