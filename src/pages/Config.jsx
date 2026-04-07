import{useState}from"react";
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
}