/* ============================================================
   Influ Capital — לוגיקת האתר (Vanilla JS)
   מקור אמת לפרטי קשר: contact.json → מוטמע ב-SITE_CONFIG
   (file:// חוסם fetch, לכן ההטמעה inline — תואם הקונבנציה בפרויקט)
   ============================================================ */

// ----- קונפיגורציה מרכזית -----
const SITE_CONFIG = {
  phone:    '0533384114',
  phoneIntl:'+972533384114',
  whatsapp: '972533384114',
  email:    'info@influ-capital.co.il',
  waMessage:'היי אדם, הגעתי דרך האתר ואשמח לשמוע על ליווי השקעות אישי',
  ga4Id:    'G-ZWL0NJ7276',   // מזהה Google Analytics 4 — ריק = כבוי (פרטיות). נטען רק בהסכמת "מדידה".
  fbPixelId:'3682923041866819',   // מזהה Meta (Facebook) Pixel — נטען רק בהסכמת עוגיות "שיווק" (ראה loadMarketing).
  // Wix HTTP Function — חובה www (ל-apex יש רדירקט שמאבד את גוף ה-POST). לבדיקות: /_functions-dev/submitLead
  formEndpoint: 'https://www.adamvainshtein.co.il/_functions/submitLead',
  quotesUrl: '',   // JSON עם ציטוטי מניות אמת ({SYMBOL: changePercent}). ריק = סימולציה חיה.
  youtube:  'https://www.youtube.com/@AdamVainshtein'
};
const WA_LINK = 'https://wa.me/' + SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent(SITE_CONFIG.waMessage);

// ----- אטריבוציה — נלכדת פעם אחת בכניסה לאתר ונשמרת לסשן (ניווט פנימי לא דורס) -----
const ATTRIBUTION_KEY = 'influ_attribution';
(function captureAttribution(){
  try{
    if(sessionStorage.getItem(ATTRIBUTION_KEY)) return; // לא לדרוס את מקור ההגעה המקורי
    const q = new URLSearchParams(location.search);
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      utmSource:   q.get('utm_source')   || '',
      utmMedium:   q.get('utm_medium')   || '',
      utmCampaign: q.get('utm_campaign') || '',
      utmTerm:     q.get('utm_term')     || '',
      utmContent:  q.get('utm_content')  || '',
      gclid:       q.get('gclid')        || '',
      fbclid:      q.get('fbclid')       || '',
      referrer:    document.referrer     || '',
      landingPage: location.pathname + location.hash,
      enteredAt:   new Date().toISOString()
    }));
  }catch(err){}
})();
function getAttribution(){
  try{ return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY)) || {}; }catch(err){ return {}; }
}

// ----- מעקב מרכזי (GA4 + Meta Pixel) — facade אחד לכל האתר -----
// GA4 עם Google Consent Mode v2: נטען תמיד, אך ברירת המחדל denied — פינגים בסיסיים ללא עוגיות וללא מזהה קבוע.
// הסכמת "מדידה" → analytics_storage=granted (מדידה מלאה); "שיווק" → ad_*. Meta Pixel נטען אך ורק בהסכמת "שיווק".
// מדידה רק בדומיין האמיתי — localhost / בדיקות E2E / תצוגות מקדימות לא מזהמים את נתוני GA4 ו-Meta.
// הדומיין נגזר מ-og:url (נוצר מ-CNAME); www נחשב אותו אתר. לבדיקה מקומית: ‎?track=1
const SITE_HOST = (()=>{ try{ return new URL(document.querySelector('meta[property="og:url"]').content).hostname.replace(/^www\./,''); }catch(err){ return ''; } })();
const TRACKING_ON = location.hostname.replace(/^www\./,'') === SITE_HOST || new URLSearchParams(location.search).has('track');
const CONSENT_KEY = 'influ_consent_v2';
const storedConsent = (()=>{ try{ return JSON.parse(localStorage.getItem(CONSENT_KEY)) || {}; }catch(err){ return {}; } })();
const consentState = c => ({
  analytics_storage:  c.analytics ? 'granted' : 'denied',
  ad_storage:         c.marketing ? 'granted' : 'denied',
  ad_user_data:       c.marketing ? 'granted' : 'denied',
  ad_personalization: c.marketing ? 'granted' : 'denied'
});
if(TRACKING_ON && SITE_CONFIG.ga4Id && !/X{3,}/.test(SITE_CONFIG.ga4Id)){
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('consent', 'default', consentState(storedConsent));   // מצב התחלתי לפי הסכמה שמורה — כדי שה-page_view הראשון יישלח במצב הנכון
  gtag('set', 'ads_data_redaction', true);
  gtag('js', new Date());
  gtag('config', SITE_CONFIG.ga4Id);   // page_view: הראשון מה-config, ובניווט — מנגנון ה-SPA המובנה של GA4 (history events) קולט כל pushState/popstate
  // gtag.js נטען אחרי load / ב-idle — לא מתחרה בתוכן על רוחב פס (Core Web Vitals). פקודות שנכנסו לתור נשמרות.
  const loadGtag = ()=>{ const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+SITE_CONFIG.ga4Id; document.head.appendChild(s); };
  const idle = ()=> 'requestIdleCallback' in window ? requestIdleCallback(loadGtag, {timeout:3000}) : setTimeout(loadGtag, 1500);
  if(document.readyState === 'complete') idle(); else addEventListener('load', idle, {once:true});
}
window.updateConsent = c => { if(window.gtag) gtag('consent', 'update', consentState(c||{})); };
// מיפוי אירועי האתר לאירועי Meta: סטנדרטיים (Lead/Contact — מזינים אופטימיזציית קמפיינים) או מותאמים (trackCustom)
const FB_EVENTS = {
  lead_success:  ['track','Lead'],          // ליד שנקלט בהצלחה בשרת — אירוע ההמרה המרכזי לקמפיינים
  contact_click: ['track','Contact'],       // לחיצה על וואטסאפ / טלפון / אימייל
  lead_submit:   ['trackCustom','LeadSubmit'],  // ניסיון שליחת טופס (לפני אישור שרת)
  modal_open:    ['trackCustom','ModalOpen']    // פתיחת מודאל ליד/תיאום — מדד כוונה
};
let fbLastPath = null;  // מניעת PageView כפול — loadMarketing וה-route הראשוני עלולים לירות על אותו נתיב
function fbPageView(path){
  if(!window.fbq || path === fbLastPath) return;
  fbLastPath = path; fbq('track','PageView');
}
window.trackPageView = p => {   // GA4 סופר צפיות לבד (history events) — כאן רק Meta
  fbPageView(p);
};
window.trackEvent = (n,p) => {
  if(window.gtag) gtag('event',n,p||{});
  const m = FB_EVENTS[n];
  if(window.fbq && m) fbq(m[0], m[1], p||{});
};

// ----- המלצות מוטמעות סטטית ב-HTML (מקור: testimonials.json — דמה לפיתוח) -----

// ----- חיווט כפתורי חיוג / וואטסאפ / אימייל -----
function wireContacts(){
  const tel  = 'tel:' + SITE_CONFIG.phoneIntl;
  const mail = 'mailto:' + SITE_CONFIG.email;
  document.querySelectorAll('[data-call-link]').forEach(a=>{ a.setAttribute('href', tel); a.addEventListener('click', ()=>trackEvent('contact_click',{channel:'phone'})); });
  document.querySelectorAll('[data-wa-link]').forEach(a=>{ a.setAttribute('href', WA_LINK); a.target='_blank'; a.rel='noopener'; a.addEventListener('click', ()=>trackEvent('contact_click',{channel:'whatsapp'})); });
  document.querySelectorAll('[data-email-link]').forEach(a=>{ a.setAttribute('href', mail); a.addEventListener('click', ()=>trackEvent('contact_click',{channel:'email'})); });
}

// ----- שנה נוכחית -----
(function(){ const y=document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); })();

// ----- Router מבוסס נתיבים (History API) -----
// כל נתיב הוא גם קובץ סטטי עם meta משלו (tools/build-pages.py) — גוגל רואה כל עמוד כ-URL נפרד.
// כותרת/תיאור לכל עמוד: data-title / data-desc על ה-article (ועל tab-panel במסמכי רגולציה) — מקור אחד לנתב ולמחולל.
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('a[data-link]');
const REG_DOCS = [...document.querySelectorAll('#reg-tabs .tab')].map(t=>t.dataset.doc);
const HOME_META = { title: document.title, desc: (document.querySelector('meta[name="description"]')||{}).content || '' };
const canonicalEl = document.querySelector('link[rel="canonical"]');
const SITE_ORIGIN = canonicalEl ? new URL(canonicalEl.href).origin : location.origin;   // מקור יחיד: ה-canonical הסטטי (CNAME)
function currentPath(){
  const p = decodeURIComponent(location.pathname).replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/+$/, '');
  return p || '/';
}
// קישורים ישנים בפורמט hash (#/קורס, #/רגולציה/פרטיות) — מעבירים לנתיב החדש בלי טעינה מחדש
(function legacyHashRedirect(){
  if(!location.hash.startsWith('#/')) return;
  let p = decodeURIComponent(location.hash.slice(1));
  const m = p.match(/^\/רגולציה(?:\/(.+))?$/);
  if(m) p = '/' + (m[1] || 'פרטיות');
  history.replaceState(null, '', encodeURI(p) + location.search);
})();
// רגולציה — עמוד יחיד; בחירת טאב מחליפה מסמך בלבד (ללא מעבר/ריענון עמוד)
function showRegDoc(doc){
  const reg = document.querySelector('.page[data-page="/רגולציה"]'); if(!reg) return null;
  const panels = reg.querySelectorAll('.tab-panel');
  if(![...panels].some(p=>p.dataset.doc===doc)) doc = 'פרטיות';
  reg.querySelectorAll('#reg-tabs .tab').forEach(t=>{
    const on = t.dataset.doc === doc;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  let active = null;
  panels.forEach(p=>{ const on = p.dataset.doc === doc; p.classList.toggle('active', on); if(on) active = p; });
  return active;
}
function setMeta(path, title, desc){
  document.title = title;
  const d = document.querySelector('meta[name="description"]'); if(d) d.content = desc;
  if(canonicalEl) canonicalEl.href = SITE_ORIGIN + encodeURI(path);   // תמיד הצורה הנקייה (בלי .html / www)
}
// נתיב → עמוד + מסמך רגולציה + כותרת/תיאור. רגולציה: /פרטיות, /נגישות, /תנאי-שימוש, /עוגיות → העמוד היחיד; /רגולציה → פרטיות
function resolve(path){
  let regDoc = null;
  if(path === '/רגולציה') regDoc = 'פרטיות';
  else if(REG_DOCS.includes(path.slice(1))) regDoc = path.slice(1);
  const pagePath = regDoc ? '/רגולציה' : path;
  let target = null;
  pages.forEach(p=>{ if(p.dataset.page === pagePath) target = p; });
  // missing: העמוד לא נמצא במסמך הזה. בעמודים הסטטיים הרזים (tools/build-pages.py) יש רק עמוד אחד — ניווט אליו = טעינה מלאה
  const missing = !target;
  if(!target) target = document.querySelector('.page[data-page="/404"]');
  const src = (target && regDoc && target.querySelector(`.tab-panel[data-doc="${regDoc}"]`)) || target;
  const home = !!target && target.dataset.page === '/';
  return { path, regDoc, pagePath, target, missing,
    title: (home || !src) ? HOME_META.title : (src.dataset.title || HOME_META.title),
    desc:  (home || !src) ? HOME_META.desc  : (src.dataset.desc  || HOME_META.desc) };
}
let firstRoute = true;  // הקריאה הראשונה היא הרינדור ההתחלתי — לא "ניווט לאותו עמוד"
function route(){
  const { path, regDoc, pagePath, target, missing, title, desc } = resolve(currentPath());
  if(missing){
    // "אחורה"/"קדימה" לעמוד שלא במסמך הזה — טוענים את הקובץ הסטטי שלו
    if(!firstRoute){ location.reload(); return; }
    // כניסה ישירה לצורה לא-קנונית (‎/קורס/ מוגש כ-404.html) — מעבר לנתיב הנקי
    if(location.pathname !== encodeURI(path)){ location.replace(encodeURI(path) + location.search); return; }
  }
  if(!target) return;
  const prevActive = document.querySelector('.page.active');
  const samePage = target === prevActive && !firstRoute;
  firstRoute = false;
  pages.forEach(p=> p.classList.toggle('active', p === target));
  if(regDoc) showRegDoc(regDoc);
  setMeta(target.dataset.page === '/' ? '/' : path, title, desc);
  document.querySelectorAll('.site-nav .nav-links a[data-link]').forEach(a=>{
    if(a.pathname === location.pathname || decodeURIComponent(a.pathname) === pagePath) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  closeNav();
  if(!samePage){
    window.scrollTo({top:0, behavior:'auto'});
    if(window.syncHeader) window.syncHeader();
    if(typeof heroTypewriter !== 'undefined') heroTypewriter.activate();
    if(pagePath === '/קורס' && typeof treemapHero !== 'undefined') treemapHero.ensure();
    if(pagePath === '/ליווי-אישי' && typeof growthRace !== 'undefined') growthRace.ensure();
  }
  if(window.trackPageView) window.trackPageView(path);
}
function revealHeader(){ const h=document.querySelector('.site-header'); if(h) h.classList.add('intro-in'); }
// ניווט פנימי בלי טעינה מחדש — רק קליק שמאלי רגיל על קישור פנימי (Ctrl/Cmd/אמצעי/target נשארים התנהגות דפדפן)
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="/"]');
  if(!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
  if(a.origin !== location.origin || /\.[a-z0-9]+$/i.test(a.pathname)) return;   // קבצים (pdf/תמונות) — טעינה רגילה
  const next = resolve(decodeURIComponent(a.pathname).replace(/\/+$/, '') || '/');
  if(next.missing) return;   // העמוד לא במסמך הזה (עמוד סטטי רזה) — טעינה רגילה של הקובץ שלו
  e.preventDefault();
  document.title = next.title;   // לפני pushState — GA4 קורא את הכותרת באירוע ה-history
  if(a.pathname !== location.pathname || location.hash) history.pushState(null, '', a.pathname);
  revealHeader();   // אם המשתמש מנווט לפני שכניסת הבית הסתיימה — לחשוף את ההידר בכל מקרה
  route();
});
window.addEventListener('popstate', ()=>{ revealHeader(); route(); });

// ----- תפריט מובייל (לכל הידר: עליון + סטיקי) -----
const navClosers = [];
document.querySelectorAll('.site-header').forEach(header=>{
  const navList = header.querySelector('.nav-links');
  const hamburger = header.querySelector('.nav-toggle');
  if(!navList || !hamburger) return;
  function close(){
    hamburger.setAttribute('aria-expanded','false'); hamburger.setAttribute('aria-label','פתיחת תפריט');
    if(!navList.classList.contains('open')) return;
    const instant = matchMedia('(prefers-reduced-motion:reduce)').matches || matchMedia('(min-width:821px)').matches;
    if(instant){ navList.classList.remove('open','closing'); return; }
    navList.classList.add('closing');
    navList.addEventListener('animationend', e=>{
      if(e.target!==navList || e.animationName!=='nav-up') return;
      navList.classList.remove('open','closing');
    }, {once:true});
  }
  function open(){
    navList.classList.remove('closing'); navList.classList.add('open');
    hamburger.setAttribute('aria-expanded','true'); hamburger.setAttribute('aria-label','סגירת תפריט');
  }
  hamburger.addEventListener('click', ()=>{
    if(navList.classList.contains('open') && !navList.classList.contains('closing')) close(); else open();
  });
  navClosers.push(close);
});
function closeNav(){ navClosers.forEach(fn=>fn()); }

// ----- אקורדיון (סילבוס) -----
window.toggleAcc = function(btn){
  const item = btn.closest('.acc-item');
  const open = item.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
  const body = item.querySelector('.acc-body');
  if(body) body.setAttribute('aria-hidden', String(!open));
};
document.querySelectorAll('.acc-item').forEach((item,i)=>{
  const head=item.querySelector('.acc-head'), body=item.querySelector('.acc-body');
  if(!head||!body) return;
  const open=item.classList.contains('open'), id='acc-body-'+i;
  body.id=id; head.setAttribute('aria-controls',id);
  head.setAttribute('aria-expanded',String(open)); body.setAttribute('aria-hidden',String(!open));
});

// ----- מודאלים — פתיחה/סגירה/נגישות -----
(function modals(){
  let active = null, lastFocus = null;
  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function open(id){
    const ov = document.getElementById(id); if(!ov) return;
    lastFocus = document.activeElement;
    ov.classList.add('show'); active = ov; document.body.style.overflow = 'hidden';
    const first = ov.querySelector('input:not([type=hidden]),select,textarea') || ov.querySelector(FOCUSABLE); if(first) first.focus();
  }
  function close(){
    if(!active) return;
    active.classList.remove('show'); active = null; document.body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.__openModal = open; window.__closeModal = close;
  window.__leadCtaSource = ''; // מקור ה-CTA שפתח את המודאל האחרון — מצורף לליד כ-ctaSource
  document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click', e=>{
    e.preventDefault();
    window.__leadCtaSource = 'cta:' + (btn.textContent||'').trim().replace(/\s+/g,' ');
    trackEvent('modal_open', {modal: btn.getAttribute('data-open-modal')});
    open(btn.getAttribute('data-open-modal'));
  }));
  document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click', close));
  document.querySelectorAll('.modal-overlay').forEach(ov=>ov.addEventListener('mousedown', e=>{ if(e.target===ov) close(); }));
  document.addEventListener('keydown', e=>{
    if(!active) return;
    if(e.key==='Escape'){ close(); return; }
    if(e.key==='Tab'){
      const f=[...active.querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null);
      if(!f.length) return;
      const first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });
})();

// ----- גלריית וידאו "coverflow" — מרכז embedded, צדדים קטנים, לחיצה/החלקה (RTL), IntersectionObserver, נגן youtube-nocookie -----
(function vidCoverflow(){
  document.querySelectorAll('.vid-cf').forEach(cf => {
    const items = [...cf.querySelectorAll('.vcf-item')];
    const n = items.length; if(!n) return;
    const dots = cf.parentElement.querySelector('.vcf-dots');
    let active = Math.floor(n/2), armed = false, mediaTimer = 0;
    const mq = window.matchMedia('(max-width:640px)');  // מובייל: סליידר snap נייטיב במקום coverflow
    function ensureMedia(){
      if(!armed) return;
      items.forEach((it,i) => {
        const frame = it.querySelector('.vcf-frame');
        if(i === active){
          if(!it.dataset.loaded && it.dataset.yt){
            it.dataset.loaded = '1';
            const f = document.createElement('iframe');
            f.src = 'https://www.youtube-nocookie.com/embed/' + it.dataset.yt + '?rel=0';
            f.title = it.dataset.title || 'וידאו'; f.loading = 'lazy';
            f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            f.setAttribute('allowfullscreen','');
            frame.appendChild(f);
          }
        } else if(it.dataset.loaded){
          it.dataset.loaded = '';
          const f = frame.querySelector('iframe'); if(f) f.remove();
        }
      });
    }
    // טעינת/החלפת הנגן רק אחרי שהתנועה נחה — מונע הבהוב iframe בזמן מעבר
    function scheduleMedia(){ clearTimeout(mediaTimer); mediaTimer = setTimeout(ensureMedia, 470); }
    function layout(){
      if(mq.matches){  // מובייל: כל הכרטיסים זורמים בסליידר, ללא coverflow/הסתרה
        items.forEach(it => { it.dataset.pos = 'm'; it.tabIndex = 0; it.setAttribute('aria-hidden','false'); });
        if(dots) [...dots.children].forEach((d,i) => d.setAttribute('aria-current', String(i === active)));
        return;
      }
      items.forEach((it,i) => {
        const p = i - active;   // ללא גלישה מעגלית — מונע "קפיצת" כרטיס מקצה לקצה
        it.dataset.pos = Math.abs(p) > 1 ? 'hidden' : String(p);   // מקס׳ 3 גלויים: מרכז + 1 מכל צד
        it.tabIndex = (p === 0) ? 0 : -1;
        it.setAttribute('aria-hidden', String(Math.abs(p) > 1));
      });
      if(dots) [...dots.children].forEach((d,i) => d.setAttribute('aria-current', String(i === active)));
    }
    function go(idx){
      const next = Math.max(0, Math.min(n - 1, idx));   // קלאמפ לקצוות — בלי גלישה
      if(next === active) return;
      active = next; armed = true; layout(); scheduleMedia();
    }
    if(dots){
      dots.innerHTML = '';
      items.forEach((it,i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label','וידאו ' + (i+1));
        b.addEventListener('click', () => { if(mq.matches){ active = i; layout(); items[i].scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); } else { go(i); } });
        dots.appendChild(b);
      });
    }
    items.forEach((it,i) => it.addEventListener('click', e => {
      if(cf.dataset.swiping === '1'){ e.preventDefault(); return; }
      if(i !== active){ e.preventDefault(); go(i); }
      else if(!it.dataset.loaded){ armed = true; ensureMedia(); }   // לחיצה על המרכז → טעינה מיידית
    }));
    // החלקה במצביע — עם תפיסת מצביע בעכבר/עט כדי שלא יקפוץ באמצע גרירה (במגע: גלילה נייטיב)
    let sx = 0, dx = 0, down = false, pid = null;
    cf.addEventListener('pointerdown', e => {
      down = true; sx = e.clientX; dx = 0; cf.dataset.swiping = '';
      if(e.pointerType !== 'touch'){ pid = e.pointerId; try{ cf.setPointerCapture(pid); }catch(_){} }
    });
    cf.addEventListener('pointermove', e => { if(down){ dx = e.clientX - sx; if(Math.abs(dx) > 10) cf.dataset.swiping = '1'; } });
    function endSwipe(){
      if(!down) return; down = false;
      if(pid != null){ try{ cf.releasePointerCapture(pid); }catch(_){} pid = null; }
      if(!mq.matches && Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));   /* RTL: החלקה שמאלה = הבא */
      const moved = Math.abs(dx) > 10;
      setTimeout(() => { cf.dataset.swiping = ''; }, moved ? 60 : 0);
    }
    cf.addEventListener('pointerup', endSwipe);
    cf.addEventListener('pointercancel', endSwipe);
    cf.addEventListener('keydown', e => {
      if(e.key === 'ArrowLeft'){ e.preventDefault(); go(active + 1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); go(active - 1); }
    });
    // מובייל: עדכון הנקודה הפעילה לפי הכרטיס שבמרכז הסליידר
    let scrollT;
    cf.addEventListener('scroll', () => {
      if(!mq.matches) return;
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        const mid = cf.getBoundingClientRect().left + cf.clientWidth / 2;
        let best = active, bestD = Infinity;
        items.forEach((it,i) => {
          const r = it.getBoundingClientRect();
          const d = Math.abs((r.left + r.width/2) - mid);
          if(d < bestD){ bestD = d; best = i; }
        });
        if(best !== active){ active = best; if(dots) [...dots.children].forEach((d,i) => d.setAttribute('aria-current', String(i === best))); }
      }, 90);
    }, {passive:true});
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(ents => {
        ents.forEach(en => { if(en.isIntersecting && !armed){ armed = true; ensureMedia(); io.disconnect(); } });
      }, {threshold:.25});
      io.observe(cf);
    } else { armed = true; }
    layout(); ensureMedia();
  });
})();

// ----- "דופק השוק": מספרי אחוזים רנדומליים צפים (מיקום/ערך/צבע/תזמון רנדומליים) -----
(function marketPulse(){
  const UP   = '<svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>';
  const DOWN = '<svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  document.querySelectorAll('[data-market-pulse]').forEach(sec => {
    const stage = sec.querySelector('[data-mp-stage]');
    if(!stage || reduce) return;   // כיבוד prefers-reduced-motion
    let active = 0, timer = 0, running = false;
    function spawn(){
      if(active > 6) return;
      const up  = Math.random() < 0.5;                       // אדום/ירוק רנדומלי
      const val = (Math.random() * 8 + 0.1).toFixed(Math.random() < 0.5 ? 1 : 2);
      const el  = document.createElement('span');
      el.className = 'mp-badge ' + (up ? 'up' : 'down');
      el.style.setProperty('--mp-dur', (2.4 + Math.random() * 1.8) + 's');   // משך רנדומלי
      el.style.left = (5 + Math.random() * 84) + '%';                        // מיקום אופקי רנדומלי
      el.style.top  = (Math.random() < 0.5 ? (8 + Math.random() * 22) : (62 + Math.random() * 26)) + '%';  // בפסים עליון/תחתון, לא על הכותרת
      el.innerHTML  = (up ? UP : DOWN) + '<span>' + (up ? '+' : '\u2212') + val + '%</span>';
      stage.appendChild(el); active++;
      el.addEventListener('animationend', () => { el.remove(); active--; });
    }
    function loop(){ if(!running) return; spawn(); timer = setTimeout(loop, 650 + Math.random() * 1700); }  // תזמון רנדומלי
    function start(){ if(running) return; running = true; loop(); }
    function stop(){ running = false; clearTimeout(timer); }
    if('IntersectionObserver' in window){
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), {threshold:.2}).observe(sec);
    } else { start(); }
  });
})();

// ----- Toast -----
const toastEl = document.getElementById('toast');
let toastT;
function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(()=>toastEl.classList.remove('show'), 3500); }

// ----- טפסי לידים — שליחה ל-Backend (Wix HTTP Function) + אטריבוציה -----
// מיפוי aria-label של כל טופס → מזהה source יציב באנגלית (טופס עתידי → slug מה-aria-label)
const LEAD_FORM_SOURCES = {
  'טופס יצירת קשר — דף הבית': 'home_hero',
  'טופס יצירת קשר — אודות':   'about_page',
  'טופס יצירת קשר — צור קשר': 'contact_page',
  'טופס יצירת קשר — פוטר':    'footer',
  'טופס לכידת ליד':           'exit_popup',
  'טופס תיאום שיחה':          'header_call'
};
const LEAD_ERRORS = {
  email_or_phone_required: 'נא למלא טלפון',
  rate_limited: 'יותר מדי ניסיונות, נסה שוב בעוד רגע'
};
// טלפון ישראלי: נייד 05X/07X (10 ספרות) או קווי (9 ספרות), כולל קידומת +972
function isValidILPhone(v){
  const d = v.replace(/[\s\-().]/g,'').replace(/^\+?972/, '0');
  return /^0(?:[57]\d{8}|[23489]\d{7})$/.test(d);
}
document.querySelectorAll('[data-leadform]').forEach(form=>{
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    // ולידציה בסיסית
    let ok = true;
    form.querySelectorAll('[required]').forEach(inp=>{
      const valid = inp.type==='checkbox' ? inp.checked : inp.value.trim()!=='';
      inp.classList.toggle('bad', !valid);
      if(!valid) ok = false;
    });
    if(!ok){ toast('נא למלא את שדות החובה'); return; }
    const phoneInp = form.querySelector('[name="phone"]');
    if(phoneInp && !isValidILPhone(phoneInp.value)){
      phoneInp.classList.add('bad');
      toast('נא להזין מספר טלפון ישראלי תקין');
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const label = form.getAttribute('aria-label') || '';
    const source = LEAD_FORM_SOURCES[label] || label.trim().replace(/\s+/g,'_');
    const fullName = (data.name||'').trim();
    const nameParts = fullName ? fullName.split(/\s+/) : [];
    const attr = getAttribution();
    const payload = {
      firstName:   nameParts[0] || '',
      lastName:    nameParts.slice(1).join(' '),
      email:       '',
      phone:       (data.phone||'').trim(),
      message:     (data.message||'').trim(),
      website:     data.website || '',   // honeypot — השרת מסנן לפיו
      source:      source,
      interest:    data.interest || '',
      consent:     !!(form.querySelector('[name="consent"]') && form.querySelector('[name="consent"]').checked),
      pagePath:    location.pathname + location.hash,
      referrer:    attr.referrer    || '',
      landingPage: attr.landingPage || '',
      utmSource:   attr.utmSource   || '',
      utmMedium:   attr.utmMedium   || '',
      utmCampaign: attr.utmCampaign || '',
      utmTerm:     attr.utmTerm     || '',
      utmContent:  attr.utmContent  || '',
      gclid:       attr.gclid       || '',
      fbclid:      attr.fbclid      || '',
      ctaSource:   form.closest('.modal-overlay') ? (window.__leadCtaSource || '') : ''
    };
    if(window.trackEvent) window.trackEvent('lead_submit', {interest:payload.interest, source:source});
    // נטרול הכפתור למניעת שליחה כפולה
    const btn = form.querySelector('[type="submit"]');
    const btnText = btn ? btn.textContent : '';
    if(btn){ btn.disabled = true; btn.textContent = 'שולח…'; }
    try{
      const res = await fetch(SITE_CONFIG.formEndpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'Accept':'application/json'},
        body: JSON.stringify(payload)
      });
      let out = null;
      try{ out = await res.json(); }catch(err){}
      if(res.ok && out && out.ok){
        trackEvent('lead_success', {interest:payload.interest, source:source});  // הליד נקלט בשרת — אירוע ההמרה (Meta: Lead)
        form.reset();
        if(window.__closeModal) window.__closeModal();
        toast('תודה! נחזור אליכם בהקדם 🙌');
      }else{
        toast(LEAD_ERRORS[out && out.error] || 'משהו השתבש בשליחה, נסו שוב או דברו איתנו בוואטסאפ');
      }
    }catch(err){
      toast('אין חיבור לרשת כרגע — נסו שוב, או דברו איתנו בוואטסאפ');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = btnText; }
    }
  });
});

// ----- חזרה למעלה -----
const backTop = document.getElementById('back-to-top');
if(backTop){
  backTop.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));
  window.addEventListener('scroll', ()=>backTop.classList.toggle('show', window.scrollY>500), {passive:true});
}

// ----- ווידג'ט נגישות -----
(function a11y(){
  const toggle = document.getElementById('a11y-toggle');
  const panel = document.getElementById('a11y-panel');
  const KEY = 'influ_a11y_v1';
  if(!toggle||!panel) return;
  toggle.addEventListener('click', ()=>{ const open=panel.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ panel.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); } });
  function apply(state){
    const root = document.documentElement;
    ['fs','contrast','underline'].forEach(k=>{ if(state[k]) root.dataset[k]=state[k]; else delete root.dataset[k]; });
    document.querySelectorAll('.a11y-row').forEach(row=>{
      const key=row.dataset.a11y;
      row.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', String((state[key]||'')===b.dataset.val)));
    });
  }
  let state = (()=>{ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch{ return {}; } })();
  apply(state);
  document.querySelectorAll('.a11y-row').forEach(row=>row.addEventListener('click', e=>{
    const b=e.target.closest('button'); if(!b) return;
    state[row.dataset.a11y]=b.dataset.val; localStorage.setItem(KEY, JSON.stringify(state)); apply(state);
  }));
  document.getElementById('a11y-reset').addEventListener('click', ()=>{ state={}; localStorage.removeItem(KEY); apply(state); });
})();

// ----- הסכמת עוגיות (v2 — קטגוריות: הכרחיות / מדידה / שיווק) -----
(function cookies(){
  const KEY=CONSENT_KEY;   // v2: נוספה קטגוריית "שיווק" (Meta Pixel). הסכמות v1 ישנות לא נמשכות בכוונה — המשתמש נשאל מחדש
  const bar=document.getElementById('cookie');
  const get=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)); }catch{ return null; } };
  const set=o=>localStorage.setItem(KEY, JSON.stringify(o));
  const show=()=>bar.classList.add('show');
  const hide=()=>bar.classList.remove('show');
  function applyConsent(c){
    updateConsent(c);   // GA4 Consent Mode — granted/denied לפי הבחירה (GA עצמו כבר נטען במצב בסיסי)
    if(c && c.marketing) loadMarketing();
    else if(window.fbq) fbq('consent','revoke');   // הפיקסל כבר נטען בסשן והמשתמש חזר בו — עצירת איסוף
  }
  // Meta Pixel — נטען אך ורק בהסכמת "שיווק". בלי noscript-fallback בכוונה (תמונת noscript הייתה עוקפת את מנגנון ההסכמה).
  let marketingLoaded=false;
  function loadMarketing(){
    if(marketingLoaded) return; marketingLoaded=true;
    if(TRACKING_ON && SITE_CONFIG.fbPixelId && !/X{3,}/.test(SITE_CONFIG.fbPixelId)){
      !function(f,b,e,v,n,t,s){ if(f.fbq) return; n=f.fbq=function(){ n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments); };
        if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
        t=b.createElement(e); t.async=!0; t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq.disablePushState = true;   // PageView ידני בכל route — בלי זה Meta יורה PageView נוסף על כל pushState
      fbq('consent','grant');
      fbq('init', SITE_CONFIG.fbPixelId);
      fbPageView(currentPath());  // צפיית העמוד הנוכחי (מנוע-כפילויות מול route)
    }
  }
  document.getElementById('cookie-accept').addEventListener('click', ()=>{ const c={necessary:true,analytics:true,marketing:true,ts:Date.now()}; set(c); hide(); applyConsent(c); });
  document.getElementById('cookie-decline').addEventListener('click', ()=>{ const c={necessary:true,analytics:false,marketing:false,ts:Date.now()}; set(c); hide(); applyConsent(c); });
  const reopen=document.getElementById('reopen-cookies'); if(reopen) reopen.addEventListener('click', show);
  const c=get(); if(c){ applyConsent(c); } else { setTimeout(show, 900); }
})();

// ----- פופאפ חכם (exit-intent + גלילה עמוקה), פעם אחת לסשן, טריגרים מאופקים -----
(function smartPopup(){
  const KEY='influ_popup_shown';
  const MIN_DWELL_MS=25000;   // לא לפני 25 שניות בעמוד — לתת לגולש להתרשם קודם
  const SCROLL_PCT=0.85;       // רק בגלילה עמוקה מאוד (85%), קרוב לסוף התוכן
  const shown=()=>sessionStorage.getItem(KEY)==='1';
  let armed=false;             // טריגרים מזוינים רק אחרי שהות מינימלית בעמוד
  let scrolled=false;          // exit-intent ידרוש שהגולש כבר גלל מעט (סימן מעורבות)
  setTimeout(()=>{ armed=true; }, MIN_DWELL_MS);
  function fire(trigger){ if(!armed || shown()) return; sessionStorage.setItem(KEY,'1'); window.__leadCtaSource = trigger; if(window.__openModal) window.__openModal('modal-lead'); }
  // exit-intent: רק אחרי השהיה + רק אם הגולש כבר גלל (לא קפיצה מיידית)
  document.addEventListener('mouseout', e=>{ if(armed && scrolled && e.clientY<=0 && !e.relatedTarget) fire('exit_intent'); });
  let scrollFired=false;
  window.addEventListener('scroll', ()=>{
    if(window.scrollY>200) scrolled=true;
    if(scrollFired) return;
    const denom=document.body.scrollHeight - window.innerHeight;
    if(denom>0 && (window.scrollY/denom)>SCROLL_PCT){ scrollFired=true; fire('scroll_depth'); }
  }, {passive:true});
})();

// ----- הדמיית שיחת וואטסאפ אינטראקטיבית -----
(function waChat(){
  const chat=document.getElementById('wa-chat');
  const body=document.getElementById('wa-body');
  const input=document.getElementById('wa-input');
  const form=document.getElementById('wa-compose');
  if(!chat||!body||!input||!form) return;
  const head=document.getElementById('wa-head-link'); if(head) head.href=WA_LINK;
  const DEMO=[
    {who:'them', text:'בוקר טוב 👋 שמתי לב שאחת החברות בתיק שלך פרסמה דוח חזק היום. רציתי לעדכן שאני על זה.', time:'9:14'},
    {who:'me',   text:'וואו, תודה שאתה עוקב 🙏 אז כדאי להוסיף עכשיו?', time:'9:16', read:true},
    {who:'them', text:'לא רצים אחרי. נשארים נאמנים לתוכנית — אם נחליט להגדיל, נעשה את זה מסודר במפגש החודשי.', time:'9:17'},
    {who:'me',   text:'הגיוני לגמרי. מרגיש טוב לדעת שיש יד על הדופק 💚', time:'9:18', read:true},
    {who:'them', text:'בדיוק בשביל זה אני כאן: עוקב אחרי התיק ופונה רק כשיש סיבה אמיתית. אתם רגועים — אנחנו על זה ביחד. 💪', time:'9:19'},
  ];
  let token=0, cleared=false;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const sleep=ms=>new Promise(r=>setTimeout(r, reduce?0:ms));
  const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const nowTime=()=>new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
  const scroll=()=>{ body.scrollTop=body.scrollHeight; };
  const reset=()=>{ body.innerHTML='<span class="wa-day">היום</span>'; };
  function addBubble(m){
    const el=document.createElement('div'); el.className='wa-msg '+m.who;
    el.innerHTML=esc(m.text)+(m.cta?'<a class="wa-cta" href="'+WA_LINK+'" target="_blank" rel="noopener"><svg class="lucide icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg> להמשך השיחה בוואטסאפ</a>':'')+
      '<time>'+(m.time||nowTime())+(m.read?' <svg class="lucide icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>':'')+'</time>';
    body.appendChild(el); scroll(); return el;
  }
  function addTyping(){ const el=document.createElement('div'); el.className='wa-typing'; el.setAttribute('aria-label','אדם מקליד…'); el.innerHTML='<span></span><span></span><span></span>'; body.appendChild(el); scroll(); return el; }
  async function playDemo(){
    const my=++token; reset(); await sleep(500); if(my!==token) return;
    for(const m of DEMO){
      if(m.who==='them'){ const t=addTyping(); await sleep(1000); if(my!==token){ t.remove(); return; } t.remove(); }
      else { await sleep(550); if(my!==token) return; }
      addBubble(m); await sleep(750); if(my!==token) return;
    }
  }
  async function adamReply(){ const my=token; await sleep(450); if(my!==token) return; const t=addTyping(); await sleep(1400); if(my!==token){ t.remove(); return; } t.remove(); addBubble({who:'them', cta:true, text:'תודה על ההודעה! 🙏 זו הדמיה — אשמח להמשיך איתך בוואטסאפ האמיתי ולחזור אישית.'}); }
  input.addEventListener('focus', ()=>{ if(cleared) return; cleared=true; token++; reset(); scroll(); });
  form.addEventListener('submit', ()=>{ const v=input.value.trim(); if(!v) return; cleared=true; token++; input.value=''; addBubble({who:'me', text:v, read:true}); adamReply(); });
  let started=false;
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{ if(e.isIntersecting && !started && !cleared){ started=true; playDemo(); } }), {threshold:.35});
  io.observe(chat);
})();

// ----- אתחול -----
// ----- המלצות — קיר ביקורות נע (עמודי המוצר). מקור: testimonials.json (דמה לפיתוח) -----
const TESTI_WALL = [
  {name:'דנה לוי',    platform:'whatsapp',  rating:5, text:'הצטרפתי לליווי בלי שום רקע בשוק ההון, והיום אני מבינה בדיוק מה אני קונה ולמה. אדם מסביר בסבלנות אינסופית.'},
  {name:'יוסי מזרחי', platform:'google',    rating:5, text:'הליווי האישי שינה לי את כל הגישה להשקעות. עברתי מספקולציות לאסטרטגיית ערך מסודרת. ממליץ בחום!'},
  {name:'מירב כהן',   platform:'whatsapp',  rating:5, text:'סוף סוף מישהו שמדבר בגובה העיניים ולא מוכר חלומות. למדתי לחקור מניה לבד וזה שווה זהב.'},
  {name:'אורן בן דוד',platform:'instagram', rating:5, text:'עוקב אחרי התוכן כבר שנתיים, וההצטרפות לליווי הייתה הצעד הכי טוב שעשיתי לכסף שלי.'},
  {name:'שירה אברהם', platform:'facebook',  rating:4, text:'התלבטתי הרבה לפני שנכנסתי לעולם הזה, אבל הליווי נתן לי ביטחון לקבל החלטות בעצמי. תודה רבה!'},
  {name:'אלי פרץ',    platform:'whatsapp',  rating:5, text:'אדם לא נותן טיפים חמים, הוא מלמד אותך לדוג. בדיוק מה שחיפשתי. תיק ההשקעות שלי נראה אחרת לגמרי.'},
  {name:'נטע גולן',   platform:'google',    rating:5, text:'הגעתי בלי לדעת מה זה דוח רווח והפסד, והיום אני קוראת דוחות בעצמי. הליווי ענייני, מקצועי וכיפי.'},
  {name:'רון שמואלי', platform:'instagram', rating:5, text:'הכי אהבתי שאין לחץ ואין הבטחות סרק. גישה שמרנית, אחראית ולטווח ארוך. ממליץ לכל מתחיל.'},
  {name:'ליאת חדד',   platform:'whatsapp',  rating:5, text:'פחדתי מהשוק שנים. אחרי הליווי אני מרגישה שיש לי שליטה ותוכנית ברורה. תודה על הסבלנות.'},
  {name:'גיא נחום',   platform:'facebook',  rating:5, text:'ההשקעה בליווי החזירה את עצמה פי כמה רק מהשקט הנפשי והביטחון בהחלטות. שווה כל שקל.'}
];
const PLAT_LABEL = {whatsapp:'וואטסאפ', google:'Google', instagram:'אינסטגרם', facebook:'פייסבוק'};
const PLAT_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 15.8 6.5 19.1l1.4-6.1L3.2 8.8l6.2-.6z"/></svg>';
function revCard(t){
  const stars = Array.from({length:5},(_,i)=>'<span'+(i<t.rating?'':' class="off"')+'>'+STAR+'</span>').join('');
  // גוון אווטאר יציב לכל ממליץ — נגזר מהשם, כך שכל עיגול בצבע מעט אחר (כמו Google Maps)
  const avaColor = 'c'+(([...t.name].reduce((s,ch)=>s+ch.charCodeAt(0),0)%8)+1);
  return '<article class="testi-rev"><div class="rev-top"><span class="rev-ava '+avaColor+'" aria-hidden="true">'+t.name.charAt(0)+
    '</span><span class="rev-id"><span class="rev-name">'+t.name+'</span><span class="rev-plat">'+PLAT_ICON+' '+(PLAT_LABEL[t.platform]||'')+
    '</span></span><span class="rev-stars" role="img" aria-label="'+t.rating+' מתוך 5 כוכבים">'+stars+'</span></div>'+
    '<p class="rev-text">'+t.text+'</p></article>';
}
function renderTestiWall(){
  const walls = document.querySelectorAll('[data-testi-wall]');
  if(!walls.length) return;
  const cols = [[],[],[]];
  TESTI_WALL.forEach((t,i)=>cols[i%3].push(revCard(t)));
  const html = cols.map(c=>{ const inner=c.join(''); return '<div class="testi-col"><div class="testi-track">'+inner+inner+'</div></div>'; }).join('');
  walls.forEach(w=>w.innerHTML=html);
}

// ----- טיקר מניות מובילות -----
// ברירת מחדל: סימולציית "מהלך אקראי" חיה (אדום/ירוק). אם הוגדר SITE_CONFIG.quotesUrl,
// הפרונט ימשוך נתוני אמת. אין להטמיע מפתח API בצד-לקוח (אבטחה/פרטיות) — proxy/Edge-Function או API ללא מפתח עם CORS.
const TICKER = [
  {sym:'NVDA',logo:'01-nvidia.svg'},{sym:'AAPL',logo:'02-apple.svg'},{sym:'MSFT',logo:'03-microsoft.svg'},
  {sym:'GOOGL',logo:'04-alphabet.svg'},{sym:'AMZN',logo:'05-amazon.svg'},{sym:'META',logo:'06-meta.svg'},
  {sym:'AVGO',logo:'07-broadcom.svg'},{sym:'TSLA',logo:'08-tesla.svg'},{sym:'ORCL',logo:'09-oracle.svg'},{sym:'V',logo:'10-visa.svg'}
];
const TKR_BASE='media/stock-company/logos/02-monochrome/';
const TKR_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>';
const TKR_DOWN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>';
const TKR_STATE={};
const tkrClamp=v=>Math.max(-9.99,Math.min(9.99,v));
const tkrHTML=v=>(v>=0?TKR_UP:TKR_DOWN)+(v>=0?'+':'')+v.toFixed(2)+'%';
function tkrApply(sym){const v=TKR_STATE[sym];document.querySelectorAll('.chg[data-chg="'+sym+'"]').forEach(el=>{el.className='chg '+(v>=0?'up':'down');el.innerHTML=tkrHTML(v);});}
let tkrTimer=null;
async function tkrFetchReal(){
  if(!SITE_CONFIG.quotesUrl) return false;
  try{
    const r=await fetch(SITE_CONFIG.quotesUrl,{headers:{'Accept':'application/json'}}); if(!r.ok) return false;
    const d=await r.json(); let any=false;
    TICKER.forEach(c=>{ const raw=Array.isArray(d)?((d.find(x=>x.symbol===c.sym)||{}).changePercent):d[c.sym];
      if(raw!=null && !isNaN(+raw)){ TKR_STATE[c.sym]=tkrClamp(+(+raw).toFixed(2)); tkrApply(c.sym); any=true; } });
    return any;
  }catch(e){ return false; }
}
function tkrSimStep(){
  for(let i=0;i<2;i++){ const c=TICKER[Math.floor(Math.random()*TICKER.length)];
    let v=TKR_STATE[c.sym]+(Math.random()*0.7-0.35);
    if(Math.random()<0.12) v+=(Math.random()*2-1);
    TKR_STATE[c.sym]=tkrClamp(+v.toFixed(2)); tkrApply(c.sym); }
}
function startTickerData(){
  if(tkrTimer || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(SITE_CONFIG.quotesUrl){ tkrFetchReal(); tkrTimer=setInterval(tkrFetchReal,30000); }
  else { tkrTimer=setInterval(tkrSimStep,1100); }
}
function renderTicker(){
  const track=document.querySelector('[data-ticker]'); if(!track) return;
  TICKER.forEach(c=>{ if(!(c.sym in TKR_STATE)) TKR_STATE[c.sym]=tkrClamp(Math.random()*4-2); });
  const chips=TICKER.map(c=>{const v=TKR_STATE[c.sym];
    return '<span class="tkr" data-sym="'+c.sym+'"><img src="'+TKR_BASE+c.logo+'" alt="" decoding="async" height="18">'+
      '<span class="sym">'+c.sym+'</span><span class="chg '+(v>=0?'up':'down')+'" data-chg="'+c.sym+'">'+tkrHTML(v)+'</span></span>';
  }).join('');
  const half=chips+chips; track.innerHTML=half+half; // x4 — חצי (x2) רחב מכל מסך, ו-translateX(-50%) נוחת מדויק
  startTickerData();
}

// ----- אפקט מכונת כתיבה לכותרות הירו (h1[data-typewriter]) -----
const heroTypewriter = (function(){
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  // השהיה (ms) *אחרי* התו שהוקלד — טבעי: תווים מהר, פסק קצר בין מילים, ארוך יותר אחרי פיסוק.
  function delayAfter(ch){
    if(/[.!?…]/.test(ch)) return 300;            // סוף משפט — הפסקה ארוכה
    if(/[,;:]/.test(ch))  return 180;            // פסיק — הפסקה בינונית
    if(/[—–-]/.test(ch))  return 140;            // מקף
    if(ch === ' ')        return 48 + Math.random()*28;  // רווח בין מילים — קצר
    return 14 + Math.random()*18;                // אות רגילה — מהיר
  }
  function run(h1){
    if(!h1 || h1.dataset.twReady) return;
    h1.dataset.twReady = '1';
    const heroMain = h1.closest('.hero-main');
    if(heroMain) heroMain.classList.add('intro-portrait-go'); // פורטרט + typewriter ביחד
    if(reduce){
      if(heroMain) heroMain.classList.add('intro-go');
      const hdrEl = document.querySelector('.site-header'); if(hdrEl) hdrEl.classList.add('intro-in');
      return;                                    // ללא תנועה — הטקסט מוצג מלא ע״י ה-CSS
    }
    h1.setAttribute('aria-label', h1.textContent.trim()); // קורא מסך שומע את הכותרת המלאה
    const chars = [];
    const src = h1.cloneNode(true);              // מקור לקריאה
    h1.textContent = '';                         // בונים מחדש עם spans לכל תו
    (function walk(from, to){
      from.childNodes.forEach(node=>{
        if(node.nodeType === 3){                 // טקסט → span לכל תו
          for(const ch of node.nodeValue){
            const s = document.createElement('span');
            s.className = 'tw-c'; s.textContent = ch; s.setAttribute('aria-hidden','true');
            to.appendChild(s); chars.push({el:s, ch});
          }
        } else if(node.nodeType === 1){          // אלמנט (span.accent) → לשמר את העטיפה
          const el = node.cloneNode(false);
          to.appendChild(el); walk(node, el);
        }
      });
    })(src, h1);
    if(!chars.length) return;
    h1.classList.add('tw-typing');
    // רשת ביטחון: אם ההקלדה תיקטע, חושפים את תוכן ההירו אחרי 6 שניות בכל מקרה (idempotent).
    const heroMainEl = h1.closest('.hero-main');
    if(heroMainEl) setTimeout(()=>{ heroMainEl.classList.add('intro-portrait-go','intro-go');
      const hdrEl = document.querySelector('.site-header'); if(hdrEl) hdrEl.classList.add('intro-in'); }, 6000);
    // הנעה ב-rAF (מסונכרן לפריימים). הקארט הוא מחלקה (.tw-cursor) על התו האחרון —
    // ::after אבסולוטי שאינו תופס מקום, כך שאין דחיפה/רעד של הטקסט.
    let i = 0, nextAt = 0, prevCursor = null;
    function frame(now){
      if(!nextAt) nextAt = now;
      while(i < chars.length && now >= nextAt){
        const {el, ch} = chars[i];
        el.classList.add('tw-on');
        if(prevCursor) prevCursor.classList.remove('tw-cursor');
        el.classList.add('tw-cursor'); prevCursor = el;
        nextAt += delayAfter(ch);
        i++;
      }
      if(i < chars.length){ requestAnimationFrame(frame); }
      else {
        h1.classList.add('tw-done');
        // סיום ההקלדה → חשיפת שאר תוכן ההירו (כותרת המשנה ואז השאר). רק בהירו של הבית.
        const heroMain = h1.closest('.hero-main');
        if(heroMain){ heroMain.classList.add('intro-go');
          const hdrEl = document.querySelector('.site-header'); if(hdrEl) hdrEl.classList.add('intro-in'); }
        setTimeout(()=>{ if(prevCursor) prevCursor.classList.remove('tw-cursor'); }, 1400);
      }
    }
    requestAnimationFrame(frame);
  }
  // מפעיל את הכותרת בעמוד הפעיל (פעם אחת לכל כותרת)
  function activate(){
    const h1 = document.querySelector('.page.active h1[data-typewriter]');
    if(h1) run(h1);
  }
  return { activate };
})();

// ----- ניסוי עיצובי: סקשן Treemap — עוצמת הצבע של כל אריח גדלה ככל שהוא קרוב יותר לעכבר -----
const treemapHero = (function(){
  let host, canvas, ctx, ink={r:14,g:19,b:48}, bg={r:236,g:237,b:249}, zone=null;
  let W=0, H=0, dpr=1, rects=[], inited=false, raf=0, primed=false;
  let mx=0, my=0, cx=0, cy=0, strength=0, targetStrength=0;
  const BASE=0.05;                                    // עוצמה מינימלית (רחוק מהעכבר / אין עכבר)
  const INF_R=360;                                    // רדיוס השפעה: ככל שקרוב יותר — חזק יותר
  const POW=2.0;                                       // עקומת הדעיכה
  const GAP=2;                                         // מרווח בין האריחים
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rootVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function hex2rgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
    return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) }; }
  function mix(a,b,t){ return { r:Math.round(a.r+(b.r-a.r)*t), g:Math.round(a.g+(b.g-a.g)*t), b:Math.round(a.b+(b.b-a.b)*t) }; }
  function rgb(c){ return 'rgb('+c.r+','+c.g+','+c.b+')'; }

  // --- Squarified Treemap (Bruls, Huizing & van Wijk) ---
  function worst(row, side){
    if(!row.length) return Infinity;
    let sum=0,max=-Infinity,min=Infinity;
    for(const a of row){ sum+=a; if(a>max)max=a; if(a<min)min=a; }
    const s2=sum*sum, w2=side*side;
    return Math.max(w2*max/s2, s2/(w2*min));
  }
  function layoutRow(row, rect, out){
    const sum=row.reduce((a,b)=>a+b,0), thick=sum/Math.min(rect.w,rect.h);
    if(rect.w>=rect.h){ let yy=rect.y; for(const a of row){ const hh=a/thick; out.push({x:rect.x,y:yy,w:thick,h:hh}); yy+=hh; }
      return {x:rect.x+thick,y:rect.y,w:rect.w-thick,h:rect.h}; }
    let xx=rect.x; for(const a of row){ const ww=a/thick; out.push({x:xx,y:rect.y,w:ww,h:thick}); xx+=ww; }
    return {x:rect.x,y:rect.y+thick,w:rect.w,h:rect.h-thick};
  }
  function squarify(areas, start){
    const out=[]; let rect={x:start.x,y:start.y,w:start.w,h:start.h}, row=[], i=0;
    while(i<areas.length){
      const side=Math.min(rect.w,rect.h), c=areas[i];
      if(!row.length || worst(row,side) >= worst(row.concat(c),side)){ row.push(c); i++; }
      else { rect=layoutRow(row,rect,out); row=[]; }
    }
    if(row.length) layoutRow(row,rect,out);
    return out;
  }
  // חלוקה רנדומלית של השטח ל"סקטורים" (BSP) — נותן מראה מעורבב/טטריסי, לא מדורג
  function splitRegions(rect){
    const out=[];
    (function rec(r, depth){
      if(depth<=0 || r.w<150 || r.h<130 || Math.random()<0.16){ out.push(r); return; }
      const horiz = r.w*0.78 > r.h ? true : (r.h*0.78 > r.w ? false : Math.random()<0.5);
      const ratio = 0.34 + Math.random()*0.32;          // 0.34..0.66
      if(horiz){ const wl=Math.round(r.w*ratio);
        rec({x:r.x,y:r.y,w:wl,h:r.h}, depth-1); rec({x:r.x+wl,y:r.y,w:r.w-wl,h:r.h}, depth-1); }
      else { const ht=Math.round(r.h*ratio);
        rec({x:r.x,y:r.y,w:r.w,h:ht}, depth-1); rec({x:r.x,y:r.y+ht,w:r.w,h:r.h-ht}, depth-1); }
    })(rect, 4);
    return out;
  }

  function buildLayout(){
    const pos=hex2rgb(rootVar('--positive')||'#12a594');
    const neg=hex2rgb(rootVar('--danger')||'#e0564a');
    const white={r:255,g:255,b:255};                    // בסיס בהיר — אריחים פסטליים מהסכמה
    const L='ABCDEFGHIJKLMNOPRSTUVZ';
    rects=[];
    // לכל סקטור: כמה אריחים בגדלים מוטים, מסודרים squarify בתוך הסקטור בלבד
    for(const reg of splitRegions({x:0,y:0,w:W,h:H})){
      const area=reg.w*reg.h, n=Math.max(3, Math.min(24, Math.round(area/3400)));
      const raw=[]; let tot=0;
      for(let k=0;k<n;k++){ const v=Math.pow(Math.random(),2.0)*60+6; raw.push(v); tot+=v; }
      raw.sort((a,b)=>b-a);
      const sc=area/tot;
      for(const c of squarify(raw.map(v=>v*sc), reg)){
        const up=Math.random()<0.52, m=Math.random();    // כיוון + עוצמת שינוי
        const f=0.16+m*0.50;                             // מיזוג אל לבן — עז יותר ככל שהשינוי גדול
        const fill=mix(white, up?pos:neg, f);
        const stroke=mix(white, up?pos:neg, Math.min(1,f+0.30)); // מסגרת באותו גוון, מעט חזק יותר
        const pct=((up?1:-1)*(0.05+m*3.4)).toFixed(2);
        let tk=''; for(let j=0;j<3;j++) tk+=L[(Math.random()*L.length)|0];
        rects.push({x:c.x,y:c.y,w:c.w,h:c.h, mcx:c.x+c.w/2, mcy:c.y+c.h/2, fillS:rgb(fill), strokeS:rgb(stroke), up, tk, pct});
      }
    }
    ink=hex2rgb(rootVar('--ink')||'#0e1330');
    bg=hex2rgb(rootVar('--bg-alt')||'#ecedf9');
  }

  // תיבת אזור הטקסט (כותרת+כותרת משנה+דיסקליימר) ביחס לקנבס — לבריכת האור שמאחוריו
  function textZone(){
    if(!host) return null;
    const hr=host.getBoundingClientRect();
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    host.querySelectorAll('.section-head, .treemap-note').forEach(el=>{
      const r=el.getBoundingClientRect();
      x0=Math.min(x0,r.left-hr.left); y0=Math.min(y0,r.top-hr.top);
      x1=Math.max(x1,r.right-hr.left); y1=Math.max(y1,r.bottom-hr.top);
    });
    return x0===Infinity ? null : {x:x0,y:y0,w:x1-x0,h:y1-y0};
  }

  function render(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    const g=GAP, live=strength>0.001, ik=ink.r+','+ink.g+','+ink.b;
    for(const r of rects){
      const x=r.x+g, y=r.y+g, w=r.w-g*2, h=r.h-g*2;
      if(w<=0||h<=0) continue;
      // עוצמה לפי קרבה לעכבר: רחוק/ללא עכבר → BASE, צמוד לעכבר → 1
      let infl=0;
      if(live){ const t=1-Math.hypot(r.mcx-cx, r.mcy-cy)/INF_R; if(t>0) infl=Math.pow(t,POW)*strength; }
      ctx.globalAlpha=BASE+(1-BASE)*infl;
      ctx.fillStyle=r.fillS; ctx.fillRect(x,y,w,h);                 // ריבוע חד
      ctx.lineWidth=1.5; ctx.strokeStyle=r.strokeS;                 // מסגרת באותו גוון, חזק מעט
      ctx.strokeRect(x+0.75, y+0.75, w-1.5, h-1.5);
      if(w>62 && h>42){                                            // תוויות רק על אריחים גדולים
        const fs=Math.max(11, Math.min(17, w*0.15));
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='rgba('+ik+',.8)';
        ctx.font='600 '+fs+'px "IBM Plex Sans Hebrew", system-ui, sans-serif';
        ctx.fillText(r.tk, x+w/2, y+h/2 - fs*0.42);
        ctx.fillStyle='rgba('+ik+',.6)';
        ctx.font='500 '+(fs*0.8)+'px "IBM Plex Sans Hebrew", system-ui, sans-serif';
        ctx.fillText((r.up?'+':'')+r.pct+'%', x+w/2, y+h/2 + fs*0.58);
      }
    }
    // אפקט קריאוּת: בריכת אור רכה (צבע הרקע) מאחורי הטקסט, מתחזקת בריחוף — שומרת על ניגודיות
    if(zone && strength>0.001){
      const pad=Math.max(26, zone.h*0.5);
      ctx.save();
      ctx.globalAlpha=Math.min(0.96, strength*0.96);
      ctx.filter='blur(28px)';
      ctx.fillStyle='rgb('+bg.r+','+bg.g+','+bg.b+')';
      ctx.fillRect(zone.x-pad, zone.y-pad*0.7, zone.w+pad*2, zone.h+pad*1.4);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }

  function tick(){
    raf=0;
    const ep = reduce?1:0.075;                           // איחור/החלקה בעקיבה אחר העכבר
    cx+=(mx-cx)*ep; cy+=(my-cy)*ep;
    strength += (targetStrength-strength)*(reduce?1:0.1);
    render();
    if(Math.abs(mx-cx)>.4 || Math.abs(my-cy)>.4 || Math.abs(targetStrength-strength)>.005) raf=requestAnimationFrame(tick);
  }
  function kick(){ if(!raf) raf=requestAnimationFrame(tick); }

  function onMove(e){
    const r=host.getBoundingClientRect();
    mx=e.clientX-r.left; my=e.clientY-r.top;
    if(!primed){ cx=mx; cy=my; primed=true; }            // ללא "טיסה" מהפינה בכניסה הראשונה
    targetStrength=1; kick();
  }
  function onLeave(){ targetStrength=0; kick(); }         // יצא מהסקשן → אין עכבר, חזרה ל-BASE

  function resize(){
    const r=host.getBoundingClientRect();
    if(r.width<2 || r.height<2) return;                  // עדיין לא נראה (display:none)
    dpr=Math.min(window.devicePixelRatio||1, 2);
    W=Math.round(r.width); H=Math.round(r.height);
    canvas.width=W*dpr; canvas.height=H*dpr;
    buildLayout(); zone=textZone(); render();
  }

  function ensure(){
    host=document.querySelector('[data-treemap-lab]');
    if(!host) return;
    canvas=host.querySelector('.treemap-bg'); if(!canvas) return;
    if(!inited){
      ctx=canvas.getContext('2d');
      host.addEventListener('pointermove', onMove, {passive:true});
      host.addEventListener('pointerleave', onLeave, {passive:true});
      window.addEventListener('resize', ()=>requestAnimationFrame(resize), {passive:true});
      inited=true;
    }
    requestAnimationFrame(()=>{ resize(); host.classList.add('treemap-ready'); });
  }
  return { ensure };
})();

// ----- ויזואליזציה: "שני תיקים, 15 שנה" — שני גרפים מצוירים בזמן אמת על גריד נייר‑מילימטר -----
// תיק מלווה (ירוק) צומח במתינות ובעקביות ומנצח; תיק פזיז (אדום) מזנק וצונח עם תוחלת שלילית.
const growthRace = (function(){
  let host, chart, canvas, ctx, inited=false, played=false;
  let W=0, H=0, dpr=1, raf=0, t0=0, curP=0;
  let endCalm, endWild;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N=170, DUR=21000;                              // נקודות לכל סדרה · משך הציור איטי מאוד (ms)
  const PIN_WIN=0.085;                                 // משך הופעת כל תגית (ביחס להתקדמות) — מופיעה ונעלמת
  const PAD={ t:0.12, b:0.18, l:0.06, r:0.10 };        // שוליים יחסיים (b — תוויות שנים; l — תוויות שווי; r מותאם בריסייז)
  let baseYear=2011;                                   // שנת הבסיס (ציר X) — מחושב מהשנה הנוכחית בריסייז
  let calm=[], wild=[];                                // ערכי y מנורמלים 0..1 (0=תחתית, 1=ראש)

  // נקודות ציון הומוריסטיות — מופיעות כשראש הקו חולף על‑פניהן (t=מיקום יחסי בציר הזמן)
  // נקודות ציון היסטוריות — אירוע שוק לכל שנה (yr = היסט משנת הבסיס). מעוגנות על הקו הפזיז (התגובתי).
  const PINS=[
    { yr:0,  dir:'down', txt:'משבר החוב באירופה' },
    { yr:1,  dir:'up',   txt:'התאוששות הדרגתית',  sm:'hide' },
    { yr:2,  dir:'up',   txt:'ראלי בשווקים' },
    { yr:3,  dir:'down', txt:'נפט צונח',           sm:'hide' },
    { yr:4,  dir:'down', txt:'מפולת בסין' },
    { yr:5,  dir:'up',   txt:'ברקזיט ובחירות בארה״ב', sm:'hide' },
    { yr:6,  dir:'up',   txt:'שנת רגיעה' },
    { yr:7,  dir:'down', txt:'תיקון חד בשווקים' },
    { yr:8,  dir:'up',   txt:'ריבית יורדת',        sm:'hide' },
    { yr:9,  dir:'down', txt:'מגפת הקורונה' },
    { yr:10, dir:'up',   txt:'טירוף מניות הממים' },
    { yr:11, dir:'down', txt:'אינפלציה וריבית עולה' },
    { yr:12, dir:'up',   txt:'ראלי ה‑AI' },
    { yr:13, dir:'up',   txt:'שיאים חדשים',        sm:'hide' },
    { yr:14, dir:'down', txt:'ריבית מתמתנת' },
  ].map(o=>({ ...o, t:o.yr/15 }));

  function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0;
    let t=Math.imul(seed^seed>>>15, 1|seed); t=t+Math.imul(t^t>>>7, 61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296; }; }
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function gauss(t,c,w){ const d=(t-c)/w; return Math.exp(-d*d); }
  function hex2rgb(h){ h=(h||'').replace('#',''); if(h.length===3) h=h.replace(/./g,'$&$&');
    const n=parseInt(h||'000000',16); return {r:(n>>16)&255, g:(n>>8)&255, b:n&255}; }
  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function buildSeries(){
    calm=[]; wild=[]; const rc=rng(7), rw=rng(91);
    const Y=yr=>yr/15;                 // עזר: מיקום שנה בציר הזמן
    // יחידות הציר: y מנורמל ×1000 = אלפי ₪ (0.20=₪200K נקודת הפתיחה המשותפת)
    // שני התיקים עוברים את אותם אירועי שוק — המלווה סופג ומחלים, הפזיז מגיב בחדות ובתזמון גרוע.
    // תיק מלווה: צמיחה עקבית מ‑₪200K ל‑₪800K, עם תיקוני שוק מתונים סביב אירועים
    for(let i=0;i<=N;i++){ const t=i/N;
      let y = 0.20 + 0.60*Math.pow(t,0.95);
      y -= 0.030*gauss(t,Y(4),0.035);   // 2015 — תיקון קל
      y -= 0.055*gauss(t,Y(9),0.030);   // 2020 — קורונה, ירידה זמנית
      y -= 0.045*gauss(t,Y(11),0.040);  // 2022 — שוק דובי מתון
      y += (rc()-0.5)*0.015;            // רעש עדין
      calm.push(clamp(y,0.10,0.94));
    }
    // תיק פזיז: תנודתי הרבה יותר ומגיב בתזמון גרוע — מוכר בפאניקה, קונה בשיא; נשחק בעמלות
    let walk=0;
    for(let i=0;i<=N;i++){ const t=i/N;
      let y = 0.215 - 0.02*t;            // מגמה כמעט-שטוחה, נסחפת מעט מטה (עמלות)
      walk += (rw()-0.5)*0.06; walk*=0.88;  // הילוך אקראי תנודתי אך לא קיצוני
      y += walk;
      y -= 0.10*gauss(t,Y(0),0.030);     // 2011 — פאניקה
      y += 0.07*gauss(t,Y(2),0.030);     // 2013 — רודף את הראלי
      y -= 0.11*gauss(t,Y(4),0.032);     // 2015 — מוכר בתחתית
      y += 0.08*gauss(t,Y(6),0.028);     // 2017 — FOMO
      y -= 0.10*gauss(t,Y(7),0.028);     // 2018 — נבהל בתיקון
      y += 0.09*gauss(t,Y(8.6),0.026);   // 2019 — חוזר פנימה בשיא
      y -= 0.13*gauss(t,Y(9),0.026);     // 2020 — מוכר בקריסה
      y += 0.12*gauss(t,Y(10),0.028);    // 2021 — ראלי ממים, מצליח בגדול לרגע
      y -= 0.13*gauss(t,Y(11),0.034);    // 2022 — הפסד כבד
      y += 0.05*gauss(t,Y(13),0.030);    // 2024 — מנסה שוב
      y += (rw()-0.5)*0.012;             // רעש קל נוסף
      wild.push(clamp(y,0.06,0.95));
    }
    calm[0]=0.20; wild[0]=0.20;          // אותה נקודת פתיחה — ₪200K
    calm[N]=0.80;                        // סיום: ₪800K (פי 4)
    wild[N]=0.18;                        // סיום: ₪180K — הרבה תנועה, ובסוף מתחת לנקודת ההתחלה
  }

  function px(t){ return (PAD.l + t*(1-PAD.l-PAD.r))*W; }
  function py(y){ return (PAD.t + (1-y)*(1-PAD.t-PAD.b))*H; }
  function valAt(arr,t){ const f=clamp(t,0,1)*N, k=Math.floor(f), fr=f-k;
    return k>=N ? arr[N] : arr[k]+(arr[k+1]-arr[k])*fr; }

  function pathPoints(series, upto){
    const k=Math.floor(upto), fr=upto-k, pts=[];
    for(let i=0;i<=Math.min(k,N);i++) pts.push([px(i/N), py(series[i])]);
    if(k<N && fr>0){ const y=series[k]+(series[k+1]-series[k])*fr; pts.push([px((k+fr)/N), py(y)]); }
    return pts;
  }

  function drawSeries(pts, hex, isCalm){
    if(pts.length<2) return;
    const c=hex2rgb(hex), baseY=(1-PAD.b)*H;
    ctx.beginPath(); ctx.moveTo(pts[0][0], baseY);
    for(const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(pts[pts.length-1][0], baseY); ctx.closePath();
    const grd=ctx.createLinearGradient(0, PAD.t*H, 0, baseY);
    grd.addColorStop(0, 'rgba('+c.r+','+c.g+','+c.b+','+(isCalm?0.20:0.13)+')');
    grd.addColorStop(1, 'rgba('+c.r+','+c.g+','+c.b+',0)');
    ctx.fillStyle=grd; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth=isCalm?3:2.4; ctx.strokeStyle=hex; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.stroke();
    const tip=pts[pts.length-1];
    ctx.save(); ctx.shadowColor='rgba('+c.r+','+c.g+','+c.b+',.55)'; ctx.shadowBlur=12;
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(tip[0],tip[1], isCalm?5.5:4.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle=hex; ctx.beginPath(); ctx.arc(tip[0],tip[1], isCalm?3.4:2.8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawGrid(){
    const yt=PAD.t*H, yb=(1-PAD.b)*H, x0=px(0), x1=px(1), sm=W<560;
    // ציר Y — קווי שווי אופקיים + תוויות בשקלים (₪200K..₪800K)
    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.font='600 '+(sm?9:10.5)+'px "IBM Plex Sans Hebrew", system-ui, sans-serif';
    [200,400,600,800].forEach(k=>{
      const y=py(k/1000);
      ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y);
      ctx.lineWidth=1; ctx.strokeStyle='rgba(67,67,219,.07)'; ctx.stroke();
      ctx.fillStyle='rgba(90,95,122,.92)'; ctx.fillText('₪'+k+'K', x0-7, y);
    });
    for(let yr=0;yr<=15;yr++){                          // קווי שנים אנכיים
      const x=px(yr/15);
      ctx.beginPath(); ctx.moveTo(x,yt); ctx.lineTo(x,yb);
      ctx.lineWidth=1; ctx.strokeStyle='rgba(67,67,219,'+(yr%5===0?0.15:0.055)+')'; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x0,yb); ctx.lineTo(x1,yb); // קו בסיס (ציר X)
    ctx.lineWidth=1.5; ctx.strokeStyle='rgba(14,19,48,.2)'; ctx.stroke();
    // ציר X — תוויות שנים בפורמט מלא (2011, 2012…)
    ctx.fillStyle='rgba(90,95,122,.92)'; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.font='600 '+(sm?9:10.5)+'px "IBM Plex Sans Hebrew", system-ui, sans-serif';
    for(let yr=0;yr<=15;yr+=(sm?3:1)) ctx.fillText(String(baseYear+yr), px(yr/15), yb+8);
  }

  function draw(p){
    curP=p;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    drawGrid();
    const upto=p*N;
    const calmHex=cssVar('--positive')||'#12a594', wildHex=cssVar('--danger')||'#e0564a';
    drawSeries(pathPoints(wild,upto), wildHex, false);   // פזיז מאחור
    drawSeries(pathPoints(calm,upto), calmHex, true);    // מלווה מקדימה (הגיבור)
    // תגיות מופיעות כשראש הקו חולף עליהן, נשארות ~PIN_WIN ואז נעלמות — סיום נקי ללא תגיות
    PINS.forEach(o=>{ if(o.el) o.el.classList.toggle('show', p>=o.t && p<o.t+PIN_WIN && p<0.985); });
    const done = p>=0.995;
    if(endCalm) endCalm.classList.toggle('show', done);
    if(endWild) endWild.classList.toggle('show', done);
  }

  function place(){
    if(!W||!H) return;
    PINS.forEach(o=>{ if(!o.el) return;
      o.el.style.left=(px(o.t)/W*100)+'%';
      const topPct=py(valAt(wild, o.t))/H*100;   // מעוגן על הקו הפזיז (התגובתי)
      o.el.style.top='calc('+topPct+'% '+(o.dir==='down'?'+ 26px':'- 26px')+')';
    });
    if(endCalm) endCalm.style.top=(py(calm[N])/H*100)+'%';
    if(endWild) endWild.style.top=(py(wild[N])/H*100)+'%';
  }

  function createPins(){
    const frag=document.createDocumentFragment();
    PINS.forEach(o=>{
      const el=document.createElement('div');
      el.className='growth-pin'+(o.dir==='down'?' below':'');
      if(o.sm) el.dataset.sm=o.sm;
      el.setAttribute('aria-hidden','true');
      el.innerHTML='<span class="yr">'+(baseYear+o.yr)+'</span><span>'+o.txt+'</span>';
      o.el=el; frag.appendChild(el);
    });
    endCalm=document.createElement('div'); endCalm.className='growth-end calm'; endCalm.setAttribute('aria-hidden','true');
    endCalm.innerHTML='<span class="v">₪800K</span><span class="t">פי 4 מההתחלה</span>';
    endWild=document.createElement('div'); endWild.className='growth-end wild'; endWild.setAttribute('aria-hidden','true');
    endWild.innerHTML='<span class="v">₪180K</span><span class="t">−10% אחרי עמלות</span>';
    frag.appendChild(endCalm); frag.appendChild(endWild);
    chart.appendChild(frag);
  }

  function frame(ts){
    if(!t0) t0=ts;
    const p = reduce ? 1 : Math.min(1, (ts-t0)/DUR);
    draw(p);
    if(p<1) raf=requestAnimationFrame(frame); else raf=0;
  }
  function play(){ if(played) return; played=true; t0=0; raf=requestAnimationFrame(frame); }

  function resize(){
    const r=chart.getBoundingClientRect();
    if(r.width<2 || r.height<2) return;                  // עדיין לא נראה (display:none)
    dpr=Math.min(window.devicePixelRatio||1, 2);
    W=Math.round(r.width); H=Math.round(r.height);
    PAD.r = W<560 ? 0.17 : 0.10;                         // מקום לתגי הסיום — רחב יותר במובייל
    PAD.l = W<560 ? 0.15 : 0.07;                         // מקום לתוויות השווי (ציר Y)
    canvas.width=W*dpr; canvas.height=H*dpr;
    place(); draw(played?curP:0);
  }

  function ensure(){
    host=document.querySelector('[data-growth-race]'); if(!host) return;
    chart=host.querySelector('[data-race-chart]'); canvas=chart&&chart.querySelector('canvas'); if(!canvas) return;
    if(!inited){
      ctx=canvas.getContext('2d');
      try{ baseYear=new Date().getFullYear()-15; }catch(e){}  // 15 השנים האחרונות עד היום
      buildSeries(); createPins();
      window.addEventListener('resize', ()=>requestAnimationFrame(resize), {passive:true});
      const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ play(); io.disconnect(); } }), {threshold:0.35});
      io.observe(chart);
      inited=true;
    }
    requestAnimationFrame(resize);
  }
  return { ensure };
})();

function init(){
  wireContacts();
  renderTestiWall();
  renderTicker();
  route();
  // רשת ביטחון בלתי-תלויה ב-typewriter: אם תוך 6 שניות תוכן הבית עדיין מוסתר — לחשוף בכל מקרה
  setTimeout(()=>{
    const hm = document.querySelector('.page[data-page="/"] .hero-main');
    if(hm && !hm.classList.contains('intro-go')){
      hm.classList.add('intro-portrait-go','intro-go');
      const h = document.querySelector('.site-header'); if(h) h.classList.add('intro-in');
    }
  }, 6000);
  const hdr = document.querySelector('.site-header:not(.sticky-header)');
  const stickyHdr = document.querySelector('.site-header.sticky-header');
  if(hdr){
    // ההידר העליון נגלל מעלה עם התוכן (absolute). ההידר הסטיקי מחליק פנימה רק כשההירו יצא מהפריים.
    const syncHeader=()=>{
      const page = document.querySelector('.page.active');
      const hero = page && page.querySelector('.hero-main, .hero-page');
      const out = hero ? (hero.getBoundingClientRect().bottom <= 0) : true;   // ההירו יצא מהפריים
      hdr.classList.toggle('over-light', !out && hero && hero.classList.contains('light'));
      if(stickyHdr){
        stickyHdr.classList.toggle('show', out);
        stickyHdr.setAttribute('aria-hidden', String(!out));
        stickyHdr.inert = !out;   // כשמוסתר — מחוץ ל-tab order וגם לעץ הנגישות (מונע focus על קישורים נסתרים)
      }
    };
    window.syncHeader = syncHeader;
    syncHeader();
    window.addEventListener('scroll', syncHeader, {passive:true});
    window.addEventListener('resize', syncHeader, {passive:true});
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
