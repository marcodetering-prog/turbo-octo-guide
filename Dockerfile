FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the application with environment variables
# Railway passes these as build-time arguments
ARG VITE_OPENAI_API_KEY
ARG VITE_CLAUDE_API_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_CLAUDE_API_KEY=$VITE_CLAUDE_API_KEY
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
