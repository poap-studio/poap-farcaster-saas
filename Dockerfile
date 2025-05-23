# Build stage
FROM node:alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

RUN npm run build --prod

# Production stage
FROM node:alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

ENV NODE_ENV=production
EXPOSE 3000

# Start the application
CMD ["npm", "start"]