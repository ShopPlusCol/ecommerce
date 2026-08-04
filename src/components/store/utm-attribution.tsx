const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/**
 * Guion que se ejecuta **durante el análisis del HTML**, antes de que React
 * hidrate.
 *
 * Antes esto vivía en un `useEffect`, así que la cookie de atribución no
 * existía hasta que la hidratación terminaba. Medido en el navegador: justo
 * después de cargar la portada la cookie todavía no estaba. Quien llega
 * desde un anuncio y toca un producto antes de que React arranque —en un
 * Android modesto con datos móviles, que es el público real de esta
 * tienda— perdía su atribución, y el pedido quedaba registrado como
 * tráfico directo.
 *
 * Se resolvió con un guion en línea y no con `proxy.ts` (el Middleware de
 * Next 16) porque Proxy queda fijado al runtime de Node —su `runtime` no es
 * configurable— y OpenNext para Cloudflare no admite middleware de Node:
 * `cf:build` falla con "Node.js middleware is not currently supported".
 * El guion en línea consigue lo mismo sin romper el despliegue.
 *
 * La primera atribución nunca se sobrescribe; la última se actualiza en
 * cada visita con campaña.
 */
const SCRIPT = `(function(){try{
var p=new URLSearchParams(window.location.search);
var keys=${JSON.stringify(UTM_KEYS)};
var a={};
for(var i=0;i<keys.length;i++){var v=p.get("utm_"+keys[i]);if(v){a[keys[i]]=v.slice(0,160);}}
if(!Object.keys(a).length){return;}
var val=encodeURIComponent(JSON.stringify(a));
var secure=window.location.protocol==="https:"?"; Secure":"";
var attrs="; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax"+secure;
var hasFirst=document.cookie.split("; ").some(function(c){return c.indexOf("shoppluscol_utm_first=")===0;});
if(!hasFirst){document.cookie="shoppluscol_utm_first="+val+attrs;}
document.cookie="shoppluscol_utm_last="+val+attrs;
}catch(e){}})();`;

export function UtmAttribution() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
