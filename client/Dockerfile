# Build Stage
FROM node:20 

WORKDIR /app

# Copy package.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining files
COPY . .

# Build React app
RUN npm run build

CMD ["npm","run","dev"]
