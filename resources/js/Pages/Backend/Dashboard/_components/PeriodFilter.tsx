import { useState } from "react";
import { PeriodParams, PeriodType } from "../Index";
import { DatePickerInput, DatesRangeValue } from "@mantine/dates";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "lucide-react";

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
    const [rangeValue, setRangeValue] = useState<DatesRangeValue>([
        value.date_from ? dayjs(value.date_from).toDate() : null,
        value.date_to ? dayjs(value.date_to).toDate() : null,
    ]);

    const handleSelect = (period: PeriodType) => {
        if (period === "custom") {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        onChange({ period });
    };

    const handleRangeChange = (val: DatesRangeValue) => {
        setRangeValue(val);
        const [start, end] = val;
        if (start && end) {
            onChange({
                period: "custom",
                date_from: dayjs(start).format("YYYY-MM-DD"),
                date_to: dayjs(end).format("YYYY-MM-DD"),
            });
        }
    };

    return (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
                {OPTIONS.map((opt) => {
                    const active = value.period === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelect(opt.value)}
                            className={[
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 disabled:opacity-50",
                                active
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            ].join(" ")}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2">
                    <DatePickerInput
                        type="range"
                        placeholder="Select start - end date"
                        value={rangeValue}
                        onChange={handleRangeChange}
                        leftSection={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
                        clearable
                        size="xs"
                        radius="md"
                        disabled={disabled}
                        className="w-[250px]"
                    />
                </div>
            )}
        </div>
    );
}
