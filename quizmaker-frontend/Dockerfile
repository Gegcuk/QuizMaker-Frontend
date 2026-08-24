# Runtime-only Dockerfile - no Node build here
FROM nginx:alpine
RUN apk add --no-cache curl && mkdir -p /etc/nginx/includes
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/nginx/public-routes.conf /etc/nginx/includes/public-routes.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
