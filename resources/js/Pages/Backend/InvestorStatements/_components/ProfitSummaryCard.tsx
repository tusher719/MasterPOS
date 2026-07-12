import { StatementProfitSummary } from "@/types/investor-statement";
import {
    Clock,
    CreditCard,
    Hourglass,
    RefreshCw,
    TrendingUp,
} from "lucide-react";

interface Props {
    summary: StatementProfitSummary;
}

const fmt = (amount: number) =>
    "৳" + Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 });

interface RowProps {
    icon: React.ReactNode;
    label: string;
    amount: number;
    amountClass?: string;
    sublabel?: string;
}

const SummaryRow = ({
    icon,
    label,
    amount,
    amountClass = "text-gray-700",
    sublabel,
}: RowProps) => (
    <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
            <span className="text-gray-400">{icon}</span>
            <div>
                <p className="text-sm text-gray-600">{label}</p>
                {sublabel && (
                    <p className="text-xs text-gray-400">{sublabel}</p>
                )}
            </div>
        </div>
        <span className={`text-sm font-medium ${amountClass}`}>
            {fmt(amount)}
        </span>
    </div>
);

export default function ProfitSummaryCard({ summary }: Props) {
    const totalSettled =
        Number(summary.total_paid) +
        Number(summary.total_deferred) +
        Number(summary.total_reinvested);

    const settlementPercent =
        Number(summary.total_earned) > 0
            ? Math.min(
                  100,
                  Math.round(
                      (totalSettled / Number(summary.total_earned)) * 100,
                  ),
              )
            : 0;

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-medium text-gray-700">
                    Profit Summary
                </h2>
            </div>

            {/* Pending Balance — hero figure */}
            <div className="bg-amber-50 px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-amber-500 uppercase tracking-wide font-medium">
                        Pending Profit Balance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">
                        {fmt(summary.pending_balance)}
                    </p>
                    <p className="mt-1 text-xs text-amber-400">
                        Earned but not yet paid out
                    </p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                    <Hourglass className="h-6 w-6 text-amber-500" />
                </div>
            </div>

            {/* Breakdown rows */}
            <div className="px-5 py-3 divide-y divide-gray-50">
                <SummaryRow
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Total Earned"
                    amount={summary.total_earned}
                    amountClass="text-gray-800 font-semibold"
                    sublabel="Across all distributions"
                />
                <SummaryRow
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Total Paid Out"
                    amount={summary.total_paid}
                    amountClass="text-green-600"
                    sublabel="Cash payments received"
                />
                <SummaryRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Total Deferred"
                    amount={summary.total_deferred}
                    amountClass="text-purple-600"
                    sublabel="Carried to next period"
                />
                <SummaryRow
                    icon={<RefreshCw className="h-4 w-4" />}
                    label="Total Reinvested"
                    amount={summary.total_reinvested}
                    amountClass="text-indigo-600"
                    sublabel="Converted to capital"
                />
            </div>

            {/* Settlement progress footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        Settlement Progress
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                        {settlementPercent}%
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${settlementPercent}%` }}
                    />
                </div>
                <p className="text-xs text-gray-400">
                    {fmt(totalSettled)} settled of {fmt(summary.total_earned)}{" "}
                    total earned
                </p>
            </div>
        </div>
    );
}
