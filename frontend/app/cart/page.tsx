"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { ordersApi } from "@/lib/api/orders";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } =
    useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY">("DINE_IN");
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    pincode: "",
    landmark: "",
  });
  const [orderToken, setOrderToken] = useState("");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (data) => {
      if (data.success) {
        setOrderToken(data.data.order_token || `SW${Date.now()}`);
        setShowPaymentConfirm(true);
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: "Your order has been placed and will be processed soon.",
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description:
          error.message || "Failed to place order. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleQuantityChange = (id: number, newQuantity: number) => {
    updateQuantity(id, newQuantity);
    toast({
      title: "Cart updated",
      description: "Item quantity has been updated",
      duration: 2000,
    });
  };

  const handleRemoveItem = (id: number, name: string) => {
    removeItem(id);
    toast({
      title: "Item removed",
      description: `${name} has been removed from your cart`,
      duration: 3000,
    });
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to place an order",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!customerName || !phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (
      orderType === "DELIVERY" &&
      (!address.line1 || !address.city || !address.pincode)
    ) {
      toast({
        title: "Missing delivery address",
        description: "Please fill in all delivery address fields",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const orderData = {
      customer_name: customerName,
      phone_number: phoneNumber,
      order_type: orderType,
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      ...(orderType === "DELIVERY" && {
        address_line1: address.line1,
        address_line2: address.line2,
        city: address.city,
        pincode: address.pincode,
        landmark: address.landmark,
      }),
    };

    createOrderMutation.mutate(orderData);
  };

  const handleConfirmPayment = () => {
    setShowPaymentConfirm(false);
    toast({
      title: "Payment confirmed!",
      description: `Order confirmed! Your order token is: ${orderToken}`,
      duration: 10000,
    });
  };

  if (showPaymentConfirm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Payment Gateway</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">We will add payment gateway later</p>
              <p className="text-2xl font-bold">Total: ₹{getTotal()}</p>
              <p className="text-sm text-gray-500">Order Token: {orderToken}</p>
              <Button onClick={handleConfirmPayment} className="w-full">
                Confirm Payment & Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Your cart is empty</p>
            <Button className="mt-4">Continue Shopping</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <Image
                        src={
                          item.image_url ||
                          "/placeholder.svg?height=80&width=80"
                        }
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-pink-600 font-bold">₹{item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="orderType">Order Type</Label>
                    <Select
                      value={orderType}
                      onValueChange={(value: "DINE_IN" | "DELIVERY") =>
                        setOrderType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINE_IN">Dine In</SelectItem>
                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {orderType === "DELIVERY" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          value={address.line1}
                          onChange={(e) =>
                            setAddress({ ...address, line1: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          value={address.line2}
                          onChange={(e) =>
                            setAddress({ ...address, line2: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={address.city}
                            onChange={(e) =>
                              setAddress({ ...address, city: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={address.pincode}
                            onChange={(e) =>
                              setAddress({
                                ...address,
                                pincode: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="landmark">Landmark</Label>
                        <Input
                          id="landmark"
                          value={address.landmark}
                          onChange={(e) =>
                            setAddress({ ...address, landmark: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total: ₹{getTotal()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full"
                    disabled={
                      createOrderMutation.isPending ||
                      !customerName ||
                      !phoneNumber
                    }
                  >
                    {createOrderMutation.isPending
                      ? "Placing Order..."
                      : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
