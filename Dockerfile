# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally and then install all dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application source code
COPY . .

# Compile TypeScript
RUN pnpm exec tsc


# Stage 2: Production image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally and then install production dependencies
RUN npm install -g pnpm && pnpm install --prod

# Copy the compiled code and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "node", "dist/index.js" ]
