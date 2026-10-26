import { FadeIn } from "@/Components/ui/animations";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { LayoutGrid, List, Plus, RefreshCw, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import DataTableToolbar from "@/Components/Common/DataTableToolbar";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock">("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !query ||
                p.name.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query) ||
                (p.barcode && p.barcode.toLowerCase().includes(query)) ||
                (p.category_name && p.category_name.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            if (statusFilter === "active") return p.is_active;
            if (statusFilter === "inactive") return !p.is_active;
            if (statusFilter === "low_stock") return p.is_low_stock;

            return true;
        });
    }, [products, searchQuery, statusFilter]);

    const handleDelete = (product: any) => {
        import("@/lib/confirm").then(({ confirmAction }) => {
            confirmAction({
                title: "Delete Product?",
                text: `"${product.name}" will be soft-deleted.`,
                confirmButtonText: "Yes, delete",
            }).then((ok) => {
                if (!ok) return;
                router.delete(route("backend.products.destroy", product.id), {
                    onSuccess: () => toast.success("Product deleted successfully."),
                    onError: () => toast.error("Failed to delete product."),
                });
            });
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => {
                setIsRefreshing(false);
                toast.success("Catalogue refreshed.");
            },
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
                // Preference fallback
            })
            .finally(() => {
                setSavingView(false);
            });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Products Catalogue" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Products Catalogue
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage inventory, pricing, variants, and stock alerts
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <ProductAutocomplete />

                        {/* Grid / List toggle */}
                        <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
                            <button
                                onClick={() => handleToggleView(false)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    !isGrid
                                        ? "bg-primary text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="List view"
                            >
                                <List className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                onClick={() => handleToggleView(true)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    isGrid
                                        ? "bg-primary text-white shadow-xs"
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
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={15} />
                            <span>Add Product</span>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <ProductStatsCards stats={stats} />

                {/* Unified DataTable Toolbar */}
                <DataTableToolbar
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search by product name, SKU, barcode, category..."
                    totalCount={products.length}
                    filteredCount={filteredProducts.length}
                    loading={isRefreshing}
                    onRefresh={handleRefresh}
                    filters={
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {(
                                [
                                    { key: "all", label: "All Products" },
                                    { key: "active", label: "Active" },
                                    { key: "inactive", label: "Inactive" },
                                    { key: "low_stock", label: "Low Stock" },
                                ] as const
                            ).map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setStatusFilter(key)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                                        statusFilter === key
                                            ? "bg-primary text-white shadow-xs"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                />

                {/* Table / Grid */}
                <FadeIn key={isGrid ? "grid" : "list"} duration={180}>
                    {isGrid ? (
                        <ProductGrid
                            products={filteredProducts}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <ProductTable
                            products={filteredProducts}
                            onDelete={handleDelete}
                        />
                    )}
                </FadeIn>
            </div>
        </AuthenticatedLayout>
    );
}
