"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useHydration } from "@/hooks/use-hydration";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const isHydrated = useHydration();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-pink-600"
            >
              SimpleSweet
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/products"
              className="text-gray-700 hover:text-pink-600 transition-colors"
            >
              Products
            </Link>

            {isHydrated && isAuthenticated ? (
              <>
                <Link href="/cart" className="relative">
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart ({cartItemsCount})
                  </Button>
                </Link>

                {user?.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                )}

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.name}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : isHydrated ? (
              <div className="space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="/products"
                className="block px-3 py-2 text-gray-700 hover:text-pink-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                Products
              </Link>

              {isHydrated && isAuthenticated ? (
                <>
                  <Link
                    href="/cart"
                    className="block px-3 py-2 text-gray-700 hover:text-pink-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart ({cartItemsCount})
                    </div>
                  </Link>

                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-pink-600 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Admin Panel
                    </Link>
                  )}

                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm text-gray-700">
                          {user?.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </>
              ) : isHydrated ? (
                <div className="px-3 py-2 space-y-2">
                  <Link
                    href="/login"
                    className="block"
                    onClick={closeMobileMenu}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    className="block"
                    onClick={closeMobileMenu}
                  >
                    <Button size="sm" className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
