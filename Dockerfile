# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy the rest of the application source code
COPY . .

# Compile TypeScript
RUN pnpm exec tsc
# Generate Prisma Client
RUN pnpm prisma generate


# Stage 2: Production image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --prod

# Copy the compiled code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "node", "dist/index.js" ]
