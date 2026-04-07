import{openDB}from"idb";
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
  const adminEmail=import.meta.env.VITE_ADMIN_EMAIL||"thiaggotx@gmail.com";
  const adminPass=import.meta.env.VITE_ADMIN_PASSWORD||"";
  const admin=await getAccount(adminEmail);
  if(!admin){
    await saveAccount({email:adminEmail,name:"Admin",password:adminPass,role:"admin",status:"active",createdAt:new Date().toISOString(),mustChangePassword:false,protected:true});
  }
}

// ─── SUB-USERS (membros com login) ───
export async function getSubUsers(parentEmail){const db=await getDB();const all=await db.getAll("accounts");return all.filter(a=>a.parentEmail===parentEmail)}
