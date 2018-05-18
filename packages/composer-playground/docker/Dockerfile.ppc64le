# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM ppc64le/node:8-alpine

# Reset npm logging to default level.
ENV NPM_CONFIG_LOGLEVEL warn

# Install the latest version by default.
ARG VERSION=latest

# Need to install extra dependencies for native modules.
RUN npm install --unsafe --production -g pm2 composer-playground@${VERSION} && \
    npm cache clean --force

# Create the composer user ID.
RUN useradd composer

# Change /home/composer ownership
RUN mkdir -p /home/composer && \
    chown composer:composer /home/composer

# Run as the composer user ID.
USER composer

# Run in the composer users home directory.
WORKDIR /home/composer

# Run supervisor to start the application.
CMD [ "pm2-docker", "composer-playground" ]

# Expose port 8080.
EXPOSE 8080
