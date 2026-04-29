import { blob } from "https://esm.town/v/std/blob";

const MESSAGES_KEY = "async_chat_messages";
const USERS_KEY = "async_chat_users";
const THEME_KEY = "async_chat_theme";

function getPassword(): string {
  return Deno.env.get("CHAT_PASSWORD") || "changeme";
}

function isAuthed(req: Request): boolean {
  const auth = req.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() === getPassword();
  }
  return false;
}

export default async function(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Auth endpoint — no auth check needed
  if (url.pathname === "/api/auth" && req.method === "POST") {
    const body = await req.json();
    if (body.password === getPassword()) {
      return Response.json({ ok: true, token: getPassword() });
    }
    return Response.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }

  // All other API routes require auth via Authorization header
  if (url.pathname.startsWith("/api/")) {
    if (!isAuthed(req)) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (url.pathname === "/api/messages" && req.method === "GET") {
      return Response.json((await blob.getJSON(MESSAGES_KEY).catch(() => null)) ?? []);
    }
    if (url.pathname === "/api/messages" && req.method === "POST") {
      const msg = await req.json();
      const existing = ((await blob.getJSON(MESSAGES_KEY).catch(() => null)) ?? []) as any[];
      existing.push(msg);
      await blob.setJSON(MESSAGES_KEY, existing.slice(-500));
      return Response.json({ ok: true });
    }
    if (url.pathname === "/api/messages" && req.method === "DELETE") {
      await blob.setJSON(MESSAGES_KEY, []);
      return Response.json({ ok: true });
    }
    if (url.pathname === "/api/reset" && req.method === "DELETE") {
      await blob.setJSON(MESSAGES_KEY, []);
      await blob.setJSON(USERS_KEY, {});
      await blob.setJSON(THEME_KEY, { name: "Parchment" });
      return Response.json({ ok: true });
    }
    if (url.pathname === "/api/users" && req.method === "GET") {
      return Response.json((await blob.getJSON(USERS_KEY).catch(() => null)) ?? {});
    }
    if (url.pathname === "/api/users" && req.method === "POST") {
      await blob.setJSON(USERS_KEY, await req.json());
      return Response.json({ ok: true });
    }
    if (url.pathname === "/api/theme" && req.method === "GET") {
      return Response.json((await blob.getJSON(THEME_KEY).catch(() => null)) ?? { name: "Parchment" });
    }
    if (url.pathname === "/api/theme" && req.method === "POST") {
      await blob.setJSON(THEME_KEY, await req.json());
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Always serve the page — auth is handled client-side
  return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>async</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',-apple-system,sans-serif;overflow:hidden}
input,button{font-family:inherit}
button{cursor:pointer}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{border-radius:10px}
::-webkit-scrollbar-track{background:transparent}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
</style>
</head>
<body>
<div id="app"></div>
<script>
const BCOLS=[
  {n:"Walnut",h:"#6B4226"},{n:"Violet",h:"#7C3AED"},{n:"Slate",h:"#475569"},
  {n:"Forest",h:"#2D5A3D"},{n:"Wine",h:"#881337"},{n:"Ocean",h:"#0E7490"},
  {n:"Ember",h:"#C2410C"},{n:"Plum",h:"#9333EA"},{n:"Moss",h:"#4D7C0F"},
  {n:"Storm",h:"#1E40AF"},{n:"Clay",h:"#A16207"},{n:"Ink",h:"#1E1B4B"}
];
const THEMES=[
  {name:"Parchment",bg:"#FAFAF8",text:"#1A1A18",muted:"#8A8780",faint:"#B0ADA8",border:"#E8E5E0",surface:"#FFFFFF",mode:"light"},
  {name:"Cream",bg:"#FDF6EC",text:"#3D2E1C",muted:"#9C8B74",faint:"#C4B59E",border:"#E8DCC8",surface:"#FFFCF5",mode:"light"},
  {name:"Blush",bg:"#FDF2F4",text:"#3D1C2E",muted:"#9C7484",faint:"#C49EAE",border:"#E8C8D4",surface:"#FFFAFC",mode:"light"},
  {name:"Mist",bg:"#F0F4F8",text:"#1A2A3A",muted:"#6B7F93",faint:"#A0B0BF",border:"#D0DAE4",surface:"#F8FAFC",mode:"light"},
  {name:"Sage",bg:"#F2F5F0",text:"#1C2E1A",muted:"#6E8268",faint:"#A3B39E",border:"#CDD8C8",surface:"#F9FBF8",mode:"light"},
  {name:"Lavender",bg:"#F4F2FA",text:"#2A1C3D",muted:"#7F6B93",faint:"#B0A0BF",border:"#DAD0E8",surface:"#FAF8FF",mode:"light"},
  {name:"Midnight",bg:"#0F1117",text:"#E2E0DC",muted:"#8B8A86",faint:"#55544F",border:"#2A2C32",surface:"#1A1C22",mode:"dark"},
  {name:"Charcoal",bg:"#1C1C1E",text:"#E5E5E7",muted:"#8E8E93",faint:"#48484A",border:"#38383A",surface:"#2C2C2E",mode:"dark"},
  {name:"Deep Ocean",bg:"#0B1628",text:"#D0DEF0",muted:"#6889A8",faint:"#2E4460",border:"#1E3050",surface:"#12203A",mode:"dark"},
  {name:"Espresso",bg:"#1A1210",text:"#E0D4C8",muted:"#9C8674",faint:"#4A3828",border:"#3A2818",surface:"#241A14",mode:"dark"},
  {name:"Pine",bg:"#0C1A14",text:"#C8E0D4",muted:"#6A9C80",faint:"#284A38",border:"#183A28",surface:"#142420",mode:"dark"},
  {name:"Dusk",bg:"#18121E",text:"#D8CCE4",muted:"#8A6E9C",faint:"#3E284E",border:"#30203E",surface:"#221828",mode:"dark"}
];

// Auth token stored in memory — works in iframes
let AUTH_TOKEN = null;

let S={messages:[],users:{},currentUser:null,theme:THEMES[0],input:"",openPicker:null,loading:false,screen:"password"};

function authHeaders(){
  return {"Content-Type":"application/json","Authorization":"Bearer "+AUTH_TOKEN};
}
function api(p,m="GET",b=null){
  const o={method:m,headers:authHeaders()};
  if(b)o.body=JSON.stringify(b);
  return fetch(p,o).then(r=>{if(r.status===401){AUTH_TOKEN=null;S.screen="password";render();throw new Error("auth");}return r.json();});
}
function rgba(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return"rgba("+r+","+g+","+b+","+a+")";}
function uc(n){return S.users[n]?.color||BCOLS[0].h;}
function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function timeAgo(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<1)return"just now";if(m<60)return m+"m ago";const h=Math.floor(m/60);if(h<24)return h+"h ago";return new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function dayLabel(ts){const d=new Date(ts),now=new Date();if(d.toDateString()===now.toDateString())return"Today";const y=new Date(now);y.setDate(y.getDate()-1);if(d.toDateString()===y.toDateString())return"Yesterday";return d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});}
function scrollB(){const el=document.getElementById("msgs");if(el)el.scrollTop=el.scrollHeight;}

async function loadData(){
  try{
    const[msgs,usrs,thm]=await Promise.all([api("/api/messages"),api("/api/users"),api("/api/theme")]);
    S.messages=msgs||[];S.users=usrs||{};
    const f=THEMES.find(t=>t.name===thm?.name);if(f)S.theme=f;
    S.loading=false;S.screen="login";render();scrollB();
  }catch(e){if(e.message!=="auth"){S.screen="password";render();}}
}

async function tryLogin(){
  const pw=document.getElementById("pw")?.value;
  if(!pw)return;
  try{
    const res=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});
    const data=await res.json();
    if(data.ok){
      AUTH_TOKEN=data.token;
      S.loading=true;render();
      await loadData();
    }else{
      document.getElementById("err").textContent="Wrong password";
      const row=document.getElementById("pwrow");
      if(row){row.style.animation="shake 0.4s ease-in-out";setTimeout(()=>row.style.animation="",500);}
    }
  }catch(e){document.getElementById("err").textContent="Something went wrong";}
}

document.addEventListener("click",function(e){
  const t=e.target.closest("[data-action]");
  if(!t)return;
  const a=t.dataset.action, v=t.dataset.value;
  if(a==="join")joinAs(v);
  else if(a==="join-input"){const inp=document.getElementById("nameinput");if(inp)joinAs(inp.value);}
  else if(a==="send")sendMsg();
  else if(a==="clear")clearChat();
  else if(a==="reset"){if(confirm("Reset everything? This clears all messages, users, and theme."))resetAll();}
  else if(a==="logout"){S.currentUser=null;S.openPicker=null;render();}
  else if(a==="toggle-picker"){S.openPicker=S.openPicker===v?null:v;render();}
  else if(a==="set-bubble"){changeColor(v);}
  else if(a==="set-theme"){const th=THEMES.find(x=>x.name===v);if(th)changeTheme(th);}
  else if(a==="trylogin")tryLogin();
});

async function joinAs(name){
  const n=(name||"").trim();if(!n)return;
  if(Object.keys(S.users).length>=4&&!S.users[n])return;
  S.currentUser=n;
  if(!S.users[n]){
    const taken=Object.values(S.users).map(u=>u.color);
    const pick=BCOLS.find(c=>!taken.includes(c.h))||BCOLS[0];
    S.users[n]={color:pick.h};
    await api("/api/users","POST",S.users);
  }
  render();scrollB();
}
async function sendMsg(){
  const t=S.input.trim();if(!t||!S.currentUser)return;
  const msg={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),user:S.currentUser,text:t,ts:Date.now()};
  S.messages.push(msg);S.input="";render();scrollB();
  await api("/api/messages","POST",msg);
}
async function clearChat(){S.messages=[];render();await api("/api/messages","DELETE");}
async function resetAll(){S.messages=[];S.users={};S.currentUser=null;S.theme=THEMES[0];S.openPicker=null;render();await api("/api/reset","DELETE");}
async function changeColor(hex){S.users[S.currentUser].color=hex;S.openPicker=null;render();await api("/api/users","POST",S.users);}
async function changeTheme(t){S.theme=t;S.openPicker=null;render();await api("/api/theme","POST",{name:t.name});}

function pickerBtn(color,label,which){
  const arrow=S.openPicker===which?"&#9650;":"&#9660;";
  return '<button data-action="toggle-picker" data-value="'+which+'" style="display:flex;align-items:center;gap:7px;padding:6px 12px;background:'+rgba(color,0.08)+';border:1.5px solid '+rgba(color,0.25)+';border-radius:100px;font-size:11px;color:'+color+';font-weight:500;letter-spacing:0.3px;white-space:nowrap"><span style="width:8px;height:8px;border-radius:50%;background:'+color+'"></span>'+label+' <span style="font-size:7px;opacity:0.5">'+arrow+'</span></button>';
}

function bubblePickerDropdown(current,isDark){
  let h='<div style="position:absolute;top:calc(100% + 6px);left:0;z-index:50;background:'+(isDark?"#2C2C2E":"#fff")+';border:1px solid '+(isDark?"#48484A":"#E8E5E0")+';border-radius:16px;padding:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:7px;box-shadow:0 12px 40px rgba(0,0,0,0.13);min-width:190px">';
  BCOLS.forEach(c=>{
    h+='<button data-action="set-bubble" data-value="'+c.h+'" title="'+c.n+'" style="width:34px;height:34px;border-radius:50%;border:'+(current===c.h?"2.5px solid "+c.h:"2.5px solid transparent")+';background:'+rgba(c.h,0.15)+';display:flex;align-items:center;justify-content:center"><span style="width:15px;height:15px;border-radius:50%;background:'+c.h+'"></span></button>';
  });
  return h+'</div>';
}

function themePickerDropdown(current){
  let h='<div style="position:absolute;top:calc(100% + 6px);right:0;z-index:50;background:#fff;border:1px solid #E8E5E0;border-radius:16px;padding:12px;box-shadow:0 12px 40px rgba(0,0,0,0.13);min-width:210px">';
  ["light","dark"].forEach(mode=>{
    h+='<div style="font-size:10px;color:#8A8780;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;padding-left:2px">'+(mode==="light"?"Light":"Dark")+'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:'+(mode==="light"?"10":"0")+'px">';
    THEMES.filter(o=>o.mode===mode).forEach(o=>{
      h+='<button data-action="set-theme" data-value="'+o.name+'" style="width:56px;height:38px;border-radius:8px;background:'+o.bg+';border:'+(current===o.name?"2px solid "+o.text:"1.5px solid "+o.border)+';display:flex;align-items:flex-end;justify-content:center;padding:3px"><span style="font-size:8px;color:'+o.muted+'">'+o.name+'</span></button>';
    });
    h+='</div>';
  });
  return h+'</div>';
}

function render(){
  const T=S.theme, isDark=T.mode==="dark", app=document.getElementById("app");

  // ── Password screen ──
  if(S.screen==="password"){
    app.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FAFAF8"><div style="text-align:center;padding:48px 36px;max-width:340px;width:100%"><div style="font-size:28px;color:#8A8780;margin-bottom:14px;letter-spacing:4px">&#9671;</div><h1 style="font-size:32px;font-weight:300;color:#1A1A18;margin:0;letter-spacing:6px">async</h1><p style="font-size:13px;color:#8A8780;line-height:1.7;margin:12px 0 32px">This chat is password protected.</p><div id="pwrow" style="display:flex;gap:8px"><input id="pw" type="password" placeholder="Enter password" style="flex:1;padding:12px 16px;border:1.5px solid #E8E5E0;border-radius:100px;font-size:14px;outline:none;background:#fff;color:#1A1A18;font-family:inherit"><button data-action="trylogin" style="width:44px;height:44px;border-radius:50%;border:none;background:#1A1A18;color:#FAFAF8;font-size:18px;display:flex;align-items:center;justify-content:center">&rarr;</button></div><div id="err" style="font-size:12px;color:#881337;margin-top:12px;min-height:18px"></div></div></div>';
    const pwi=document.getElementById("pw");
    if(pwi){pwi.focus();pwi.addEventListener("keydown",e=>{if(e.key==="Enter")tryLogin();});}
    return;
  }

  // ── Loading ──
  if(S.loading){
    app.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:'+T.bg+'"><div style="width:8px;height:8px;border-radius:50%;background:'+T.muted+';animation:pulse 1.2s ease-in-out infinite"></div></div>';
    return;
  }

  // ── Login (choose user) ──
  if(!S.currentUser){
    const names=Object.keys(S.users), full=names.length>=4;
    let h='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:'+T.bg+';transition:background 0.4s"><div style="text-align:center;padding:48px 36px;max-width:380px;width:100%">';
    h+='<div style="font-size:28px;color:'+T.muted+';margin-bottom:14px;letter-spacing:4px">&#9671;</div>';
    h+='<h1 style="font-size:32px;font-weight:300;color:'+T.text+';margin:0;letter-spacing:6px">async</h1>';
    h+='<p style="font-size:13px;color:'+T.muted+';line-height:1.7;margin:12px 0 28px">A quiet space for two people to talk<br>when they have time.</p>';

    h+='<div style="display:flex;justify-content:center;margin-bottom:28px;position:relative">'+pickerBtn(T.text,"Theme: "+T.name,"theme");
    if(S.openPicker==="theme")h+=themePickerDropdown(T.name);
    h+='</div>';

    if(names.length>0){
      h+='<div style="margin-bottom:24px"><span style="font-size:11px;color:'+T.muted+';text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:12px">Return as</span><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
      names.forEach(u=>{const c=uc(u);h+='<button data-action="join" data-value="'+esc(u)+'" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:transparent;border:1.5px solid '+c+';border-radius:100px;font-size:14px;color:'+c+'"><span style="width:7px;height:7px;border-radius:50%;background:'+c+'"></span>'+esc(u)+'</button>';});
      h+='</div></div>';
    }
    if(!full){
      h+='<div style="display:flex;align-items:center;gap:12px;margin:24px 0"><span style="flex:1;height:1px;background:'+T.border+'"></span><span style="font-size:11px;color:'+T.faint+';text-transform:uppercase;letter-spacing:1px;white-space:nowrap">'+(names.length>0?"or join as someone new":"enter your name")+'</span><span style="flex:1;height:1px;background:'+T.border+'"></span></div>';
      h+='<div style="display:flex;gap:8px"><input id="nameinput" placeholder="Your name" maxlength="20" style="flex:1;padding:12px 16px;border:1.5px solid '+T.border+';border-radius:100px;font-size:14px;outline:none;background:'+T.surface+';color:'+T.text+'"><button data-action="join-input" style="width:44px;height:44px;border-radius:50%;border:none;background:'+T.text+';color:'+T.bg+';font-size:18px;display:flex;align-items:center;justify-content:center">&rarr;</button></div>';
    }
    h+='</div></div>';
    app.innerHTML=h;
    const ni=document.getElementById("nameinput");
    if(ni){ni.focus();ni.addEventListener("keydown",e=>{if(e.key==="Enter")joinAs(ni.value);});}
    return;
  }

  // ── Chat ──
  const myColor=uc(S.currentUser);
  const colorName=BCOLS.find(c=>c.h===myColor)?.n||"Color";
  let lastDate=null;

  let h='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:'+T.bg+';transition:background 0.4s">';
  h+='<style>::-webkit-scrollbar-thumb{background:'+T.border+'}</style>';
  h+='<div style="width:100%;max-width:520px;height:100vh;max-height:720px;display:flex;flex-direction:column;background:'+T.bg+';border-left:1px solid '+T.border+';border-right:1px solid '+T.border+';transition:background 0.4s">';

  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid '+T.border+';background:'+T.surface+';gap:6px;flex-wrap:wrap;transition:background 0.4s">';
  h+='<div style="display:flex;align-items:center;gap:7px"><span style="font-size:14px;color:'+T.muted+'">&#9671;</span><span style="font-size:13px;font-weight:500;color:'+T.text+';letter-spacing:2px">async</span></div>';
  h+='<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">';

  h+='<div style="position:relative">'+pickerBtn(myColor,colorName,"bubble");
  if(S.openPicker==="bubble")h+=bubblePickerDropdown(myColor,isDark);
  h+='</div>';

  h+='<div style="position:relative">'+pickerBtn(T.text,T.name,"theme");
  if(S.openPicker==="theme")h+=themePickerDropdown(T.name);
  h+='</div>';

  h+='<button data-action="clear" style="background:none;border:none;color:'+T.faint+';font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:4px 5px">clear</button>';
  h+='<button data-action="reset" style="background:none;border:none;color:'+T.faint+';font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:4px 5px">reset</button>';
  h+='<button data-action="logout" style="background:none;border:1px solid '+T.border+';color:'+T.muted+';font-size:10px;border-radius:100px;padding:5px 10px;text-transform:uppercase;letter-spacing:0.5px">switch</button>';
  h+='</div></div>';

  // Messages
  h+='<div id="msgs" style="flex:1;overflow-y:auto;padding:20px 16px">';
  if(S.messages.length===0){
    h+='<div style="text-align:center;padding-top:80px"><div style="font-size:32px;color:'+T.border+';margin-bottom:16px">&#9671;</div><p style="font-size:13px;color:'+T.muted+';line-height:1.8">No messages yet.<br>Start the conversation.</p></div>';
  }
  S.messages.forEach((msg,i)=>{
    const isMe=msg.user===S.currentUser, c=uc(msg.user);
    const ds=dayLabel(msg.ts), showDate=ds!==lastDate; lastDate=ds;
    const prev=S.messages[i-1], grouped=prev&&prev.user===msg.user&&!showDate;
    if(showDate){
      h+='<div style="display:flex;align-items:center;gap:12px;margin:24px 0 16px"><span style="flex:1;height:1px;background:'+T.border+'"></span><span style="font-size:10px;color:'+T.faint+';text-transform:uppercase;letter-spacing:1.2px;white-space:nowrap">'+ds+'</span><span style="flex:1;height:1px;background:'+T.border+'"></span></div>';
    }
    const tlr=isMe?"18px":(grouped?"6px":"4px"), trr=isMe?(grouped?"6px":"4px"):"18px";
    h+='<div style="display:flex;justify-content:'+(isMe?"flex-end":"flex-start")+';padding:0 4px;margin-top:'+(grouped?"3":"14")+'px;animation:fadeIn 0.2s ease-out">';
    h+='<div style="max-width:78%;padding:10px 14px;border-radius:18px;background:'+(isMe?rgba(c,isDark?0.18:0.09):T.surface)+';border:1px solid '+(isMe?rgba(c,isDark?0.3:0.18):T.border)+';border-top-left-radius:'+tlr+';border-top-right-radius:'+trr+'">';
    if(!grouped&&!isMe)h+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;color:'+(isDark?rgba(c,0.8):c)+'">'+esc(msg.user)+'</div>';
    h+='<div style="font-size:14px;line-height:1.55;color:'+T.text+';word-break:break-word">'+esc(msg.text)+'</div>';
    h+='<div style="font-size:10px;color:'+T.faint+';margin-top:4px;text-align:right">'+timeAgo(msg.ts)+'</div>';
    h+='</div></div>';
  });
  h+='</div>';

  // Input
  h+='<div style="padding:12px 16px 16px;border-top:1px solid '+T.border+';background:'+T.surface+';transition:background 0.4s">';
  h+='<div style="display:flex;align-items:center;gap:10px;background:'+T.bg+';border:1.5px solid '+T.border+';border-radius:100px;padding:6px 6px 6px 16px;transition:background 0.4s">';
  h+='<span style="width:7px;height:7px;border-radius:50%;background:'+myColor+';flex-shrink:0"></span>';
  h+='<input id="chatinput" placeholder="Message as '+esc(S.currentUser)+'..." style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:'+T.text+'">';
  h+='<button data-action="send" style="width:32px;height:32px;border-radius:50%;border:none;background:'+myColor+';color:'+(isDark?"#0F1117":"#fff")+';font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">&uarr;</button>';
  h+='</div></div>';

  h+='</div></div>';
  app.innerHTML=h;

  const ci=document.getElementById("chatinput");
  if(ci){
    ci.value=S.input;ci.focus();
    ci.addEventListener("input",e=>{S.input=e.target.value;});
    ci.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}});
  }
}

// Start on password screen
render();
setInterval(()=>{if(AUTH_TOKEN)loadData();},5000);
</script>
</body>
</html>`;
