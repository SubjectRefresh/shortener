#
# ---- Base Node ----
FROM node:8-alpine AS base
# set working directory
WORKDIR /shortener
# install git
RUN apk add --no-cache git
# copy project file
COPY package.json package-lock.json ./
RUN npm i
COPY . .
CMD npm run dev