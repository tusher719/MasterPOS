import { useState } from "react";
import { PeriodParams, PeriodType } from "../Index";
import { Calendar, ChevronDown } from "lucide-react";

interface Props {
    value: PeriodParams;
    onChange: (params: PeriodParams) => void;
    disabled?: boolean;
}

const OPTIONS: { value: PeriodType; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
];

export default function PeriodFilter({ value, onChange, disabled }: Props) {
    const [showCustom, setShowCustom] = useState(value.period === "custom");
    const [dateFrom, setDateFrom] = useState(value.date_from ?? "");
    const [dateTo, setDateTo] = useState(value.date_to ?? "");

    const handleSelect = (period: PeriodType) => {
        if (period === "custom") {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        onChange({ period });
    };

    const applyCustom = () => {
        if (!dateFrom || !dateTo) return;
        onChange({ period: "custom", date_from: dateFrom, date_to: dateTo });
    };

    return (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white/80 p-1 shadow-2xs backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                {OPTIONS.map((opt) => {
                    const active = value.period === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelect(opt.value)}
                            className={[
                                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-50",
                                active
                                    ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200",
                            ].join(" ")}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                    <Calendar className="ml-1.5 h-3.5 w-3.5 text-gray-400 dark:text-neutral-500" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-xs text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                    <span className="text-xs text-gray-400 dark:text-neutral-500">to</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-xs text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                    <button
                        type="button"
                        disabled={disabled || !dateFrom || !dateTo}
                        onClick={applyCustom}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
