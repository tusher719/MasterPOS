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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                {OPTIONS.map((opt) => {
                    const active = value.period === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelect(opt.value)}
                            className={[
                                "rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                                active
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-500 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-md border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-md border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        disabled={disabled || !dateFrom || !dateTo}
                        onClick={applyCustom}
                        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
