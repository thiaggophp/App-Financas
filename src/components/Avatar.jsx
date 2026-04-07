export default function Avatar({name,color,size=36}){
  const i=(name||"?")[0].toUpperCase();
  return(<div style={{width:size,height:size,borderRadius:size*.35,background:color||"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*.4,fontWeight:700,flexShrink:0}}>{i}</div>);
}