import { StatementCapitalSummary } from "@/types/investor-statement";
import {
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    SlidersHorizontal,
    Wallet,
} from "lucide-react";

interface Props {
    summary: StatementCapitalSummary;
}

const fmt = (amount: number) =>
    "৳" + Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 });

interface RowProps {
    icon: React.ReactNode;
    label: string;
    amount: number;
    amountClass?: string;
    border?: boolean;
}

const SummaryRow = ({
    icon,
    label,
    amount,
    amountClass = "text-gray-700",
    border = false,
}: RowProps) => (
    <div
        className={`flex items-center justify-between py-2.5 ${
            border ? "border-t border-gray-100 mt-1 pt-3" : ""
        }`}
    >
        <div className="flex items-center gap-2.5">
            <span className="text-gray-400">{icon}</span>
            <span className="text-sm text-gray-600">{label}</span>
        </div>
        <span className={`text-sm font-medium ${amountClass}`}>
            {fmt(amount)}
        </span>
    </div>
);

export default function CapitalSummaryCard({ summary }: Props) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-medium text-gray-700">
                    Capital Summary
                </h2>
            </div>

            {/* Current Balance — hero figure */}
            <div className="bg-indigo-50 px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-indigo-400 uppercase tracking-wide font-medium">
                        Current Capital Balance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700">
                        {fmt(summary.current_balance)}
                    </p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3">
                    <Wallet className="h-6 w-6 text-indigo-500" />
                </div>
            </div>

            {/* Breakdown rows */}
            <div className="px-5 py-3 divide-y divide-gray-50">
                <SummaryRow
                    icon={<ArrowDownLeft className="h-4 w-4" />}
                    label="Total Deposited"
                    amount={summary.total_deposited}
                    amountClass="text-green-600"
                />
                <SummaryRow
                    icon={<ArrowUpRight className="h-4 w-4" />}
                    label="Total Withdrawn"
                    amount={summary.total_withdrawn}
                    amountClass="text-red-500"
                />
                <SummaryRow
                    icon={<RefreshCw className="h-4 w-4" />}
                    label="Total Reinvested (from Profit)"
                    amount={summary.total_reinvested}
                    amountClass="text-indigo-500"
                />
                <SummaryRow
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                    label="Total Adjusted"
                    amount={summary.total_adjusted}
                    amountClass="text-amber-600"
                />
            </div>

            {/* Net check footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        Deposited − Withdrawn + Reinvested + Adjusted
                    </span>
                    <span className="text-xs font-semibold text-indigo-600">
                        {fmt(
                            Number(summary.total_deposited) -
                                Number(summary.total_withdrawn) +
                                Number(summary.total_reinvested) +
                                Number(summary.total_adjusted),
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
