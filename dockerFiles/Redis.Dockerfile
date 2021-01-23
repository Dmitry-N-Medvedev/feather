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
      iputils-ping \
      net-tools \
      nano \
      telnet \
      libsystemd-dev \
      pkg-config \
    && apt-get purge --assume-yes --autoremove \
    && apt-get clean --assume-yes \
    && rm -rf /var/lib/apt/lists/*

FROM os-base AS build-redis
COPY dockerConfigs/Redis/redis.conf /etc/redis/
RUN mkdir -p /tmp/redis-source \
    && cd /tmp/redis-source \
    && curl -O https://download.redis.io/redis-stable.tar.gz \
    && tar xzf redis-stable.tar.gz --strip-components=1 \
    && rm -f redis-stable.tar.gz \
    && make \
    && make install
    # && REDIS_PORT=6379 \
    #     REDIS_CONFIG_FILE=/etc/redis/redis.conf \
    #     REDIS_LOG_FILE=/var/log/redis.log \
    #     REDIS_DATA_DIR=/var/lib/redis \
    #     REDIS_EXECUTABLE=`command -v redis-server` utils/install_server.sh

EXPOSE 6379
STOPSIGNAL SIGTERM
CMD /usr/local/bin/redis-server /etc/redis/redis.conf
