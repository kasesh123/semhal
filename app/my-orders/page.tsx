import Link from "next/link"
import Image from "next/image"
import { Package, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Mock orders data
const orders = [
  {
    id: "PO-123456",
    date: "April 10, 2025",
    total: "$289.99",
    status: "Delivered",
    items: [
      {
        id: 1,
        name: "Blooming Rose Elixir",
        image: "/placeholder.svg?height=100&width=100",
        price: "$89.99",
        quantity: 1,
      },
      {
        id: 7,
        name: "Sage & Lavender Harmony",
        image: "/placeholder.svg?height=100&width=100",
        price: "$95.00",
        quantity: 2,
      },
    ],
  },
  {
    id: "PO-123455",
    date: "March 25, 2025",
    total: "$159.99",
    status: "Processing",
    items: [
      {
        id: 3,
        name: "Pink Peony Dream",
        image: "/placeholder.svg?height=100&width=100",
        price: "$95.00",
        quantity: 1,
      },
      {
        id: 8,
        name: "Pink Grapefruit Zest",
        image: "/placeholder.svg?height=100&width=100",
        price: "$79.99",
        quantity: 1,
      },
    ],
  },
]

export default function MyOrdersPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search orders..." className="pl-8" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 space-y-6">
          <div className="flex justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-medium">No orders yet</h2>
          <p className="text-muted-foreground">When you place your first order, it will appear here.</p>
          <Button asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg overflow-hidden">
              <div className="bg-secondary/10 p-4 flex flex-col md:flex-row gap-4 justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">{order.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={order.status === "Delivered" ? "default" : "outline"}>{order.status}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="md:self-center" asChild>
                  <Link href={`/my-orders/${order.id}`}>
                    View Details <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="p-4">
                <h3 className="font-medium mb-4">Items</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 bg-secondary/10 rounded-md overflow-hidden">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
