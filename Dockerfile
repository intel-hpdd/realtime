FROM node:10 as builder
WORKDIR /build
COPY . .
RUN  npm install --only=production

FROM node:10
WORKDIR /root/
COPY --from=builder /build/group ./group
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/serialize-error ./serialize-error
COPY --from=builder /build/socket-router ./socket-router
COPY --from=builder /build/socketio ./socketio
COPY --from=builder /build/package.json ./
COPY --from=builder /build/*.js ./

ENV DB_HOST postgres
ENV DB_PORT 5432
ENV DB_USER chroma
ENV DB_NAME chroma
ENV REALTIME_PORT 8888

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init \
  && apt-get update \
  && apt install -y postgresql-client \
  && apt-get clean

COPY wait-for-dependencies.sh /usr/local/bin/
ENTRYPOINT [ "wait-for-dependencies.sh" ]
CMD ["dumb-init", "node", "index.js"]
