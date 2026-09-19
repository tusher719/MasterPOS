// resources/js/Components/Public/Pagination.tsx

import { PaginatedProducts } from "@/types/public";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = Pick<PaginatedProducts, "meta" | "links">;

export default function Pagination({ meta, links }: PaginationProps) {
    if (meta.last_page <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            {links.prev ? (
                <Link
                    href={links.prev}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft size={15} />
                    Previous
                </Link>
            ) : (
                <span className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-300 cursor-not-allowed">
                    <ChevronLeft size={15} />
                    Previous
                </span>
            )}

            <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                {meta.current_page} / {meta.last_page}
            </span>

            {links.next ? (
                <Link
                    href={links.next}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                    Next
                    <ChevronRight size={15} />
                </Link>
            ) : (
                <span className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-300 cursor-not-allowed">
                    Next
                    <ChevronRight size={15} />
                </span>
            )}
        </div>
    );
}
