# Dockerfile for multi-stage Next.js frontend + Flask backend on GCP Cloud Run
# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS builder
WORKDIR /app/next
COPY next/package*.json ./
RUN npm ci
COPY next/ ./
RUN npm run build

# Stage 2: Build the final runner container (Python runtime)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies & clean up lists
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Next.js production files and server dependencies
COPY --from=builder /app/next/package*.json ./next/
COPY --from=builder /app/next/.next ./next/.next
COPY --from=builder /app/next/public ./next/public
COPY --from=builder /app/next/node_modules ./next/node_modules
COPY --from=builder /app/next/next.config.* ./next/ || true

# Copy Flask backend code
COPY app.py ./
COPY static ./static
COPY templates ./templates

# Expose port (Cloud Run defaults to 8080 or uses PORT env var)
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Start script that runs the Flask API and Next.js server concurrently
# (Flask runs on port 5000 internally, and Next.js serves/proxies requests on 8080)
CMD ["sh", "-c", "python app.py & cd next && npx next start -p 8080"]
