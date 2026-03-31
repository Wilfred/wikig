FROM node:20.4-alpine AS builder

RUN apk add --no-cache git

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20.4-alpine

RUN apk add --no-cache git

WORKDIR /usr/src/app

COPY package*.json ./
ENV NODE_ENV production
RUN npm ci

COPY --from=builder /usr/src/app/dist ./dist
COPY views ./views
COPY static ./static

EXPOSE 3000
CMD [ "node", "./dist/bin/www" ]
