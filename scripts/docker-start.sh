#!/usr/bin/env bash

# Parse port from .env.json
DOCKER_PORT=$(cat .env.json | grep --color "\"port\"" | awk -F "\"port\"" '{print $2}' | sed -r 's/.*:([0-9 ]+)\,.*/\1/g' | awk '{$1=$1};1')

# Start container
DOCKER_PORT="$DOCKER_PORT" DOCKER_UNAME="$(id -u -n)" DOCKER_UID="$(id -u)" DOCKER_GID="$(id -g)" docker-compose up
