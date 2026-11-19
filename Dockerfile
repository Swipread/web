# Production image: the static build served by Nginx.
# The API origin is baked into the bundle, so build one image per environment:
#   docker build --build-arg VITE_API_BASE_URL=https://swipread.example -t swipread-web .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL
# An origin only (scheme, host, optional port): it is also written into the Nginx configuration.
RUN echo "$VITE_API_BASE_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]+)?$' \
 || { echo "VITE_API_BASE_URL must be an origin such as https://swipread.example, got '$VITE_API_BASE_URL'" >&2; exit 1; }
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.30-alpine
ARG VITE_API_BASE_URL
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# The Content Security Policy allows calls to the API origin only.
RUN sed -i "s|__API_ORIGIN__|$VITE_API_BASE_URL|" /etc/nginx/conf.d/default.conf \
 && rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
