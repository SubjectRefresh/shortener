#!/bin/bash

git pull && docker pull subjectrefresh/shortener:latest && docker stack deploy -c docker-compose.yml shortener