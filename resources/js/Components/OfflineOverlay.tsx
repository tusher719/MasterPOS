import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflineOverlay() {
    const [offline, setOffline] = useState(!navigator.onLine);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const goOffline = () => {
            setOffline(true);
            setDismissed(false);
        };
        const goOnline = () => {
            setOffline(false);
            setDismissed(false);
        };

        window.addEventListener("offline", goOffline);
        window.addEventListener("online", goOnline);
        return () => {
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online", goOnline);
        };
    }, []);

    if (!offline || dismissed) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-between gap-4 border-t border-amber-300 bg-amber-50 px-6 py-3 shadow-lg">
            <div className="flex items-center gap-3">
                <WifiOff size={18} className="shrink-0 text-amber-600" />
                <div>
                    <p className="text-sm font-semibold text-amber-800">
                        You are offline
                    </p>
                    <p className="text-xs text-amber-700">
                        Check your internet connection. Some features may not
                        work until you reconnect.
                    </p>
                </div>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
            >
                Dismiss
            </button>
        </div>
    );
}
