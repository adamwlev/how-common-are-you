FROM ubuntu:latest

LABEL maintainer="Adam Levin <adamlevin44@gmail.com>"

RUN apt-get update
RUN apt-get install -y --no-install-recommends \
        libatlas-base-dev gfortran nginx supervisor

RUN useradd --no-create-home nginx

RUN rm /etc/nginx/sites-enabled/default
RUN rm /etc/nginx/sites-available/default
RUN rm /usr/share/nginx/html/index.html

COPY nginx.conf /etc/nginx/
COPY site-nginx.conf /etc/nginx/conf.d/
COPY supervisord.conf /etc/

RUN mkdir project
COPY index.html project
COPY assets project/assets

WORKDIR /project

CMD ["/usr/bin/supervisord"]
