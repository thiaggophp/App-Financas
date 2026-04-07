const fs=require("fs"),path=require("path");
function w(f,c){const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,c.trimStart());console.log("✅ "+f)}

// ─── GROUPS & MEMBERS PAGE ───
w("src/pages/Groups.jsx",`import{useState,useEffect}from"react";
import{getGroups,saveGroup,deleteGroup,getMembers,getMembersByGroup,saveMember,deleteMember}from"../db";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";import Avatar from"../components/Avatar";

const COLORS=["#7c3aed","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

export default function Groups({user}){
  const[groups,setGroups]=useState([]);const[members,setMembers]=useState([]);
  const[groupModal,setGroupModal]=useState(false);const[memberModal,setMemberModal]=useState(false);
  const[selGroup,setSelGroup]=useState(null);
  const[groupName,setGroupName]=useState("");const[memberName,setMemberName]=useState("");
  const[editGroup,setEditGroup]=useState(null);

  const reload=async()=>{setGroups(await getGroups(user.email));setMembers(await getMembers(user.email))};
  useEffect(()=>{reload()},[user.email]);

  const saveG=async()=>{
    if(!groupName.trim())return;
    const g={id:editGroup?editGroup.id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ownerEmail:user.email,name:groupName.trim(),color:COLORS[groups.length%COLORS.length],createdAt:editGroup?editGroup.createdAt:new Date().toISOString()};
    await saveGroup(g);setGroupModal(false);setGroupName("");setEditGroup(null);await reload();
  };

  const removeG=async(g)=>{
    if(!confirm("Excluir grupo "+g.name+" e todos os membros?")){return}
    const gMembers=await getMembersByGroup(g.id);
    for(const m of gMembers)await deleteMember(m.id);
    await deleteGroup(g.id);if(selGroup?.id===g.id)setSelGroup(null);await reload();
  };

  const saveM=async()=>{
    if(!memberName.trim()||!selGroup)return;
    const m={id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ownerEmail:user.email,groupId:selGroup.id,name:memberName.trim(),color:COLORS[(members.length+1)%COLORS.length],createdAt:new Date().toISOString()};
    await saveMember(m);setMemberModal(false);setMemberName("");await reload();
  };

  const removeM=async(m)=>{await deleteMember(m.id);await reload()};

  const groupMembers=selGroup?members.filter(m=>m.groupId===selGroup.id):[];

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>Grupos & Membros</h2>
      <Btn onClick={()=>{setEditGroup(null);setGroupName("");setGroupModal(true)}} style={{width:"auto",padding:"8px 16px",fontSize:13}}>+ Grupo</Btn>
    </div>

    {groups.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Crie seu primeiro grupo para começar</p>}

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
      {groups.map(g=>{const cnt=members.filter(m=>m.groupId===g.id).length;
        return(<div key={g.id} onClick={()=>setSelGroup(selGroup?.id===g.id?null:g)}
          style={{minWidth:120,padding:12,borderRadius:14,background:selGroup?.id===g.id?g.color+"20":"#141428",border:"1px solid "+(selGroup?.id===g.id?g.color:"#1e1e3a"),cursor:"pointer",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:20,marginBottom:4}}>👥</div>
          <div style={{color:"#fff",fontWeight:600,fontSize:13}}>{g.name}</div>
          <div style={{color:"#888",fontSize:11}}>{cnt} membro{cnt!==1?"s":""}</div>
        </div>);
      })}
    </div>

    {selGroup&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{color:selGroup.color,margin:0,fontSize:16}}>{selGroup.name}</h3>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={()=>setMemberModal(true)} style={{width:"auto",padding:"6px 12px",fontSize:12}}>+ Membro</Btn>
          <button onClick={()=>{setEditGroup(selGroup);setGroupName(selGroup.name);setGroupModal(true)}} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#7c3aed",cursor:"pointer"}}>✏️</button>
          <button onClick={()=>removeG(selGroup)} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#ef4444",cursor:"pointer"}}>🗑</button>
        </div>
      </div>

      {groupMembers.map(m=><Card key={m.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <Avatar name={m.name} color={m.color} size={32}/>
            <span style={{color:"#fff",fontWeight:600,fontSize:14}}>{m.name}</span>
          </div>
          <button onClick={()=>removeM(m)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>🗑</button>
        </div>
      </Card>)}
      {groupMembers.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:16,fontSize:13}}>Nenhum membro neste grupo</p>}
    </div>}

    <Modal open={groupModal} onClose={()=>setGroupModal(false)} title={editGroup?"Editar Grupo":"Novo Grupo"}>
      <Input label="Nome do grupo" value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex: Casa, Família..."/>
      <Btn onClick={saveG}>{editGroup?"Salvar":"Criar Grupo"}</Btn>
    </Modal>

    <Modal open={memberModal} onClose={()=>setMemberModal(false)} title={"Novo Membro — "+(selGroup?.name||"")}>
      <Input label="Nome do membro" value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="Ex: João, Maria..."/>
      <Btn onClick={saveM}>Adicionar Membro</Btn>
    </Modal>
  </div>);
}`);

// ─── CONFIG ───
w("src/pages/Config.jsx",`import{useState}from"react";
import{saveAccount}from"../db";
import{exportBackup,importBackupFile,confirmImport}from"../backup";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";

export default function Config({user,onUpdate}){
  const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);
  const[passModal,setPassModal]=useState(false);const[newPass,setNewPass]=useState("");const[confirmPass,setConfirmPass]=useState("");
  const[importing,setImporting]=useState(false);const[importInfo,setImportInfo]=useState(null);const[importData,setImportData]=useState(null);

  const handleExport=async()=>{
    setLoading(true);const r=await exportBackup(user.email);
    if(r.success)setMsg({t:"success",m:"Backup exportado!"});else if(!r.cancelled)setMsg({t:"error",m:r.error||"Erro"});
    setLoading(false);
  };

  const handleImport=async()=>{
    const r=await importBackupFile();
    if(r.success){setImportInfo(r.info);setImportData(r.data);setImporting(true)}
    else if(r.error)setMsg({t:"error",m:r.error});
  };

  const handleConfirmImport=async()=>{
    const r=await confirmImport(importData);
    if(r.success)setMsg({t:"success",m:"Dados restaurados!"});else setMsg({t:"error",m:r.error});
    setImporting(false);
  };

  const handleChangePassword=async()=>{
    if(!newPass||newPass.length<6){setMsg({t:"error",m:"Mínimo 6 caracteres"});return}
    if(newPass!==confirmPass){setMsg({t:"error",m:"Senhas não conferem"});return}
    user.password=newPass;user.mustChangePassword=false;await saveAccount(user);
    setMsg({t:"success",m:"Senha alterada!"});setPassModal(false);setNewPass("");setConfirmPass("");
    if(onUpdate)onUpdate(user);
  };

  return(<div style={{padding:"0 4px"}}>
    <h2 style={{color:"#fff",margin:"0 0 16px",fontSize:20}}>Configurações</h2>

    <Card style={{marginBottom:12}}>
      <div style={{color:"#888",fontSize:12,fontWeight:600,marginBottom:8}}>CONTA</div>
      <div style={{color:"#fff",fontWeight:600,fontSize:15}}>{user.name}</div>
      <div style={{color:"#666",fontSize:13}}>{user.email}</div>
      <div style={{color:"#7c3aed",fontSize:12,marginTop:4}}>{user.role==="admin"?"Administrador":"Usuário"}</div>
      <Btn onClick={()=>{setPassModal(true);setMsg(null)}} color="#1a1a30" style={{marginTop:10,border:"1px solid #2a2a4a",fontSize:13}}>🔑 Alterar Senha</Btn>
    </Card>

    <Card style={{marginBottom:12}}>
      <div style={{color:"#888",fontSize:12,fontWeight:600,marginBottom:8}}>BACKUP</div>
      <p style={{color:"#666",fontSize:12,marginBottom:10}}>Exporte para salvar seus dados. Restaure em outro dispositivo.</p>
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={handleExport} color="#22c55e" style={{fontSize:13,padding:10}} disabled={loading}>{loading?"Exportando...":"📤 Exportar"}</Btn>
        <Btn onClick={handleImport} color="#3b82f6" style={{fontSize:13,padding:10}}>📥 Restaurar</Btn>
      </div>
    </Card>

    {msg&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:12,fontSize:13,background:msg.t==="success"?"#22c55e15":"#ef444415",color:msg.t==="success"?"#22c55e":"#ef4444"}}>{msg.m}</div>}

    <Modal open={passModal} onClose={()=>setPassModal(false)} title="Alterar Senha">
      <Input label="Nova senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={handleChangePassword}>Salvar Nova Senha</Btn>
    </Modal>

    <Modal open={importing} onClose={()=>setImporting(false)} title="Restaurar Backup">
      {importInfo&&<div>
        <p style={{color:"#f59e0b",fontSize:13,marginBottom:12}}>⚠️ Os dados atuais serão substituídos. Essa ação não pode ser desfeita.</p>
        <Card style={{marginBottom:14}}>
          <div style={{color:"#888",fontSize:13,lineHeight:1.8}}>
            📅 Data: <strong style={{color:"#ccc"}}>{importInfo.date}</strong><br/>
            💳 Lançamentos: <strong style={{color:"#ccc"}}>{importInfo.entries}</strong><br/>
            🎯 Metas: <strong style={{color:"#ccc"}}>{importInfo.goals}</strong><br/>
            👥 Grupos: <strong style={{color:"#ccc"}}>{importInfo.groups}</strong><br/>
            🧑 Membros: <strong style={{color:"#ccc"}}>{importInfo.members}</strong>
          </div>
        </Card>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setImporting(false)} color="#444" style={{flex:1}}>Cancelar</Btn>
          <Btn onClick={handleConfirmImport} color="#f59e0b" style={{flex:1}}>Restaurar</Btn>
        </div>
      </div>}
    </Modal>
  </div>);
}`);

// ─── APP.JSX ───
w("src/App.jsx",`import{useState,useEffect}from"react";
import{initAdmin,getAccount,saveAccount}from"./db";
import Login from"./pages/Login";
import Dashboard from"./pages/Dashboard";
import Entries from"./pages/Entries";
import Goals from"./pages/Goals";
import Reports from"./pages/Reports";
import Groups from"./pages/Groups";
import Config from"./pages/Config";
import Admin from"./pages/Admin";
import Modal from"./components/Modal";
import{Btn,Input}from"./components/FormElements";

const tabs=[
  {id:"dash",label:"Home",icon:"🏠"},
  {id:"entries",label:"Lançar",icon:"💳"},
  {id:"groups",label:"Grupos",icon:"👥"},
  {id:"goals",label:"Metas",icon:"🎯"},
  {id:"reports",label:"Relatórios",icon:"📊"},
  {id:"config",label:"Config",icon:"⚙️"},
];

export default function App(){
  const[user,setUser]=useState(null);const[tab,setTab]=useState("dash");
  const[ready,setReady]=useState(false);
  const[changePassModal,setChangePassModal]=useState(false);
  const[newPass,setNewPass]=useState("");const[confirmPass,setConfirmPass]=useState("");const[passMsg,setPassMsg]=useState(null);

  useEffect(()=>{(async()=>{await initAdmin();setReady(true)})()},[]);

  const handleLogin=(acc)=>{
    setUser(acc);setTab("dash");
    if(acc.mustChangePassword)setChangePassModal(true);
  };

  const handleForceChangePass=async()=>{
    if(!newPass||newPass.length<6){setPassMsg("Mínimo 6 caracteres");return}
    if(newPass!==confirmPass){setPassMsg("Senhas não conferem");return}
    user.password=newPass;user.mustChangePassword=false;await saveAccount(user);
    setUser({...user});setChangePassModal(false);setNewPass("");setConfirmPass("");setPassMsg(null);
  };

  const logout=()=>{setUser(null);setTab("dash")};

  if(!ready)return(<div style={{minHeight:"100vh",background:"#0a0a1a",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#7c3aed",fontSize:18,animation:"pulse 1s infinite"}}>Carregando...</div></div>);
  if(!user)return <Login onLogin={handleLogin}/>;

  const allTabs=user.role==="admin"?[...tabs,{id:"admin",label:"Admin",icon:"🛡️"}]:tabs;

  const renderPage=()=>{
    switch(tab){
      case"dash":return<Dashboard user={user}/>;
      case"entries":return<Entries user={user}/>;
      case"groups":return<Groups user={user}/>;
      case"goals":return<Goals user={user}/>;
      case"reports":return<Reports user={user}/>;
      case"config":return<Config user={user} onUpdate={u=>setUser({...u})}/>;
      case"admin":return user.role==="admin"?<Admin currentUser={user}/>:null;
      default:return<Dashboard user={user}/>;
    }
  };

  return(<div style={{minHeight:"100vh",background:"#0a0a1a",paddingBottom:80}}>
    <div style={{padding:"16px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0a0a1a",zIndex:100,borderBottom:"1px solid #1a1a30"}}>
      <div>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,background:"linear-gradient(135deg,#a78bfa,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Finanças</h1>
        <div style={{color:"#666",fontSize:11}}>Olá, {user.name}</div>
      </div>
      <button onClick={logout} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:10,padding:"8px 14px",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>🚪 Sair</button>
    </div>

    <div style={{padding:16}}>{renderPage()}</div>

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0a1a",borderTop:"1px solid #1a1a30",display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom,8px)",zIndex:100}}>
      {allTabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
        style={{background:"none",border:"none",color:tab===t.id?"#7c3aed":"#555",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",fontSize:9,fontWeight:tab===t.id?700:400,gap:1,padding:"4px 6px"}}>
        <span style={{fontSize:18}}>{t.icon}</span>{t.label}
      </button>)}
    </div>

    <Modal open={changePassModal} onClose={()=>{}} title="Redefina sua senha">
      <p style={{color:"#888",fontSize:13,marginBottom:14}}>Você precisa criar uma nova senha antes de continuar.</p>
      {passMsg&&<div style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{passMsg}</div>}
      <Input label="Nova senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={handleForceChangePass}>Salvar e Continuar</Btn>
    </Modal>
  </div>);
}`);

console.log("\\n🎉 ═══════════════════════════════════════════");
console.log("   TODOS OS ARQUIVOS CRIADOS COM SUCESSO!");
console.log("═══════════════════════════════════════════════");
console.log("\\nAgora rode:  npm run dev");
console.log("Acesse:  http://localhost:5173\\n");