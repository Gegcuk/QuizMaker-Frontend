# Runtime-only Dockerfile - no Node build here
FROM nginx:alpine
ARG REVISION
ARG RELEASE_ID
LABEL org.opencontainers.image.revision=$REVISION com.quizzence.release=$RELEASE_ID com.quizzence.managed=issue-201
RUN apk add --no-cache curl && mkdir -p /etc/nginx/includes
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/nginx/ /etc/nginx/includes/
EXPOSE 80
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=6 CMD curl -fsS http://127.0.0.1/__release.json || exit 1
CMD ["nginx", "-g", "daemon off;"]
