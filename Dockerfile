FROM node:18-alpine

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install dependencies separately to maximize layer caching
COPY package*.json ./
RUN npm install --only=production

# Copy app source
COPY . .

# Fix permissions for runtime user
RUN chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["npm", "start"]
