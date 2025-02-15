FROM node:20.4-alpine

RUN apk add --no-cache git

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

ENV NODE_ENV production

# Install dependencies according to package-lock.json.
RUN npm ci

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "./src/bin/www" ]
