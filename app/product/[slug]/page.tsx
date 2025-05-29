"use client";

import { useState, useEffect, useMemo } from "react"; // Added useMemo
import Image from "next/image";
import Link from "next/link"; // Added Link for potential internal linking (e.g., brand, category)
import { Heart, Star, Truck, RotateCcw, ShieldCheck, ShoppingBag } from "lucide-react"; // Added ShoppingBag
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import the updated ProductCard and necessary types from its module
// Ensure paths and exports are correct.
import ProductCard, { ApiProduct, RatesMap, ExchangeRate, ApiProductSize } from "@/components/product-card";

// --- Interfaces ---
// Use ApiProduct as the primary type for product data throughout the component
// Define the expected shape of the data fetched for a *single* product detail page
// Assuming the API endpoint /api/products/:id returns { product: ApiProduct }
interface ApiSingleProductResponse {
  product: ApiProduct; // Expect the main product data under this key
}

// Define the expected shape of the data fetched from the product *list* endpoint for related products
// This might contain less detail than the full ApiProduct
interface RelatedApiProductFromList {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  subcategory_id?: number;
  brand?: string;
  default_currency: string;
  base_price: string;
  images: string; // JSON string array
  // List view might not include sizes, category objects etc.
}

// Interface for the list API response structure
interface ListApiResponse {
  products: RelatedApiProductFromList[];
  pagination?: any; // Optional pagination info
}

// ***** ADDED: Interface for items stored in the shopping cart *****
interface CartItem {
    id: string; // Unique identifier for the cart item (e.g., productId-size)
    productId: number;
    name: string;
    size: string | null; // Use null if no size is applicable/selected
    quantity: number;
    price: number; // Price *per unit* at the time of adding
    currency: string; // Currency of the stored price
    imageUrl?: string; // Optional: image URL for display in cart
}
// ******************************************************************


// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const UPLOADS_URL = `${API_BASE_URL}/uploads`; // Centralize uploads path construction
const DEFAULT_DISPLAY_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_DISPLAY_CURRENCY || "ETB"; // Ethiopia Time Zone default
const DEFAULT_FALLBACK_CURRENCY = 'USD'; // Fallback if product currency is missing

// --- Helper Functions (Consider moving shared functions to a 'utils' file) ---

const parseImages = (imagesString: string | undefined): string[] => {
  if (!imagesString) return [];
  try {
    const parsed = JSON.parse(imagesString);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed.map(imgPath => `${UPLOADS_URL}/${imgPath}`); // Prepend base URL here
    }
    return [];
  } catch (e) {
    console.error("Failed to parse images string:", imagesString, e);
    return [];
  }
};

const convertCurrency = ( amount: number, fromCurrency: string, toCurrency: string, rates: RatesMap | null ): number | null => {
  if (!rates) return null;
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (!fromRate || !toRate) { console.warn(`Missing rate for conversion: ${fromCurrency} (${fromRate}) -> ${toCurrency} (${toRate})`); return null; }
  if (fromRate <= 0 || toRate <= 0) { console.error("Invalid rate found:", fromCurrency, fromRate, toCurrency, toRate); return null; }
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
};

const formatCurrency = (value: number, currencyCode: string): string => {
   const options = { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 };
   try {
     // Specific formatting for ETB
     if (currencyCode === 'ETB') return `ETB ${value.toFixed(2)}`;
     // Use 'en' locale as a generic fallback for Intl support.
     return new Intl.NumberFormat('en', options).format(value);
   } catch (e) {
     console.warn(`Currency formatting failed for ${currencyCode}: ${e}`);
     return `${currencyCode} ${value.toFixed(2)}`; // Basic fallback
   }
};

async function getRatesMap(): Promise<RatesMap | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/exchange-rates`);
    if (!response.ok) throw new Error(`Failed to fetch rates: ${response.statusText} (${response.status})`);
    const ratesData: ExchangeRate[] = await response.json();
    const ratesMap = ratesData.reduce((map, rate) => {
        const rateValue = parseFloat(rate.rate_from_usd);
        if (!isNaN(rateValue) && rateValue > 0) map[rate.currency_code] = rateValue; // Ensure rate is positive
        return map;
    }, {} as RatesMap);
    if (!ratesMap.USD) ratesMap.USD = 1.0; // Ensure USD base rate exists
    return ratesMap;
  } catch (error) {
    console.error("Error fetching or processing exchange rates:", error);
    return null;
  }
}

// --- Component ---

export default function ProductPage({ params }: { params: { slug: string } }) {
  const productId = params?.slug;
  if (!productId) {
    // This case should ideally be handled by routing or a dedicated "not found" state
    // For now, render a simple message. A proper solution would use Next.js notFound()
    return <div className="container py-10 text-center text-red-600">Error: Product ID is missing.</div>;
  }

  // --- State ---
  const [productData, setProductData] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
  const [rates, setRates] = useState<RatesMap | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<string>(DEFAULT_DISPLAY_CURRENCY);

  // UI Interaction State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Index of the main product image list
  const [activeImageUrl, setActiveImageUrl] = useState<string>(""); // URL of the currently displayed large image
  const [selectedSizeValue, setSelectedSizeValue] = useState<string | undefined>(undefined); // Use undefined initially
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Loading and Error State
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingRates, setLoadingRates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching Effects ---

  // Fetch Exchange Rates (runs once)
  useEffect(() => {
    setLoadingRates(true);
    getRatesMap().then(map => {
        setRates(map);
        setLoadingRates(false);
        if (!map) { console.warn("Exchange rates could not be loaded."); }
    });
  }, []);

  // Fetch Main Product Data (runs when productId changes)
  useEffect(() => {
    // Reset state before fetching new product
    setLoadingProduct(true);
    setError(null);
    setProductData(null);
    setActiveImageUrl("");
    setSelectedImageIndex(0);
    setSelectedSizeValue(undefined);
    setRelatedProducts([]); // Clear related products too

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
            if (!response.ok) {
                 if (response.status === 404) throw new Error(`Product not found (ID: ${productId}).`);
                 throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            const responseData: ApiSingleProductResponse = await response.json();
            if (!responseData?.product) throw new Error("Invalid API response: 'product' data missing.");

            // Use the fetched data, ensuring defaults for critical fields
            const fetchedProduct: ApiProduct = {
                ...responseData.product,
                default_currency: responseData.product.default_currency || DEFAULT_FALLBACK_CURRENCY,
                base_price: responseData.product.base_price || '0',
                sizes: responseData.product.sizes || [],
                images: responseData.product.images || '[]',
            };

            const parsedImages = parseImages(fetchedProduct.images);
            const defaultSize = fetchedProduct.sizes?.[0]?.size; // Auto-select first size if available

            let initialActiveImage = parsedImages.length > 0 ? parsedImages[0] : "/placeholder.svg?height=600&width=500";

            // If default size exists and has specific images, use the first one
            if (defaultSize) {
                const defaultSizeData = fetchedProduct.sizes.find(s => s.size === defaultSize);
                const sizeImages = defaultSizeData?.size_images; // Already an array from API?
                if (Array.isArray(sizeImages) && sizeImages.length > 0) {
                    initialActiveImage = `${UPLOADS_URL}/${sizeImages[0]}`;
                }
            }

            setProductData(fetchedProduct);
            setActiveImageUrl(initialActiveImage);
            setSelectedSizeValue(defaultSize);

        } catch (err) {
            console.error("Fetch Product Error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while loading product data.");
        } finally {
            setLoadingProduct(false);
        }
    };
    fetchProduct();
  }, [productId]);

  // Fetch Related Products (runs when main product data is available)
  useEffect(() => {
    if (!productData?.category_id) {
        setLoadingRelated(false); // No category ID, so nothing to fetch
        return;
    }
    setLoadingRelated(true);
    const fetchRelated = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products?limit=5&excludeId=${productData.id}&categoryId=${productData.category_id}`); // Example: Enhance API query
            if (!response.ok) throw new Error(`API error fetching related: ${response.statusText}`);

            const listData: ListApiResponse = await response.json();

            // Map related product list data to the full ApiProduct structure needed by ProductCard
            const transformedRelated = listData.products
                .slice(0, 4) // Ensure max 4 are shown
                .map((p): ApiProduct => ({ // Map directly to ApiProduct, providing defaults
                    id: p.id,
                    name: p.name,
                    description: p.description || '',
                    category_id: p.category_id,
                    subcategory_id: p.subcategory_id,
                    brand: p.brand,
                    default_currency: p.default_currency || DEFAULT_FALLBACK_CURRENCY,
                    is_featured: false, // Assume not featured in related list
                    is_new_arrival: false, // Assume not new in related list
                    base_price: p.base_price || '0',
                    images: p.images || '[]', // Keep original string if card needs it? No, card parses.
                    created_at: '', // Not needed for card
                    updated_at: '', // Not needed for card
                    category: undefined, // Likely not available in list view
                    subcategory: undefined, // Likely not available in list view
                    sizes: [], // Assume sizes aren't in list view
                    calculated_price: parseFloat(p.base_price || '0'), // Use base_price as fallback
                }));

            setRelatedProducts(transformedRelated);
        } catch (err) {
            console.error("Failed to fetch or process related products:", err);
            // Optionally set a specific error state for related products
        } finally {
            setLoadingRelated(false);
        }
    };
    fetchRelated();
  }, [productData]); // Dependency: run when productData changes

  // --- Memoized Derived Values ---

  // Memoize parsed images for the main product
  const mainDisplayImages = useMemo(() => productData ? parseImages(productData.images) : [], [productData]);
  const fallbackImage = "/placeholder.svg?height=600&width=500";

  // Memoize size options
  const sizeOptions = useMemo(() => productData?.sizes?.map(s => ({ value: s.size, label: s.size })) || [], [productData?.sizes]);

  // Memoize price calculation
  const { priceInDefaultCurrency, priceConverted, finalPriceDisplay } = useMemo(() => {
    if (!productData) return { priceInDefaultCurrency: 0, priceConverted: null, finalPriceDisplay: "N/A" };

    let priceDefault = parseFloat(productData.base_price); // Start with base price
    if (selectedSizeValue) {
         const sizeInfo = productData.sizes.find(s => s.size === selectedSizeValue);
         if (sizeInfo) {
             const sizePrice = parseFloat(sizeInfo.price);
             if (!isNaN(sizePrice)) priceDefault = sizePrice; // Use size price if valid
         }
    }
    if (isNaN(priceDefault)) priceDefault = 0; // Ensure it's a number

    const converted = convertCurrency(
        priceDefault,
        productData.default_currency,
        displayCurrency,
        rates
    );

    let displayStr: string;
    if (loadingRates) {
        displayStr = "Calculating price...";
    } else if (converted !== null) {
         displayStr = formatCurrency(converted, displayCurrency);
    } else {
        // Conversion failed (e.g., missing rate), display in original currency with warning/indicator
         displayStr = `${formatCurrency(priceDefault, productData.default_currency)}*`; // Add indicator
        // Optionally add a tooltip explaining the '*'
         console.warn(`Displaying price in original currency (${productData.default_currency}) due to conversion issue.`);
    }

    return {
        priceInDefaultCurrency: priceDefault,
        priceConverted: converted,
        finalPriceDisplay: displayStr
    };
  }, [productData, selectedSizeValue, displayCurrency, rates, loadingRates]);

  // --- Event Handlers ---

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    setActiveImageUrl(mainDisplayImages[index] || fallbackImage);
  };

  const handleSizeChange = (newSizeValue: string) => {
    setSelectedSizeValue(newSizeValue);
    const selectedSizeData = productData?.sizes?.find(s => s.size === newSizeValue);

    // Start with the currently selected main image (if any)
    let newActiveImage = mainDisplayImages?.[selectedImageIndex] || mainDisplayImages?.[0] || fallbackImage;

    // If the new size has specific images, update the active image
    if (selectedSizeData?.size_images && Array.isArray(selectedSizeData.size_images) && selectedSizeData.size_images.length > 0) {
        newActiveImage = `${UPLOADS_URL}/${selectedSizeData.size_images[0]}`;
        // Optional: Reset main image selection index if size image overrides it
        // setSelectedImageIndex(-1); // Or manage this state differently
    }
    setActiveImageUrl(newActiveImage);
  };

  // ***** UPDATED: Add to Cart Handler with Local Storage *****
  const handleAddToCart = () => {
    if (!productData) return;

    // Basic validation
    if (sizeOptions.length > 0 && !selectedSizeValue) {
        // Consider using a more user-friendly notification system (e.g., toast)
        alert("Please select a size.");
        return;
    }

    // --- Local Storage Logic ---
    try {
        // 1. Get current cart from localStorage
        const existingCartString = localStorage.getItem("shoppingCart");
        let cart: CartItem[] = [];
        if (existingCartString) {
            try {
                cart = JSON.parse(existingCartString);
                if (!Array.isArray(cart)) { // Basic validation if JSON is not an array
                    console.warn("Existing cart data in localStorage is not an array. Resetting.");
                    cart = [];
                }
            } catch (parseError) {
                console.error("Failed to parse cart from localStorage:", parseError);
                // Decide how to handle: reset cart or stop? Let's reset for robustness.
                cart = [];
            }
        }

        // 2. Determine price and currency to store
        //    Store the price per single unit.
        const priceToAdd = priceConverted !== null ? priceConverted : priceInDefaultCurrency;
        const currencyToAdd = priceConverted !== null ? displayCurrency : productData.default_currency;

        // 3. Create the new cart item object to potentially add
        const cartItemId = `${productData.id}-${selectedSizeValue || 'default'}`; // Unique ID based on product and size
        const newItem: CartItem = {
            id: cartItemId,
            productId: productData.id,
            name: productData.name,
            size: selectedSizeValue || null, // Store null if no size selected/applicable
            quantity: selectedQuantity,
            price: priceToAdd, // Store the unit price
            currency: currencyToAdd,
            imageUrl: activeImageUrl || mainDisplayImages[0] || undefined // Store current or first image
        };

        // 4. Check if item already exists (same product ID and size)
        const existingItemIndex = cart.findIndex(item => item.id === cartItemId);

        if (existingItemIndex > -1) {
            // Item exists - update quantity
            cart[existingItemIndex].quantity += selectedQuantity;
            // Note: We generally don't update the price here, as the price might have changed
            // since the item was first added. The price stored is the price *at the time of adding*.
        } else {
            // Item doesn't exist - add new item
            cart.push(newItem);
        }

        // 5. Save the updated cart back to localStorage
        localStorage.setItem("shoppingCart", JSON.stringify(cart));

        // 6. Provide user feedback (replace alert with better UI element like toast)
        console.log('Cart updated:', cart);
        alert(`${newItem.name} ${newItem.size ? `(${newItem.size}) ` : ''}added/updated in cart. New quantity: ${existingItemIndex > -1 ? cart[existingItemIndex].quantity : newItem.quantity}.`);

        // Optional: Update a cart count display elsewhere in your UI
        // dispatchCartUpdate(); // Example function call

    } catch (error) {
        console.error("Error updating cart in localStorage:", error);
        alert("There was an issue adding the item to your cart. Please try again.");
    }
  };
  // ***********************************************************

   const handleAddToWishlist = () => {
       if (!productData) return;
       // Implement actual wishlist logic
       console.log('Adding to wishlist:', productData.id);
       alert(`${productData.name} added to wishlist.`); // Placeholder feedback
   }

  // --- Render Logic ---

  // Combined loading state for initial page load
  const isPageLoading = loadingProduct || loadingRates;

  if (isPageLoading && !productData && !error) {
    // TODO: Replace with a more visually appealing Skeleton Loader component
    return (
         <div className="container py-10 text-center" aria-live="polite">
           Loading product details...
           {/* Example Skeleton Structure (replace with actual skeleton components) */}
           {/* <div className="grid md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
               <div className="space-y-4"><div className="bg-gray-300 h-[400px] w-full rounded"></div><div className="grid grid-cols-4 gap-2"><div className="bg-gray-300 h-20 w-full rounded"></div>...</div></div>
               <div className="space-y-6"><div className="bg-gray-300 h-8 w-3/4 rounded"></div><div className="bg-gray-300 h-10 w-1/4 rounded"></div><div className="bg-gray-300 h-20 w-full rounded"></div>...</div>
           </div> */}
         </div>
    );
  }

  if (error) {
    return <div className="container py-10 text-center text-destructive">Error: {error}</div>;
  }

  if (!productData) {
    // This state should ideally be caught by the loading/error states or productId check
    return <div className="container py-10 text-center text-muted-foreground">Product could not be loaded.</div>;
  }

  // --- Render Component JSX ---
  return (
    <div className="container py-10">
        {/* Main Product Section */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Images Column */}
            <section aria-labelledby="product-images-heading" className="space-y-4">
                 <h2 id="product-images-heading" className="sr-only">Product Images</h2>
                 <div className="relative aspect-square overflow-hidden rounded-lg shadow-md bg-secondary/10">
                     {/* Use mainDisplayImages derived state */}
                     <Image
                         key={activeImageUrl} // Re-render on URL change
                         src={activeImageUrl || fallbackImage} // Ensure fallback
                         alt={productData.name || "Product Image"}
                         fill
                         className="object-contain" // Use contain or cover based on preference
                         priority // Load this image first
                         sizes="(max-width: 768px) 100vw, 50vw" // Responsive image sizes
                      />
                 </div>
                 {mainDisplayImages.length > 1 && (
                     <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                         {mainDisplayImages.map((image, index) => (
                             <button
                                 key={`${productData.id}-thumb-${index}`} // More specific key
                                 type="button"
                                 onClick={() => handleThumbnailClick(index)}
                                 className={`relative aspect-square overflow-hidden rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 ${
                                    activeImageUrl === image // Highlight active thumbnail
                                      ? "border-primary scale-105 shadow-lg"
                                      : "border-transparent hover:border-muted-foreground/50 opacity-75 hover:opacity-100"
                                  }`}
                                 aria-label={`View image ${index + 1} of ${mainDisplayImages.length}`}
                              >
                                 <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 20vw, 10vw" />
                             </button>
                         ))}
                     </div>
                 )}
            </section>

            {/* Details Column */}
            <section aria-labelledby="product-details-heading" className="space-y-6">
                 {/* Product Info */}
                 <div className="space-y-2">
                     <h1 id="product-details-heading" className="text-3xl lg:text-4xl font-bold tracking-tight">{productData.name}</h1>
                     {/* Optional: Link to brand/category page if available */}
                     {productData.brand && <p className="text-sm text-muted-foreground">Brand: {productData.brand}</p>}
                     {productData.category && <p className="text-sm text-muted-foreground">Category: {productData.category.name}</p>}
                 </div>
                 <p className="text-3xl font-bold" aria-live="polite">
                     {finalPriceDisplay}
                     {/* Show clarification if price couldn't be converted */}
                     {finalPriceDisplay.endsWith('*') && <span className="text-sm font-normal text-muted-foreground ml-1">(Price in {productData.default_currency})</span>}
                 </p>
                 {/* Product description */}
                 <div className="prose prose-sm max-w-none text-muted-foreground">
                     <p>{productData.description || "No description available."}</p>
                 </div>
                 <Separator />

                 {/* Options (Size, Quantity) Form */}
                 {/* Use form onSubmit to trigger add to cart */}
                 <form onSubmit={(e) => { e.preventDefault(); handleAddToCart(); }} className="space-y-6">
                      {/* Size Selection */}
                      {sizeOptions.length > 0 && (
                         <fieldset className="space-y-2">
                             <legend className="text-base font-medium">Size:</legend>
                             {/* Use RadioGroup for selecting one size */}
                             <RadioGroup id="size" aria-label="Select size" value={selectedSizeValue || ""} onValueChange={handleSizeChange} className="flex flex-wrap gap-3">
                                 {sizeOptions.map((size) => (
                                     <Label key={size.value} htmlFor={`size-${size.value}`} className={`flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground hover:bg-accent hover:text-accent-foreground ${
                                        selectedSizeValue === size.value ? 'border-primary bg-primary text-primary-foreground shadow' : 'border-input' // Style selected size
                                     }`}>
                                         <RadioGroupItem id={`size-${size.value}`} value={size.value} className="sr-only" />
                                         {size.label}
                                     </Label>
                                 ))}
                             </RadioGroup>
                         </fieldset>
                      )}
                      {/* Quantity Selection */}
                      <div className="space-y-2">
                         <Label htmlFor="quantity" className="text-base font-medium">Quantity:</Label>
                         <Select name="quantity" value={selectedQuantity.toString()} onValueChange={(value) => setSelectedQuantity(parseInt(value, 10) || 1)}>
                             <SelectTrigger id="quantity" className="w-24"><SelectValue placeholder="Qty" /></SelectTrigger>
                             <SelectContent>{/* Generate options 1-10 */}
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(q => (<SelectItem key={q} value={q.toString()}>{q}</SelectItem>))}
                             </SelectContent>
                         </Select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                         {/* Add to Cart Button (triggers form submit) */}
                         <Button type="submit" size="lg" className="flex-1">
                             <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
                          </Button>
                          {/* Add to Wishlist Button */}
                          <Button type="button" size="lg" variant="outline" className="flex-1" onClick={handleAddToWishlist}>
                             <Heart className="mr-2 h-5 w-5" /> Add to Wishlist
                          </Button>
                      </div>
                 </form>
                 <Separator />

                 {/* Features/Guarantees */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center sm:text-left">
                     <div className="flex items-center justify-center sm:justify-start gap-2"><Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" /><span>Free Shipping Available</span></div>
                     <div className="flex items-center justify-center sm:justify-start gap-2"><RotateCcw className="h-5 w-5 text-muted-foreground flex-shrink-0" /><span>Easy 30-Day Returns</span></div>
                     <div className="flex items-center justify-center sm:justify-start gap-2"><ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" /><span>Secure Online Payment</span></div>
                 </div>

                 {/* Details/Reviews Tabs */}
                 <Tabs defaultValue="details" className="pt-4">
                     <TabsList className="grid w-full grid-cols-2">
                         <TabsTrigger value="details">Details</TabsTrigger>
                         <TabsTrigger value="reviews">Reviews</TabsTrigger>
                     </TabsList>
                     <TabsContent value="details" className="pt-4 prose prose-sm max-w-none text-muted-foreground">
                         <p>{productData.description || "Product details not available."}</p>
                         {productData.brand && <p><strong>Brand:</strong> {productData.brand}</p>}
                         {/* Add more details here if available (e.g., materials, origin) */}
                     </TabsContent>
                     <TabsContent value="reviews" className="pt-4 text-sm text-muted-foreground">
                         <p>Customer reviews will be shown here once available.</p>
                         {/* Placeholder for reviews - Fetch and display actual reviews here */}
                         <div className="flex items-center gap-1 mt-2" title="No reviews yet">
                             <Star className="w-4 h-4 text-muted-foreground" />
                             <Star className="w-4 h-4 text-muted-foreground" />
                             <Star className="w-4 h-4 text-muted-foreground" />
                             <Star className="w-4 h-4 text-muted-foreground" />
                             <Star className="w-4 h-4 text-muted-foreground" />
                             <span className="ml-1 text-xs">(0 Reviews)</span>
                         </div>
                     </TabsContent>
                 </Tabs>
            </section>
        </div>

        {/* Related Products Section */}
        <section aria-labelledby="related-products-heading" className="mt-16 lg:mt-24">
             <h2 id="related-products-heading" className="text-2xl font-bold mb-6">You May Also Like</h2>
             {/* Show loading state for related products */}
             {loadingRelated && <div className="text-center text-muted-foreground">Loading related products...</div>}
             {/* Show message if no related products found */}
             {!loadingRelated && relatedProducts.length === 0 && <div className="text-center text-muted-foreground">No related products found.</div>}
             {/* Display related products using ProductCard */}
             {!loadingRelated && relatedProducts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map((relatedProd) => (
                         <ProductCard
                             key={relatedProd.id}
                             product={relatedProd}
                             rates={rates} // Pass rates for currency conversion in the card
                             displayCurrency={displayCurrency} // Pass display currency
                             imageBaseUrl="" // Base URL is now prepended in parseImages helper
                          />
                    ))}
                </div>
             )}
        </section>
    </div>
  );
}