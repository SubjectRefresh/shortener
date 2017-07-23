# Shortener

This is a URL shortener written in Nodejs backed by mongodb for storage. We recommend deploying via docker for ease of use:

## How do I run it

### Development

`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`

Or

`npm run deploy:dev`


### Production

`docker-compose up --build`

Or

`npm run deploy:prod`

See the included Docker compose files for environment variables & other configuration.

Feel free to hack around and show us what you build with it - PRs welcome!
