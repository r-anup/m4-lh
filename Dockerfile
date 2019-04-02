FROM ubuntu

ENV PORT=6002

WORKDIR /usr/src/app

COPY package*.json ./

RUN \
	apt-get update &&\
	apt-get install nodejs npm chromium-browser --yes &&\
	npm install &&\
	apt-get clean &&\
	rm -rf /tmp/* /var/tmp/*

COPY . .

EXPOSE ${PORT}

CMD [ "npm", "start"]

