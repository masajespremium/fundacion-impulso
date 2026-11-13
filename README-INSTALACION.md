# Fundación Impulso — Oracle

## Instalación
1. Instala Node.js LTS y comprueba `node -v` y `npm -v`.
2. Abre esta carpeta en VS Code.
3. En Oracle SQL Developer, conéctate con tu usuario de aplicación y ejecuta `schema-oracle.sql` una sola vez. No uses SYSTEM para la aplicación.
4. Copia `.env.example` a `.env` y completa DB_USER, DB_PASSWORD, DB_CONNECT_STRING. Ejemplo: `localhost:1521/XEPDB1` o `localhost:1521/XE` según dónde exista tu usuario. Configura también ADMIN_USER y ADMIN_PASSWORD.
5. En la terminal ejecuta `npm install` y después `npm start`.
6. Abre `http://localhost:3000`. Usa «Solicitar Ayuda» y «En proceso · Consultar estado».

## Administración
La API protegida permite listar solicitudes con `GET /api/admin/solicitudes` y cambiar el estado mediante `PATCH /api/admin/solicitudes/:id` con JSON `{"estado":"APROBADA"}`. Ambas requieren autenticación HTTP Basic (ADMIN_USER y ADMIN_PASSWORD). Aún no hay interfaz visual administrativa.

## Importante antes de publicar
- Esta es una integración inicial, **no verificada contra tu instancia Oracle**.
- El plazo de 12–24 horas es informativo, no automático ni garantizado.
- El formulario de contacto original sigue usando EmailJS por separado.
- Los documentos se almacenan fuera del acceso público HTTP, en `archivos_privados/`. Configura copias de seguridad, cifrado en reposo, HTTPS, políticas de retención y revisión de permisos antes de usar datos reales.
- El acceso administrativo HTTP Basic debe reemplazarse por un inicio de sesión con sesiones y controles más robustos antes de producción.
- Asegúrate de contar con avisos de privacidad y autorización apropiada para los documentos solicitados.
