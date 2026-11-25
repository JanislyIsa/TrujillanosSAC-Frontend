# Vista local de producción

1. Ejecuta el backend con el perfil `dev`, las variables de conexión Oracle y `REDIS_HOST=localhost`.
2. Desde la raíz del frontend, ejecuta `npm run build`.
3. Ejecuta `docker compose -f deploy/docker-compose.yml up -d`.
4. Abre `http://localhost:8081`. Nginx sirve Angular, aplica la caché de archivos con hash y reenvía `/api/` al backend en el puerto 8080.

El servicio Redis de Compose publica el puerto 6379 para que el backend iniciado en el equipo pueda conectarse.
