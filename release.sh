#!/bin/bash

# build images & push to hub

TAG=`node -p "require('./package.json').version"`
IMAGE="subjectrefresh/shortener"

echo "Building $IMAGE:$TAG"
docker build -t $IMAGE:$TAG . && \
docker tag $IMAGE:$TAG $IMAGE:latest && \
docker push $IMAGE:$TAG && \
docker push $IMAGE:latest
