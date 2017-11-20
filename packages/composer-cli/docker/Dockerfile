FROM node:8-alpine

# Reset npm logging to default level.
ENV NPM_CONFIG_LOGLEVEL warn

# Install the latest version by default.
ARG VERSION=latest

# Need to install extra dependencies for native modules.
RUN deluser --remove-home node && \
    addgroup -g 1000 composer && \
    adduser -u 1000 -G composer -s /bin/sh -D composer && \
    apk add --no-cache make gcc g++ python git libc6-compat && \
    su -c "npm config set prefix '/home/composer/.npm-global'" - composer && \
    su -c "npm install --production -g composer-cli@${VERSION}" - composer && \
    su -c "npm cache clean --force" - composer && \
    rm -rf /home/composer/.config /home/composer/.node-gyp /home/composer/.npm && \
    apk del make gcc g++ python git

# Run as the composer user ID.
USER composer

# Add global composer modules to the path.
ENV PATH /home/composer/.npm-global/bin:$PATH

# Run in the composer users home directory.
WORKDIR /home/composer

# Run the composer CLI.
ENTRYPOINT ["composer"]
CMD ["--help"]
