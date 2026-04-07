export default function Card({children,style,onClick}){
  return(<div onClick={onClick} style={{background:"#141428",borderRadius:16,padding:14,marginBottom:10,border:"1px solid #1e1e3a",cursor:onClick?"pointer":"default",transition:"transform .1s",...(style||{})}}>{children}</div>);
}