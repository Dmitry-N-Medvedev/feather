ARG DEBIAN_FRONTEND=noninteractive

FROM debian:buster-slim AS os-base
SHELL ["/bin/bash", "-c"]
RUN apt-get --assume-yes --no-install-recommends --no-install-suggests update \
    && apt-get --assume-yes --no-install-recommends --no-install-suggests upgrade \
    && apt-get --assume-yes --no-install-recommends --no-install-suggests install \
      # ca-certificates \
      # gcc \
      curl \
      build-essential \
      procps \
      nano \
    && rm -rf /var/lib/apt/lists/*

FROM os-base as build-nginx
RUN mkdir -p /tmp/nginx-build/sources \
    && cd /tmp/nginx-build \
    && curl http://nginx.org/download/nginx-1.19.6.tar.gz -o nginx.tar.gz \
    && tar -xzf nginx.tar.gz --strip-components=1 --directory ./sources \
    && rm -f nginx.tar.gz \
    && cd ./sources \
    && ./configure \
      --sbin-path=/usr/local/nginx/nginx \
      --conf-path=/usr/local/nginx/nginx.conf \
      --pid-path=/usr/local/nginx/nginx.pid \
      --with-debug \
      --with-threads \
      --with-file-aio \
      --with-http_v2_module \
      --with-http_auth_request_module \
      --without-http_gzip_module \
      --without-http_ssi_module \
      --without-http_userid_module \
      --without-http_access_module \
      --without-http_auth_basic_module \
      --without-http_mirror_module \
      --without-http_autoindex_module \
      --without-http_geo_module \
      --without-http_map_module \
      --without-http_split_clients_module \
      --without-http_referer_module \
      --without-http_rewrite_module \
      # --without-http_proxy_module \
      --without-http_fastcgi_module \
      --without-http_uwsgi_module \
      --without-http_scgi_module \
      --without-http_grpc_module \
      --without-http_memcached_module \
      --without-http_limit_conn_module \
      --without-http_limit_req_module \
      --without-http_empty_gif_module \
      --without-http_browser_module \
      --without-http_upstream_hash_module \
      --without-http_upstream_ip_hash_module \
      --without-http_upstream_least_conn_module \
      --without-http_upstream_keepalive_module \
      --without-http_upstream_zone_module \
      --without-stream_limit_conn_module \
      --without-stream_access_module \
      --without-stream_geo_module \
      --without-stream_map_module \
      --without-stream_split_clients_module \
      --without-stream_return_module \
      --without-stream_upstream_hash_module \
      --without-stream_upstream_least_conn_module \
      --without-stream_upstream_zone_module \
    && make \
    && make install \
    && cd /usr/local/nginx \
    && rm -rf /tmp/nginx-build \
    && mkdir -p /usr/local/nginx/questionnaires
COPY dockerConfigs/nginx/nginx.conf /usr/local/nginx/
COPY dockerConfigs/nginx/mime.types /usr/local/nginx/
COPY dockerConfigs/nginx/questionnaires/2479b25e-6980-4208-8de7-2639e14604da.json /usr/local/nginx/questionnaires/

FROM build-nginx AS add-nginx-user
RUN set -x \
    && addgroup --system --gid 101 nginx \
    && adduser --system --disabled-login --ingroup nginx --no-create-home --gecos "nginx user" --shell /bin/false --uid 101 nginx \
    && chown -R nginx:nginx /usr/local/nginx

FROM add-nginx-user AS clean-up
RUN apt-get purge --auto-remove \
      curl \
      build-essential \
      procps \
      nano \
    && apt-get clean \
    && apt-get autoclean

FROM clean-up AS file-server
EXPOSE 80
STOPSIGNAL SIGTERM
CMD /usr/local/nginx/nginx -c /usr/local/nginx/nginx.conf

