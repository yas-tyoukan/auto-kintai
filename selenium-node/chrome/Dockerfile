FROM selenium/node-chrome:3.6.0-americium

USER root

# install japanese font and set default font
#RUN apk add curl

RUN mkdir /noto

ADD https://noto-website.storage.googleapis.com/pkgs/NotoSansCJKjp-hinted.zip /noto

WORKDIR /noto

RUN unzip NotoSansCJKjp-hinted.zip && \
mkdir -p /usr/share/fonts/noto && \
cp *.otf /usr/share/fonts/noto && \
chmod 644 -R /usr/share/fonts/noto/ && \
fc-cache -fv

WORKDIR /
RUN rm -rf /noto
