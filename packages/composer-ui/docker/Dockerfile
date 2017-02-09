FROM node:6-alpine

# Need to install extra dependencies for native modules.
RUN apk add --no-cache make gcc g++ python git

# Install the latest version by default.
ARG VERSION=latest

# Install Composer UI.
RUN npm install --production -g composer-ui@${VERSION} && \
    npm cache clean

# Create the composer user ID.
RUN adduser -S composer

# Run as the composer user ID.
USER composer

# Run supervisor to start the application.
CMD [ "composer-ui", "-p", "8080" ]

# Expose port 8080.
EXPOSE 8080
