const fs=require("fs"),path=require("path");
function w(f,c){const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,typeof c==="string"?c.trimStart():c);console.log("✅ "+f)}

// ─── public/manifest.json ───
w("public/manifest.json",`{
  "name":"Finanças","short_name":"Finanças","description":"Controle financeiro doméstico",
  "start_url":"/","display":"standalone","background_color":"#0a0a1a","theme_color":"#7c3aed",
  "orientation":"portrait",
  "icons":[{"src":"/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"/icon-512.png","sizes":"512x512","type":"image/png"}]
}`);

// ─── public/sw.js ───
w("public/sw.js",`const CACHE="financas-v3";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/index.html"])));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
`);

// ─── index.html ───
w("index.html",`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
<meta name="theme-color" content="#0a0a1a"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<link rel="manifest" href="/manifest.json"/>
<link rel="icon" href="/icon-192.png"/>
<link rel="apple-touch-icon" href="/icon-192.png"/>
<title>Finanças</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
input,select,button,textarea{font-family:inherit}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
</style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js"))</script>
</body>
</html>`);

// ─── vite.config.js ───
w("vite.config.js",`import{defineConfig}from"vite";import react from"@vitejs/plugin-react";
export default defineConfig({plugins:[react()],server:{host:true,port:5173}});
`);

// ─── src/main.jsx ───
w("src/main.jsx",`import React from"react";import ReactDOM from"react-dom/client";import App from"./App";
ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
`);

// ─── src/emailService.js ───
w("src/emailService.js",`
const SERVICE_ID="service_d0uex69";
const TEMPLATE_ID="template_nzuzzgq";
const PUBLIC_KEY="5R9ZxFkk-UzbIXlGh";

export function generatePassword(len=8){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p="";for(let i=0;i<len;i++)p+=chars[Math.floor(Math.random()*chars.length)];return p;
}

export async function sendPasswordEmail(toName,toEmail,tempPassword){
  const url="https://api.emailjs.com/api/v1.0/email/send";
  const payload={service_id:SERVICE_ID,template_id:TEMPLATE_ID,user_id:PUBLIC_KEY,
    template_params:{to_name:toName,to_email:toEmail,user_email:toEmail,temp_password:tempPassword}};
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!res.ok)throw new Error("Falha ao enviar e-mail: "+res.status);
  return true;
}
`);

// ─── src/db.js ───
w("src/db.js",`import{openDB}from"idb";
const DB="financas-v3",VER=3;
async function getDB(){
  return openDB(DB,VER,{upgrade(db,oldV){
    if(!db.objectStoreNames.contains("accounts")){const s=db.createObjectStore("accounts",{keyPath:"email"});s.createIndex("status","status")}
    if(!db.objectStoreNames.contains("groups")){const s=db.createObjectStore("groups",{keyPath:"id"});s.createIndex("ownerEmail","ownerEmail")}
    if(!db.objectStoreNames.contains("members")){const s=db.createObjectStore("members",{keyPath:"id"});s.createIndex("groupId","groupId");s.createIndex("ownerEmail","ownerEmail")}
    if(!db.objectStoreNames.contains("entries")){const s=db.createObjectStore("entries",{keyPath:"id"});s.createIndex("ownerEmail","ownerEmail");s.createIndex("month","month")}
    if(!db.objectStoreNames.contains("goals")){const s=db.createObjectStore("goals",{keyPath:"id"});s.createIndex("ownerEmail","ownerEmail")}
    if(!db.objectStoreNames.contains("signup_requests")){db.createObjectStore("signup_requests",{keyPath:"email"})}
    if(!db.objectStoreNames.contains("config")){db.createObjectStore("config")}
  }});
}

// ─── ACCOUNTS ───
export async function getAccount(email){const db=await getDB();return db.get("accounts",email)}
export async function getAllAccounts(){const db=await getDB();return db.getAll("accounts")}
export async function saveAccount(acc){const db=await getDB();await db.put("accounts",acc)}
export async function deleteAccount(email){const db=await getDB();await db.delete("accounts",email)}

// ─── SIGNUP REQUESTS ───
export async function getSignupRequests(){const db=await getDB();return db.getAll("signup_requests")}
export async function addSignupRequest(req){const db=await getDB();await db.put("signup_requests",req)}
export async function deleteSignupRequest(email){const db=await getDB();await db.delete("signup_requests",email)}

// ─── GROUPS ───
export async function getGroups(ownerEmail){const db=await getDB();return db.getAllFromIndex("groups","ownerEmail",ownerEmail)}
export async function saveGroup(g){const db=await getDB();await db.put("groups",g)}
export async function deleteGroup(id){const db=await getDB();await db.delete("groups",id)}

// ─── MEMBERS ───
export async function getMembers(ownerEmail){const db=await getDB();return db.getAllFromIndex("members","ownerEmail",ownerEmail)}
export async function getMembersByGroup(groupId){const db=await getDB();return db.getAllFromIndex("members","groupId",groupId)}
export async function saveMember(m){const db=await getDB();await db.put("members",m)}
export async function deleteMember(id){const db=await getDB();await db.delete("members",id)}

// ─── ENTRIES ───
export async function getEntries(ownerEmail){const db=await getDB();return db.getAllFromIndex("entries","ownerEmail",ownerEmail)}
export async function saveEntry(e){const db=await getDB();await db.put("entries",e)}
export async function deleteEntry(id){const db=await getDB();await db.delete("entries",id)}

// ─── GOALS ───
export async function getGoals(ownerEmail){const db=await getDB();return db.getAllFromIndex("goals","ownerEmail",ownerEmail)}
export async function saveGoal(g){const db=await getDB();await db.put("goals",g)}
export async function deleteGoal(id){const db=await getDB();await db.delete("goals",id)}

// ─── CONFIG ───
export async function getConfig(key){const db=await getDB();return db.get("config",key)}
export async function saveConfig(key,val){const db=await getDB();await db.put("config",val,key)}

// ─── BACKUP ───
export async function exportAllData(ownerEmail){
  const entries=await getEntries(ownerEmail);const goals=await getGoals(ownerEmail);
  const groups=await getGroups(ownerEmail);const members=await getMembers(ownerEmail);
  return{appName:"Financas",version:3,exportDate:new Date().toISOString(),ownerEmail,entries,goals,groups,members};
}
export async function importAllData(data){
  const db=await getDB();
  if(data.entries)for(const e of data.entries)await db.put("entries",e);
  if(data.goals)for(const g of data.goals)await db.put("goals",g);
  if(data.groups)for(const g of data.groups)await db.put("groups",g);
  if(data.members)for(const m of data.members)await db.put("members",m);
}

// ─── INIT ADMIN ───
export async function initAdmin(){
  const admin=await getAccount("thiaggotx@gmail.com");
  if(!admin){
    await saveAccount({email:"thiaggotx@gmail.com",name:"Thiago",password:"Precioso21",role:"admin",status:"active",createdAt:new Date().toISOString(),mustChangePassword:false,protected:true});
  }
}
`);

// ─── src/backup.js ───
w("src/backup.js",`import{exportAllData,importAllData}from"./db";
export async function exportBackup(ownerEmail){
  try{
    const data=await exportAllData(ownerEmail);const json=JSON.stringify(data,null,2);
    const blob=new Blob([json],{type:"application/json"});
    const fn="financas-backup-"+new Date().toISOString().slice(0,10)+".json";
    if(navigator.share&&navigator.canShare){const file=new File([blob],fn,{type:"application/json"});const sd={files:[file],title:"Backup Finanças"};if(navigator.canShare(sd)){await navigator.share(sd);return{success:true,method:"share"}}}
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    return{success:true,method:"download"};
  }catch(err){if(err.name==="AbortError")return{success:false,cancelled:true};return{success:false,error:err.message}}
}
export function importBackupFile(){
  return new Promise(resolve=>{
    const input=document.createElement("input");input.type="file";input.accept=".json";
    input.onchange=async e=>{const file=e.target.files?.[0];if(!file){resolve({success:false});return}
      try{const text=await file.text();const data=JSON.parse(text);
        if(data.appName!=="Financas"){resolve({success:false,error:"Arquivo inválido"});return}
        resolve({success:true,data,info:{date:data.exportDate?new Date(data.exportDate).toLocaleDateString("pt-BR"):"?",entries:data.entries?.length||0,goals:data.goals?.length||0,groups:data.groups?.length||0,members:data.members?.length||0}});
      }catch{resolve({success:false,error:"Arquivo corrompido"})}
    };input.click();
  });
}
export async function confirmImport(data){try{await importAllData(data);return{success:true}}catch(err){return{success:false,error:err.message}}}
`);

console.log("\\n✅ s1.cjs concluído! Agora rode: node s2.cjs\\n");