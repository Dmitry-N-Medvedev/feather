ARG DEBIAN_FRONTEND=noninteractive

FROM debian:buster-slim AS os-base
SHELL ["/bin/bash", "-c"]
RUN apt-get --assume-yes --no-install-recommends --no-install-suggests update \
    && apt-get --assume-yes --no-install-recommends --no-install-suggests upgrade \
    && apt-get --assume-yes --no-install-recommends --no-install-suggests install \
      ca-certificates \
      curl \
      apt-utils \
      python \
      build-essential \
      apt-transport-https \
      procps \
      gnupg2 \
    && apt-get purge --assume-yes --autoremove \
    && apt-get clean --assume-yes \
    && rm -rf /var/lib/apt/lists/*

FROM os-base AS HAproxy
RUN curl https://haproxy.debian.net/bernat.debian.org.gpg | apt-key add -
RUN echo deb http://haproxy.debian.net buster-backports-2.3 main | tee /etc/apt/sources.list.d/haproxy.list
RUN apt-get --assume-yes --no-install-recommends --no-install-suggests update \
    && apt-get --assume-yes --no-install-recommends --no-install-suggests install haproxy=2.3.\* \
    && apt-get --assume-yes remove gnupg2 \
    && apt-get purge --assume-yes --autoremove \
    && apt-get clean --assume-yes
COPY ./dockerConfigs/AuthServer/HAProxy/haproxy.cfg /etc/haproxy/
RUN update-rc.d haproxy defaults

FROM HAproxy AS add-pm2-user
RUN useradd \
    --home-dir /home/pm2 \
    --create-home \
    --no-log-init \
    --system \
    --shell /bin/bash \
    --gid root \
    pm2

FROM add-pm2-user AS install-volta
USER pm2
RUN curl --anyauth --progress-bar --http2 --retry 0 --tcp-fastopen https://get.volta.sh | bash

FROM install-volta AS install-node-pnpm-pm2
ARG node_version=15.6.0
ARG pnpm_version=5.15.1
ARG pm2_version=4.5.1
ENV PATH=~/.volta/bin:$PATH
RUN volta install node@$node_version \
    && volta install pnpm@$pnpm_version \
    && volta install pm2@$pm2_version \
    && pnpm config set store-dir ~/.pnpm-store

FROM install-node-pnpm-pm2 as copy-project-files
ARG node_version=15.6.0
WORKDIR /home/pm2/feather/
COPY . ./
USER root
RUN chown -R pm2:root /home/pm2/feather/
USER pm2
ENV PATH=$PATH:/home/pm2/.volta/tools/image/node/$node_version/bin
RUN pnpm --recursive install

RUN pm2 start \
  --cwd ./sources/back-end/servers/AuthServer/ \
  ./sources/back-end/servers/AuthServer/ecosystem.config.js \
  && pm2 save \
  && pm2 stop all

FROM copy-project-files as AuthServer
LABEL maintainer="Dmitry N. Medvedev <dmitry.medvedev@gmail.com>"
LABEL version="0.0.0"
EXPOSE 80
ENV PATH=~/.volta:~/.volta/bin:$PATH
ENV NODE_ENV=production
WORKDIR /home/pm2/feather/sources/back-end/servers/AuthServer
CMD pm2-runtime start ./ecosystem.config.js
