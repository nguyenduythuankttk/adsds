# Hướng dẫn Deploy Manual — PBL3 (dhstore.it.com)

> Server: `157.66.101.193`  
> Project path: `/var/www/pbl3/`  
> SSH key: `~/.ssh/team_server_key`

---

## Tổng quan kiến trúc

```
Internet
   │
   ▼
Nginx (host systemd) :80/:443
   ├── dhstore.it.com        → static files /var/www/pbl3/FrontEnd/
   │                           + proxy /api/* → localhost:3000
   ├── api.dhstore.it.com    → proxy → localhost:3000
   ├── admin.dhstore.it.com  → proxy → localhost:3002
   ├── storage.dhstore.it.com→ proxy → localhost:9000 (MinIO)
   └── console.dhstore.it.com→ proxy → localhost:9001 (MinIO)

Docker Compose
   ├── pbl3-backend-1   (.NET API)  → 127.0.0.1:3000
   ├── pbl3-db-1        (MySQL 8)
   └── pbl3-mongo-1     (MongoDB 7)
```

---

## Bước 1 — SSH vào server

```bash
ssh -i ~/.ssh/team_server_key root@157.66.101.193
```

---

## Bước 2 — Pull code mới nhất

```bash
cd /var/www/pbl3
git pull origin main
```

Nếu có conflict:
```bash
git stash        # tạm cất thay đổi local
git pull origin main
git stash pop    # lấy lại (nếu cần)
```

---

## Bước 3 — Cập nhật biến môi trường (nếu cần)

File `.env` nằm tại `/var/www/pbl3/.env`. Chỉnh sửa khi thêm key mới:

```bash
nano /var/www/pbl3/.env
```

Các biến quan trọng:
```env
MYSQL_ROOT_PASSWORD=...
MYSQL_USER=jolibi_user
MYSQL_PASSWORD=...
JWT_KEY=...                  # >= 32 ký tự
JWT_ISSUER=api.dhstore.it.com
JWT_AUDIENCE=dhstore.it.com
JWT_EXPIRY_MINUTES=60
RESEND_API_KEY=...
```

---

## Bước 4 — Deploy Backend (.NET)

### 4a. Build lại Docker image

```bash
cd /var/www/pbl3
docker compose build backend
```

> Lần đầu hoặc khi thay đổi `BackEnd.csproj` / `Dockerfile` sẽ lâu hơn (~2-5 phút).

### 4b. Restart backend container

```bash
docker compose up -d backend
```

### 4c. Kiểm tra backend đang chạy

```bash
docker ps | grep backend
docker logs pbl3-backend-1 --tail 30
```

Kết quả mong đợi:
```
pbl3-backend-1   Up X minutes   127.0.0.1:3000->8080/tcp
```

### 4d. Chạy migration database (nếu có migration mới)

```bash
docker exec pbl3-backend-1 dotnet BackEnd.dll --migrate 2>/dev/null
```

Hoặc kiểm tra migration thủ công:
```bash
docker exec -it pbl3-db-1 mysql -u root -p jolibi
# trong MySQL:
SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5;
```

---

## Bước 5 — Deploy Frontend (static files)

Frontend là HTML/CSS/JS tĩnh, nginx serve trực tiếp — không cần build.

```bash
# Chỉ cần git pull ở Bước 2 là FrontEnd tự cập nhật
# File được serve từ /var/www/pbl3/FrontEnd/
ls /var/www/pbl3/FrontEnd/
```

Nếu FrontEnd có bước build (Vite/Webpack...) thì thêm:
```bash
cd /var/www/pbl3/FrontEnd
npm install
npm run build
```

---

## Bước 6 — Reload Nginx (nếu đổi config)

Chỉ cần reload khi sửa file `/etc/nginx/sites-enabled/dhstore`:

```bash
# Kiểm tra config trước
nginx -t

# Reload (không downtime)
systemctl reload nginx
```

---

## Bước 7 — Kiểm tra toàn bộ sau deploy

```bash
# Tất cả container đang chạy
docker ps

# Test backend API
curl -sk https://dhstore.it.com/api/health
curl -s http://127.0.0.1:3000/api/health

# Test frontend
curl -sk -o /dev/null -w "HTTP %{http_code}\n" https://dhstore.it.com

# Xem log backend realtime
docker logs pbl3-backend-1 -f
```

---

## Lệnh quản lý thường dùng

### Xem trạng thái services
```bash
docker compose ps
docker ps -a
systemctl status nginx
```

### Restart từng service
```bash
docker compose restart backend
docker compose restart mongo
systemctl restart nginx
```

### Xem log
```bash
docker logs pbl3-backend-1 --tail 50 -f
docker logs pbl3-db-1 --tail 20
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Vào MySQL
```bash
docker exec -it pbl3-db-1 mysql -u root -p jolibi
```

### Vào MongoDB
```bash
docker exec -it pbl3-mongo-1 mongosh
```

### Dừng toàn bộ
```bash
docker compose down
```

### Khởi động lại toàn bộ
```bash
cd /var/www/pbl3
docker compose up -d
```

---

## SSL Certificate

Cert tự động gia hạn qua certbot. Kiểm tra:
```bash
certbot certificates
# Expiry: 2026-07-14 (tự gia hạn trước 30 ngày)
```

Gia hạn thủ công nếu cần:
```bash
certbot renew --dry-run   # test trước
certbot renew
systemctl reload nginx
```

---

## Xử lý sự cố thường gặp

### Backend không start
```bash
docker logs pbl3-backend-1 --tail 50
# Thường do: sai connection string, thiếu biến .env, port bị chiếm
```

### Nginx lỗi 502 Bad Gateway
```bash
# Kiểm tra backend có chạy không
curl http://127.0.0.1:3000/api/health
docker ps | grep backend
```

### Database không kết nối được
```bash
docker ps | grep db          # MySQL phải ở trạng thái "healthy"
docker logs pbl3-db-1 --tail 20
```

### Port bị chiếm
```bash
ss -tlnp | grep -E ':80|:443|:3000'
```

### Xem /etc/hosts local (máy dev) — tránh nhầm lẫn
```bash
cat /etc/hosts | grep dhstore
# Nếu có dòng "127.0.0.1 dhstore.it.com" thì xóa đi:
sudo sed -i '' '/dhstore/d' /etc/hosts
```
