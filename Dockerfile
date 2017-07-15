#
# ---- Base Node ----
FROM node:8-alpine AS base
# set working directory
WORKDIR /shortener
# install git
RUN apk add --no-cache git
# copy project file
COPY package.json package-lock.json ./

#
# ---- Dependencies ----
FROM base AS dependencies
# install node packages
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production
# copy production node_modules aside
RUN cp -R node_modules prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install

# ---- Build ----
# build up docs
FROM dependencies AS build
COPY . .
RUN npm run build:docs

#
# ---- Release ----
FROM base AS release
# copy production node_modules
COPY --from=dependencies /shortener/node_modules ./node_modules
# copy in built docs
COPY --from=build /shortener/docs ./
# copy app sources
COPY . .
