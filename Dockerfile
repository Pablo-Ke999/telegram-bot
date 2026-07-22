# Multi-stage build for Node.js Telegram Bot
# Stage 1: Dependencies
FROM node:20-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Production image
FROM node:20-slim
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 botuser

# Copy dependencies from builder
COPY --from=dependencies --chown=botuser:botuser /app/node_modules ./node_modules

# Copy application code
COPY --chown=botuser:botuser package*.json ./
COPY --chown=botuser:botuser src ./src
COPY --chown=botuser:botuser config.yaml ./
COPY --chown=botuser:botuser index.html index.js ./

# Create necessary directories
RUN mkdir -p uploads && chown -R botuser:botuser uploads

# Switch to non-root user
USER botuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('ok')" || exit 1

# Use dumb-init to handle signals
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["npm", "start"]

EXPOSE 3000
