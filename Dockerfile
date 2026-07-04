FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk update && apk add openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

EXPOSE 3000

# Deploy database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
