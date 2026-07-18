import { Popover } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import dayjs from "dayjs";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

const TODAY = dayjs().format("YYYY-MM-DD");

interface Props {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
    clearable?: boolean;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

export default function AppDateInput({
    value,
    onChange,
    placeholder = "Pick date",
    label,
    required,
    error,
    clearable = false,
    disabled = false,
    minDate,
    maxDate,
}: Props) {
    const [opened, setOpened] = useState(false);

    function getDayProps(date: Date) {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        const isFriday = dayjs(date).day() === 5;
        const isToday = formatted === TODAY;
        const isSelected = formatted === value;

        return {
            selected: isSelected,
            onClick: () => {
                onChange(formatted);
                setOpened(false);
            },
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
                borderRadius: isToday && !isSelected ? "20%" : undefined,
            },
        };
    }

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
                onChange={setOpened}
                position="bottom-start"
                withinPortal
                shadow="md"
            >
                <Popover.Target>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setOpened((o) => !o)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition
                            focus:outline-none focus:ring-1 focus:ring-indigo-500
                            ${error ? "border-red-300" : "border-gray-300 focus:border-indigo-500"}
                            ${disabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : "bg-white hover:border-gray-400"}`}
                    >
                        <span
                            className={
                                value ? "text-gray-800" : "text-gray-400"
                            }
                        >
                            {value
                                ? dayjs(value).format("DD MMM YYYY")
                                : placeholder}
                        </span>
                        <span className="flex items-center gap-1">
                            {clearable && value && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange("");
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

                <Popover.Dropdown className="p-3">
                    <Calendar
                        firstDayOfWeek={6}
                        weekendDays={[5]}
                        minDate={minDate}
                        maxDate={maxDate}
                        getDayProps={getDayProps}
                    />

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setOpened(false);
                            }}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onChange(TODAY);
                                setOpened(false);
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Today
                        </button>
                    </div>
                </Popover.Dropdown>
            </Popover>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
