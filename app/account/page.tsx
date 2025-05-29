"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, User, Mail, Phone, MapPin, LogOut, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AccountPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState("")
  const [user, setUser] = useState<any>(null)

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  })

  // UI states
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "register" | "profile">("login")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      setIsAuthenticated(true)
      fetchUserProfile(storedToken)
    }
  }, [])

  // Update profile form when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      })
      setCurrentView("profile")
    }
  }, [user])

  // Fetch user profile from API
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setCurrentView("profile")
      } else {
        // Token might be expired or invalid
        handleLogout()
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    }
  }

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validate form
    const newErrors: Record<string, string> = {}
    if (!loginForm.email) newErrors.email = "Email is required"
    if (!loginForm.password) newErrors.password = "Password is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (response.ok) {
        // Save token and update state
        localStorage.setItem("token", data.token)
        setToken(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        setCurrentView("profile")

        toast({
          title: "Success",
          description: "You have successfully logged in",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Login failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validate form
    const newErrors: Record<string, string> = {}
    if (!registerForm.first_name) newErrors.first_name = "First name is required"
    if (!registerForm.last_name) newErrors.last_name = "Last name is required"
    if (!registerForm.email) newErrors.email = "Email is required"
    if (!registerForm.password) newErrors.password = "Password is required"
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = registerForm

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (response.ok) {
        // Save token and update state
        localStorage.setItem("token", data.token)
        setToken(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        setCurrentView("profile")

        toast({
          title: "Success",
          description: "Your account has been created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Registration failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      })

      const data = await response.json()

      if (response.ok) {
        setUser({ ...user, ...profileForm })
        toast({
          title: "Success",
          description: "Your profile has been updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken("")
    setUser(null)
    setIsAuthenticated(false)
    setCurrentView("login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {currentView === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription className="text-gray-200">Sign in to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                          onClick={() => {
                            /* Add forgot password functionality */
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pr-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-3">
                    <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center text-sm text-gray-500">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="text-gray-800 hover:text-gray-900 font-medium"
                        onClick={() => setCurrentView("register")}
                      >
                        Create one
                      </button>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          )}

          {currentView === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg">
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="mr-2 p-1 rounded-full hover:bg-gray-700/50"
                      onClick={() => setCurrentView("login")}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                      <CardDescription className="text-gray-200">Join our community today</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="first_name"
                            placeholder="John"
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={registerForm.first_name}
                            onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                          />
                        </div>
                        {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          placeholder="Doe"
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={registerForm.last_name}
                          onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                        />
                        {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register_email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register_email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 123-4567"
                          className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register_password">Password</Label>
                      <div className="relative">
                        <Input
                          id="register_password"
                          type={showPassword ? "text" : "password"}
                          className="pr-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          )}

          {currentView === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
                      <CardDescription className="text-gray-200">Manage your account information</CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                {user ? (
                  <form onSubmit={handleUpdateProfile}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile_first_name">First Name</Label>
                          <Input
                            id="profile_first_name"
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="profile_last_name">Last Name</Label>
                          <Input
                            id="profile_last_name"
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile_email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="profile_email"
                            type="email"
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile_phone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="profile_phone"
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile_address">Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="profile_address"
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Account Type:</span>
                          <span className="font-medium">{user.role || "Standard"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                          <span>Member Since:</span>
                          <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3">
                      <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </CardFooter>
                  </form>
                ) : (
                  <CardContent>
                    <div className="py-8 text-center">
                      <p>Loading profile information...</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
