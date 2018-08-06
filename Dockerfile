FROM node:8 as builder
WORKDIR /build
COPY . .
RUN  npm install --only=production

FROM node:8
WORKDIR /root/
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/*.js ./
COPY --from=builder /build/serialize-error ./serialize-error
COPY --from=builder /build/socket-router ./socket-router

CMD ["node", "./server.js"]
