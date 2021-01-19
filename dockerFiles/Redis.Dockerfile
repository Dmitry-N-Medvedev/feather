ARG DEBIAN_FRONTEND=noninteractive

FROM redis:6.0.10-alpine AS base
EXPOSE 6379
COPY dockerConfigs/Redis/redis.conf /usr/local/etc/redis/
CMD redis-server /usr/local/etc/redis/redis.conf
