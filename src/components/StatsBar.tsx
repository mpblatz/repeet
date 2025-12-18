interface StatsBarProps {
    stats: {
        total: number;
        queued: number;
        active: number;
        mastered: number;
        dueToday: number;
        masteryRate: number;
    };
}

export default function StatsBar({ stats }: StatsBarProps) {
    return (
        <div className="flex space-x-8">
            <div className="stat-card">
                <div className="stat-value">{stats.dueToday}</div>
                <div className="stat-label">Due Today</div>
            </div>

            <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Problems</div>
            </div>

            <div className="stat-card stat-card-accent">
                <div className="stat-value">{stats.masteryRate}%</div>
                <div className="stat-label">Mastery Rate</div>
            </div>
        </div>
    );
}
