FROM kong:latest

# Install the js-pluginserver
USER root
RUN apk add --update nodejs npm python2 make g++
RUN npm install --unsafe -g kong-pdk

COPY ./plugins /usr/local/kong/js-plugins
WORKDIR /usr/local/kong/js-plugins
RUN npm install