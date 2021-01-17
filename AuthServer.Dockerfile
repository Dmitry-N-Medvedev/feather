ARG DEBIAN_FRONTEND=noninteractive

FROM debian:latest AS os-base
SHELL ["/bin/bash", "-c"]
RUN apt-get --assume-yes update && \
    apt-get --assume-yes upgrade
RUN apt-get --assume-yes install ca-certificates

FROM os-base AS sys-utils
RUN apt-get --assume-yes --no-install-recommends install apt-utils curl openssl && \
    apt-get autoremove --purge --assume-yes && apt-get clean --assume-yes

FROM sys-utils AS add-pm2-user
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
RUN volta install node@$node_version && \
    volta install pnpm@$pnpm_version && \
    volta install pm2@$pm2_version && \
    pnpm config set store-dir ~/.pnpm-store

FROM install-node-pnpm-pm2 as copy-project-files
ARG node_version=15.6.0
WORKDIR /home/pm2/feather/
ADD . .
USER root
RUN chown -R pm2:root /home/pm2/feather/
USER pm2
ENV PATH=$PATH:/home/pm2/.volta/tools/image/node/$node_version/bin
RUN pnpm --recursive install
RUN ls -laR .
RUN pm2 start ./sources/back-end/servers/AuthServer/ecosystem.config.js && pm2 save && pm2 stop all

FROM copy-project-files as ready-to-rock-and-roll
LABEL maintainer="Dmitry N. Medvedev <dmitry.medvedev@gmail.com>"
LABEL version="0.0.0"
EXPOSE 9090
EXPOSE 9091
ENV PATH=~/.volta:~/.volta/bin:$PATH
ENV NODE_ENV=production
CMD pm2-runtime start ./sources/back-end/servers/AuthServer/ecosystem.config.js
