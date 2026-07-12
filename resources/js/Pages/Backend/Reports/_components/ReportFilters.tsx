import { router } from "@inertiajs/react";
import { DatePickerInput } from "@mantine/dates";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface Props {
    filters: {
        from: string;
        to: string;
        customer_id?: string | null;
    };
    routeName: string;
    showCustomerFilter?: boolean;
    customers?: { id: number; name: string; phone: string | null }[];
}

type RangeValue = [string | null, string | null];

// Quick presets
const PRESETS = [
    { label: "Today", getDates: () => ({ from: today(), to: today() }) },
    {
        label: "This Week",
        getDates: () => ({ from: startOfWeek(), to: today() }),
    },
    {
        label: "This Month",
        getDates: () => ({ from: startOfMonth(), to: today() }),
    },
    {
        label: "Last Month",
        getDates: () => ({ from: startOfLastMonth(), to: endOfLastMonth() }),
    },
    {
        label: "This Year",
        getDates: () => ({ from: startOfYear(), to: today() }),
    },
];

function today(): string {
    return new Date().toISOString().slice(0, 10);
}
function startOfWeek(): string {
    const d = new Date();
    // JS getDay(): Sun=0, Mon=1, ... Fri=5, Sat=6
    // Week starts Saturday, so days-since-Saturday = (getDay() + 1) % 7
    const daysSinceSaturday = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - daysSinceSaturday);
    return d.toISOString().slice(0, 10);
}
function startOfMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function startOfLastMonth(): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
}
function endOfLastMonth(): string {
    const d = new Date();
    d.setDate(0); // last day of previous month
    return d.toISOString().slice(0, 10);
}
function startOfYear(): string {
    return `${new Date().getFullYear()}-01-01`;
}

export default function ReportFilters({
    filters,
    routeName,
    showCustomerFilter = false,
    customers = [],
}: Props) {
    const [range, setRange] = useState<RangeValue>([
        filters.from || null,
        filters.to || null,
    ]);
    const [customerId, setCustomerId] = useState(filters.customer_id ?? "");
    const [activePreset, setActivePreset] = useState<string | null>(null);

    function applyPreset(preset: (typeof PRESETS)[number]) {
        const dates = preset.getDates();
        setRange([dates.from, dates.to]);
        setActivePreset(preset.label);
        submit(dates.from, dates.to, customerId);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const [from, to] = range;
        if (!from || !to) return; // wait until both ends of the range are picked
        setActivePreset(null);
        submit(from, to, customerId);
    }

    function submit(f: string, t: string, cid: string) {
        const params: Record<string, string> = { from: f, to: t };
        if (showCustomerFilter && cid) params.customer_id = cid;
        router.get(route(routeName), params, { preserveScroll: true });
    }

    function reset() {
        const f = startOfMonth();
        const t = today();
        setRange([f, t]);
        setCustomerId("");
        setActivePreset(null);
        submit(f, t, "");
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            {/* Preset buttons */}
            <div className="mb-3 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition
                            ${
                                activePreset === p.label
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom date range + optional customer filter */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-wrap items-end gap-3"
            >
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                        Date Range
                    </label>
                    <DatePickerInput
                        type="range"
                        placeholder="From — To"
                        value={range}
                        onChange={(val) => {
                            setRange(val);
                            setActivePreset(null);
                        }}
                        valueFormat="DD MMM YYYY"
                        firstDayOfWeek={6}
                        weekendDays={[5]}
                        getDayProps={(date) => {
                            const day = new Date(date).getDay(); // Sun=0 ... Sat=6
                            const isFriday = day === 5;
                            return {
                                style: {
                                    color: isFriday
                                        ? "#ef4444" // red-500 for Friday (off day)
                                        : "#1f2937", // gray-800, normal color for every other day incl. Sat/Sun
                                    fontWeight: isFriday ? 600 : 400,
                                },
                            };
                        }}
                        allowSingleDateInRange
                        clearable={false}
                        className="min-w-[240px]"
                        styles={{
                            input: {
                                borderRadius: "0.375rem",
                                borderColor: "#d1d5db",
                                fontSize: "0.875rem",
                                padding: "0.375rem 0.75rem",
                            },
                        }}
                    />
                </div>

                {showCustomerFilter && customers.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">
                            Customer
                        </label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
                                       focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                                       focus:outline-none min-w-[180px]"
                        >
                            <option value="">All Customers</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                    {c.phone ? ` — ${c.phone}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5
                               text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                    <Search className="h-3.5 w-3.5" />
                    Apply
                </button>

                <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300
                               px-4 py-1.5 text-sm font-medium text-gray-600
                               hover:bg-gray-50 transition"
                >
                    <X className="h-3.5 w-3.5" />
                    Reset
                </button>
            </form>
        </div>
    );
}
