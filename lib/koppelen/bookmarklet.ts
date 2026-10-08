/**
 * De bookmarklet: een bladwijzer met een stukje JavaScript. Je klikt erop
 * terwijl je bent ingelogd op je eigen Magister. Hij zoekt daar je sessie
 * (sessionStorage `oidc.user:…`, anders elke sleutel met een access_token) en
 * opent SuperMagister met token, verloopmoment en school in het fragment (#),
 * nooit in de query string. Hij leest alleen; hij stuurt niets naar een server.
 *
 * Geschreven in oud JavaScript, zodat hij in elke browser werkt.
 */

function origin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** Het adres van de app: ingesteld (NEXT_PUBLIC_SITE_URL), anders waar hij nu draait. */
export function resolveAppUrl(configured: string | undefined, current: string): string {
  return (configured && origin(configured)) || origin(current) || current;
}

const MESSAGES = {
  noMagister:
    "Open eerst je eigen Magister (jouwschool.magister.net), log in en klik dan nog een keer op deze bladwijzer.",
  noSession: "Geen Magister-sessie gevonden. Log eerst in op Magister en klik dan nog een keer.",
  expired: "Je Magister-sessie is verlopen. Ververs Magister (F5) en klik dan nog een keer.",
};

export function buildBookmarklet(appUrl: string): string {
  const app = origin(appUrl);
  if (!app) throw new Error("De bookmarklet heeft een http(s)-adres nodig.");
  const code = `(function(){
var app=${JSON.stringify(app)},host=location.hostname;
if(!/^[a-z0-9-]+\\.magister\\.net$/.test(host)||host==="accounts.magister.net"){alert(${JSON.stringify(MESSAGES.noMagister)});return;}
function find(store,oidcOnly){try{for(var i=0;i<store.length;i++){var key=store.key(i);if(!key||(oidcOnly&&key.indexOf("oidc.user:")!==0))continue;try{var v=JSON.parse(store.getItem(key));if(v&&typeof v.access_token==="string")return v;}catch(e){}}}catch(e){}return null;}
var user=find(sessionStorage,true)||find(sessionStorage,false)||find(localStorage,false);
if(!user){alert(${JSON.stringify(MESSAGES.noSession)});return;}
var exp=Number(user.expires_at)||0,ms=exp<1e12?exp*1000:exp;
if(exp&&ms<Date.now()){alert(${JSON.stringify(MESSAGES.expired)});return;}
location.href=app+"/koppelen#koppel=1&token="+encodeURIComponent(user.access_token)+(exp?"&expires_at="+exp:"")+"&school="+encodeURIComponent(host);
})();`.replace(/\n/g, "");
  return `javascript:${encodeURIComponent(code)}`;
}
