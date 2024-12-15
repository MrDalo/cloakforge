# First Stage: Build Stage
FROM node:22-alpine as build-stage

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install


# Copy Prisma schema files
# COPY prisma ./prisma

# Generate Prisma Client
# RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Second Stage: Production Stage
FROM node:22-alpine as production-stage

# Set working directory
WORKDIR /app

# Copy the built application from the build stage
COPY --from=build-stage /app/package.json /app/package-lock.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/.next ./.next
COPY --from=build-stage /app/public ./public

# Copy Prisma schema files
# COPY --from=build-stage /app/prisma ./prisma

# Expose the port on which the app will run
EXPOSE 3000

# Start the Next.js app
CMD ["sh", "-c", "npm start > /app/logs/nextjs.log 2>&1"]