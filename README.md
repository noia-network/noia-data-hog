# How to run

## Setup

Install dependencies:

    npm install

Build:

    npm run build

Update `./src/datahog.config.json`.

Start:

    npm run start

**Note**: This service is used by https://github.com/noia-network/noia-master.

## Updating geoip data

After `npm install`

    node ./node_modules/geoip-lite/scripts/updatedb.js

## Config `config.json` options

| key      | value  | Description             |
| -------- | ------ | ----------------------- |
| user     | string | Database user.          |
| password | string | Database user password. |
| host     | string | Database hostname .     |
| port     | string | Database port.          |
| database | string | Database name.          |
