# -------- STAGE BUILD (Node) --------
FROM node:20 AS build

WORKDIR /app

# Copy file package
COPY package*.json ./

# Cài dependency
RUN npm install

# Copy toàn bộ source
COPY . .

# Build sản phẩm
RUN npm run build

# -------- STAGE RUN (Nginx) --------
FROM nginx:alpine

# Copy file build vào thư mục web của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 cho FE
EXPOSE 80

# Copy file cấu hình Nginx (nếu muốn custom, còn không thì dùng default)
CMD ["nginx", "-g", "daemon off;"]
