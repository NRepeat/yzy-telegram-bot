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

RUN pnpm run build

ENV CI=true


FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Copy package.json for npx to work
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./
COPY --from=builder /app/prisma.config.ts ./


# Copy dependencies and build output from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD sh -c "npx prisma migrate deploy && node dist/src/main.js"
