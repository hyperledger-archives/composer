FROM node:6-alpine

# Reset npm logging to default level.
ENV NPM_CONFIG_LOGLEVEL warn

# Install the latest version by default.
ARG VERSION=latest

# Need to install extra dependencies for native modules.
RUN apk add --no-cache make gcc g++ python git libc6-compat && \
    npm install --production -g composer-cli@${VERSION} && \
    npm cache clean && \
    apk del make gcc g++ python git

# Create the composer user ID.
RUN adduser -S composer

# Run as the composer user ID.
USER composer

# Run in the composer users home directory.
WORKDIR /home/composer

# Run the composer CLI.
CMD ["composer"]
