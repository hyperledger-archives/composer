FROM node:6

# From https://github.com/nginxinc/docker-nginx/blob/master/mainline/jessie/Dockerfile
RUN wget -qO - http://nginx.org/keys/nginx_signing.key | apt-key add - \
	&& echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list \
	&& apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
						ca-certificates \
						nginx \
						nginx-module-xslt \
						nginx-module-geoip \
						nginx-module-image-filter \
						nginx-module-perl \
						nginx-module-njs \
						gettext-base \
	&& rm -rf /var/lib/apt/lists/*
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log
EXPOSE 80 443

# Our extra bits.
RUN apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y \
            supervisor \
	&& rm -rf /var/lib/apt/lists/*

# Create application directory.
WORKDIR /usr/src/app

# Install application dependencies.
COPY package.json /usr/src/app/
RUN npm cache clean \
  && npm install --quiet

# Install the global dependencies.
RUN npm cache clean \
  && npm install -g --quiet composer-cli@^0.4.0 composer-connector-server@^0.4.0

# Bundle application source.
COPY . /usr/src/app/

# Build the application and install it.
ARG DOCKER=true
ARG DOCKER_COMPOSE
RUN npm run build:prod \
  && cd /usr/src/app/dist \
  && tar cf - . | (cd /usr/share/nginx/html; tar xf -)

# Copy the nginx configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the supervisord configuration.
COPY supervisord-*.conf /etc/supervisor/conf.d/

# Create the composer user ID.
RUN useradd -r -m -s /bin/false composer

# Run supervisor to start the application.
CMD [ "/usr/bin/supervisord", "-n" ]
