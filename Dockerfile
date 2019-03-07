FROM node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY src src
COPY tslint.json tslint.json
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js
COPY web.config web.config

RUN npm run build
COPY src/datahog.config.json dist/datahog.config.json

EXPOSE 8080

CMD [ "npm", "start" ]
