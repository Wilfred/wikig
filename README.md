# Wikig

A wiki with some blog influences.

## Local Development

```
$ npm i
$ npm run watch
```

## Docker

```
$ docker build . -t wikig
$ docker run -e NODE_ENV=production --name wk -p 3000:3000 -t wikig
```

The [image is on Docker
Hub](https://cloud.docker.com/repository/docker/wilfred/wikig).
