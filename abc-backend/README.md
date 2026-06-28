# FitoABC — Backend

Backend de FitoABC: plataforma interactiva de alfabetización para niños.  
Maneja usuarios, niveles, progreso, sesiones, gamificación y motor de voz (STT/TTS).

## Tecnologías

- **Runtime:** Node.js (v20+) con ESM
- **Framework:** Express
- **Base de Datos:** MongoDB Atlas (Mongoose ODM)
- **Autenticación:** Clerk Auth (con bypass mock para desarrollo)
- **Motor de Voz:**
  - STT: Vosk (offline, local)
  - TTS: Google TTS API (en memoria RAM)

## Requisitos

- Node.js 18+
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (tier gratis funciona)
- (Opcional) Cuenta en [Clerk](https://clerk.com) para autenticación real

## Instalación

1. Cloná el repositorio y entrá al directorio del backend:

   ```bash
   cd abc-backend
   ```

2. Copiá las variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Editá `.env` con tu `MONGO_URI` de MongoDB Atlas.

4. Instalá las dependencias:

   ```bash
   npm install
   ```

5. Poblá la base de datos con los datos iniciales:

   ```bash
   npm run seed
   ```

6. Iniciá el servidor en desarrollo:

   ```bash
   npm run dev
   ```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm start` | Servidor en producción |
| `npm run seed` | Poblar MongoDB con niveles y diccionario base |

## Estructura del Proyecto

```
src/
├── config/          # Conexión a MongoDB Atlas
├── controllers/     # Lógica de negocio de cada endpoint
├── middlewares/      # Auth centralizado (Clerk / mock)
├── models/          # Schemas de Mongoose (9 modelos)
├── routes/          # Definición de rutas Express
├── services/        # Lógica de negocio compleja (futuro)
├── utils/           # Seeder y modelo de Vosk
├── app.js           # Configuración de Express
└── server.js        # Punto de entrada
```

## Notas

- `USE_MOCK_AUTH=true` permite ejecutar el backend sin Clerk durante pruebas.
- El webhook de Clerk (`/api/webhooks/clerk`) requiere `CLERK_WEBHOOK_SECRET` en producción.
- El archivo `.env` **no** debe subirse a Git.
