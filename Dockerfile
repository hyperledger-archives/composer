FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Update npm
RUN npm install -g npm

# Set up the private npm registry
ARG NPM_TOKEN
RUN npm config set @ibm:registry https://npm-registry.whitewater.ibm.com
RUN npm config set //npm-registry.whitewater.ibm.com/:_authToken ${NPM_TOKEN}

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --quiet

# Bundle app source
COPY . /usr/src/app
