import{v as H,r as f,j as t,B as D,f as Y,k as U}from"./index-BZoX4k-A.js";import{u as z}from"./useQuery-BkepmJGS.js";import{T as O}from"./trash-2-RjDLJ8B_.js";import{L as X}from"./loader-circle-BtJNtW_f.js";import{S as K}from"./send-RePN3pDW.js";import{B as _,H as J}from"./hard-drive-DxVOhAST.js";import{S as Q}from"./shield-alert-4dvDpiRA.js";import{A as V}from"./activity-DE2eRS25.js";const q=[{emoji:"🎮",text:"Can I install BGMI on my phone?"},{emoji:"🐢",text:"Why is my phone slow?"},{emoji:"🗑️",text:"Which apps should I delete?"},{emoji:"🏦",text:"Is my phone safe for banking?"}],Z=new Set(["hi","hii","hey","hello","helo","sup","yo","ok","okay","k","kk","cool","nice","great","awesome","alright","sure","yep","yes","no","bye","cya","goodbye","later","thanks","thank you","thank u","ty","thx","np","good","fine","noted","got it","understood"]),ee=["how are","how r u","what are you","who are you","what is this","what can you","tell me about you","good morning","good evening","good night","good afternoon","what do you do"],R=a=>{const e=a.trim().toLowerCase();return Z.has(e)?!0:ee.some(s=>e.startsWith(s))},E=a=>{const e=a.trim().toLowerCase();return["hi","hii","hey","hello","helo","sup","yo"].includes(e)||e.startsWith("hey ")||e.startsWith("hi ")?`Hey! 👋 How can I help you with your phone today?

Try asking:
• Can I install BGMI on my phone?
• Why is my phone slow?
• Which apps should I delete?
• Is my phone safe for banking?`:e.startsWith("how are")?`All systems running! 🟢 I'm actively monitoring your device.

Ask me anything about your phone — performance, security, storage, or app installs.`:e.includes("what are you")||e.includes("who are you")||e.includes("what can you")||e.includes("what is this")?`I'm RootX-AI — your personal device intelligence assistant inside SafeOpen.

I can help you with:
• Game installation (with FPS estimates)
• Performance and lag fixes
• Battery optimization tips
• Storage cleanup advice
• Security and privacy checks

Just ask anything about your phone!`:e.startsWith("good morning")||e.startsWith("good evening")||e.startsWith("good afternoon")||e.startsWith("good night")?`${e.startsWith("good morning")?"Good morning":e.startsWith("good evening")?"Good evening":e.startsWith("good afternoon")?"Good afternoon":"Good night"}! 👋 How can I help with your phone today?`:e.includes("thank")||e==="ty"||e==="thx"?"You're welcome! 😊 Let me know if there's anything else about your phone I can help with.":["ok","okay","k","kk","cool","nice","great","awesome","alright","sure","yep","yes","noted","got it","understood"].includes(e)?"Got it! Anything else you'd like to know about your phone?":e.includes("bye")||e.includes("cya")||e.includes("later")?"Take care! Your device is in safe hands with SafeOpen. 🛡️":"I'm here to help with your phone! Ask me about performance, security, battery, storage, or app recommendations."},se=(a,e)=>{const s=a.trim().toLowerCase(),o=(e==null?void 0:e.model)||"your phone",i=(e==null?void 0:e.ramTotal)||6,y=(e==null?void 0:e.ramFree)||1.2,l=(e==null?void 0:e.storageFree)||30,x=(e==null?void 0:e.storageTotal)||128,S=(e==null?void 0:e.batteryHealth)||84,h=(e==null?void 0:e.batteryTemp)||32,k=(e==null?void 0:e.riskyApps)||4,c=(e==null?void 0:e.bgProcesses)||12,b=(e==null?void 0:e.androidVersion)||"13",j=(e==null?void 0:e.cacheSize)||"8.4",v=(e==null?void 0:e.topDrains)||"Instagram 22%, WhatsApp 18%, TikTok 14%",$=(e==null?void 0:e.dangerousPerms)||23;if(s.includes("bgmi")||s.includes("battleground")||s.includes("pubg mobile"))return`Yes! BGMI will run on your ${o}.

• RAM: ${i}GB ✓ (needs 3GB)
• Storage: ${l}GB free ✓ (needs ~2.5GB)
• Android ${b} ✓ (needs 8+)
• Expected FPS: ${i>=6?"60fps on Medium-High":"40fps on Low"}

Tip: Close ${c} background apps before gaming for best performance.`;if(s.includes("free fire")||s.includes("freefire")||s.includes("ff game"))return`Yes! Free Fire runs perfectly on ${o}.

• RAM: ${i}GB ✓ (Free Fire needs only 1GB)
• Storage: ${l}GB free ✓ (needs ~700MB)
• Expected FPS: 60fps on High settings

Free Fire is very lightweight — your phone handles it easily.`;if(s.includes("genshin")){const B=i>=4&&l>=20;return`Genshin Impact is ${B?"possible":"very demanding"} on ${o}.

• RAM: ${i}GB ${i>=4?"✓":"✗ needs 4GB"}
• Storage: ${l}GB ${l>=20?"✓":"✗ needs 20GB"}
• Expected FPS: ${i>=6?"30-40fps Medium":"20-30fps Low"}

${B?"Clear cache first, then install on Low-Medium graphics.":"Your device may struggle — consider Free Fire or BGMI instead."}`}return s.includes("call of duty")||s.includes("cod mobile")||s.includes("codm")?`Yes! COD Mobile runs well on ${o}.

• RAM: ${i}GB ✓ (needs 2GB)
• Storage: ${l}GB free ✓ (needs ~3GB)
• Expected FPS: ${i>=4?"60fps High":"40fps Medium"}

Your phone handles COD Mobile comfortably.`:s.includes("minecraft")?`Yes! Minecraft runs well on ${o}.

• RAM: ${i}GB ✓ (needs 1GB)
• Storage: ${l}GB free ✓ (needs ~200MB)
• Expected FPS: 60fps

Minecraft is very efficient — no issues expected.`:(s.includes("install")||s.includes("run")||s.includes("play"))&&(s.includes("game")||s.includes("app"))?`For most apps on ${o} (${i}GB RAM, ${l}GB free, Android ${b}):

• Light games (Free Fire, Among Us): ✓ 60fps easily
• Medium games (BGMI, COD Mobile): ✓ 60fps
• Heavy games (Genshin, Warzone): ⚠️ 30fps Low settings

Tell me the specific app name for a precise answer!`:s.includes("slow")||s.includes("lag")||s.includes("freeze")||s.includes("hang")||s.includes("stutter")?`Your ${o} is slow because of ${c} apps running in background (only ${y}GB RAM free).

• Force stop: Instagram, TikTok, Facebook
• Clear ${j}GB cache right now
• Uninstall Clean Master (flagged risky, hurting performance)

These steps will speed up your device within minutes.`:s.includes("battery")||s.includes("drain")||s.includes("charge")||s.includes("power")?`Your battery health: ${S}% — ${S>80?"good":"consider replacement"}. Temp: ${h}°C.

• Top drains: ${v}
• Fix: Restrict background for Instagram and TikTok
• Gain: +3-4 hours daily battery life

No replacement needed until health drops below 80%.`:s.includes("storage")||s.includes("space")||s.includes("full")||s.includes("memory")?`Storage: ${l}GB free of ${x}GB (${Math.round((x-l)/x*100)}% used).

• Cache: ${j}GB cleanable right now
• Duplicate files: ~2.1GB removable
• Total recoverable: ~12.3GB without deleting photos

Go to AndroidSEC → Storage to clean up.`:s.includes("safe")||s.includes("bank")||s.includes("secure")||s.includes("privacy")||s.includes("hack")||s.includes("virus")?`Security status: ${k} risky apps detected.

• Flashlight Pro: has SMS + Location (big red flag)
• Revoke SMS permission before using banking apps
• ${$} dangerous permissions across all apps
• Your network: clean

For full analysis open AndroidSEC.`:s.includes("delete")||s.includes("uninstall")||s.includes("remove")||s.includes("clean")?`Top apps to remove from ${o}:

• Flashlight Pro: Mic + Location + SMS — last used 23 days ago
• Clean Master: flagged risky, sends data externally
• Battery Doctor: 15 permissions, always running

Uninstalling these 3 frees ~465MB and removes 16 dangerous permissions.`:s.includes("permission")||s.includes("access")||s.includes("spy")||s.includes("track")?`${$} dangerous permissions across all apps.

• Flashlight Pro: Location + Mic + SMS — not needed
• TikTok: Camera + Mic + Location + Contacts
• Facebook: Mic + location when not in use

Fix: Settings → Apps → [App Name] → Permissions → Revoke.`:s.includes("hot")||s.includes("heat")||s.includes("temp")||s.includes("overheat")?`Battery temperature: ${h}°C — ${h>40?"🔴 Too hot!":h>35?"🟡 Slightly warm":"🟢 Normal"}.

• Normal range: 20-40°C
• ${h>35?"Close heavy apps and remove case to cool down":"Your device is not overheating"}
• Avoid charging while gaming
• Keep away from direct sunlight`:s.includes("update")||s.includes("upgrade")||s.includes("version")?`Your ${o} is on Android ${b}.

Check: Settings → Software Update → Download and Install.

Also update apps from Play Store — your ${k} flagged apps especially need updates or removal.`:s.includes("ram")||s.includes("cpu")||s.includes("processor")||s.includes("performance")?`${o} performance: ${i}GB RAM, ${y}GB currently free.

• ${c} apps running in background using ${(i-y).toFixed(1)}GB RAM
• Close unused apps to free memory
• Restart device weekly to clear RAM fully
• Avoid opening many apps simultaneously`:`I can help with that! Ask me more specifically:
• "Can I install [game name]?"
• "Why is my ${o} slow?"
• "How do I improve battery?"
• "Is my phone safe for banking?"

What would you like to know?`},te=(a,e)=>R(a)?E(a).split(""):se(a,e).split(""),ne=({profile:a})=>a?t.jsxs("div",{className:"flex gap-4 overflow-x-auto pb-2 scrollbar-none text-xs text-white/60 mb-4 whitespace-nowrap",children:[t.jsxs("span",{className:"flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full",children:[t.jsx(Y,{className:"w-3 h-3"})," ",a.model||"Unknown Device"]}),t.jsxs("span",{className:"flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full",children:[t.jsx(_,{className:"w-3 h-3"})," ",a.batteryPercent||0,"%"]}),t.jsxs("span",{className:"flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full",children:[t.jsx(J,{className:"w-3 h-3"})," ",a.storageFreeGB||0,"GB Free"]}),a.riskyAppsCount>0&&t.jsxs("span",{className:"flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-1 rounded-full",children:[t.jsx(Q,{className:"w-3 h-3"})," ",a.riskyAppsCount," Risky Apps"]}),t.jsxs("span",{className:"flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full",children:[t.jsx(V,{className:"w-3 h-3"})," ",Math.max(0,(a.ramTotalGB||0)-(a.ramFreeGB||0)).toFixed(1),"GB RAM Used"]})]}):null;function he(){const a=H(n=>n.user),{data:e}=z({queryKey:["deviceProfile"],queryFn:async()=>{const n=localStorage.getItem("safeopen_token");return(await U.get("http://localhost:3000/device/profile",{headers:{Authorization:`Bearer ${n}`}})).data}}),[s,o]=f.useState([]),[i,y]=f.useState(""),[l,x]=f.useState(!1),[S,h]=f.useState(!0),k=f.useRef(null),c=f.useRef(null),b=f.useRef(null);f.useEffect(()=>{if(!e||s.length>0)return;let n=`Hey! I'm RootX-AI — your personal device intelligence assistant.

I've analyzed your ${e.model||"device"}. `;const r=[];(e.storageUsedPercent||0)>=90&&r.push("Your storage is critically full."),(e.batteryHealth||100)<80&&r.push("Your battery health is degrading."),(e.riskyAppsCount||0)>0&&r.push(`I found ${e.riskyAppsCount} risky apps.`),r.length>0?n+=r.join(" ")+`

How can I help you fix these?`:n+="Everything looks healthy! Ask me anything about your phone.",o([{id:"1",role:"assistant",content:n,timestamp:new Date,isStreaming:!1}])},[e,s.length]),f.useEffect(()=>{var n;(n=k.current)==null||n.scrollIntoView({behavior:"smooth"})},[s]);const j=()=>{const n=c.current;n&&(n.style.height="auto",n.style.height=Math.min(n.scrollHeight,120)+"px")},v=async n=>{var C;const r=n.trim();if(!r||l)return;if(R(r)){const d={id:Date.now().toString(),role:"user",content:r,timestamp:new Date,isStreaming:!1},m={id:(Date.now()+1).toString(),role:"assistant",content:E(r),timestamp:new Date,isStreaming:!1};o(g=>[...g,d,m]),y(""),h(!1),c.current&&(c.current.style.height="auto");return}h(!1),y(""),c.current&&(c.current.style.height="auto");const u={id:Date.now().toString(),role:"user",content:r,timestamp:new Date};o(d=>[...d,u]),x(!0);const p=(Date.now()+1).toString();o(d=>[...d,{id:p,role:"assistant",content:"",timestamp:new Date,isStreaming:!0}]),b.current=new AbortController;try{const d=localStorage.getItem("safeopen_token"),g=await fetch("http://localhost:3000/rootx-ai/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({message:r,history:s.slice(-6).map(N=>({role:N.role,content:N.content}))}),signal:b.current.signal});if(!g.ok||!g.body)throw new Error(`HTTP ${g.status}`);const A=g.body.getReader(),F=new TextDecoder;let w="";for(;;){const{done:N,value:P}=await A.read();if(N)break;const W=F.decode(P,{stream:!0});for(const M of W.split(`
`)){if(!M.startsWith("data: "))continue;const I=M.slice(6).trim();if(I==="[DONE]")break;try{const T=((C=JSON.parse(I).delta)==null?void 0:C.text)||"";if(!T)continue;w+=T,o(L=>L.map(G=>G.id===p?{...G,content:w}:G))}catch{}}}if(!w)throw new Error("Empty response")}catch(d){if(d instanceof Error&&d.name==="AbortError")return;const m=te(r,e||{});let g="";for(let A=0;A<m.length;A++)await new Promise(F=>setTimeout(F,6)),g+=m[A],o(F=>F.map(w=>w.id===p?{...w,content:g}:w))}finally{o(d=>d.map(m=>m.id===p?{...m,isStreaming:!1}:m)),x(!1)}},$=()=>{var n;(n=b.current)==null||n.abort(),o([{id:Date.now().toString(),role:"assistant",content:"Chat cleared! Ask me anything about your phone.",timestamp:new Date,isStreaming:!1}]),h(!0),x(!1)},B=n=>n.split(`
`).map((r,u)=>{var p;return r.startsWith("• ")?t.jsxs("div",{className:"flex gap-2 my-0.5",children:[t.jsx("span",{className:"text-[#7B61FF] flex-shrink-0 mt-0.5",children:"•"}),t.jsx("span",{children:r.slice(2)})]},u):/^\d+\./.test(r)?t.jsxs("div",{className:"flex gap-2 my-0.5",children:[t.jsxs("span",{className:"text-[#7B61FF] flex-shrink-0 font-mono text-xs mt-0.5 w-4",children:[(p=r.match(/^\d+/))==null?void 0:p[0],"."]}),t.jsx("span",{children:r.replace(/^\d+\.\s*/,"")})]},u):r===""?t.jsx("div",{className:"h-2"},u):t.jsx("div",{children:r},u)});return t.jsxs("div",{className:"flex flex-col bg-[#060608]",style:{height:"calc(100vh - 0px)"},children:[t.jsxs("div",{className:"flex items-center justify-between px-5 py-3 border-b border-[#1E1E30] bg-[#0D0D14] flex-shrink-0",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"w-8 h-8 rounded-full bg-[#7B61FF] flex items-center justify-center",style:{boxShadow:"0 0 12px rgba(123,97,255,0.4)"},children:t.jsx(D,{size:16,className:"text-white"})}),t.jsxs("div",{children:[t.jsx("h1",{className:"font-orbitron text-sm font-bold text-[#F0F0FF]",children:"RootX-AI"}),t.jsx("p",{className:"font-sans text-[11px] text-[#8888AA]",children:"Your personal device intelligence"})]})]}),t.jsxs("button",{onClick:$,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-[#8888AA] border border-[#2A2A40] hover:text-[#FF3366] hover:border-[rgba(255,51,102,0.3)] transition-all duration-200",children:[t.jsx(O,{size:12}),"Clear"]})]}),t.jsx("div",{className:"flex-1 overflow-y-auto py-6 px-4 sm:px-6",children:t.jsxs("div",{className:"max-w-3xl mx-auto space-y-6",children:[t.jsx(ne,{profile:e}),s.map(n=>{var r,u;return t.jsxs("div",{className:`flex gap-3 items-start ${n.role==="user"?"flex-row-reverse":""}`,children:[t.jsx("div",{className:`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${n.role==="assistant"?"bg-[#7B61FF]":"bg-[#00F5FF]"}`,style:n.role==="assistant"?{boxShadow:"0 0 10px rgba(123,97,255,0.3)"}:void 0,children:n.role==="assistant"?t.jsx(D,{size:13,className:"text-white"}):t.jsx("span",{className:"font-orbitron text-[10px] font-bold text-[#060608]",children:((u=(r=a==null?void 0:a.email)==null?void 0:r[0])==null?void 0:u.toUpperCase())||"U"})}),t.jsxs("div",{className:`flex flex-col gap-1 max-w-[80%] ${n.role==="user"?"items-end":"items-start"}`,children:[t.jsx("p",{className:"font-mono text-[10px] font-medium px-1",style:{color:n.role==="assistant"?"#7B61FF":"#8888AA"},children:n.role==="assistant"?"RootX-AI":"You"}),t.jsxs("div",{className:`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed ${n.role==="assistant"?"bg-[#0D0D14] border border-[#2A2A40] rounded-tl-sm text-[#F0F0FF]":"bg-[rgba(0,245,255,0.06)] border border-[rgba(0,245,255,0.12)] rounded-tr-sm text-[#F0F0FF]"}`,children:[n.role==="assistant"?B(n.content):n.content,n.isStreaming&&n.content===""&&t.jsx("div",{className:"flex gap-1 py-1",children:[0,1,2].map(p=>t.jsx("div",{className:"w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce",style:{animationDelay:`${p*.15}s`}},p))}),n.isStreaming&&n.content!==""&&t.jsx("span",{className:"inline-block w-1.5 h-3.5 bg-[#7B61FF] animate-pulse ml-0.5 align-middle rounded-sm"})]}),t.jsx("p",{className:"font-mono text-[10px] text-[#44445A] px-1",children:n.timestamp.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})})]})]},n.id)}),t.jsx("div",{ref:k})]})}),S&&t.jsx("div",{className:"px-4 sm:px-6 pb-3 flex-shrink-0",children:t.jsxs("div",{className:"max-w-3xl mx-auto",children:[t.jsx("p",{className:"font-sans text-xs text-[#44445A] mb-2",children:"Suggested questions"}),t.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2",children:q.map(n=>t.jsxs("button",{onClick:()=>v(n.text),className:"text-left p-3 rounded-xl border border-[#2A2A40] bg-[#0D0D14] hover:border-[rgba(123,97,255,0.4)] hover:bg-[rgba(123,97,255,0.05)] transition-all duration-200 group",children:[t.jsx("span",{className:"text-lg block mb-1",children:n.emoji}),t.jsx("span",{className:"font-sans text-xs text-[#8888AA] group-hover:text-[#F0F0FF] leading-tight line-clamp-2 block",children:n.text})]},n.text))})]})}),t.jsx("div",{className:"px-4 sm:px-6 pb-5 pt-2 flex-shrink-0 border-t border-[#1E1E30]",children:t.jsxs("div",{className:"max-w-3xl mx-auto",children:[t.jsxs("div",{className:"flex gap-3 items-end bg-[#0D0D14] border border-[#2A2A40] rounded-2xl p-3 focus-within:border-[rgba(123,97,255,0.4)] transition-colors duration-200",children:[t.jsx("textarea",{ref:c,value:i,onChange:n=>{y(n.target.value),j()},onKeyDown:n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),v(i))},placeholder:"Ask anything about your phone...",rows:1,disabled:l,className:"flex-1 bg-transparent border-none outline-none resize-none font-sans text-sm text-[#F0F0FF] placeholder-[#44445A] leading-relaxed disabled:opacity-50",style:{maxHeight:"120px"}}),t.jsx("button",{onClick:()=>v(i),disabled:!i.trim()||l,className:"w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#7B61FF] text-white hover:bg-[#6B51EF] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",children:l?t.jsx(X,{size:14,className:"animate-spin"}):t.jsx(K,{size:14})})]}),t.jsx("p",{className:"font-sans text-[10px] text-[#44445A] text-center mt-2",children:"RootX-AI uses your device data · Press Enter to send"})]})})]})}export{he as default};
