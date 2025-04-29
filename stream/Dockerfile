#Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

#Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /usr/src/app/.ts-node ./.ts-node

# friends don’t let friends run containers as root!
USER node

# Expose the port the app runs on
EXPOSE 3002

CMD ["node", ".ts-node/index.js"]