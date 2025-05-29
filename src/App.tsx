import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import HomePage from '@/pages/home'
import AccountPage from '@/pages/account'
import CartPage from '@/pages/cart'
import CategoryPage from '@/pages/category'
import CheckoutPage from '@/pages/checkout'
import ConfirmationPage from '@/pages/confirmation'
import MyOrdersPage from '@/pages/my-orders'
import ProductPage from '@/pages/product'

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Header />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/category/:categoryId/*" element={<CategoryPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>
      </main>
      <Footer />
    </ThemeProvider>
  )
}

export default App