# Dockerfile

# Stage 1: Build the application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package manager files and tsconfig
COPY package.json pnpm-lock.yaml tsconfig.json ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Set CI environment variable to true to avoid TTY issues
ENV CI=true

# Remove development dependencies
RUN pnpm prune --prod

# Stage 2: Create the final image
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Copy dependencies and build output from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/src/main.js"]