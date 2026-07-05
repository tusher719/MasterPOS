import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
    search: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: string[];
}

export default function ProductSearch({
    search,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories,
}: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            {/* ── Search Input ── */}
            <div className="relative flex-1">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* ── Category Filter ── */}
            <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
        </div>
    );
}
