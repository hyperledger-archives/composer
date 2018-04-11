#
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
#

FROM node:8-alpine AS builder
ENV NPM_CONFIG_LOGLEVEL warn
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN apk add --no-cache make gcc g++ python git && \
    npm install && \
    npm cache clean --force && \
    apk del make gcc g++ python git
COPY . /usr/src/app/
RUN npm run build

FROM node:8-alpine
ENV NPM_CONFIG_LOGLEVEL warn
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN apk add --no-cache make gcc g++ python git && \
    npm install --production -g pm2 && \
    npm install --production && \
    npm cache clean --force && \
    apk del make gcc g++ python git
COPY . /usr/src/app/
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
EXPOSE 6001
CMD [ "pm2-docker", "node", "--", "app.js" ]