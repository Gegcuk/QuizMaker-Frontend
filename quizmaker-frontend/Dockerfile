# Runtime-only Dockerfile - no Node build here
FROM nginx:alpine
RUN apk add --no-cache curl
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
