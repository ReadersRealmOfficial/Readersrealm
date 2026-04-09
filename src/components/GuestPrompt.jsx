import { useNavigate } from "react-router-dom";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", teal:"#35605A" };

export default function GuestPrompt({ message, onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"18px",maxWidth:"400px",width:"100%",padding:"32px",textAlign:"center",border:"1px solid rgba(194,122,58,0.2)" }}>
        <div style={{ fontSize:"36px",marginBottom:"12px" }}>🔐</div>
        <h3 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,marginBottom:"8px",fontSize:"18px" }}>Members Only</h3>
        <p style={{ color:"rgba(232,220,203,0.65)",fontSize:"13px",lineHeight:1.7,marginBottom:"20px" }}>
          {message || "This feature is only available for registered users. Create a free account to unlock all features!"}
        </p>
        <div style={{ display:"flex",gap:"8px",justifyContent:"center" }}>
          <button onClick={()=>navigate("/")} style={{ padding:"11px 24px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",color:"#fff",borderRadius:"10px",fontSize:"14px",fontWeight:700,cursor:"pointer" }}>Sign Up Free</button>
          <button onClick={onClose} style={{ padding:"11px 24px",background:"rgba(232,220,203,0.08)",border:"1px solid rgba(232,220,203,0.15)",borderRadius:"10px",color:C.cream,fontSize:"14px",fontWeight:600,cursor:"pointer" }}>Maybe Later</button>
        </div>
      </div>
    </div>
  );
}
