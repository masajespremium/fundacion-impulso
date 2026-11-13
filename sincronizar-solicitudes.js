'use strict';
// Copia privada de solicitudes y documentos desde Supabase a este equipo.
require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'documentos-fundacion';
const DESTINO = path.resolve(process.env.CARPETA_SOLICITUDES || path.join(__dirname, 'Solicitudes Fundación Impulso'));
const MIME_EXT = {'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png'};
const CAMPOS = {
  declaracion_hipoteca: 'Declaracion_hipoteca', talon_pago: 'Talon_pago',
  poliza_seguro: 'Poliza_seguro', w2: 'W2',
  vehiculo_fotos: 'Foto_vehiculo', vehiculo_documentos: 'Documento_vehiculo'
};
let ejecutando = false;
function seguro(s, max = 75) {
  return String(s || 'sin_nombre').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .replace(/[. ]+$/g, '').trim().replace(/\s+/g, '_').slice(0, max) || 'sin_nombre';
}
async function escribirAtomico(ruta, contenido) {
  const temporal = ruta + '.tmp-' + process.pid;
  try { await fs.writeFile(temporal, contenido, {flag: 'w', mode: 0o600}); await fs.rename(temporal, ruta); }
  finally { await fs.rm(temporal, {force: true}).catch(() => {}); }
}
async function existe(ruta) { try { await fs.stat(ruta); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
async function sincronizar() {
  if (ejecutando) return;
  ejecutando = true;
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Copias locales] Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env'); return;
    }
    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
      {auth: {persistSession: false, autoRefreshToken: false}});
    await fs.mkdir(DESTINO, {recursive: true, mode: 0o700});
    let desde = 0, procesadas = 0, fallos = 0;
    while (true) {
      const {data: solicitudes, error} = await supa.from('solicitudes')
        .select('id,codigo,estado,creado_en,datos_json').order('id', {ascending: true}).range(desde, desde + 99);
      if (error) throw error;
      for (const s of solicitudes || []) {
        try {
          const codigo = seguro(s.codigo, 35);
          const nombre = seguro(s.datos_json?.nombre_completo || 'Sin_nombre', 75);
          const carpeta = path.join(DESTINO, `${nombre}_${codigo}`);
          await fs.mkdir(carpeta, {recursive: true, mode: 0o700});
          const datos = {codigo: s.codigo, estado: s.estado, fecha: s.creado_en, datos: s.datos_json};
          await escribirAtomico(path.join(carpeta, 'Datos_de_la_solicitud.json'), JSON.stringify(datos, null, 2));
          const resumen = [`CODIGO: ${s.codigo}`, `ESTADO: ${s.estado}`, `FECHA: ${s.creado_en}`, '',
            ...Object.entries(s.datos_json || {}).map(([k, v]) => `${k}: ${v ?? ''}`)].join('\r\n');
          await escribirAtomico(path.join(carpeta, 'Datos_de_la_solicitud.txt'), resumen);
          let docsDesde = 0;
          while (true) {
            const {data: docs, error: de} = await supa.from('documentos_solicitud')
              .select('id,campo,nombre_original,ruta_privada,tipo').eq('solicitud_id', s.id)
              .order('id', {ascending: true}).range(docsDesde, docsDesde + 99);
            if (de) throw de;
            for (const d of docs || []) {
              const ext = MIME_EXT[d.tipo];
              if (!ext) { console.warn(`[Copias locales] Tipo no admitido en documento ${d.id}`); fallos++; continue; }
              const etiqueta = seguro(CAMPOS[d.campo] || d.campo, 45);
              const nombreOriginal = seguro(path.basename(String(d.nombre_original || 'archivo')), 65);
              const destino = path.join(carpeta, `${etiqueta}_${d.id}_${nombreOriginal}${nombreOriginal.toLowerCase().endsWith(ext) ? '' : ext}`);
              if (await existe(destino)) continue;
              const {data: blob, error: be} = await supa.storage.from(BUCKET).download(d.ruta_privada);
              if (be || !blob) { fallos++; console.error(`[Copias locales] No se pudo descargar documento ${d.id}:`, be?.message); continue; }
              if (blob.size > 10 * 1024 * 1024) { fallos++; console.error(`[Copias locales] Documento ${d.id} excede 10 MB`); continue; }
              await escribirAtomico(destino, Buffer.from(await blob.arrayBuffer()));
            }
            if (!docs || docs.length < 100) break;
            docsDesde += 100;
          }
          procesadas++;
        } catch (e) { fallos++; console.error(`[Copias locales] Error en solicitud ${s.id}:`, e.message); }
      }
      if (!solicitudes || solicitudes.length < 100) break;
      desde += 100;
    }
    console.log(`[Copias locales] ${procesadas} solicitudes revisadas, ${fallos} errores. Carpeta: ${DESTINO}`);
  } catch (e) { console.error('[Copias locales] Error general:', e.message); }
  finally { ejecutando = false; }
}
module.exports = {sincronizar};
if (require.main === module) {
  sincronizar().then(() => { if (process.env.SINCRONIZAR_CONTINUAMENTE === '1') setInterval(sincronizar, 60_000); });
}
