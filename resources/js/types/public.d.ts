// resources/js/types/public.d.ts

export interface PublicSettings {
    business_name: string;
    currency_symbol: string;
    logo_type: "text" | "image" | "both";
    logo_image_path: string | null;
    logo_text_segments: string | null;
}

export interface PublicCategory {
    id: number;
    name: string;
    slug: string;
    image?: string | null;
    description?: string | null;
    products_count?: number;
    children?: PublicCategory[];
}

export interface PublicProduct {
    id: number;
    name: string;
    slug: string;
    sale_price: number;
    discount_type: "flat" | "percentage" | null;
    discount_value: number | null;
    stock_qty: number;
    is_low_stock: boolean;
    has_variants: boolean;
    is_featured?: boolean;
    primary_image: string | null;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

export interface PublicProductDetail extends PublicProduct {
    description: string | null;
    sku: string;
    cost_price: number;
    low_stock_threshold: number;
    meta_title: string | null;
    meta_description: string | null;
    weight: number | null;
    weight_unit: string | null;
    images: {
        id: number;
        image_path: string;
        is_primary: boolean;
    }[];
    unit: {
        id: number;
        name: string;
        short_code: string;
    } | null;
    variants: {
        id: number;
        sku: string;
        attributes: Record<string, string>;
        stock_qty: number;
        price_override: number | null;
        cost_price_override: number | null;
        is_active: boolean;
    }[];
}

export interface PaginatedProducts {
    data: PublicProduct[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

export interface ProductFilters {
    q: string;
    category: string;
    min_price: string;
    max_price: string;
    sort: "newest" | "price_asc" | "price_desc" | "name_asc";
    featured: boolean;
}

export interface CategoryFilters {
    q: string;
    sort: "newest" | "price_asc" | "price_desc" | "name_asc";
    in_stock: boolean;
    min_price: string;
    max_price: string;
}

// Cart
export interface CartItem {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    qty: number;
    variantId?: number;
    variantLabel?: string;
}
