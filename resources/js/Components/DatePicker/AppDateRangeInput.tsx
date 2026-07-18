import { Popover } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import dayjs from "dayjs";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function quarterStart(offset: 0 | -1): string {
    const month = Math.floor(dayjs().month() / 3) * 3 + offset * 3;
    return dayjs().month(month).startOf("month").format("YYYY-MM-DD");
}

function quarterEnd(offset: 0 | -1): string {
    const month = Math.floor(dayjs().month() / 3) * 3 + offset * 3 + 2;
    return dayjs().month(month).endOf("month").format("YYYY-MM-DD");
}

// BD week: Saturday → Friday
function bdWeekStart(offset: number = 0): string {
    const day = dayjs().day(); // 0=Sun ... 6=Sat
    const diffToSat = day === 6 ? 0 : -(day + 1);
    return dayjs()
        .add(diffToSat + offset * 7, "day")
        .format("YYYY-MM-DD");
}

function bdWeekEnd(offset: number = 0): string {
    return dayjs(bdWeekStart(offset)).add(6, "day").format("YYYY-MM-DD");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Preset {
    label: string;
    start: string;
    end: string;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const DEFAULT_PERIOD_PRESETS: Preset[] = [
    {
        label: "This Week",
        start: bdWeekStart(0),
        end: bdWeekEnd(0),
    },
    {
        label: "Last Week",
        start: bdWeekStart(-1),
        end: bdWeekEnd(-1),
    },
    {
        label: "This Month",
        start: dayjs().startOf("month").format("YYYY-MM-DD"),
        end: dayjs().endOf("month").format("YYYY-MM-DD"),
    },
    {
        label: "Last Month",
        start: dayjs()
            .subtract(1, "month")
            .startOf("month")
            .format("YYYY-MM-DD"),
        end: dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
    },
    {
        label: "This Quarter",
        start: quarterStart(0),
        end: quarterEnd(0),
    },
    {
        label: "Last Quarter",
        start: quarterStart(-1),
        end: quarterEnd(-1),
    },
    {
        label: "This Year",
        start: dayjs().startOf("year").format("YYYY-MM-DD"),
        end: dayjs().endOf("year").format("YYYY-MM-DD"),
    },
    {
        label: "Last Year",
        start: dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"),
        end: dayjs().subtract(1, "year").endOf("year").format("YYYY-MM-DD"),
    },
    {
        label: "Last 7 Days",
        start: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
        end: dayjs().format("YYYY-MM-DD"),
    },
    {
        label: "Last 15 Days",
        start: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
        end: dayjs().format("YYYY-MM-DD"),
    },
    {
        label: "Last 30 Days",
        start: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
        end: dayjs().format("YYYY-MM-DD"),
    },
    {
        label: "Last 90 Days",
        start: dayjs().subtract(89, "day").format("YYYY-MM-DD"),
        end: dayjs().format("YYYY-MM-DD"),
    },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    startValue: string;
    endValue: string;
    onStartChange: (val: string) => void;
    onEndChange: (val: string) => void;
    onChange?: (start: string, end: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
    clearable?: boolean;
    disabled?: boolean;
    presets?: Preset[];
}

type PickState = "idle" | "picking_start" | "picking_end";

const TODAY = dayjs().format("YYYY-MM-DD");

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppDateRangeInput({
    startValue,
    endValue,
    onStartChange,
    onEndChange,
    onChange,
    placeholder = "Pick date range",
    label,
    required,
    error,
    clearable = true,
    disabled = false,
    presets = DEFAULT_PERIOD_PRESETS,
}: Props) {
    const [opened, setOpened] = useState(false);
    const [pickState, setPickState] = useState<PickState>("idle");
    const [hoverDate, setHoverDate] = useState<string>("");

    const hasValue = !!startValue && !!endValue;

    function applyRange(start: string, end: string) {
        onStartChange(start);
        onEndChange(end);
        if (onChange) onChange(start, end);
    }

    function applyPreset(preset: Preset) {
        applyRange(preset.start, preset.end);
        setOpened(false);
        setPickState("idle");
    }

    function handleDayClick(date: Date) {
        const formatted = dayjs(date).format("YYYY-MM-DD");

        if (pickState === "idle" || pickState === "picking_start") {
            onStartChange(formatted);
            onEndChange("");
            if (onChange) onChange(formatted, "");
            setPickState("picking_end");
        } else {
            if (formatted < startValue) {
                onStartChange(formatted);
                onEndChange("");
                if (onChange) onChange(formatted, "");
                setPickState("picking_end");
            } else {
                onEndChange(formatted);
                if (onChange) onChange(startValue, formatted);
                setPickState("idle");
                setOpened(false);
            }
        }
    }

    function clearAll() {
        applyRange("", "");
        setPickState("idle");
    }

    function getDayProps(date: Date) {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        const isFriday = dayjs(date).day() === 5;
        const isToday = formatted === TODAY;
        const isStart = formatted === startValue;
        const isEnd = formatted === endValue;
        const inRange =
            startValue &&
            endValue &&
            formatted > startValue &&
            formatted < endValue;
        const inHoverRange =
            pickState === "picking_end" &&
            hoverDate &&
            startValue &&
            formatted > startValue &&
            formatted <= hoverDate;

        const isSelected = isStart || isEnd;

        return {
            selected: isSelected,
            inRange: !!(inRange || inHoverRange),
            firstInRange: isStart && !!endValue,
            lastInRange: isEnd,
            onClick: () => handleDayClick(date),
            onMouseEnter: () => setHoverDate(formatted),
            style: {
                color: isSelected
                    ? undefined
                    : isFriday
                      ? "#ef4444"
                      : "#1f2937",
                fontWeight: isFriday && !isSelected ? 600 : undefined,
                outline:
                    isToday && !isSelected ? "2px dashed #6366f1" : undefined,
                outlineOffset: isToday && !isSelected ? "-3px" : undefined,
                borderRadius: isToday && !isSelected ? "50%" : undefined,
            },
        };
    }

    const isActivePreset = (preset: Preset) =>
        startValue === preset.start && endValue === preset.end;

    return (
        <div>
            {label && (
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}

            <Popover
                opened={opened}
                onChange={(o) => {
                    setOpened(o);
                    if (!o) setPickState("idle");
                }}
                position="bottom-start"
                withinPortal
                shadow="md"
                width="auto"
            >
                <Popover.Target>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            if (!disabled) {
                                setOpened((o) => !o);
                                setPickState("picking_start");
                            }
                        }}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition
                            focus:outline-none focus:ring-1 focus:ring-indigo-500
                            ${error ? "border-red-300" : "border-gray-300 focus:border-indigo-500"}
                            ${disabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : "bg-white hover:border-gray-400"}`}
                    >
                        <span
                            className={
                                hasValue ? "text-gray-800" : "text-gray-400"
                            }
                        >
                            {hasValue
                                ? `${dayjs(startValue).format("D MMM YYYY")} → ${dayjs(endValue).format("D MMM YYYY")}`
                                : placeholder}
                        </span>
                        <span className="flex items-center gap-1">
                            {clearable && hasValue && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearAll();
                                    }}
                                    className="rounded p-0.5 text-gray-400 hover:text-red-500"
                                >
                                    <X size={13} />
                                </span>
                            )}
                            <CalendarDays size={14} className="text-gray-400" />
                        </span>
                    </button>
                </Popover.Target>

                <Popover.Dropdown className="p-0">
                    <div className="flex">
                        {/* ── Calendar ── */}
                        <div className="p-3">
                            <p className="mb-2 text-center text-xs font-medium text-indigo-500">
                                {pickState === "picking_end"
                                    ? "Now pick end date"
                                    : "Pick start date"}
                            </p>

                            <Calendar
                                firstDayOfWeek={6}
                                weekendDays={[5]}
                                getDayProps={getDayProps}
                                onMouseLeave={() => setHoverDate("")}
                            />

                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearAll();
                                        setOpened(false);
                                    }}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (pickState === "picking_end") {
                                            if (TODAY >= startValue) {
                                                onEndChange(TODAY);
                                                if (onChange)
                                                    onChange(startValue, TODAY);
                                                setPickState("idle");
                                                setOpened(false);
                                            }
                                        } else {
                                            onStartChange(TODAY);
                                            onEndChange("");
                                            if (onChange) onChange(TODAY, "");
                                            setPickState("picking_end");
                                        }
                                    }}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    Today
                                </button>
                            </div>
                        </div>

                        {/* ── Presets sidebar ── */}
                        {presets.length > 0 && (
                            <div className="w-36 border-l border-gray-100 bg-gray-50 p-2">
                                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    Presets
                                </p>
                                <div className="space-y-0.5">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition
                                                ${
                                                    isActivePreset(preset)
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Popover.Dropdown>
            </Popover>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
