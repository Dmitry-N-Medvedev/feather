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
      git \
    && apt-get purge --assume-yes --autoremove \
    && apt-get clean --assume-yes \
    && rm -rf /var/lib/apt/lists/*

FROM os-base AS add-pm2-user
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

FROM copy-project-files AS clean-up
USER root
RUN apt-get purge --auto-remove --assume-yes \
      curl \
      build-essential \
      procps \
    && apt-get clean \
    && apt-get autoclean

FROM clean-up as AuthServer
USER pm2
LABEL maintainer="Dmitry N. Medvedev <dmitry.medvedev@gmail.com>"
LABEL version="0.0.0"
EXPOSE 80
ENV PATH=~/.volta:~/.volta/bin:$PATH
ENV NODE_ENV=production
WORKDIR /home/pm2/feather/sources/back-end/servers/AuthServer
CMD pm2-runtime start ./ecosystem.config.js
