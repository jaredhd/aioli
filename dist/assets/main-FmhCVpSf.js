import{r as o,j as e,c as Se,R as $e}from"./client-DYDkQYN6.js";const ae="http://localhost:3001/api";async function j(x,s={}){const p=`${ae}${x}`,u={headers:{"Content-Type":"application/json"},...s,body:s.body?JSON.stringify(s.body):void 0};try{const c=await(await fetch(p,u)).json();if(!c.success)throw new Error(c.error||"API request failed");return c}catch(a){throw console.error(`API Error [${x}]:`,a),a}}function Ce(){const[x,s]=o.useState(null),[p,u]=o.useState(!1),[a,c]=o.useState(null),l=o.useCallback(async m=>{u(!0),c(null);try{const f=m?`/tokens?prefix=${m}`:"/tokens",v=await j(f);return s(v.tokens),v.tokens}catch(f){return c(f.message),null}finally{u(!1)}},[]),b=o.useCallback(async m=>{try{return(await j(`/tokens/get?path=${encodeURIComponent(m)}`)).token}catch(f){return c(f.message),null}},[]),w=o.useCallback(async(m,f,v={})=>{u(!0),c(null);try{const T=await j("/tokens/set",{method:"PUT",body:{path:m,value:f,...v}});return await l(),T.token}catch(T){return c(T.message),null}finally{u(!1)}},[l]),k=o.useCallback(async()=>{try{return(await j("/tokens/validate",{method:"POST"})).validation}catch(m){return c(m.message),null}},[]),h=o.useCallback(async()=>{try{return(await j("/tokens/export/css")).css}catch(m){return c(m.message),null}},[]);return{tokens:x,loading:p,error:a,fetchTokens:l,getToken:b,updateToken:w,validateTokens:k,exportCSS:h}}function Te(){const[x,s]=o.useState(!1),[p,u]=o.useState(null),[a,c]=o.useState(null),l=o.useCallback(async(h,m={})=>{s(!0),c(null);try{const f=await j("/components/generate",{method:"POST",body:{description:h,apiKey:m.apiKey}});return u(f.component),f.component}catch(f){return c(f.message),null}finally{s(!1)}},[]),b=o.useCallback(async(h,m={})=>{s(!0),c(null);try{const f=await j("/components/generate",{method:"POST",body:{type:h,props:m}});return u(f.component),f.component}catch(f){return c(f.message),null}finally{s(!1)}},[]),w=o.useCallback(async(h,m,f={})=>{s(!0),c(null);try{const v=await j("/components/fix",{method:"POST",body:{html:h,issues:m,apiKey:f.apiKey}});return v.component&&u(T=>({...T,html:v.component.html,validation:v.component.validation,fixed:!0,issuesFixed:v.component.issuesFixed,remainingIssues:v.component.remainingIssues})),v.component}catch(v){return c(v.message),null}finally{s(!1)}},[]),k=o.useCallback(async()=>{try{return(await j("/components/templates")).templates}catch(h){return c(h.message),null}},[]);return{generating:x,lastResult:p,error:a,generateFromDescription:l,generate:b,fixComponent:w,getTemplates:k}}function Ie(){const[x,s]=o.useState(!1),[p,u]=o.useState([]),[a,c]=o.useState(null),l=o.useCallback(async(h,m,f={})=>{try{return(await j("/a11y/check-contrast",{method:"POST",body:{foreground:h,background:m,...f}})).result}catch(v){return c(v.message),null}},[]),b=o.useCallback(async h=>{var m;s(!0),c(null);try{const f=await j("/a11y/validate-html",{method:"POST",body:{html:h}});return u(((m=f.result)==null?void 0:m.issues)||[]),f.result}catch(f){return c(f.message),null}finally{s(!1)}},[]),w=o.useCallback(async()=>{s(!0),c(null);try{const h=await j("/a11y/validate-tokens",{method:"POST"});return u(h.issues||[]),h}catch(h){return c(h.message),null}finally{s(!1)}},[]),k=o.useCallback(async h=>{try{return(await j("/a11y/suggest-fixes",{method:"POST",body:{issues:h||p}})).fixes}catch(m){return c(m.message),null}},[p]);return{validating:x,issues:p,error:a,checkContrast:l,validateHTML:b,validateTokenContrast:w,suggestFixes:k}}function Re(){const[x,s]=o.useState(null),p=o.useCallback(async(c,l="desktop")=>{try{return(await j("/motion/get-duration",{method:"POST",body:{type:c,device:l}})).result}catch(b){return s(b.message),null}},[]),u=o.useCallback(async c=>{try{return(await j("/motion/get-easing",{method:"POST",body:{direction:c}})).result}catch(l){return s(l.message),null}},[]),a=o.useCallback(async c=>{try{return(await j("/motion/validate",{method:"POST",body:{css:c}})).result}catch(l){return s(l.message),null}},[]);return{error:x,getDuration:p,getEasing:u,validateMotion:a}}function ze(){const[x,s]=o.useState(!1),[p,u]=o.useState(null),[a,c]=o.useState(null),l=o.useCallback(async({code:w,html:k,css:h})=>{s(!0),c(null);try{const m=await j("/review",{method:"POST",body:{code:w,html:k,css:h}});return u(m.result),m.result}catch(m){return c(m.message),null}finally{s(!1)}},[]),b=o.useCallback(async({code:w,html:k,css:h})=>{try{return(await j("/review/quick",{method:"POST",body:{code:w,html:k,css:h}})).result}catch(m){return c(m.message),null}},[]);return{reviewing:x,reviewResult:p,error:a,review:l,quickCheck:b}}function Fe(){const[x,s]=o.useState(!1),[p,u]=o.useState(null),a=o.useCallback(async(l,b,w)=>{s(!0),u(null);try{return(await j("/orchestrator/request",{method:"POST",body:{type:l,agent:b,data:w}})).result}catch(k){return u(k.message),null}finally{s(!1)}},[]),c=o.useCallback(async({code:l,html:b,css:w})=>{s(!0),u(null);try{return(await j("/orchestrator/fix-cycle",{method:"POST",body:{code:l,html:b,css:w}})).result}catch(k){return u(k.message),null}finally{s(!1)}},[]);return{processing:x,error:p,handleRequest:a,runFixCycle:c}}function Ee(){const x=Ce(),s=Te(),p=Ie(),u=Re(),a=ze(),c=Fe(),[l,b]=o.useState(!1),[w,k]=o.useState(null);return o.useEffect(()=>{const h=async()=>{try{const v=await(await fetch(`${ae}/health`)).json();b(v.status==="ok"),k(null)}catch{b(!1),k("Cannot connect to Aioli API server")}};h();const m=setInterval(h,3e4);return()=>clearInterval(m)},[]),{connected:l,connectionError:w,tokens:x,component:s,a11y:p,motion:u,codeReview:a,orchestrator:c}}const Ae=[{name:"Inter",weights:[400,500,600,700]},{name:"Roboto",weights:[400,500,700]},{name:"Open Sans",weights:[400,600,700]},{name:"Poppins",weights:[400,500,600,700]},{name:"Montserrat",weights:[400,500,600,700]},{name:"Playfair Display",weights:[400,600,700]}],Pe=x=>{o.useEffect(()=>{if(!x)return;const s=`google-font-${x.replace(/\s+/g,"-").toLowerCase()}`;if(document.getElementById(s))return;const p=document.createElement("link");p.id=s,p.rel="stylesheet",p.href=`https://fonts.googleapis.com/css2?family=${x.replace(/\s+/g,"+")}:wght@400;500;600;700&display=swap`,document.head.appendChild(p)},[x])},We=()=>{const[x,s]=o.useState({width:window.innerWidth,height:window.innerHeight});return o.useEffect(()=>{const p=()=>s({width:window.innerWidth,height:window.innerHeight});return window.addEventListener("resize",p),()=>window.removeEventListener("resize",p)},[]),x};function Me(){var oe,re;const{width:x}=We(),s=x<768,p=x>=768&&x<1024,u=x>=1024,a=Ee(),c=()=>typeof window<"u"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":"dark",[l,b]=o.useState(c),[w,k]=o.useState("create"),[h,m]=o.useState("desktop"),[f,v]=o.useState(u),[T,ie]=o.useState(u),[R,le]=o.useState("colors"),[z,B]=o.useState(null),[U,ce]=o.useState(""),[I,de]=o.useState(localStorage.getItem("aioli_api_key")||""),[H,pe]=o.useState(!1);o.useEffect(()=>{const t=window.matchMedia("(prefers-color-scheme: dark)"),d=g=>b(g.matches?"dark":"light");return t.addEventListener("change",d),()=>t.removeEventListener("change",d)},[]);const[n,N]=o.useState({colors:{primary:"#2563eb",secondary:"#475569",success:"#16a34a",danger:"#dc2626",warning:"#d97706",background:"#ffffff",text:"#0f172a"},spacing:{xs:4,sm:8,md:16,lg:24,xl:32},typography:{fontFamily:"Inter",baseFontSize:16,headingWeight:600,bodyWeight:400},motion:{micro:100,fast:150,normal:250,slow:400},radius:{sm:4,md:8,lg:12}});o.useEffect(()=>{N(t=>({...t,colors:{...t.colors,background:l==="dark"?"#0f172a":"#ffffff",text:l==="dark"?"#f8fafc":"#0f172a"}}))},[l]);const[i,Y]=o.useState(null),[G,F]=o.useState(null),[L,J]=o.useState(!1),[Q,O]=o.useState([]),[Z,X]=o.useState([]);Pe(n.typography.fontFamily),o.useEffect(()=>{a.connected&&ue()},[a.connected]);const ue=async()=>{await a.tokens.getToken("primitive.color.blue.500")&&console.log("🎨 Loaded tokens from agent")},E=o.useCallback(async(t,d,g)=>{if(N(y=>({...y,[t]:{...y[t],[d]:g}})),a.connected){const y=xe(t,d);y&&(await a.tokens.updateToken(y,g),console.log(`✅ Synced ${y} = ${g}`))}t==="colors"&&ee(d==="primary"?g:n.colors.primary)},[a.connected,n.colors.primary]),xe=(t,d)=>{var y;return(y={colors:{primary:"semantic.color.primary",secondary:"semantic.color.secondary",success:"semantic.color.success",danger:"semantic.color.danger",warning:"semantic.color.warning",background:"semantic.surface.default",text:"semantic.text.primary"},spacing:{xs:"primitive.spacing.xs",sm:"primitive.spacing.sm",md:"primitive.spacing.md",lg:"primitive.spacing.lg",xl:"primitive.spacing.xl"},motion:{micro:"primitive.motion.duration.micro",fast:"primitive.motion.duration.fast",normal:"primitive.motion.duration.normal",slow:"primitive.motion.duration.slow"},radius:{sm:"primitive.radius.sm",md:"primitive.radius.md",lg:"primitive.radius.lg"}}[t])==null?void 0:y[d]},ee=async t=>{if(!a.connected){const g=ge(t,"#ffffff");X([{context:"Button text",foreground:"#ffffff",background:t,ratio:g,passes:g>=4.5,passesAA:g>=4.5,passesAAA:g>=7}]);return}const d=await a.a11y.checkContrast("#ffffff",t,{textType:"normalText",level:"AA"});d&&X([{context:"Button text",...d}])},ge=(t,d)=>{const g=$=>{const P=$.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);if(!P)return 0;const[ke,ve,je]=[parseInt(P[1],16),parseInt(P[2],16),parseInt(P[3],16)].map(W=>(W=W/255,W<=.03928?W/12.92:Math.pow((W+.055)/1.055,2.4)));return .2126*ke+.7152*ve+.0722*je},y=g(t),S=g(d);return((Math.max(y,S)+.05)/(Math.min(y,S)+.05)).toFixed(2)};o.useEffect(()=>{ee(n.colors.primary)},[n.colors.primary,n.colors.background]);const te=async()=>{if(!U.trim())return;if(F(null),!a.connected){F("Agent server not connected. Start the API server first.");return}I&&localStorage.setItem("aioli_api_key",I);const t=await a.component.generateFromDescription(U,{apiKey:I});if(t!=null&&t.error)F(t.message||t.aiError||"Generation failed");else if(t&&(Y(t),t.source==="template"&&F(t.note),t.html)){const d=await a.a11y.validateHTML(t.html);d!=null&&d.issues&&O(d.issues.map(g=>({type:g.severity==="error"?"error":"warning",message:g.message})))}},me=async()=>{var t,d;if(!(!(i!=null&&i.html)||!((t=i==null?void 0:i.validation)!=null&&t.issues))){J(!0),F(null);try{const g=i.validation.issues.filter(S=>S.severity==="error"),y=await a.component.fixComponent(i.html,g,{apiKey:I});y!=null&&y.success?(Y(S=>{var $;return{...S,html:y.html,validation:y.validation,passed:(($=y.validation)==null?void 0:$.passed)!==!1,fixed:!0,issuesFixed:y.issuesFixed}}),(d=y.validation)!=null&&d.issues?O(y.validation.issues.map(S=>({type:S.severity==="error"?"error":"warning",message:S.message}))):O([])):F((y==null?void 0:y.error)||"Fix failed")}catch(g){F(g.message)}finally{J(!1)}}},he=async()=>{if(!(i!=null&&i.html)||!a.connected)return;const t=await a.codeReview.review({html:i.html,css:i.css||""});t&&O([{type:t.approved?"success":"warning",message:`Score: ${t.score}/100 (${t.grade})`},...t.issues.map(d=>({type:d.severity,message:d.message}))])},fe=async()=>{if(a.connected){const t=await a.tokens.exportCSS();t&&(navigator.clipboard.writeText(t),alert("CSS copied to clipboard!"))}else{const t=V();navigator.clipboard.writeText(t),alert("CSS copied to clipboard!")}},V=()=>`:root {
  /* Colors */
  --color-primary: ${n.colors.primary};
  --color-secondary: ${n.colors.secondary};
  --color-success: ${n.colors.success};
  --color-danger: ${n.colors.danger};
  --color-warning: ${n.colors.warning};
  --color-background: ${n.colors.background};
  --color-text: ${n.colors.text};
  
  /* Typography */
  --font-family: '${n.typography.fontFamily}', sans-serif;
  --font-size-base: ${n.typography.baseFontSize}px;
  --font-weight-heading: ${n.typography.headingWeight};
  --font-weight-body: ${n.typography.bodyWeight};
  
  /* Spacing */
  --spacing-xs: ${n.spacing.xs}px;
  --spacing-sm: ${n.spacing.sm}px;
  --spacing-md: ${n.spacing.md}px;
  --spacing-lg: ${n.spacing.lg}px;
  --spacing-xl: ${n.spacing.xl}px;
  
  /* Border Radius */
  --radius-sm: ${n.radius.sm}px;
  --radius-md: ${n.radius.md}px;
  --radius-lg: ${n.radius.lg}px;
  
  /* Motion */
  --motion-micro: ${n.motion.micro}ms;
  --motion-fast: ${n.motion.fast}ms;
  --motion-normal: ${n.motion.normal}ms;
  --motion-slow: ${n.motion.slow}ms;
}`,K=t=>{if(!(i!=null&&i.html))return;const d=V(),g=i.type||"AioliComponent";if(t==="html"){const y=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g} - Aioli Component</title>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(n.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${d}

body {
  font-family: var(--font-family);
  background: var(--color-background);
  color: var(--color-text);
  padding: 2rem;
}
  </style>
</head>
<body>
${i.html}
</body>
</html>`;ne(`${g.toLowerCase()}.html`,y,"text/html")}else if(t==="react"){const y=g.replace(/[^a-zA-Z0-9]/g,"").replace(/^./,$=>$.toUpperCase()),S=`import React from 'react';

// Generated by Aioli Design System
// Tokens: ${new Date().toISOString()}

const styles = \`
${d}
\`;

export default function ${y}() {
  return (
    <>
      <style>{styles}</style>
      <div dangerouslySetInnerHTML={{ __html: \`${i.html.replace(/`/g,"\\`")}\` }} />
    </>
  );
}`;navigator.clipboard.writeText(S),alert("React component copied to clipboard!")}else if(t==="package"){const y={"index.html":`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g}</title>
  <link rel="stylesheet" href="tokens.css">
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(n.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
${i.html}
</body>
</html>`,"tokens.css":d,"component.html":i.html,"README.md":`# ${g}

Generated with Aioli Design System.

## Files
- \`index.html\` - Standalone preview
- \`tokens.css\` - Design token CSS variables
- \`component.html\` - Raw component HTML

## Usage
1. Include \`tokens.css\` in your project
2. Copy the component HTML where needed
3. Customize token values as needed
`},S=Object.entries(y).map(([$,P])=>`
${"=".repeat(60)}
// FILE: ${$}
${"=".repeat(60)}

${P}`).join(`
`);ne(`${g.toLowerCase()}-package.txt`,S,"text/plain")}},ne=(t,d,g)=>{const y=new Blob([d],{type:g}),S=URL.createObjectURL(y),$=document.createElement("a");$.href=S,$.download=t,document.body.appendChild($),$.click(),document.body.removeChild($),URL.revokeObjectURL(S)},r=l==="dark"?{bg:"#0f172a",surface:"#1e293b",surface2:"#334155",border:"#475569",text:"#f8fafc",textMuted:"#94a3b8",primary:"#3b82f6"}:{bg:"#f8fafc",surface:"#ffffff",surface2:"#f1f5f9",border:"#e2e8f0",text:"#0f172a",textMuted:"#64748b",primary:"#3b82f6"},A=`'${n.typography.fontFamily}', sans-serif`,_=o.useMemo(()=>({button:{padding:`${n.spacing.sm}px ${n.spacing.lg}px`,backgroundColor:n.colors.primary,color:"#ffffff",border:"none",borderRadius:`${n.radius.md}px`,fontSize:`${n.typography.baseFontSize}px`,fontWeight:n.typography.headingWeight,fontFamily:A,cursor:"pointer"},heading:{fontSize:`${n.typography.baseFontSize*1.5}px`,fontWeight:n.typography.headingWeight,fontFamily:A,color:n.colors.text,marginBottom:`${n.spacing.sm}px`},body:{fontSize:`${n.typography.baseFontSize}px`,fontWeight:n.typography.bodyWeight,fontFamily:A,color:n.colors.secondary}}),[n,A]),ye=()=>{s||p?B(z==="left"?null:"left"):v(!f)},be=()=>{s||p?B(z==="right"?null:"right"):ie(!T)},q=()=>B(null),se=s?"100%":p?"320px":"280px",we=o.useMemo(()=>{const t=[];return Z.forEach(d=>{t.push({type:d.passesAA?"success":"error",message:`Contrast: ${d.ratio}:1 ${d.passesAA?"(AA ✓)":"(Fail)"}`})}),Q.forEach(d=>t.push(d)),t.push({type:n.motion.fast<=200?"success":"warning",message:`Animation: ${n.motion.fast}ms`}),t},[Z,Q,n.motion.fast]),C={container:{display:"flex",flexDirection:"column",height:"100vh",background:r.bg,color:r.text,fontFamily:"'Inter', -apple-system, sans-serif",overflow:"hidden",position:"relative"},header:{display:"flex",alignItems:"center",justifyContent:"space-between",height:"56px",padding:"0 12px",background:r.surface,borderBottom:`1px solid ${r.border}`,flexShrink:0,zIndex:100},iconBtn:{width:"40px",height:"40px",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",border:"none",borderRadius:"8px",color:r.textMuted,cursor:"pointer",fontSize:"18px",flexShrink:0},sidebar:{width:se,maxWidth:"100%",background:r.surface,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0,zIndex:50},sidebarMobile:{position:"fixed",top:"56px",bottom:0,width:se,maxWidth:"100%",background:r.surface,display:"flex",flexDirection:"column",overflow:"hidden",zIndex:200,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"},overlay:{position:"fixed",top:"56px",left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:150}};return e.jsxs("div",{style:C.container,children:[e.jsxs("header",{style:C.header,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("button",{onClick:ye,style:{...C.iconBtn,background:f||z==="left"?r.surface2:"transparent"},children:"☰"}),e.jsx("span",{style:{fontSize:"24px"},children:"🧄"}),!s&&e.jsx("span",{style:{fontWeight:600},children:"Aioli Studio"}),e.jsx("div",{style:{width:"8px",height:"8px",borderRadius:"50%",background:a.connected?"#22c55e":"#ef4444",marginLeft:"8px"},title:a.connected?"Connected to agents":"Disconnected"})]}),e.jsx("nav",{style:{display:"flex",gap:"2px",background:r.surface2,padding:"3px",borderRadius:"10px"},children:[{id:"tokens",label:"Tokens",emoji:"🎨"},{id:"create",label:"Create",emoji:"✨"},{id:"export",label:"Export",emoji:"📦"}].map(t=>e.jsxs("button",{onClick:()=>k(t.id),style:{display:"flex",alignItems:"center",gap:"4px",padding:s?"8px 10px":"8px 14px",background:w===t.id?r.primary:"transparent",border:"none",borderRadius:"7px",color:w===t.id?"white":r.textMuted,fontSize:"13px",fontWeight:500,cursor:"pointer"},children:[e.jsx("span",{children:t.emoji}),!s&&e.jsx("span",{children:t.label})]},t.id))}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[e.jsx("button",{onClick:()=>b(t=>t==="dark"?"light":"dark"),style:C.iconBtn,children:l==="dark"?"☀️":"🌙"}),e.jsx("button",{onClick:be,style:{...C.iconBtn,background:T||z==="right"?r.surface2:"transparent"},children:"✓"})]})]}),e.jsxs("div",{style:{display:"flex",flex:1,overflow:"hidden",position:"relative"},children:[(s||p)&&z&&e.jsx("div",{style:C.overlay,onClick:q}),(u&&f||z==="left")&&e.jsxs("aside",{style:{...s||p?C.sidebarMobile:C.sidebar,left:0,borderRight:`1px solid ${r.border}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${r.border}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",fontWeight:600,fontSize:"14px"},children:[e.jsx("span",{children:"🎨"}),e.jsx("span",{children:"Token Editor"}),a.connected&&e.jsx("span",{style:{fontSize:"10px",padding:"2px 6px",background:"#22c55e",borderRadius:"4px",color:"white"},children:"LIVE"})]}),(s||p)&&e.jsx("button",{onClick:q,style:C.iconBtn,children:"✕"})]}),e.jsx("div",{style:{display:"flex",padding:"8px",gap:"4px",borderBottom:`1px solid ${r.border}`},children:[{id:"colors",emoji:"🎨"},{id:"spacing",emoji:"📏"},{id:"typography",emoji:"✏️"},{id:"motion",emoji:"✨"},{id:"radius",emoji:"⬜"}].map(t=>e.jsx("button",{onClick:()=>le(t.id),style:{flex:1,padding:"10px 8px",background:R===t.id?r.surface2:"transparent",border:"none",borderRadius:"6px",fontSize:"16px",cursor:"pointer",opacity:R===t.id?1:.5},children:t.emoji},t.id))}),e.jsxs("div",{style:{flex:1,padding:"16px",overflowY:"auto"},children:[R==="colors"&&e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"10px"},children:Object.entries(n.colors).map(([t,d])=>e.jsx(Le,{label:t,value:d,onChange:g=>E("colors",t,g),colors:r},t))}),R==="spacing"&&e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:Object.entries(n.spacing).map(([t,d])=>e.jsx(M,{label:t.toUpperCase(),value:d,min:0,max:64,unit:"px",onChange:g=>E("spacing",t,parseInt(g)),colors:r,previewBar:!0},t))}),R==="typography"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:[e.jsx(D,{colors:r,children:"Font Family"}),e.jsx(Oe,{value:n.typography.fontFamily,options:Ae,onChange:t=>E("typography","fontFamily",t),colors:r}),e.jsx(D,{colors:r,children:"Base Size"}),e.jsx(M,{value:n.typography.baseFontSize,min:12,max:24,unit:"px",onChange:t=>E("typography","baseFontSize",parseInt(t)),colors:r}),e.jsx(D,{colors:r,children:"Heading Weight"}),e.jsx(M,{value:n.typography.headingWeight,min:400,max:800,step:100,unit:"",onChange:t=>E("typography","headingWeight",parseInt(t)),colors:r})]}),R==="motion"&&e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:Object.entries(n.motion).map(([t,d])=>e.jsx(M,{label:t,value:d,min:0,max:600,unit:"ms",onChange:g=>E("motion",t,parseInt(g)),colors:r},t))}),R==="radius"&&e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:Object.entries(n.radius).map(([t,d])=>e.jsx(M,{label:t.toUpperCase(),value:d,min:0,max:32,unit:"px",onChange:g=>E("radius",t,parseInt(g)),colors:r,previewRadius:!0},t))})]})]}),e.jsxs("main",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0},children:[w==="create"&&e.jsxs("div",{style:{padding:s?"12px":"16px",background:r.surface,borderBottom:`1px solid ${r.border}`,flexShrink:0},children:[e.jsxs("div",{style:{marginBottom:"12px"},children:[e.jsxs("button",{onClick:()=>pe(!H),style:{display:"flex",alignItems:"center",gap:"6px",background:"transparent",border:"none",color:r.textMuted,fontSize:"12px",cursor:"pointer",padding:"4px 0"},children:[e.jsx("span",{children:H?"▼":"▶"}),e.jsxs("span",{children:["🔑 API Key ",I?"(set)":"(required for AI)"]}),I&&e.jsx("span",{style:{color:"#22c55e"},children:"✓"})]}),H&&e.jsxs("div",{style:{marginTop:"8px"},children:[e.jsx("input",{type:"password",value:I,onChange:t=>de(t.target.value),placeholder:"sk-ant-api03-...",style:{width:"100%",padding:"8px 12px",background:r.surface2,border:`1px solid ${r.border}`,borderRadius:"6px",color:r.text,fontSize:"13px"}}),e.jsx("p",{style:{fontSize:"11px",color:r.textMuted,marginTop:"6px"},children:"Enter your Anthropic API key for AI-powered component generation. Without it, only template-based generation is available."})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:r.surface2,border:`1px solid ${r.border}`,borderRadius:"10px"},children:[e.jsx("span",{style:{color:r.textMuted,flexShrink:0},children:"✨"}),e.jsx("input",{type:"text",value:U,onChange:t=>ce(t.target.value),onKeyDown:t=>t.key==="Enter"&&te(),placeholder:I?"Describe any component...":"e.g. 'large danger button with icon'",style:{flex:1,minWidth:0,background:"transparent",border:"none",outline:"none",color:r.text,fontSize:"14px"}}),e.jsx("button",{onClick:te,disabled:a.component.generating,style:{padding:"8px 14px",background:a.component.generating?r.surface2:r.primary,border:"none",borderRadius:"6px",color:"white",fontSize:"13px",fontWeight:500,cursor:"pointer",flexShrink:0},children:a.component.generating?"...":s?"→":"Generate"})]}),G&&e.jsxs("div",{style:{color:G.includes("API")?"#f59e0b":"#ef4444",fontSize:"12px",marginTop:"8px"},children:["⚠ ",G]})]}),w==="export"&&e.jsxs("div",{style:{padding:"16px",background:r.surface,borderBottom:`1px solid ${r.border}`},children:[e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"12px"},children:[e.jsx("button",{onClick:fe,style:{padding:"12px 20px",background:r.primary,border:"none",borderRadius:"8px",color:"white",fontSize:"14px",fontWeight:500,cursor:"pointer"},children:"📋 Copy CSS Variables"}),(i==null?void 0:i.html)&&e.jsx("button",{onClick:()=>K("html"),style:{padding:"12px 20px",background:r.surface2,border:`1px solid ${r.border}`,borderRadius:"8px",color:r.text,fontSize:"14px",fontWeight:500,cursor:"pointer"},children:"🌐 Download HTML"}),(i==null?void 0:i.html)&&e.jsx("button",{onClick:()=>K("react"),style:{padding:"12px 20px",background:r.surface2,border:`1px solid ${r.border}`,borderRadius:"8px",color:r.text,fontSize:"14px",fontWeight:500,cursor:"pointer"},children:"⚛️ Copy as React"}),(i==null?void 0:i.html)&&e.jsx("button",{onClick:()=>K("package"),style:{padding:"12px 20px",background:"#22c55e",border:"none",borderRadius:"8px",color:"white",fontSize:"14px",fontWeight:500,cursor:"pointer"},children:"📦 Download Package"})]}),e.jsx("div",{style:{marginTop:"12px",fontSize:"12px",color:r.textMuted},children:i?`Component ready to export: ${i.type||"custom"}`:"Generate a component first to enable export options"})]}),e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:s?"16px":"24px",background:r.bg,overflow:"auto"},children:[e.jsx("style",{children:`
              .aioli-preview {
                --color-primary: ${n.colors.primary};
                --color-secondary: ${n.colors.secondary};
                --color-success: ${n.colors.success};
                --color-danger: ${n.colors.danger};
                --color-warning: ${n.colors.warning};
                --color-background: ${n.colors.background};
                --color-surface: ${l==="dark"?"#1e293b":"#f8fafc"};
                --color-text: ${n.colors.text};
                --color-text-muted: ${l==="dark"?"#94a3b8":"#64748b"};
                --color-border: ${l==="dark"?"#334155":"#e2e8f0"};
                --spacing-xs: ${n.spacing.xs}px;
                --spacing-sm: ${n.spacing.sm}px;
                --spacing-md: ${n.spacing.md}px;
                --spacing-lg: ${n.spacing.lg}px;
                --spacing-xl: ${n.spacing.xl}px;
                --font-family: ${A};
                --font-size-sm: 0.875rem;
                --font-size-base: ${n.typography.baseFontSize}px;
                --font-size-lg: 1.125rem;
                --font-size-xl: 1.25rem;
                --font-weight-normal: ${n.typography.bodyWeight};
                --font-weight-medium: 500;
                --font-weight-bold: ${n.typography.headingWeight};
                --radius-sm: ${n.radius.sm}px;
                --radius-md: ${n.radius.md}px;
                --radius-lg: ${n.radius.lg}px;
                --radius-full: 9999px;
                --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
                --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
                --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
                --motion-fast: ${n.motion.fast}ms;
                --motion-normal: ${n.motion.normal}ms;
                --motion-slow: ${n.motion.slow}ms;
              }
            `}),e.jsx("div",{className:"aioli-preview",style:{width:"100%",maxWidth:h==="mobile"?"375px":h==="tablet"?"768px":"100%",minHeight:"300px",background:n.colors.background,borderRadius:"12px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px",padding:s?"20px":"32px",transition:"all 300ms ease",color:n.colors.text},children:i?e.jsxs("div",{style:{width:"100%"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"10px",color:l==="dark"?"#94a3b8":"#64748b",marginBottom:"12px",textTransform:"uppercase",flexWrap:"wrap",gap:"8px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("span",{children:["Generated: ",i.type||"component"]}),e.jsx("span",{style:{padding:"2px 6px",borderRadius:"4px",background:i.source==="claude-api"?"rgba(139, 92, 246, 0.2)":"rgba(100, 116, 139, 0.2)",color:i.source==="claude-api"?"#a78bfa":"#94a3b8"},children:i.source==="claude-api"?"🤖 AI":"📋 Template"}),i.fixed&&e.jsx("span",{style:{padding:"2px 6px",borderRadius:"4px",background:"rgba(34, 197, 94, 0.2)",color:"#22c55e"},children:"🔧 Fixed"})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[i.attempts&&e.jsx("span",{style:{padding:"2px 6px",borderRadius:"4px",background:"rgba(100, 116, 139, 0.2)"},children:i.attempts===1?"1 attempt":`${i.attempts} attempts`}),e.jsx("span",{style:{padding:"2px 6px",borderRadius:"4px",background:i.passed!==!1?"rgba(34, 197, 94, 0.2)":"rgba(239, 68, 68, 0.2)",color:i.passed!==!1?"#22c55e":"#ef4444"},children:i.passed!==!1?"✓ A11y Passed":"⚠ Has Issues"}),i.passed===!1&&((re=(oe=i.validation)==null?void 0:oe.issues)==null?void 0:re.length)>0&&e.jsx("button",{onClick:me,disabled:L,style:{padding:"2px 8px",borderRadius:"4px",background:"#8b5cf6",color:"white",border:"none",fontSize:"10px",fontWeight:500,cursor:L?"wait":"pointer",opacity:L?.7:1,textTransform:"uppercase"},children:L?"🔄 Fixing...":"🔧 Fix Issues"})]})]}),e.jsx("iframe",{srcDoc:`<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${A};
      padding: 16px;
      background: ${n.colors.background};
      color: ${n.colors.text};
      
      /* Inject CSS Variables */
      --color-primary: ${n.colors.primary};
      --color-secondary: ${n.colors.secondary};
      --color-success: ${n.colors.success};
      --color-danger: ${n.colors.danger};
      --color-warning: ${n.colors.warning};
      --color-background: ${n.colors.background};
      --color-surface: ${l==="dark"?"#1e293b":"#f8fafc"};
      --color-text: ${n.colors.text};
      --color-text-muted: ${l==="dark"?"#94a3b8":"#64748b"};
      --color-border: ${l==="dark"?"#334155":"#e2e8f0"};
      
      --spacing-xs: ${n.spacing.xs}px;
      --spacing-sm: ${n.spacing.sm}px;
      --spacing-md: ${n.spacing.md}px;
      --spacing-lg: ${n.spacing.lg}px;
      --spacing-xl: ${n.spacing.xl}px;
      
      --font-family: ${A};
      --font-size-sm: 0.875rem;
      --font-size-base: ${n.typography.baseFontSize}px;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.25rem;
      --font-weight-normal: ${n.typography.bodyWeight};
      --font-weight-medium: 500;
      --font-weight-bold: ${n.typography.headingWeight};
      
      --radius-sm: ${n.radius.sm}px;
      --radius-md: ${n.radius.md}px;
      --radius-lg: ${n.radius.lg}px;
      --radius-full: 9999px;
      
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
      
      --motion-fast: ${n.motion.fast}ms;
      --motion-normal: ${n.motion.normal}ms;
      --motion-slow: ${n.motion.slow}ms;
    }
    button { cursor: pointer; }
    a { color: var(--color-primary); }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(n.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
${i.html}
</body>
</html>`,style:{width:"100%",minHeight:"200px",border:"none",borderRadius:"8px",background:n.colors.background},title:"Component Preview",sandbox:"allow-scripts"}),i.html&&e.jsxs("details",{style:{marginTop:"16px"},children:[e.jsx("summary",{style:{fontSize:"12px",color:l==="dark"?"#94a3b8":"#64748b",cursor:"pointer"},children:"View HTML"}),e.jsx("pre",{style:{fontSize:"11px",background:l==="dark"?"#0f172a":"#f1f5f9",color:l==="dark"?"#e2e8f0":"#334155",padding:"12px",borderRadius:"6px",overflow:"auto",marginTop:"8px"},children:i.html})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"10px",color:l==="dark"?"#94a3b8":"#64748b",marginBottom:"8px",textTransform:"uppercase"},children:"Live Preview"}),e.jsx("button",{style:_.button,children:"Primary Button"})]}),e.jsx("div",{style:{width:"100%",maxWidth:"280px"},children:e.jsxs("div",{style:{padding:`${n.spacing.lg}px`,background:l==="dark"?"#1e293b":n.colors.background,borderRadius:`${n.radius.lg}px`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",border:`1px solid ${l==="dark"?"#334155":"#e2e8f0"}`},children:[e.jsx("h3",{style:_.heading,children:"Card Title"}),e.jsx("p",{style:_.body,children:"Preview updates live as you edit tokens."})]})})]})})]}),e.jsx("div",{style:{display:"flex",justifyContent:"center",gap:"6px",padding:"10px",background:r.surface,borderTop:`1px solid ${r.border}`,flexShrink:0},children:["mobile","tablet","desktop"].map(t=>e.jsxs("button",{onClick:()=>m(t),style:{display:"flex",alignItems:"center",gap:"4px",padding:"6px 10px",background:h===t?r.primary:"transparent",border:`1px solid ${h===t?r.primary:r.border}`,borderRadius:"6px",color:h===t?"white":r.textMuted,fontSize:"11px",cursor:"pointer"},children:[e.jsx("span",{children:t==="mobile"||t==="tablet"?"📱":"💻"}),!s&&e.jsx("span",{style:{textTransform:"capitalize"},children:t})]},t))})]}),(u&&T||z==="right")&&e.jsxs("aside",{style:{...s||p?C.sidebarMobile:C.sidebar,right:0,borderLeft:`1px solid ${r.border}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${r.border}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",fontWeight:600,fontSize:"14px"},children:[e.jsx("span",{children:"✅"}),e.jsx("span",{children:"Validation"})]}),(s||p)&&e.jsx("button",{onClick:q,style:C.iconBtn,children:"✕"})]}),e.jsxs("div",{style:{flex:1,padding:"16px",overflowY:"auto"},children:[we.map((t,d)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",marginBottom:"8px",background:t.type==="success"?"rgba(34,197,94,0.1)":t.type==="warning"?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",borderRadius:"8px",color:t.type==="success"?"#22c55e":t.type==="warning"?"#f59e0b":"#ef4444",fontSize:"13px"},children:[e.jsx("span",{children:t.type==="success"?"✓":t.type==="warning"?"⚠":"✗"}),e.jsx("span",{children:t.message})]},d)),i&&a.connected&&e.jsx("button",{onClick:he,disabled:a.codeReview.reviewing,style:{width:"100%",padding:"10px",marginTop:"12px",background:r.surface2,border:`1px solid ${r.border}`,borderRadius:"8px",color:r.text,cursor:"pointer",fontSize:"13px"},children:a.codeReview.reviewing?"Reviewing...":"🔍 Run Code Review"}),e.jsxs("div",{style:{marginTop:"20px"},children:[e.jsx(D,{colors:r,children:"CSS Output"}),e.jsxs("pre",{style:{padding:"12px",background:r.bg,borderRadius:"8px",fontSize:"10px",color:r.textMuted,overflow:"auto",maxHeight:"180px"},children:[V().slice(0,500),"..."]})]})]})]})]})]})}const D=({children:x,colors:s})=>e.jsx("h4",{style:{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",color:s.textMuted,margin:"0 0 8px 0"},children:x}),Le=({label:x,value:s,onChange:p,colors:u})=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",padding:"8px",background:u.surface2,borderRadius:"8px"},children:[e.jsx("input",{type:"color",value:s,onChange:a=>p(a.target.value),style:{width:"32px",height:"32px",border:"none",borderRadius:"6px",cursor:"pointer",padding:0}}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontSize:"12px",fontWeight:500,color:u.text,textTransform:"capitalize"},children:x}),e.jsx("input",{type:"text",value:s,onChange:a=>p(a.target.value),style:{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:"10px",color:u.textMuted,fontFamily:"monospace"}})]})]}),M=({label:x,value:s,min:p,max:u,step:a=1,unit:c,onChange:l,colors:b,previewBar:w,previewRadius:k})=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[x&&e.jsx("span",{style:{fontSize:"12px",fontWeight:500,color:b.text,textTransform:"capitalize"},children:x}),e.jsxs("span",{style:{fontSize:"11px",color:b.textMuted,fontFamily:"monospace",marginLeft:"auto"},children:[s,c]})]}),e.jsx("input",{type:"range",min:p,max:u,step:a,value:s,onChange:h=>l(h.target.value),style:{width:"100%",accentColor:b.primary,cursor:"pointer"}}),w&&e.jsx("div",{style:{width:Math.min(s,100)+"%",maxWidth:"100%",height:"6px",background:b.primary,borderRadius:"3px"}}),k&&e.jsx("div",{style:{width:"40px",height:"40px",background:b.primary,borderRadius:`${s}px`}})]}),Oe=({value:x,options:s,onChange:p,colors:u})=>(o.useEffect(()=>{s.forEach(a=>{const c=`gf-${a.name.replace(/\s+/g,"-")}`;if(!document.getElementById(c)){const l=document.createElement("link");l.id=c,l.rel="stylesheet",l.href=`https://fonts.googleapis.com/css2?family=${a.name.replace(/\s+/g,"+")}:wght@400;600&display=swap`,document.head.appendChild(l)}})},[]),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:s.map(a=>e.jsxs("button",{onClick:()=>p(a.name),style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:x===a.name?u.primary:u.surface2,border:"none",borderRadius:"8px",cursor:"pointer"},children:[e.jsx("span",{style:{fontFamily:`'${a.name}', sans-serif`,fontSize:"14px",color:x===a.name?"white":u.text},children:a.name}),e.jsx("span",{style:{fontFamily:`'${a.name}', sans-serif`,fontSize:"18px",color:x===a.name?"white":u.textMuted},children:"Aa"})]},a.name))}));Se.createRoot(document.getElementById("root")).render(e.jsx($e.StrictMode,{children:e.jsx(Me,{})}));
