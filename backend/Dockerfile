# Use the official Bun image
FROM oven/bun:1.1.38

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb (if exists)
COPY backend/package.json backend/bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy prisma schema
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN bun prisma generate

# Copy the rest of the application code
COPY backend/ ./

# Build the application
RUN bun run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["bun", "run", "start"]
