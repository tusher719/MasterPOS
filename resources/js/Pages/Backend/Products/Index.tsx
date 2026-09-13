import { FadeIn } from "@/Components/ui/animations";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ProductAutocomplete from "./_components/ProductAutocomplete";
import ProductGrid from "./_components/ProductGrid";
import ProductStatsCards from "./_components/ProductStatsCards";
import ProductTable from "./_components/ProductTable";

export interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string;
    barcode: string | null;
    category_id: number | null;
    category_name: string | null;
    unit_id: number | null;
    unit_short_code: string | null;
    cost_price: string;
    sale_price: string;
    stock_qty: string;
    low_stock_threshold: string;
    is_low_stock: boolean;
    is_featured: boolean;
    is_active: boolean;
    primary_image: string | null;
    has_variants: boolean;
    variants: {
        id: number;
        sku: string;
        attributes: Record<string, string>;
        stock_qty: number;
        price_override: string | null;
        is_active: boolean;
        label: string;
    }[];
}

interface Stats {
    total: number;
    active: number;
    low_stock: number;
    featured: number;
}

interface Props {
    products: Product[];
    stats: Stats;
    grid_view: boolean;
}

export default function ProductsIndex({ products, stats, grid_view }: Props) {
    const [isGrid, setIsGrid] = useState(grid_view);
    const [savingView, setSavingView] = useState(false);

    const handleDelete = (product: any) => {
        import("@/lib/confirm").then(({ confirmAction }) => {
            confirmAction({
                title: "Delete Product?",
                text: `"${product.name}" will be soft-deleted.`,
                confirmButtonText: "Yes, delete",
            }).then((ok) => {
                if (!ok) return;
                router.delete(route("backend.products.destroy", product.id), {
                    onSuccess: () => toast.success("Product deleted."),
                    onError: () => toast.error("Failed to delete product."),
                });
            });
        });
    };

    const handleToggleView = (gridMode: boolean) => {
        if (gridMode === isGrid || savingView) return;

        setIsGrid(gridMode);
        setSavingView(true);

        window.axios
            .put(route("backend.user.preferences.ui.update"), {
                grid_view: gridMode,
            })
            .catch(() => {
                // Non-fatal — preference save fail হলেও view switch থাকবে
            })
            .finally(() => {
                setSavingView(false);
            });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Products" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">
                            Products
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your product catalogue
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ProductAutocomplete />

                        {/* Grid / List toggle */}
                        <div className="flex items-center rounded-lg border border-border bg-card p-1 gap-0.5">
                            <button
                                onClick={() => handleToggleView(false)}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    !isGrid
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="List view"
                            >
                                <List className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                onClick={() => handleToggleView(true)}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    isGrid
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                        </div>

                        <Link
                            href={route("backend.products.create")}
                            className="flex-shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            + Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <ProductStatsCards stats={stats} />

                {/* Table / Grid */}
                <FadeIn key={isGrid ? "grid" : "list"} duration={180}>
                    {isGrid ? (
                        <ProductGrid
                            products={products}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <ProductTable
                            products={products}
                            onDelete={handleDelete}
                        />
                    )}
                </FadeIn>
            </div>
        </AuthenticatedLayout>
    );
}
