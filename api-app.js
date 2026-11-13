require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const {createClient} = require('@supabase/supabase-js');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'120kb'}));
const BUCKET='documentos-fundacion';
const MAX=10*1024*1024;
const MIME={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png'};
const FIELDS=['nombre_completo','direccion','ciudad','estado','codigo_postal','ingreso_anual','empresa','ocupacion','industria','frecuencia_pago','tiene_conyuge','conyuge_anio_inicio','conyuge_mes_inicio','conyuge_ingreso_mensual','conyuge_ingreso_anual','tiene_vehiculo'];
const REQUIRED=['nombre_completo','direccion','ciudad','estado','codigo_postal','ingreso_anual','empresa','ocupacion','industria','frecuencia_pago','tiene_conyuge','tiene_vehiculo'];
const REQUIRED_FILES=['declaracion_hipoteca','talon_pago','poliza_seguro','w2'];
const ALLOWED_FILES=[...REQUIRED_FILES,'vehiculo_fotos','vehiculo_documentos'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function client(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Falta configuración de Supabase');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}
function secret(){if(!process.env.UPLOAD_SIGNING_SECRET||process.env.UPLOAD_SIGNING_SECRET.length<32)throw Error('Configura UPLOAD_SIGNING_SECRET de al menos 32 caracteres');return process.env.UPLOAD_SIGNING_SECRET}
function sign(payload){const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+crypto.createHmac('sha256',secret()).update(data).digest('base64url')}
function verify(token){if(typeof token!=='string'||token.length>15000)throw Error('Autorización inválida');const [data,sig]=token.split('.');if(!data||!sig)throw Error('Autorización inválida');const expected=crypto.createHmac('sha256',secret()).update(data).digest();const actual=Buffer.from(sig,'base64url');if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))throw Error('Autorización inválida');const obj=JSON.parse(Buffer.from(data,'base64url').toString());if(!Number.isFinite(obj.exp)||Date.now()>obj.exp)throw Error('La autorización venció, vuelve a enviar');return obj}
function error(res,code,message){return res.status(code).json({error:message})}
function validManifest(files){return Array.isArray(files)&&files.length>=4&&files.length<=12&&files.every(f=>f&&typeof f.campo==='string'&&ALLOWED_FILES.includes(f.campo)&&typeof f.nombre==='string'&&f.nombre.length<=255&&typeof f.tipo==='string'&&MIME[f.tipo]&&Number.isInteger(f.size)&&f.size>0&&f.size<=MAX)&&REQUIRED_FILES.every(c=>files.some(f=>f.campo===c))}
function auth(req,res,next){const h=req.headers.authorization||'';if(!h.startsWith('Basic ')){res.set('WWW-Authenticate','Basic realm="Fundacion Impulso"');return res.sendStatus(401)}let credentials;try{credentials=Buffer.from(h.slice(6),'base64').toString('utf8')}catch{return res.sendStatus(401)}const sep=credentials.indexOf(':');const u=credentials.slice(0,sep),pw=credentials.slice(sep+1);const good=(a,b)=>{const x=hash(a),y=hash(b);return crypto.timingSafeEqual(Buffer.from(x),Buffer.from(y))};if(sep<0||!process.env.ADMIN_USER||!process.env.ADMIN_PASSWORD||!good(u,process.env.ADMIN_USER)||!good(pw,process.env.ADMIN_PASSWORD))return res.sendStatus(403);res.set('Cache-Control','private, no-store');next()}
// 1. Autorizar subida directa a Supabase Storage; no pasan archivos por Netlify Functions.
app.post('/api/solicitudes/preparar',async(req,res)=>{try{
 const files=req.body.files;if(!validManifest(files))return error(res,400,'Verifica los documentos: PDF/JPG/PNG, máximo 10 MB por archivo, hasta 12 archivos');
 const codigo='FI-'+crypto.randomBytes(6).toString('hex').toUpperCase();const clave=crypto.randomBytes(18).toString('base64url');const supa=client();
 const manifest=[];const uploads=[];
 for(const f of files){const ruta=codigo+'/'+crypto.randomUUID()+MIME[f.tipo];const {data,error:e}=await supa.storage.from(BUCKET).createSignedUploadUrl(ruta);if(e)throw e;manifest.push({campo:f.campo,nombre:f.nombre,tipo:f.tipo,size:f.size,ruta});uploads.push({ruta,signedUrl:data.signedUrl});}
 const ticket=sign({codigo,claveHash:hash(clave),files:manifest,exp:Date.now()+15*60*1000});
 res.set('Cache-Control','no-store').json({ticket,codigo,clave,uploads});
 }catch(e){console.error('preparar:',e.message);error(res,500,'No se pudo preparar el envío')}});
// 2. Registrar datos solo después de confirmar que todos los documentos existen.
app.post('/api/solicitudes',async(req,res)=>{let saved=false;try{
 const {ticket,datos}=req.body||{};const t=verify(ticket);if(!datos||typeof datos!=='object'||Array.isArray(datos))return error(res,400,'Datos inválidos');
 for(const k of REQUIRED)if(typeof datos[k]!=='string'||!datos[k].trim()||datos[k].length>500)return error(res,400,'Falta información obligatoria');
 if(datos.consentimiento!=='on')return error(res,400,'Debes aceptar el consentimiento');
 if(!['si','no'].includes(datos.tiene_conyuge)||!['si','no'].includes(datos.tiene_vehiculo))return error(res,400,'Opciones inválidas');
 const clean=Object.fromEntries(FIELDS.filter(k=>datos[k]!==undefined).map(k=>[k,String(datos[k]).slice(0,500)]));
 const supa=client();
 for(const f of t.files){const {data,error:e}=await supa.storage.from(BUCKET).info(f.ruta);if(e||!data)return error(res,400,'Falta subir uno de los documentos');if(data.size>MAX||data.size!==f.size)return error(res,400,'Tamaño de documento inválido');}
 const {data:record,error:insertErr}=await supa.from('solicitudes').insert({codigo:t.codigo,clave_hash:t.claveHash,datos_json:clean}).select('id').single();
 if(insertErr){if(insertErr.code==='23505')return error(res,409,'Esta solicitud ya fue registrada');throw insertErr}
 saved=true;
 const {error:docsErr}=await supa.from('documentos_solicitud').insert(t.files.map(f=>({solicitud_id:record.id,campo:f.campo,nombre_original:f.nombre,ruta_privada:f.ruta,tipo:f.tipo})));
 if(docsErr){await supa.from('solicitudes').delete().eq('id',record.id);throw docsErr}
 res.status(201).set('Cache-Control','no-store').json({codigo:t.codigo,estado:'EN PROCESO'});
 }catch(e){console.error('registrar:',e.message);error(res,500,'No se pudo registrar la solicitud')}});
app.get('/api/solicitudes/estado',async(req,res)=>{try{const {codigo,clave}=req.query;if(typeof codigo!=='string'||typeof clave!=='string'||codigo.length>30||clave.length>100)return error(res,400,'Consulta inválida');const {data,e}=await client().from('solicitudes').select('estado').eq('codigo',codigo).eq('clave_hash',hash(clave)).maybeSingle();if(e)throw e;if(!data)return error(res,404,'No encontrado');res.set('Cache-Control','no-store').json({estado:data.estado})}catch(e){console.error(e.message);error(res,500,'Error de consulta')}});
app.get('/api/admin/solicitudes',auth,async(req,res)=>{try{const {data,error:e}=await client().from('solicitudes').select('id,codigo,estado,creado_en,datos_json').order('creado_en',{ascending:false}).limit(100);if(e)throw e;res.json(data.map(x=>({id:x.id,codigo:x.codigo,estado:x.estado,creado_en:x.creado_en,nombre:x.datos_json?.nombre_completo||'',ciudad:x.datos_json?.ciudad||''})))}catch(e){console.error(e.message);error(res,500,'Error consultando solicitudes')}});
app.get('/api/admin/tabla',auth,async(req,res)=>{try{const {data,error:e}=await client().from('solicitudes').select('id,codigo,estado,creado_en,datos_json').order('creado_en',{ascending:false}).limit(1000);if(e)throw e;res.json({rows:data.map(({datos_json,...x})=>({...x,...Object.fromEntries(FIELDS.map(k=>[k,datos_json?.[k]??'']))})),limit:1000})}catch(e){console.error(e.message);error(res,500,'Error consultando tabla')}});
app.get('/api/admin/solicitudes/:id/detalle',auth,async(req,res)=>{try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return error(res,400,'ID inválido');const {data,error:e}=await client().from('solicitudes').select('datos_json').eq('id',id).maybeSingle();if(e)throw e;if(!data)return res.sendStatus(404);res.json(data.datos_json)}catch(e){console.error(e.message);error(res,500,'Error de consulta')}});
app.patch('/api/admin/solicitudes/:id',auth,async(req,res)=>{try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1||!['EN PROCESO','APROBADA','RECHAZADA'].includes(req.body?.estado))return error(res,400,'Datos inválidos');const {data,error:e}=await client().from('solicitudes').update({estado:req.body.estado}).eq('id',id).select('id');if(e)throw e;res.json({actualizadas:data.length})}catch(e){console.error(e.message);error(res,500,'Error actualizando')}});
app.get('/api/admin/solicitudes/:id/documentos',auth,async(req,res)=>{try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return error(res,400,'ID inválido');const {data,error:e}=await client().from('documentos_solicitud').select('id,campo,nombre_original,tipo').eq('solicitud_id',id).order('id');if(e)throw e;res.json(data.map(x=>({id:x.id,campo:x.campo,nombre:x.nombre_original,tipo:x.tipo})))}catch(e){console.error(e.message);error(res,500,'Error consultando documentos')}});
app.get('/api/admin/documentos/:id',auth,async(req,res)=>{try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return error(res,400,'ID inválido');const supa=client();const {data,error:e}=await supa.from('documentos_solicitud').select('ruta_privada').eq('id',id).maybeSingle();if(e)throw e;if(!data)return res.sendStatus(404);const {data:link,error:le}=await supa.storage.from(BUCKET).createSignedUrl(data.ruta_privada,60);if(le)throw le;res.redirect(302,link.signedUrl)}catch(e){console.error(e.message);error(res,500,'Error abriendo documento')}});
module.exports=app;
