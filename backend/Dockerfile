# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev dependencies)
RUN npm ci

# Reinstall prisma explicitly to ensure it's properly installed
RUN npm uninstall -D prisma && npm install -D prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS application with explicit compilation
RUN npm run build && npx tsc

# Production stage
FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder - copy both dist directories
COPY --from=builder /app/dist/src ./dist/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
