FROM node:6-alpine

# Need to install extra dependencies for native modules.
RUN apk add --no-cache make gcc g++ python git libc6-compat

# Install the latest version by default.
ARG VERSION=latest

# Install Composer UI.
RUN npm install --production -g pm2 composer-rest-server@${VERSION} && \
    npm cache clean

# Create the composer user ID.
RUN adduser -S composer

# Run as the composer user ID.
USER composer

# Run in the composer users home directory.
WORKDIR /home/composer

# Run supervisor to start the application.
ENV COMPOSER_CONNECTION_PROFILE hlfabric
ENV COMPOSER_BUSINESS_NETWORK org.acme.biznet
ENV COMPOSER_ENROLLMENT_ID admin
ENV COMPOSER_ENROLLMENT_SECRET Xurw3yU9zI0l
COPY server.js /usr/local/lib/node_modules/composer-rest-server/server/
CMD [ "pm2-docker", "composer-rest-server" ]

# Expose port 3000.
EXPOSE 3000
