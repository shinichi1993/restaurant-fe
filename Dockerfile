# -------- STAGE BUILD (Node) --------
FROM node:20 AS build

WORKDIR /app

# Nhận ENV từ Railway
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy file package
COPY package*.json ./

RUN npm install

# Copy toàn bộ source
COPY . .

# Build sản phẩm (Vite sẽ embed ENV)
RUN npm run build

# -------- STAGE RUN (Nginx) --------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
