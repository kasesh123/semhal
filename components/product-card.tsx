// Ensure this runs on the client if using hooks like useMobile or state
"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

// --- BEGIN: Types (Ensure these match definitions elsewhere or keep them updated) ---

interface ApiProductSize {
  id: number;
  size: string;
  price: string;
  size_images?: string[]; // Optional array of strings
}

interface ApiProductCategory {
  id: number;
  name: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  description?: string; // Optional
  category_id: number;
  subcategory_id?: number; // Optional
  brand?: string; // Optional
  default_currency: string;
  is_featured?: boolean; // Optional
  is_new_arrival?: boolean; // Optional
  base_price: string;
  images?: string | null; // Can be string, null, or undefined from API/parent
  created_at?: string; // Optional
  updated_at?: string; // Optional
  category?: ApiProductCategory; // Optional
  subcategory?: ApiProductCategory; // Optional
  sizes?: ApiProductSize[]; // Optional
  calculated_price?: number; // Optional
}

export interface ExchangeRate {
    id: number;
    currency_code: string;
    rate_from_usd: string;
    updated_at: string;
}

export type RatesMap = Record<string, number>;

// --- END: Types ---


// --- BEGIN: Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const UPLOADS_URL = `${API_BASE_URL}/uploads`;
const DEFAULT_FALLBACK_CURRENCY = 'USD';
// --- END: Constants ---


// --- BEGIN: Helper Functions ---

const parseImages = (imagesString: string | undefined | null): string[] => {
    if (typeof imagesString !== 'string' || imagesString.trim() === '') { return []; }
    try {
        const parsed = JSON.parse(imagesString);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            return parsed
                .filter(imgPath => typeof imgPath === 'string' && imgPath.trim() !== '')
                .map(imgPath => `${UPLOADS_URL}/${imgPath.trim()}`);
        }
        console.warn("Parsed images string, but content was not an array of strings:", parsed);
        return [];
    } catch (e) {
        console.error(`Failed to parse images JSON string: "${imagesString}"`, e);
        return [];
    }
};

const convertCurrency = ( amount: number, fromCurrency: string | undefined, toCurrency: string, rates: RatesMap | null ): number | null => {
    const sourceCurrency = fromCurrency || DEFAULT_FALLBACK_CURRENCY;
    if (!rates) return null;
    if (sourceCurrency === toCurrency) return amount;
    const fromRate = rates[sourceCurrency];
    const toRate = rates[toCurrency];
    if (!fromRate || !toRate) { console.warn(`Missing rate: ${sourceCurrency} -> ${toCurrency}`); return null; }
    if (fromRate <= 0 || toRate <= 0) { console.error("Invalid rate:", sourceCurrency, fromRate, toCurrency, toRate); return null; }
    const amountInUsd = amount / fromRate;
    return amountInUsd * toRate;
};

const formatCurrency = (value: number, currencyCode: string): string => {
     const options = { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 };
     try {
        if (currencyCode === 'ETB') return `ETB ${value.toFixed(2)}`; // Specific ETB format
        return new Intl.NumberFormat('en', options).format(value);
    } catch (e) {
        console.warn(`Currency formatting failed for ${currencyCode}: ${e}`);
        return `${currencyCode} ${value.toFixed(2)}`;
    }
};

// --- Updated getPriceDisplay Function ---
const getPriceDisplay = ( product: ApiProduct, rates: RatesMap | null, displayCurrency: string ): string => {
    // Ensure defaults for calculation if fields are missing
    const { sizes = [], default_currency = DEFAULT_FALLBACK_CURRENCY, calculated_price, base_price = '0' } = product;
    let displayString = "Price unavailable";

    let minPriceDefault: number | null = null;
    let maxPriceDefault: number | null = null;

    // Calculate min/max from sizes if available
    if (sizes.length > 0) {
        const pricesDefault = sizes.map(s => parseFloat(s.price)).filter(p => !isNaN(p));
        if (pricesDefault.length > 0) {
            minPriceDefault = Math.min(...pricesDefault);
            maxPriceDefault = Math.max(...pricesDefault);
        }
    }

    // Fallback to calculated_price or base_price if sizes didn't provide prices
    if (minPriceDefault === null) {
        const calculated = calculated_price;
        const base = parseFloat(base_price);
        minPriceDefault = calculated ?? (!isNaN(base) ? base : 0);
        maxPriceDefault = minPriceDefault; // If only one fallback price, min equals max
    } else if (maxPriceDefault === null) {
         // Should not happen if minPriceDefault is set, but handle defensively
        maxPriceDefault = minPriceDefault;
    }

    // Ensure we have valid numbers before proceeding
    if (minPriceDefault !== null && maxPriceDefault !== null) {
        // Convert prices to the target display currency
        const minPriceConverted = convertCurrency(minPriceDefault, default_currency, displayCurrency, rates);
        const maxPriceConverted = convertCurrency(maxPriceDefault, default_currency, displayCurrency, rates);

        // Format the display string based on converted prices
        if (minPriceConverted !== null && maxPriceConverted !== null) {
            // Use toFixed for reliable comparison of potentially floating point numbers
            if (minPriceConverted.toFixed(2) === maxPriceConverted.toFixed(2)) {
                 // If min and max are the same, show single price
                 displayString = formatCurrency(minPriceConverted, displayCurrency);
            } else {
                 // ***** CHANGE HERE: Show Min - Max range *****
                 displayString = `${formatCurrency(minPriceConverted, displayCurrency)} - ${formatCurrency(maxPriceConverted, displayCurrency)}`;
                 // ********************************************
            }
        } else {
            // Conversion failed, display original price range with indicator
            console.warn(`Could not convert price for product ${product.id} to ${displayCurrency}. Displaying original.`);
            if (minPriceDefault.toFixed(2) === maxPriceDefault.toFixed(2)) {
                 displayString = formatCurrency(minPriceDefault, default_currency) + '*'; // Indicate original currency
            } else {
                 // Show original currency range
                 displayString = `${formatCurrency(minPriceDefault, default_currency)} - ${formatCurrency(maxPriceDefault, default_currency)}*`; // Indicate original currency
            }
        }
    }
    return displayString;
};
// --- END: Helper Functions ---


// --- BEGIN: Component ---

interface ProductCardProps {
  product: ApiProduct;
  rates: RatesMap | null;
  displayCurrency: string;
}

export default function ProductCard({ product, rates, displayCurrency }: ProductCardProps) {
  if (!product) {
     console.error("ProductCard received null or undefined product prop.");
     return null; // Render nothing if no product data
  }

  const isMobile = useMobile();

  const images = parseImages(product.images);
  const displayImage = images.length > 0 ? images[0] : "/placeholder.svg";
  const productHref = `/product/${product.id}`;

  // Calculate price display using the updated getPriceDisplay
  const priceDisplay = getPriceDisplay(product, rates, displayCurrency);

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div className="product-card group h-full rounded-lg overflow-hidden border border-border">
        <Link href={productHref} className="block h-full" aria-label={`View details for ${product.name}`}>
          {/* ... (Image and Badges remain the same) ... */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary/10">
             <Image src={displayImage} alt={product.name || 'Product Image'} fill sizes="(max-width: 768px) 50vw, 33vw" className="product-image object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
             {product.is_new_arrival && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow">New</span>}
             {product.is_featured && <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded shadow">Featured</span>}
          </div>
          <div className="p-2">
            <h3 className="text-xs font-medium line-clamp-1" title={product.name || 'Product'}>{product.name || 'Unnamed Product'}</h3>
            <div className="flex items-center justify-between mt-1">
              {/* Price display now shows min-max if applicable */}
              <span className="text-xs font-bold">{priceDisplay}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0" aria-label="Add to cart">
                <ShoppingBag className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // --- Desktop Layout ---
  return (
    <div className="product-card group border border-transparent hover:border-border transition-colors duration-300 rounded-lg overflow-hidden shadow hover:shadow-md">
      <Link href={productHref} className="block" aria-label={`View details for ${product.name}`}>
        {/* ... (Image, Badges, Wishlist Button remain the same) ... */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/10">
           <Image src={displayImage} alt={product.name || 'Product Image'} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" className="product-image object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
           {product.is_new_arrival && <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">New</span>}
           {product.is_featured && <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow">Featured</span>}
           <Button variant="ghost" size="icon" type="button" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 rounded-full" aria-label="Add to wishlist" >
               <Heart className="h-4 w-4" />
           </Button>
        </div>
        <div className="p-3 text-center">
          <h3 className="font-medium line-clamp-1 mb-1" title={product.name || 'Product'}>{product.name || 'Unnamed Product'}</h3>
           {/* Price display now shows min-max if applicable */}
          <span className="font-bold block mb-2">{priceDisplay}</span>
           <Button variant="outline" size="sm" type="button" className="w-full" aria-label="Add to cart" >
             <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
           </Button>
        </div>
      </Link>
    </div>
  );
}
// --- END: Component ---