"use client";

// Core React/Next.js imports
import { useState, useEffect, useMemo, use } from 'react';
import { notFound } from "next/navigation";

// Component imports
import Link from "next/link";
import Image from "next/image";
import { Filter, Heart, Star, Truck, RotateCcw, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Keep if needed for single product view part
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard, { ApiProduct, RatesMap, ExchangeRate, ApiProductSize, ApiProductCategory } from "@/components/product-card";
import { useMobile } from "@/hooks/use-mobile";

// --- Interfaces & Types ---
interface CategoriesApiResponse { success: boolean; categories: ApiCategoryBasic[]; }
interface ProductsApiResponse { products: ApiProduct[]; pagination?: any; }
interface ApiSingleProductResponse { product: ApiProduct; }
interface ApiSubcategoryBasic { id: number; category_id: number; name: string; description: string | null; }
interface ApiCategoryBasic { id: number; name: string; description: string | null; subcategories: ApiSubcategoryBasic[]; }
interface PageInfoState { id: number; type: 'category' | 'subcategory'; title: string; description: string; }

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const UPLOADS_URL = `${API_BASE_URL}/uploads`;
const DEFAULT_DISPLAY_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_DISPLAY_CURRENCY || "ETB";
const DEFAULT_FALLBACK_CURRENCY = 'USD';
const RELATED_PRODUCTS_LIMIT = 4;

// --- Helper Functions ---
const parseImages = (imagesString: string | undefined | null): string[] => { /* ... */
    if (typeof imagesString !== 'string' || imagesString.trim() === '') return []; try { const p = JSON.parse(imagesString); if (Array.isArray(p) && p.every(i => typeof i === 'string')) return p.filter(i => i?.trim()).map(i => `${UPLOADS_URL}/${i.trim()}`); console.warn("Img parse fmt mismatch:", p); return []; } catch(e) { console.error(`Img parse fail:"${imagesString}"`,e); return []; } };
const convertCurrency = ( amount: number, fromCurrency: string | undefined, toCurrency: string, rates: RatesMap | null ): number | null => { /* ... */
    const s = fromCurrency||DEFAULT_FALLBACK_CURRENCY; if(!rates) return null; if(s===toCurrency) return amount; const rF=rates[s]; const rT=rates[toCurrency]; if(!rF||!rT){console.warn(`Rate miss:${s}->${toCurrency}`); return null;} if(rF<=0||rT<=0){console.error("Invalid rate:",rF,rT); return null;} return (amount/rF)*rT; };
const formatCurrency = (value: number, currencyCode: string): string => { /* ... */
     const o = { style:'currency', currency:currencyCode, minimumFractionDigits:2}; try { if(currencyCode==='ETB') return `ETB ${value.toFixed(2)}`; return new Intl.NumberFormat('en',o).format(value); } catch(e) { console.warn(`Curr fmt fail:${currencyCode}`); return `${currencyCode} ${value.toFixed(2)}`; } };
async function getRatesMap(): Promise<RatesMap | null> { /* ... */
    try { const r=await fetch(`${API_BASE_URL}/api/exchange-rates`); if(!r.ok) throw new Error(`Rate fetch fail:${r.status}`); const d:ExchangeRate[]=await r.json(); const m=d.reduce((map,rate)=>{ const v=parseFloat(rate.rate_from_usd); if(!isNaN(v)&&v>0) map[rate.currency_code]=v; return map; },{} as RatesMap); if(!m.USD) m.USD=1.0; return m; } catch(e){ console.error("Get rates err:",e); return null; } }


// --- Component Definition ---
export default function CategoryOrSubcategoryPage({ params: paramsPromise }: { params: { slug: string[] } }) {

    const params = use(paramsPromise);
    const categoryIdSlug = params?.slug?.[0];
    const subcategoryIdSlug = params?.slug?.[1];

    // --- Component State ---
    const [pageInfo, setPageInfo] = useState<PageInfoState | null>(null);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    // ***** ADDED MISSING STATE DECLARATION *****
    const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
    // *****************************************
    const [rates, setRates] = useState<RatesMap | null>(null);
    const displayCurrency = DEFAULT_DISPLAY_CURRENCY;

    // Loading and Error State
    const [loadingPageData, setLoadingPageData] = useState(true);
    const [loadingRelated, setLoadingRelated] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [relatedError, setRelatedError] = useState<string | null>(null);
    const [loadingRates, setLoadingRates] = useState(true);

    // --- Data Fetching Effects ---
    useEffect(() => {
        setLoadingRates(true);
        getRatesMap().then(map => { setRates(map); setLoadingRates(false); });
    }, []);

    // Fetch Main Page Info and Products
    useEffect(() => {
        setLoadingPageData(true); setPageError(null); setPageInfo(null); setProducts([]);
        // --- Now this line will work correctly ---
        setLoadingRelated(true); setRelatedError(null); setRelatedProducts([]);
        // ---------------------------------------

        const primaryIdSlug = subcategoryIdSlug || categoryIdSlug;
        const idType = subcategoryIdSlug ? 'subcategory' : 'category';

        if (!primaryIdSlug) { setPageError("ID missing."); setLoadingPageData(false); return; }
        const numericId = parseInt(primaryIdSlug, 10);
        if (isNaN(numericId)) { setPageError(`Invalid ID:"${primaryIdSlug}".`); setLoadingPageData(false); notFound(); return; }

        const fetchPageData = async () => {
            let foundInfo: PageInfoState | null = null;
            try {
                // Fetch Category/Subcategory Info
                const catListResponse = await fetch(`${API_BASE_URL}/api/categories`);
                if (!catListResponse.ok) throw new Error('Cat list fetch fail.');
                const catListData: CategoriesApiResponse = await catListResponse.json();
                if (idType === 'subcategory') { /* ... find subcat info ... */ for (const cat of catListData.categories) { const sub = cat.subcategories.find(s => s.id === numericId); if (sub) { foundInfo = { id: sub.id, type: 'subcategory', title: `${sub.name.trim()} (${cat.name.trim()})`, description: sub.description || `Products in ${sub.name.trim()}.` }; break; } } }
                else { /* ... find cat info ... */ const cat = catListData.categories.find(c => c.id === numericId); if (cat) { foundInfo = { id: cat.id, type: 'category', title: cat.name.trim(), description: cat.description || `Products in ${cat.name.trim()}.` }; } }
                if (!foundInfo) { notFound(); return; }
                setPageInfo(foundInfo);

                // Fetch Products
                const productParams = new URLSearchParams(); productParams.set(idType === 'subcategory' ? 'subcategoryId' : 'categoryId', numericId.toString());
                const productApiUrl = `${API_BASE_URL}/api/products?${productParams.toString()}`;
                const prodResponse = await fetch(productApiUrl);
                if (!prodResponse.ok) throw new Error(`Product fetch fail (${prodResponse.status})`);
                const prodData: ProductsApiResponse = await prodResponse.json(); if (!prodData?.products) throw new Error("Invalid product data.");
                setProducts(prodData.products.filter(p => p && typeof p.id !== 'undefined'));

            } catch (err) { console.error("Fetch Page Data Error:", err); setPageError(err instanceof Error ? err.message : "Error loading page data."); }
            finally { setLoadingPageData(false); }
        };
        fetchPageData();
    }, [categoryIdSlug, subcategoryIdSlug]);

    // Fetch Related Products
    useEffect(() => {
        const currentId = pageInfo?.id; const currentType = pageInfo?.type;
        const subcatIdForRelated = currentType === 'subcategory' ? currentId : undefined;
        if (!currentId || typeof subcatIdForRelated === 'undefined') { setLoadingRelated(false); setRelatedProducts([]); return; }

        setLoadingRelated(true); setRelatedError(null);
        const fetchRelated = async () => {
            try {
                const relatedUrl = `${API_BASE_URL}/api/products?limit=${RELATED_PRODUCTS_LIMIT + 1}&subcategoryId=${subcatIdForRelated}`;
                const response = await fetch(relatedUrl); if (!response.ok) throw new Error(`Related fetch fail: ${response.status}`);
                const listData: ProductsApiResponse = await response.json(); if (!listData?.products) throw new Error("Invalid related data.");
                const relatedItems = listData.products .filter(p => p && typeof p.id !== 'undefined' /* && p.id !== currentId */) .slice(0, RELATED_PRODUCTS_LIMIT) .map((p): ApiProduct => ({ ...p, description: p.description || '', default_currency: p.default_currency || DEFAULT_FALLBACK_CURRENCY, base_price: p.base_price || '0', images: p.images || '[]', sizes: p.sizes || [], is_featured: p.is_featured ?? false, is_new_arrival: p.is_new_arrival ?? false, category: p.category, subcategory: p.subcategory, calculated_price: p.calculated_price ?? parseFloat(p.base_price || '0'), }));
                setRelatedProducts(relatedItems); // Now this works
            } catch (err) { console.error("Failed fetch related:", err); setRelatedError(err instanceof Error ? err.message : "Could not load related."); }
            finally { setLoadingRelated(false); }
        };
        fetchRelated();
    }, [pageInfo]); // Depends on pageInfo

    // --- Memoized Values ---
    // Note: Removed unused memoized values related to single product display
    // If you need them later, uncomment and ensure productData is the correct source

    // --- Event Handlers ---
    const handleFilterChange = (filterType: string, value: any, isChecked?: boolean) => { /* TODO */ };
    const handleSortChange = (sortValue: string) => { /* TODO */ };

    // --- Render Logic ---
    const isLoading = loadingPageData || loadingRates;

    if (isLoading && !pageError) { return <div className="container py-10 text-center">Loading...</div>; }
    if (pageError) { return <div className="container py-10 text-center text-destructive">Error: {pageError}</div>; }
    if (!pageInfo) { return <div className="container py-10 text-center">Category or Subcategory not found.</div>; }

    // --- Render Component JSX ---
    return (
        <div className="container py-10">
            {/* Page Header */}
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
                <p className="text-muted-foreground">{pageInfo.description}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="hidden lg:block w-64 space-y-6 flex-shrink-0">
                     {/* ... Placeholder filters ... */}
                     <div><h3 className="font-medium mb-4 text-lg">Filters</h3></div>
                     <div> <h4 className="font-medium mb-3">Price Range</h4> <div className="space-y-2"> {/* ... price checkboxes ... */} </div> </div> <Separator />
                     <div> <h4 className="font-medium mb-3">Scent Family</h4> <div className="space-y-2"> {/* ... scent checkboxes ... */} </div> </div> <Separator />
                     <div> <h4 className="font-medium mb-3">Size</h4> <div className="space-y-2"> {/* ... size checkboxes ... */} </div> </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    {/* Mobile Filters/Sort */}
                     <div className="flex flex-col sm:flex-row gap-4 mb-6 lg:hidden"> /* ... */ </div>
                     {/* Desktop Filters/Sort */}
                    <div className="hidden lg:flex justify-between items-center mb-6"> /* ... */ </div>

                    {/* Products Grid */}
                     {loadingPageData && products.length === 0 ? (
                         <div className="text-center py-10 text-muted-foreground">Loading products...</div>
                     ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    rates={rates}
                                    displayCurrency={displayCurrency}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground"> No products found in this {pageInfo.type}. </div>
                    )}
                    {/* TODO: Pagination */}
                </main>
            </div>

             {/* Related Products Section */}
             <section aria-labelledby="related-products-heading" className="mt-16 lg:mt-24">
                 <h2 id="related-products-heading" className="text-2xl font-bold mb-6">You May Also Like</h2>
                 {loadingRelated && <div className="text-center text-muted-foreground">Loading...</div>}
                 {!loadingRelated && relatedError && <div className="text-center text-destructive">Error: {relatedError}</div>}
                 {!loadingRelated && !relatedError && relatedProducts.length === 0 && <div className="text-center text-muted-foreground">No related products.</div>}
                 {!loadingRelated && !relatedError && relatedProducts.length > 0 && ( <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6"> {relatedProducts.map((relatedProd) => ( <ProductCard key={relatedProd.id} product={relatedProd} rates={rates} displayCurrency={displayCurrency} /> ))} </div> )}
            </section>
        </div>
    );
}