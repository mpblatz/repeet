interface RatingGuideModalProps {
    onClose: () => void;
}

export default function RatingGuideModal({ onClose }: RatingGuideModalProps) {
    return (
        <div className="fixed inset-0 flex justify-center bg-modal-bg" onClick={onClose}>
            <div
                className="flex flex-col p-10 bg-surface rounded-md space-y-8 w-[600px] h-fit mt-20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex w-full justify-between">
                    <h2>Rating Guide</h2>
                    <button className="px-3 py-1 rounded-full" onClick={onClose}>
                        X
                    </button>
                </div>
                <table className="w-[500px] text-center">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-1">Rating</th>
                            <th className="text-left py-1">Meaning</th>
                            <th className="text-left py-1">Next</th>
                        </tr>
                    </thead>
                    <tbody className="text-left">
                        <tr className="border-b">
                            <td className="py-1 font-bold">1</td>
                            <td className="py-1">Couldn't solve</td>
                            <td className="py-1">1 day</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-1 font-bold">2</td>
                            <td className="py-1">Significant struggle</td>
                            <td className="py-1">2 days</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-1 font-bold">3</td>
                            <td className="py-1">Minor struggle</td>
                            <td className="py-1">3 days</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-1 font-bold">4</td>
                            <td className="py-1">Solved smoothly</td>
                            <td className="py-1">4 days</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold">5</td>
                            <td className="py-1">Perfect solve</td>
                            <td className="py-1">5 days</td>
                        </tr>
                    </tbody>
                </table>
                <p className="mt-2">Rate 5 twice → Mastered</p>
            </div>
        </div>
    );
}
