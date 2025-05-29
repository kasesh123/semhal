"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Footer() {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <footer className="bg-background border-t pt-6 pb-20">
        <div className="px-4 space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="about">
              <AccordionTrigger>About Poéselle</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover your signature scent with our luxury perfume collection. Handcrafted with the finest
                  ingredients for a truly unique experience.
                </p>
                <div className="flex space-x-4">
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Facebook className="h-5 w-5" />
                    <span className="sr-only">Facebook</span>
                  </Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Instagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shop">
              <AccordionTrigger>Shop</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/category/new-arrivals" className="text-muted-foreground hover:text-primary">
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/bestsellers" className="text-muted-foreground hover:text-primary">
                      Bestsellers
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/gift-sets" className="text-muted-foreground hover:text-primary">
                      Gift Sets
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/sale" className="text-muted-foreground hover:text-primary">
                      Sale
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-service">
              <AccordionTrigger>Customer Service</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/contact" className="text-muted-foreground hover:text-primary">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-muted-foreground hover:text-primary">
                      Shipping & Returns
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-muted-foreground hover:text-primary">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-4 pt-4">
            <h3 className="text-base font-semibold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3 py-2 border rounded-md text-sm"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Poéselle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-background border-t">
      <div className="container py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About Poéselle</h3>
            <p className="text-sm text-muted-foreground">
              Discover your signature scent with our luxury perfume collection. Handcrafted with the finest ingredients
              for a truly unique experience.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/category/new-arrivals" className="text-muted-foreground hover:text-primary">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/category/bestsellers" className="text-muted-foreground hover:text-primary">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/category/gift-sets" className="text-muted-foreground hover:text-primary">
                  Gift Sets
                </Link>
              </li>
              <li>
                <Link href="/category/sale" className="text-muted-foreground hover:text-primary">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-primary">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3 py-2 border rounded-md text-sm"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Poéselle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
