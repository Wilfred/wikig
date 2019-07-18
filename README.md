# Wikig

A wiki with some blog influences.

## Local Development

```
$ npm i
$ npm run watch
```

## Docker

```
$ docker build . -t wilfred/wikig
# Or
$ docker pull wilfred/wikig:latest

$ docker volume create wikig_storage

$ docker run -v wikig_storage:/ext -e DB_PATH=/ext/wikig.db wilfred/wikig /usr/src/app/bin/init-db

$ docker run -e ADMIN_PASSWORD=secrethere -e SITE_NAME="My Site" -v wikig_storage:/ext -e DB_PATH=/ext/wikig.db -e DEBUG=wikig:* --name wk -p 3000:3000 -t -d wilfred/wikig
```

The [image is on Docker
Hub](https://cloud.docker.com/repository/docker/wilfred/wikig).
