"use client";

import type React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { ordersApi } from "@/lib/api/orders";
import { useHydration } from "@/hooks/use-hydration";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Trash2, Edit } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const isHydrated = useHydration();
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    description: "",
    stock_quantity: 0,
    categoryId: "",
    image_urls: [] as string[],
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => productsApi.getProducts(),
    enabled: isHydrated,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: categoriesApi.getCategories,
    enabled: isHydrated,
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => ordersApi.getAllOrders(),
    enabled: isHydrated,
  });

  const addProductMutation = useMutation({
    mutationFn: productsApi.addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setNewProduct({
        name: "",
        price: 0,
        description: "",
        stock_quantity: 0,
        categoryId: "",
        image_urls: [],
      });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: categoriesApi.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setNewCategory({ name: "" });
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "PENDING" | "COMPLETED";
    }) => ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert categoryId to number before sending
    const productData = {
      ...newProduct,
      categoryId: Number(newProduct.categoryId),
    };
    addProductMutation.mutate(productData);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      ...product,
      categoryId: product.categoryId?.toString() || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const productData = {
      ...editingProduct,
      categoryId: Number(editingProduct.categoryId),
    };
    updateProductMutation.mutate({
      id: Number(editingProduct.id),
      data: productData,
    });
  };

  const handleDeleteProduct = (id: number) => {
    deleteProductMutation.mutate(id);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory({ ...category });
    setIsEditCategoryModalOpen(true);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    updateCategoryMutation.mutate({
      id: Number(editingCategory.id),
      data: editingCategory,
    });
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategoryMutation.mutate(newCategory);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="productPrice">Price (₹)</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            price: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="productStock">Stock Quantity</Label>
                      <Input
                        id="productStock"
                        type="number"
                        value={newProduct.stock_quantity}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            stock_quantity: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="productCategory">Category</Label>
                      <Select
                        value={newProduct.categoryId}
                        onValueChange={(value) =>
                          setNewProduct({
                            ...newProduct,
                            categoryId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {!isHydrated ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : categoriesLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading categories...
                            </SelectItem>
                          ) : categoriesError ? (
                            <SelectItem value="error" disabled>
                              Error loading categories
                            </SelectItem>
                          ) : categories?.data?.categories &&
                            Array.isArray(categories.data.categories) &&
                            categories.data.categories.length > 0 ? (
                            categories.data.categories.map((category: any) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-categories" disabled>
                              No categories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Product Images</Label>
                    <CloudinaryUpload
                      onUploadComplete={(urls) => {
                        setNewProduct({
                          ...newProduct,
                          image_urls: [...newProduct.image_urls, ...urls],
                        });
                      }}
                      onUploadError={(error) => {
                        toast({
                          title: "Upload Error",
                          description: error,
                          variant: "destructive",
                        });
                      }}
                      maxFiles={5}
                    />
                    {newProduct.image_urls.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Uploaded images:
                        </p>
                        <ul className="text-sm">
                          {newProduct.image_urls.map((url, index) => (
                            <li key={index} className="truncate">
                              {url}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={addProductMutation.isPending}>
                    {addProductMutation.isPending ? "Adding..." : "Add Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isHydrated ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : productsLoading ? (
                    <div className="text-center py-4">Loading products...</div>
                  ) : productsError ? (
                    <div className="text-center py-4 text-red-500">
                      Failed to load products
                    </div>
                  ) : products?.data?.products &&
                    Array.isArray(products.data.products) ? (
                    products.data.products.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-gray-600">
                            ₹{product.price} - Stock: {product.stock_quantity}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Dialog
                            open={isEditModalOpen}
                            onOpenChange={setIsEditModalOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                              </DialogHeader>
                              {editingProduct && (
                                <form
                                  onSubmit={handleUpdateProduct}
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="editProductName">
                                        Product Name
                                      </Label>
                                      <Input
                                        id="editProductName"
                                        value={editingProduct.name}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            name: e.target.value,
                                          })
                                        }
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editProductPrice">
                                        Price (₹)
                                      </Label>
                                      <Input
                                        id="editProductPrice"
                                        type="number"
                                        value={editingProduct.price}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            price: Number(e.target.value),
                                          })
                                        }
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editProductStock">
                                        Stock Quantity
                                      </Label>
                                      <Input
                                        id="editProductStock"
                                        type="number"
                                        value={editingProduct.stock_quantity}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            stock_quantity: Number(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editProductCategory">
                                        Category
                                      </Label>
                                      <Select
                                        value={editingProduct.categoryId}
                                        onValueChange={(value) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            categoryId: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories?.data?.categories?.map(
                                            (category: any) => (
                                              <SelectItem
                                                key={category.id}
                                                value={category.id.toString()}
                                              >
                                                {category.name}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="editProductDescription">
                                      Description
                                    </Label>
                                    <Textarea
                                      id="editProductDescription"
                                      value={editingProduct.description}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          description: e.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Product Images</Label>
                                    <CloudinaryUpload
                                      onUploadComplete={(urls) => {
                                        setEditingProduct({
                                          ...editingProduct,
                                          image_urls: [
                                            ...(editingProduct.image_urls ||
                                              []),
                                            ...urls,
                                          ],
                                        });
                                      }}
                                      onUploadError={(error) => {
                                        toast({
                                          title: "Upload Error",
                                          description: error,
                                          variant: "destructive",
                                        });
                                      }}
                                      maxFiles={5}
                                    />
                                    {editingProduct.image_urls &&
                                      editingProduct.image_urls.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-sm text-gray-600">
                                            Current images:
                                          </p>
                                          <div className="grid grid-cols-2 gap-2 mt-2">
                                            {editingProduct.image_urls.map(
                                              (url: string, index: number) => (
                                                <div
                                                  key={index}
                                                  className="relative"
                                                >
                                                  <img
                                                    src={url}
                                                    alt={`Product image ${
                                                      index + 1
                                                    }`}
                                                    className="w-full h-20 object-cover rounded"
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                                    onClick={() => {
                                                      const newImages =
                                                        editingProduct.image_urls.filter(
                                                          (
                                                            _: string,
                                                            i: number
                                                          ) => i !== index
                                                        );
                                                      setEditingProduct({
                                                        ...editingProduct,
                                                        image_urls: newImages,
                                                      });
                                                    }}
                                                  >
                                                    ×
                                                  </Button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="submit"
                                      disabled={updateProductMutation.isPending}
                                    >
                                      {updateProductMutation.isPending
                                        ? "Updating..."
                                        : "Update Product"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsEditModalOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the product "{product.name}
                                  ".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteProduct(Number(product.id))
                                  }
                                  disabled={deleteProductMutation.isPending}
                                >
                                  {deleteProductMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      No products available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Add Category Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={addCategoryMutation.isPending}
                  >
                    {addCategoryMutation.isPending
                      ? "Adding..."
                      : "Add Category"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Categories List */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isHydrated ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : categoriesLoading ? (
                    <div className="text-center py-4">
                      Loading categories...
                    </div>
                  ) : categoriesError ? (
                    <div className="text-center py-4 text-red-500">
                      Failed to load categories
                    </div>
                  ) : categories?.data?.categories &&
                    Array.isArray(categories.data.categories) ? (
                    categories.data.categories.map((category: any) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                        </div>
                        <div className="space-x-2">
                          <Dialog
                            open={isEditCategoryModalOpen}
                            onOpenChange={setIsEditCategoryModalOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                              </DialogHeader>
                              {editingCategory && (
                                <form
                                  onSubmit={handleUpdateCategory}
                                  className="space-y-4"
                                >
                                  <div>
                                    <Label htmlFor="editCategoryName">
                                      Category Name
                                    </Label>
                                    <Input
                                      id="editCategoryName"
                                      value={editingCategory.name}
                                      onChange={(e) =>
                                        setEditingCategory({
                                          ...editingCategory,
                                          name: e.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="submit"
                                      disabled={
                                        updateCategoryMutation.isPending
                                      }
                                    >
                                      {updateCategoryMutation.isPending
                                        ? "Updating..."
                                        : "Update Category"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setIsEditCategoryModalOpen(false)
                                      }
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the category "
                                  {category.name}". All products in this
                                  category will need to be reassigned.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCategory(Number(category.id))
                                  }
                                  disabled={deleteCategoryMutation.isPending}
                                >
                                  {deleteCategoryMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      No categories available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isHydrated ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : ordersLoading ? (
                    <div className="text-center py-4">Loading orders...</div>
                  ) : ordersError ? (
                    <div className="text-center py-4 text-red-500">
                      Failed to load orders
                    </div>
                  ) : orders?.data && Array.isArray(orders.data) ? (
                    orders.data.map((order: any) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-gray-600">
                              {order.customer_name} - {order.phone_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.order_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{order.total_amount}</p>
                            <Select
                              value={order.status}
                              onValueChange={(
                                status: "PENDING" | "COMPLETED"
                              ) =>
                                updateOrderStatusMutation.mutate({
                                  id: order.id,
                                  status,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="COMPLETED">
                                  Completed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Items: {order.order_items?.length || 0}</p>
                          {order.order_type === "DELIVERY" &&
                            order.address_line1 && (
                              <p>
                                Address: {order.address_line1}, {order.city} -{" "}
                                {order.pincode}
                              </p>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">No orders available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}
