# Use Node.js LTS as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your Express server runs on
EXPOSE 3000

# Start the Express server
CMD ["npm", "run", "start"]