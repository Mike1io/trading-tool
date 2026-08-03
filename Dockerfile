# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies
RUN npm ci

# Copy source files and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Copy built app dist from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root node user for security
USER node

EXPOSE 8080

CMD ["node", "dist/server.js"]
