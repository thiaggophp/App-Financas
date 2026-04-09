import{useState,useEffect}from"react";
import{getGroups,saveGroup,deleteGroup,getMembers,getMembersByGroup,saveMember,deleteMember,saveAccount,deleteAccount,getSubUsers,getAccount}from"../db";
import{sendPasswordEmail,generatePassword}from"../emailService";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";import Avatar from"../components/Avatar";

const COLORS=["#7c3aed","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

export default function Groups({user}){
  const[groups,setGroups]=useState([]);const[members,setMembers]=useState([]);const[subUsers,setSubUsers]=useState([]);
  const[groupModal,setGroupModal]=useState(false);const[memberModal,setMemberModal]=useState(false);
  const[selGroup,setSelGroup]=useState(null);
  const[groupName,setGroupName]=useState("");
  const[memberName,setMemberName]=useState("");const[memberEmail,setMemberEmail]=useState("");
  const[editGroup,setEditGroup]=useState(null);const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);
  const[deleteGroupModal,setDeleteGroupModal]=useState(null);const[deleteMemberModal,setDeleteMemberModal]=useState(null);

  const reload=async()=>{
    setGroups(await getGroups(user.email));
    setMembers(await getMembers(user.email));
    setSubUsers(await getSubUsers(user.email));
  };
  useEffect(()=>{reload()},[user.email]);

  const saveG=async()=>{
    if(!groupName.trim())return;
    const g={ownerEmail:user.email,name:groupName.trim(),color:COLORS[groups.length%COLORS.length],createdAt:new Date().toISOString()};
    if(editGroup){g.id=editGroup.id;g.createdAt=editGroup.createdAt;}
    await saveGroup(g);setGroupModal(false);setGroupName("");setEditGroup(null);await reload();
  };

  const removeG=async(g)=>{
    const gMembers=await getMembersByGroup(g.id);
    for(const m of gMembers){
      await deleteMember(m.id);
      if(m.memberEmail){const acc=await getAccount(m.memberEmail);if(acc&&acc.parentEmail===user.email)await deleteAccount(m.memberEmail);}
    }
    await deleteGroup(g.id);if(selGroup?.id===g.id)setSelGroup(null);setDeleteGroupModal(null);await reload();
  };

  const saveM=async()=>{
    if(!memberName.trim()||!selGroup){setMsg({t:"error",m:"Preencha o nome"});return}
    if(!memberEmail.trim()){setMsg({t:"error",m:"E-mail é obrigatório"});return}
    setLoading(true);setMsg(null);
    const e=memberEmail.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setMsg({t:"error",m:"E-mail inválido"});setLoading(false);return}
    if(e===user.email.toLowerCase()){setMsg({t:"error",m:"Você não pode se adicionar como membro do próprio grupo"});setLoading(false);return}
    if(members.some(m=>m.memberEmail===e)){setMsg({t:"error",m:"E-mail já cadastrado como membro neste grupo"});setLoading(false);return}
    const mRec={ownerEmail:user.email,groupId:selGroup.id,name:memberName.trim(),memberEmail:e,color:COLORS[(members.length+1)%COLORS.length],createdAt:new Date().toISOString()};
    {
      const{getAccount}=await import("../db");
      const existing=await getAccount(e);
      // Bloqueia somente se a conta pertence a outro dono (não é sub-usuário deste)
      if(existing&&existing.parentEmail!==user.email){
        setMsg({t:"error",m:"E-mail já cadastrado no sistema por outro usuário"});setLoading(false);return;
      }
      if(!existing){
        const pass=generatePassword();
        try{
          await sendPasswordEmail(memberName.trim(),e,pass);
          await saveAccount({email:e,name:memberName.trim(),password:pass,role:"user",status:"active",createdAt:new Date().toISOString(),mustChangePassword:true,protected:false,parentEmail:user.email});
        }catch(err){setMsg({t:"error",m:"Erro ao enviar e-mail: "+err.message});setLoading(false);return}
        setMsg({t:"success",m:"Membro criado! Senha temporária enviada para "+e+"."});
      }else{
        setMsg({t:"success",m:"Membro adicionado ao grupo!"});
      }
      await saveMember(mRec);
    }
    setMemberModal(false);setMemberName("");setMemberEmail("");
    setLoading(false);await reload();
  };

  const removeM=async(m)=>{
    await deleteMember(m.id);
    if(m.memberEmail){const{getAccount}=await import("../db");const acc=await getAccount(m.memberEmail);if(acc&&acc.parentEmail===user.email)await deleteAccount(m.memberEmail)}
    setDeleteMemberModal(null);await reload();
  };

  const toggleBlockMember=async(m)=>{
    if(!m.memberEmail)return;
    const{getAccount}=await import("../db");
    const acc=await getAccount(m.memberEmail);
    if(!acc)return;
    acc.status=acc.status==="active"?"blocked":"active";
    await saveAccount(acc);await reload();
  };

  const getMemberStatus=(m)=>{
    if(!m.memberEmail)return null;
    const acc=subUsers.find(s=>s.email===m.memberEmail);
    return acc?.status||null;
  };

  const groupMembers=selGroup?members.filter(m=>m.groupId===selGroup.id):[];

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>Grupos & Membros</h2>
      <Btn onClick={()=>{setEditGroup(null);setGroupName("");setGroupModal(true)}} style={{width:"auto",padding:"8px 16px",fontSize:13}}>+ Grupo</Btn>
    </div>

    {msg&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:12,fontSize:13,background:msg.t==="success"?"#22c55e15":"#ef444415",color:msg.t==="success"?"#22c55e":"#ef4444"}}>{msg.m}</div>}

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
          <Btn onClick={()=>{setMemberModal(true);setMsg(null)}} style={{width:"auto",padding:"6px 12px",fontSize:12}}>+ Membro</Btn>
          <button onClick={()=>{setEditGroup(selGroup);setGroupName(selGroup.name);setGroupModal(true)}} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#7c3aed",cursor:"pointer"}}>✏️</button>
          <button onClick={()=>setDeleteGroupModal(selGroup)} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#ef4444",cursor:"pointer"}}>🗑</button>
        </div>
      </div>

      {groupMembers.map(m=>{
        const status=getMemberStatus(m);
        return(<Card key={m.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <Avatar name={m.name} color={m.color} size={32}/>
              <div>
                <span style={{color:"#fff",fontWeight:600,fontSize:14}}>{m.name}</span>
                {m.memberEmail&&<div style={{color:"#666",fontSize:11}}>{m.memberEmail}</div>}
                {status&&<div style={{fontSize:10,color:status==="active"?"#22c55e":"#ef4444"}}>{status==="active"?"● Ativo":"● Bloqueado"}</div>}
                {!m.memberEmail&&<div style={{color:"#555",fontSize:10}}>Sem login</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {m.memberEmail&&<button onClick={()=>toggleBlockMember(m)} title={status==="active"?"Bloquear":"Desbloquear"}
                style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:status==="active"?"#f59e0b":"#22c55e",cursor:"pointer"}}>{status==="active"?"🚫":"✅"}</button>}
              <button onClick={()=>setDeleteMemberModal(m)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>🗑</button>
            </div>
          </div>
        </Card>);
      })}
      {groupMembers.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:16,fontSize:13}}>Nenhum membro neste grupo</p>}
    </div>}

    <Modal open={groupModal} onClose={()=>setGroupModal(false)} title={editGroup?"Editar Grupo":"Novo Grupo"}>
      <Input label="Nome do grupo" value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex: Casa, Família..."/>
      <Btn onClick={saveG}>{editGroup?"Salvar":"Criar Grupo"}</Btn>
    </Modal>

    <Modal open={memberModal} onClose={()=>setMemberModal(false)} title={"Novo Membro — "+(selGroup?.name||"")}>
      <Input label="Nome" value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="Ex: João, Maria..."/>
      <Input label="E-mail" type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} placeholder="email@exemplo.com"/>
      <p style={{color:"#888",fontSize:12,margin:"-8px 0 8px"}}>Uma senha temporária será enviada para este e-mail. No primeiro acesso, o usuário deverá definir uma nova senha.</p>
      {msg&&<div style={{color:msg.t==="error"?"#ef4444":"#22c55e",fontSize:12,marginBottom:8}}>{msg.m}</div>}
      <Btn onClick={saveM} disabled={loading}>{loading?"Criando...":"Adicionar Membro"}</Btn>
    </Modal>

    <Modal open={!!deleteGroupModal} onClose={()=>setDeleteGroupModal(null)} title="Excluir grupo">
      {deleteGroupModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:8,textAlign:"center"}}>Deseja excluir o grupo <strong style={{color:"#f1f5f9"}}>{deleteGroupModal.name}</strong>?</p>
        <p style={{color:"#ef4444",fontSize:12,marginBottom:20,textAlign:"center"}}>Todos os membros do grupo também serão removidos.</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteGroupModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>removeG(deleteGroupModal)} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>

    <Modal open={!!deleteMemberModal} onClose={()=>setDeleteMemberModal(null)} title="Remover membro">
      {deleteMemberModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Deseja remover <strong style={{color:"#f1f5f9"}}>{deleteMemberModal.name}</strong> do grupo?{deleteMemberModal.memberEmail?" A conta de login também será excluída.":""}</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteMemberModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>removeM(deleteMemberModal)} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Remover</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
