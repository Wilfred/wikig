# Wikig [![CircleCI](https://circleci.com/gh/Wilfred/wikig.svg?style=svg)](https://circleci.com/gh/Wilfred/wikig)[![codecov](https://codecov.io/gh/Wilfred/wikig/branch/master/graph/badge.svg)](https://codecov.io/gh/Wilfred/wikig)[![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/wilfred/wikig.svg)](https://hub.docker.com/r/wilfred/wikig)

A blog with some wiki influences.

Live site: https://notes.wilfred.me.uk

The wikig source code is under the MIT license (see package.json), but
wikig also includes [twemoji](https://github.com/twitter/twemoji) under
a CC-BY 4.0 license (at [this
commit](https://github.com/twitter/twemoji/commit/2ad9f87b730cb1466c1accbf4d08606447271d9b)).

## Local Development

```
$ npm i
$ npm run init-db
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
Hub](https://hub.docker.com/r/wilfred/wikig).

## Backups

If you're running wikig in Docker, you can copy the database as
follows:

```
$ docker run -it --rm -v wikig_storage:/vol busybox ls -l /vol
-rw-r--r--    1 root     root         24576 Aug 13 09:41 wikig.db

# Based on https://github.com/moby/moby/issues/25245#issuecomment-365980572
$ docker container create --name dummy -v wikig_storage:/root hello-world
$ docker cp dummy:/root/wikig.db .
$ docker rm dummy
```

To copy a local `wikig.db` into the container:

```
$ docker container create --name dummy -v wikig_storage:/root hello-world
$ docker cp wikig.db dummy:/root/wikig.db
$ docker rm dummy
```
