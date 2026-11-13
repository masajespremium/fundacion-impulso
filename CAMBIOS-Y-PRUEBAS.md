# Fundación Impulso — Actualización del formulario

- Página principal: el enlace superior «Solicitar ayuda» lleva al formulario, no a la consulta de estado.
- Formulario: pantalla de bienvenida inicial, estilo negro/dorado, seguida de los siete pasos originales.
- Envío: POST /api/solicitudes al servidor Node.js; guarda datos en Oracle y archivos en archivos_privados/.
- Confirmación: «EN PROCESO», revisión estimada 12–24 horas y código/clave generados después de guardar.
- Consulta: estado.html es opcional y se utiliza únicamente después de enviar la solicitud.

## Instalar la actualización

1. Haz una copia de seguridad de tu proyecto actual.
2. Con el servidor detenido (Ctrl+C), sustituye los archivos de tu proyecto por los del ZIP actualizado, **sin reemplazar ni borrar tu archivo .env ni la carpeta archivos_privados**.
3. Mantén tus tablas actuales en Oracle: no ejecutes otra vez schema-oracle.sql.
4. Ejecuta `npm install` si es necesario y `npm start`.
5. Abre http://localhost:3000, entra en Solicitar ayuda y prueba con datos y documentos ficticios.
6. Verifica en SQL Developer: `SELECT codigo, estado, creado_en FROM solicitudes ORDER BY creado_en DESC;`.

**Seguridad:** rota las contraseñas que quedaron visibles en capturas anteriores. No compartas ni subas `.env` a GitHub. No uses información real hasta probar y reforzar la seguridad del servidor, autenticación y almacenamiento. La estimación de 12–24 horas no automatiza una revisión.
