FROM node:16-alpine

RUN apk update && apk upgrade

# Add new user for sandbox
RUN addgroup -S student && adduser -S -g student student \
    && chown -R student:student /home/student

COPY ./app/ /app/

RUN mkdir -p /source \
    && chown -R student:student /app

WORKDIR app

# Run user as non privileged.
USER student

# Install deps for tests.
RUN npm ci
