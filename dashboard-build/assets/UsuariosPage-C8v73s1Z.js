import{j as e,m,A as M}from"./motion-9d3Db09n.js";import{r as o}from"./react-vendor-D-pGcriG.js";import{s as B,u as O}from"./index-D65w46EB.js";import{F as G}from"./FAB-CK3cMQIT.js";import{u as E,w as H,E as W,a as q}from"./export-Byr5tq-O.js";import{L as Z}from"./LoadingSpinner-DVBrC7GW.js";import"./supabase-BCnEU3Yj.js";import"./analytics-BMD6QFpy.js";function Y({user:t,index:s,onClick:n}){const x=t.role?.toLowerCase()||"default",h={administrador:"text-red-500 bg-red-500/10 border-red-500/30",admin:"text-red-500 bg-red-500/10 border-red-500/30",gestor:"text-blue-500 bg-blue-500/10 border-blue-500/30",vendedor:"text-green-500 bg-green-500/10 border-green-500/30",default:"text-gray-500 bg-gray-500/10 border-gray-500/30"},l=h[x]||h.default,a=u=>u?u.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase():"?",b=u=>{const p=u?.toLowerCase()||"";return p.includes("admin")?"👑":p.includes("gestor")?"📊":p.includes("vendedor")?"💼":"👤"};return e.jsxs(m.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:s*.05},whileHover:{scale:1.02,y:-4},onClick:n,className:`
        bg-[#0F172A]
        border border-white/5
        rounded-3xl
        p-6 lg:p-8
        cursor-pointer
        transition-all
        hover:border-[#10B981]/30
        hover:shadow-xl
        hover:shadow-[#10B981]/10
        relative
        overflow-hidden
      `,children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"}),e.jsxs("div",{className:"flex items-start gap-4 mb-6 relative z-10",children:[e.jsx("div",{className:`
          w-16 h-16 lg:w-20 lg:h-20
          rounded-2xl
          bg-gradient-to-br from-[#10B981] to-[#059669]
          flex items-center justify-center
          text-xl lg:text-2xl
          font-black
          text-black
          flex-shrink-0
        `,children:a(t.nome)}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h3",{className:"text-lg lg:text-xl font-bold text-white mb-1 truncate",children:t.nome}),e.jsx("p",{className:"text-sm text-gray-500 mb-2 truncate",children:t.email}),e.jsxs("div",{className:`
            inline-flex items-center gap-1
            ${l}
            border
            rounded-lg
            px-2 py-1
            text-xs
            font-bold
            uppercase
            tracking-wide
          `,children:[b(t.role),t.role||"Usuário"]})]})]}),t.telefone&&e.jsx("div",{className:"mb-6 relative z-10",children:e.jsxs("div",{className:"bg-white/5 rounded-xl p-3 border border-white/5",children:[e.jsx("div",{className:"text-xs text-gray-500 font-semibold mb-1",children:"📱 Telefone"}),e.jsx("div",{className:"text-sm font-bold text-white",children:t.telefone})]})}),e.jsxs("div",{className:"flex items-center justify-between pt-4 border-t border-white/5 relative z-10",children:[e.jsx("span",{className:`text-xs font-semibold ${t.active?"text-green-500":"text-red-500"}`,children:t.active?"🟢 Ativo":"🔴 Inativo"}),e.jsx(m.button,{whileHover:{x:4},className:"text-blue-500 text-sm font-bold flex items-center gap-1",children:"Editar →"})]})]})}function J({usuario:t,onClose:s}){const[n,x]=o.useState({role:t?.role||"Consultor"}),[h,l]=o.useState(!1),[a,b]=o.useState(null),u=[{value:"Administrador",label:"Administrador",icon:"👑",color:"purple"},{value:"Diretor",label:"Diretor",icon:"🎯",color:"blue"},{value:"Gestor",label:"Gestor",icon:"📊",color:"green"},{value:"Consultor",label:"Consultor",icon:"💼",color:"orange"},{value:"Cliente",label:"Cliente",icon:"👤",color:"gray"}],p={purple:"bg-purple-500/10 border-purple-500/30 text-purple-400",blue:"bg-blue-500/10 border-blue-500/30 text-blue-400",green:"bg-green-500/10 border-green-500/30 text-green-400",orange:"bg-orange-500/10 border-orange-500/30 text-orange-400",gray:"bg-gray-500/10 border-gray-500/30 text-gray-400"},g=async()=>{if(t?.id){l(!0);try{const{error:c}=await B.from("usuarios").update({role:n.role}).eq("id",t.id);if(c)throw c;b({type:"success",message:"Perfil atualizado com sucesso!"}),setTimeout(()=>s(),1e3)}catch(c){console.error("Erro ao atualizar perfil:",c),b({type:"error",message:"Erro ao atualizar perfil: "+c.message})}finally{l(!1)}}};return e.jsx(M,{children:e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4",children:[e.jsx(m.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:s,className:"absolute inset-0 bg-black/60 backdrop-blur-sm"}),e.jsxs(m.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},className:"relative w-full max-w-md bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 overflow-hidden",children:[e.jsx("div",{className:"px-6 py-5 border-b border-white/5",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-lg",children:t?.nome?.charAt(0).toUpperCase()||"?"}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-white",children:"Editar Perfil"}),e.jsx("p",{className:"text-sm text-gray-400",children:t?.nome})]})]}),e.jsx("button",{onClick:s,className:"w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all",children:"✕"})]})}),e.jsxs("div",{className:"px-6 py-6 space-y-6",children:[e.jsxs("div",{className:"bg-white/5 rounded-2xl p-4 space-y-3",children:[e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Email"})}),e.jsx("p",{className:"text-sm text-gray-300",children:t?.email}),t?.telefone&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"flex items-center gap-2 mt-4",children:e.jsx("span",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Telefone"})}),e.jsx("p",{className:"text-sm text-gray-300",children:t.telefone})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-bold text-gray-400 mb-3",children:"Perfil de Acesso"}),e.jsx("div",{className:"space-y-2",children:u.map(c=>{const d=n.role===c.value;return e.jsxs(m.button,{type:"button",whileHover:{scale:1.02},whileTap:{scale:.98},onClick:()=>x({...n,role:c.value}),className:`
                        w-full
                        flex items-center gap-3
                        px-4 py-3
                        rounded-xl
                        border-2
                        transition-all
                        ${d?p[c.color]+" shadow-lg":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}
                      `,children:[e.jsx("span",{className:"text-2xl",children:c.icon}),e.jsx("span",{className:"flex-1 text-left font-bold",children:c.label}),d&&e.jsx(m.span,{initial:{scale:0},animate:{scale:1},className:"text-lg",children:"✓"})]},c.value)})})]}),e.jsx("div",{className:"bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4",children:e.jsxs("div",{className:"flex gap-3",children:[e.jsx("span",{className:"text-xl",children:"ℹ️"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-[#10B981] mb-1",children:"Sobre a mudança de perfil"}),e.jsx("p",{className:"text-xs text-gray-400",children:"Alterar o perfil do usuário irá modificar suas permissões de acesso ao sistema."})]})]})})]}),a&&e.jsx("div",{className:`px-6 py-2 border-t ${a.type==="success"?"bg-green-500/10 border-green-500/20":"bg-red-500/10 border-red-500/20"}`,children:e.jsx("p",{className:`text-xs font-bold ${a.type==="success"?"text-green-400":"text-red-400"}`,children:a.message})}),e.jsxs("div",{className:"px-6 py-4 border-t border-white/5 flex gap-3",children:[e.jsx(m.button,{whileHover:{scale:1.02},whileTap:{scale:.98},onClick:s,disabled:h,className:`
                flex-1
                px-6 py-3
                rounded-xl
                bg-white/5
                border border-white/10
                text-white
                font-bold
                hover:bg-white/10
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
              `,children:"Cancelar"}),e.jsx(m.button,{whileHover:{scale:1.02},whileTap:{scale:.98},onClick:g,disabled:h||n.role===t?.role,className:`
                flex-1
                px-6 py-3
                rounded-xl
                bg-gradient-to-r from-[#10B981] to-[#059669]
                text-black
                font-bold
                hover:shadow-lg hover:shadow-[#10B981]/20
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              `,children:h?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"}),"Salvando..."]}):"✓ Salvar Alterações"})]})]})]})})}const K=t=>{try{if(console.log("📗 Iniciando export Excel..."),!t||t.length===0){console.warn("Nenhum usuário para exportar!");return}const s=t.map(a=>({Nome:a.nome||"","Cargo/Perfil":a.role||"",Email:a.email||"",Telefone:a.telefone||"",Status:a.ativo?"Ativo":"Inativo","Criado em":new Date(a.created_at).toLocaleDateString("pt-BR")})),n=E.json_to_sheet(s),x=E.book_new();E.book_append_sheet(x,n,"Usuários");const h=[{wch:30},{wch:15},{wch:30},{wch:15},{wch:10},{wch:12}];n["!cols"]=h;const l=`usuarios_${new Date().toISOString().split("T")[0]}.xlsx`;H(x,l),setTimeout(()=>{console.log("✅ Excel exportado:",l)},500)}catch(s){console.error("❌ Erro ao exportar Excel:",s),console.error("Erro ao exportar:",s.message)}},Q=t=>{try{if(console.log("📕 Iniciando export PDF..."),!t||t.length===0){console.warn("Nenhum usuário para exportar!");return}const s=new W;s.setFontSize(18),s.setTextColor(238,123,77),s.text("Relatório de Usuários",14,20),s.setFontSize(10),s.setTextColor(100,100,100),s.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`,14,28),s.setFontSize(12),s.setTextColor(0,0,0),s.text(`Total de usuários: ${t.length}`,14,36);const n=t.map(l=>[(l.nome||"").substring(0,30),l.role||"",l.telefone||"",l.ativo?"Ativo":"Inativo"]);q(s,{startY:42,head:[["Nome","Cargo","Telefone","Status"]],body:n,theme:"grid",headStyles:{fillColor:[238,123,77],textColor:[0,0,0],fontStyle:"bold",fontSize:10},bodyStyles:{fontSize:9},alternateRowStyles:{fillColor:[245,245,245]},columnStyles:{0:{cellWidth:65},1:{cellWidth:38},2:{cellWidth:35},3:{cellWidth:20,halign:"center"}},margin:{left:14,right:14}});const x=s.getNumberOfPages();for(let l=1;l<=x;l++)s.setPage(l),s.setFontSize(8),s.setTextColor(150,150,150),s.text(`Página ${l} de ${x}`,s.internal.pageSize.getWidth()/2,s.internal.pageSize.getHeight()-10,{align:"center"});const h=`usuarios_${new Date().toISOString().split("T")[0]}.pdf`;s.save(h),setTimeout(()=>{console.log("✅ PDF exportado:",h)},500)}catch(s){console.error("❌ Erro ao exportar PDF:",s),console.error("Erro ao exportar:",s.message)}},v=20;function oe(){const{usuario:t,isPlatformAdmin:s}=O(),[n,x]=o.useState([]),[h,l]=o.useState(!0),[a,b]=o.useState(""),[u,p]=o.useState(""),[g,c]=o.useState("todos"),[d,N]=o.useState(1),[P,A]=o.useState(null),[_,F]=o.useState(!1),[S,C]=o.useState(!1),j=o.useRef(null),U=o.useCallback(r=>{p(r),j.current&&clearTimeout(j.current),j.current=setTimeout(()=>b(r),300)},[]),k=o.useCallback(async()=>{if(!t?.tenant_id&&!s()){console.log("Sem tenant_id");return}l(!0);try{let r=B.from("usuarios").select("id, nome, email, role, active, tenant_id, created_at").order("created_at",{ascending:!1}).limit(500);s()||(r=r.eq("tenant_id",t.tenant_id));const{data:f,error:i}=await r;i?(console.error("Erro ao carregar usuarios:",i),x([])):(console.log("Usuarios carregados:",f?.length),x(f||[]))}catch(r){console.error("Erro inesperado:",r),x([])}finally{l(!1)}},[t?.tenant_id]);o.useEffect(()=>{t?.tenant_id&&k()},[t?.tenant_id,k]),o.useEffect(()=>{console.log("🔍 UsuariosPage - usuario:",t),console.log("🔍 UsuariosPage - tenant_id:",t?.tenant_id),console.log("🔍 UsuariosPage - usuarios:",n.length)},[t,n]),o.useEffect(()=>()=>{j.current&&clearTimeout(j.current)},[]),o.useEffect(()=>{N(1)},[a,g]);const w=n.filter(r=>{const f=r.nome?.toLowerCase().includes(a.toLowerCase())||r.email?.toLowerCase().includes(a.toLowerCase()),i=g==="todos"||r.role===g;return f&&i}),y=Math.ceil(w.length/v),z=w.slice((d-1)*v,d*v),D=(d-1)*v+1,I=Math.min(d*v,w.length),T=(r=null)=>{A(r),F(!0)},L=()=>{F(!1),A(null),k()},$=()=>{K(w),C(!1)},R=()=>{Q(w),C(!1)};return h?e.jsx(Z,{fullScreen:!1}):e.jsxs("div",{className:"text-white pb-32",children:[e.jsx("div",{className:"px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8",children:e.jsxs(m.div,{initial:{opacity:0,y:-20},animate:{opacity:1,y:0},transition:{duration:.5},children:[e.jsxs("h1",{className:"text-2xl lg:text-4xl font-light text-white mb-2",children:["Gestão de ",e.jsx("span",{className:"text-[#10B981] font-bold",children:"Usuários"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-16 h-0.5 bg-[#10B981] rounded-full"}),e.jsxs("p",{className:"text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]",children:[n.length," ",n.length===1?"usuário cadastrado":"usuários cadastrados"]})]})]})}),e.jsxs("div",{className:"px-4 lg:px-10 mb-8 space-y-4",children:[e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"text",placeholder:"🔍 Buscar usuário...",value:u,onChange:r=>U(r.target.value),className:`
              w-full
              bg-[#0F172A]
              border border-white/5
              rounded-2xl
              px-5 py-4
              lg:px-6 lg:py-4
              text-sm lg:text-base
              text-white
              placeholder:text-gray-600
              focus:outline-none
              focus:border-[#10B981]/50
              focus:ring-2
              focus:ring-[#10B981]/20
              transition-all
            `}),u&&e.jsx("button",{onClick:()=>{p(""),b("")},className:"absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors",children:"✕"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide",children:["todos","Administrador","Diretor","Gestor","Consultor","Operador"].map(r=>e.jsxs(m.button,{whileTap:{scale:.95},onClick:()=>c(r),className:`
                  px-4 py-2.5 lg:px-5 lg:py-3
                  rounded-full
                  text-xs lg:text-sm
                  font-bold
                  uppercase
                  tracking-wide
                  whitespace-nowrap
                  transition-all
                  ${g===r?"bg-[#10B981]/30 text-white shadow-lg shadow-[#10B981]/20 border border-[#10B981]/50":"bg-[#0F172A] text-gray-400 border border-white/5 hover:bg-white/5"}
                `,children:[r==="todos"&&"⚪ Todos",r==="Administrador"&&"👑 Admin",r==="Diretor"&&"🎯 Diretor",r==="Gestor"&&"📊 Gestor",r==="Consultor"&&"💼 Consultor",r==="Operador"&&"⚙️ Operador"]},r))}),e.jsxs("div",{className:"relative flex-shrink-0",children:[e.jsxs(m.button,{whileHover:{scale:1.05},whileTap:{scale:.95},onClick:()=>C(!S),className:`
                flex items-center gap-2
                px-4 py-2.5 lg:px-5 lg:py-3
                bg-[#0F172A]
                border border-white/10
                rounded-xl
                text-sm font-bold
                text-white
                hover:bg-white/5
                transition-all
                whitespace-nowrap
              `,children:[e.jsx("span",{className:"text-lg",children:"📥"}),e.jsx("span",{className:"hidden lg:inline",children:"Exportar"})]}),S&&e.jsxs(m.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},className:`
                  absolute right-0 top-full mt-2
                  bg-[#0F172A]
                  border border-white/10
                  rounded-xl
                  shadow-2xl
                  overflow-hidden
                  z-50
                  min-w-[200px]
                `,children:[e.jsxs("button",{onClick:$,className:`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-green-500/10
                    transition-colors
                  `,children:[e.jsx("span",{className:"text-xl",children:"📗"}),e.jsx("span",{children:"Excel (.xlsx)"})]}),e.jsxs("button",{onClick:R,className:`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-red-500/10
                    transition-colors
                    border-t border-white/5
                  `,children:[e.jsx("span",{className:"text-xl",children:"📕"}),e.jsx("span",{children:"PDF (.pdf)"})]})]})]})]})]}),e.jsx("div",{className:"px-4 lg:px-10",children:w.length===0?e.jsxs(m.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},className:"text-center py-20",children:[e.jsx("div",{className:"text-6xl mb-4 opacity-30",children:"👥"}),e.jsx("p",{className:"text-xl text-gray-400 mb-2",children:a||g!=="todos"?"Nenhum usuário encontrado":"Nenhum usuário cadastrado"}),e.jsx("p",{className:"text-sm text-gray-600 mb-6",children:a||g!=="todos"?"Tente ajustar os filtros":"Comece criando seu primeiro usuário!"}),!a&&g==="todos"&&e.jsxs("p",{className:"text-xs text-white/30 mt-2",children:["tenant_id: ",t?.tenant_id]}),(a||g!=="todos")&&e.jsx("button",{onClick:()=>{p(""),b(""),c("todos")},className:"px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all",children:"Limpar Filtros"})]}):e.jsxs("div",{className:"bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden",children:[e.jsx("div",{className:"p-4 lg:p-6",children:e.jsx("div",{className:"grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6",children:z.map((r,f)=>e.jsx(Y,{user:r,index:f,onClick:()=>T(r)},r.id))})}),e.jsx("div",{className:"px-4 py-4 border-t border-white/5 bg-[#0F172A] rounded-b-3xl",children:e.jsxs("div",{className:"flex flex-col lg:flex-row items-center justify-between gap-4",children:[e.jsxs("p",{className:"text-xs text-gray-600",children:["Exibindo ",e.jsx("span",{className:"text-white font-bold",children:D})," a"," ",e.jsx("span",{className:"text-white font-bold",children:I})," de"," ",e.jsx("span",{className:"text-white font-bold",children:w.length})," itens"]}),y>1&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>N(r=>Math.max(1,r-1)),disabled:d===1,className:"px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed",children:"← Anterior"}),e.jsx("div",{className:"flex items-center gap-1",children:[...Array(y)].map((r,f)=>{const i=f+1;return i===1||i===y||i>=d-1&&i<=d+1?e.jsx("button",{onClick:()=>N(i),className:`
                                w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${d===i?"bg-[#10B981] text-black":"bg-white/5 text-gray-400 hover:bg-white/10"}
                              `,children:i},i):i===d-2||i===d+2?e.jsx("span",{className:"text-gray-600",children:"..."},i):null})}),e.jsx("button",{onClick:()=>N(r=>Math.min(y,r+1)),disabled:d===y,className:"px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed",children:"Próxima →"})]}),e.jsx("p",{className:"text-[9px] text-gray-700 font-black uppercase tracking-widest",children:"LeadCapture Pro · Zafalão Tech"})]})})]})}),e.jsx(G,{onClick:()=>T(null)}),_&&e.jsx(J,{usuario:P,onClose:L}),S&&e.jsx("div",{className:"fixed inset-0 z-40",onClick:()=>C(!1)})]})}export{oe as default};
