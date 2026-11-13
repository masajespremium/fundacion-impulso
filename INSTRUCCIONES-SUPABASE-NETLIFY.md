# Fundación Impulso — Supabase + Netlify

## Lo que incluye
- Diseño mejorado del formulario de solicitud.
- Supabase Database para solicitudes, estados y documentos.
- Supabase Storage privado (`documentos-fundacion`), archivos hasta 10 MB cada uno.
- Subida directa de archivos a Storage mediante URL firmada temporal, sin enviar los archivos a Netlify Functions.
- Panel, documentos privados, tabla Excel/CSV y consulta de estado.

## 1. Supabase
Ya tienes las tablas `solicitudes` y `documentos_solicitud` y el bucket privado `documentos-fundacion`.
No ejecutes de nuevo CREATE TABLE si ya las tienes.
Verifica que la API de Supabase permita acceder a estas tablas desde el servidor con la clave secreta y que RLS siga activado. NO crees políticas públicas para estos datos ni para Storage.

## 2. Configurar credenciales privadas
En Supabase > Project Settings > API Keys, localiza la URL del proyecto y una clave secreta de servidor (`service_role` legacy o secret key compatible). Nunca pongas esa clave en HTML, GitHub ni mensajes de chat.
En tu computadora, crea `.env` basándote en `.env.example`. Genera `UPLOAD_SIGNING_SECRET` con al menos 32 caracteres aleatorios. Define usuario y contraseña administrativa largos.

## 3. Prueba local
Instala Node.js y en la carpeta del proyecto ejecuta:
```
npm install
npm start
```
Abre http://localhost:3000 y envía una solicitud FICTICIA con documentos de prueba. Verifica que el código se genere, que el estado se consulte, que el panel admin lea datos y que se puedan abrir los documentos.

## 4. Netlify y GitHub
Sube SOLO esta carpeta a un repositorio privado de GitHub. Comprueba que NO subas `.env`, archivos personales, ni claves.
Conecta el repositorio a Netlify; el archivo `netlify.toml` configura funciones y rutas. La carpeta `public/` contiene la página; el código de servidor queda fuera del directorio público.
En Netlify > Site configuration > Environment variables agrega exactamente: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPLOAD_SIGNING_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`.
Publica y realiza pruebas ficticias desde otro dispositivo.

## 5. Seguridad y límites antes de uso real
**No habilites todavía solicitudes reales**: esta es una implementación de prueba. Falta protección antiabuso robusta (captcha/rate limiting persistente), endurecer acceso administrativo con autenticación de sesiones/MFA, política de privacidad/consentimiento, escaneo de archivos, backups y retención/borrado de datos.
La clave de administrador usa Basic Auth y requiere HTTPS (Netlify lo provee). Los HTML administrativos pueden ser visibles como páginas, pero los datos y documentos solo se obtienen mediante API autenticada.
Supabase Free tiene límites de almacenamiento, ancho de banda y disponibilidad; no garantiza operación continua ni copias automáticas.
Los uploads autorizados que se abandonen pueden dejar archivos huérfanos en Storage; configura limpieza periódica antes de producción.
Si se repite un envío o falla tras cargar archivos, revisa el estado en el panel antes de volver a enviar.

## Notas técnicas
- El formulario recibe el código y clave de consulta desde el paso `preparar`; la API guarda solo el hash de la clave.
- Netlify Functions no recibe archivos de 10 MB; la subida directa evita ese límite.
- Las funciones deben tener acceso a las tablas mediante el rol de servidor y a Storage mediante la clave secreta.
- La aplicación NO ha sido validada contra tu instancia privada de Supabase; pruébala antes de utilizarla con personas reales.
