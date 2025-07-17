# Use the official Bun image
FROM oven/bun:1.1.38

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb (if exists)
COPY package.json bun.lock* ./

# Copy prisma schema first (before installing dependencies)
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bun prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["bun", "run", "start"]
