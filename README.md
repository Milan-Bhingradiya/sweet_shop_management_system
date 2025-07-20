# Sweet Shop Management System 🧁

A modern full-stack web application for managing a sweet shop with inventory, orders, and customer management.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Image Upload**: Cloudinary
- **Package Manager**: Bun
- **Deployment**: Heroku

## TDD Approach 🔄

This project follows **Test-Driven Development (TDD)** principles - writing tests first, then implementing the functionality.

### Example TDD Workflow from Commits:

#### 1. Authentication System

```
📝 First: Write test cases
✅ Commit: "Add auth tests for login, register, and JWT verification"
   - login.test.ts
   - register.test.ts
   - verifyjwt.test.ts

🔧 Then: Implement endpoints
✅ Commit: "Implement auth endpoints and middleware"
   - POST /auth/login
   - POST /auth/register
   - Middleware: JWT verification
```

#### 2. Category Management

```
📝 First: Write test cases
✅ Commit: "Add category CRUD test cases"
   - addCategory.test.ts
   - editCategory.test.ts
   - deleteCategory.test.ts
   - listCategory.test.ts
   - listCategoryByid.test.ts

🔧 Then: Implement endpoints
✅ Commit: "Implement category CRUD endpoints"
   - POST /categories (add)
   - PUT /categories/:id (edit)
   - DELETE /categories/:id (delete)
   - GET /categories (list all)
   - GET /categories/:id (get by id)
```

#### 3. Product Management

```
📝 First: Write test cases
✅ Commit: "Add product management test suite"
   - addProduct.test.ts
   - updateProduct.test.ts
   - deleteProduct.test.ts
   - listProduct.test.ts
   - getProductDetails.test.ts

🔧 Then: Implement endpoints
✅ Commit: "Implement product CRUD with image upload"
   - POST /products (add with images)
   - PUT /products/:id (update)
   - DELETE /products/:id (delete)
   - GET /products (list with filters)
   - GET /products/:id (get details)
```

#### 4. Order System

```
📝 First: Write test cases
✅ Commit: "Add order management tests"
   - createOrder.test.ts
   - listOrders.test.ts
   - updateOrderStatus.test.ts
   - orderEndpoints.test.ts

🔧 Then: Implement endpoints
✅ Commit: "Implement order processing system"
   - POST /orders (create order)
   - GET /orders (list orders)
   - PUT /orders/:id/status (update status)
   - GET /admin/orders (admin view)
```

## Benefits of TDD in This Project

1. **🛡️ Confidence**: Every feature is backed by tests
2. **🐛 Bug Prevention**: Catch issues before they reach production
3. **📐 Clear Requirements**: Tests define expected behavior
4. **♻️ Refactoring Safety**: Change code without breaking functionality
5. **📚 Documentation**: Tests serve as living documentation

## Test Coverage

```
✅ Authentication: 100%
✅ Categories: 100%
✅ Products: 100%
✅ Orders: 100%
```

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Milan-Bhingradiya/sweet_shop_management_system.git

# Install dependencies
cd sweet_shop_management_system/backend
bun install

cd ../frontend
bun install

# Run tests (TDD approach)
bun test

# Start development
bun run dev
```

## Live Demo

🌐 **Frontend**: [Sweet Shop App](https://sweet-shop-management-system-seven.vercel.app/)
🔧 **Backend API**: [API Endpoints](https://sweet-shop-management-system-60d31ee24ccf.herokuapp.com/)

---

_Built with ❤️ using Test-Driven Development_
