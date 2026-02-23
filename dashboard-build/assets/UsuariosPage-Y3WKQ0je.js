import{j as e,m as h,A as O}from"./motion-CnUDAaLS.js";import{r as o}from"./react-vendor-DDxOQdDP.js";import{s as A,u as R}from"./index-DNvzsDZk.js";import{F as M}from"./FAB-0kAuwrai.js";import{u as k,w as G,E as H,a as W}from"./export-Dlusqx8k.js";import{L as q}from"./LoadingSpinner-QA4ydWnx.js";import"./supabase-BCnEU3Yj.js";import"./analytics-BMD6QFpy.js";function Z({user:t,index:s,onClick:c}){const m=t.role?.toLowerCase()||"default",d={administrador:"text-red-500 bg-red-500/10 border-red-500/30",admin:"text-red-500 bg-red-500/10 border-red-500/30",gestor:"text-blue-500 bg-blue-500/10 border-blue-500/30",vendedor:"text-green-500 bg-green-500/10 border-green-500/30",default:"text-gray-500 bg-gray-500/10 border-gray-500/30"},a=d[m]||d.default,n=p=>p?p.split(" ").map(i=>i[0]).slice(0,2).join("").toUpperCase():"?",b=p=>{const i=p?.toLowerCase()||"";return i.includes("admin")?"👑":i.includes("gestor")?"📊":i.includes("vendedor")?"💼":"👤"};return e.jsxs(h.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:s*.05},whileHover:{scale:1.02,y:-4},onClick:c,className:`
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
        `,children:n(t.nome)}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h3",{className:"text-lg lg:text-xl font-bold text-white mb-1 truncate",children:t.nome}),e.jsx("p",{className:"text-sm text-gray-500 mb-2 truncate",children:t.email}),e.jsxs("div",{className:`
            inline-flex items-center gap-1
            ${a}
            border
            rounded-lg
            px-2 py-1
            text-xs
            font-bold
            uppercase
            tracking-wide
          `,children:[b(t.role),t.role||"Usuário"]})]})]}),t.telefone&&e.jsx("div",{className:"mb-6 relative z-10",children:e.jsxs("div",{className:"bg-white/5 rounded-xl p-3 border border-white/5",children:[e.jsx("div",{className:"text-xs text-gray-500 font-semibold mb-1",children:"📱 Telefone"}),e.jsx("div",{className:"text-sm font-bold text-white",children:t.telefone})]})}),e.jsxs("div",{className:"flex items-center justify-between pt-4 border-t border-white/5 relative z-10",children:[e.jsx("span",{className:`text-xs font-semibold ${t.active?"text-green-500":"text-red-500"}`,children:t.active?"🟢 Ativo":"🔴 Inativo"}),e.jsx(h.button,{whileHover:{x:4},className:"text-blue-500 text-sm font-bold flex items-center gap-1",children:"Editar →"})]})]})}function Y({usuario:t,onClose:s}){const[c,m]=o.useState({role:t?.role||"Operador"}),[d,a]=o.useState(!1),[n,b]=o.useState(null),p=[{value:"Administrador",label:"Administrador",icon:"👑",color:"purple"},{value:"Diretor",label:"Diretor",icon:"🎯",color:"blue"},{value:"Gestor",label:"Gestor",icon:"📊",color:"green"},{value:"Consultor",label:"Consultor",icon:"💼",color:"orange"},{value:"Operador",label:"Operador",icon:"⚙️",color:"gray"}],i={purple:"bg-purple-500/10 border-purple-500/30 text-purple-400",blue:"bg-blue-500/10 border-blue-500/30 text-blue-400",green:"bg-green-500/10 border-green-500/30 text-green-400",orange:"bg-orange-500/10 border-orange-500/30 text-orange-400",gray:"bg-gray-500/10 border-gray-500/30 text-gray-400"},v=async()=>{if(t?.id){a(!0);try{const{error:l}=await A.from("usuarios").update({role:c.role}).eq("id",t.id);if(l)throw l;b({type:"success",message:"Perfil atualizado com sucesso!"}),setTimeout(()=>s(),1e3)}catch(l){console.error("Erro ao atualizar perfil:",l),b({type:"error",message:"Erro ao atualizar perfil: "+l.message})}finally{a(!1)}}};return e.jsx(O,{children:e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4",children:[e.jsx(h.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:s,className:"absolute inset-0 bg-black/60 backdrop-blur-sm"}),e.jsxs(h.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},className:"relative w-full max-w-md bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 overflow-hidden",children:[e.jsx("div",{className:"px-6 py-5 border-b border-white/5",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-lg",children:t?.nome?.charAt(0).toUpperCase()||"?"}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-white",children:"Editar Perfil"}),e.jsx("p",{className:"text-sm text-gray-400",children:t?.nome})]})]}),e.jsx("button",{onClick:s,className:"w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all",children:"✕"})]})}),e.jsxs("div",{className:"px-6 py-6 space-y-6",children:[e.jsxs("div",{className:"bg-white/5 rounded-2xl p-4 space-y-3",children:[e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Email"})}),e.jsx("p",{className:"text-sm text-gray-300",children:t?.email}),t?.telefone&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"flex items-center gap-2 mt-4",children:e.jsx("span",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Telefone"})}),e.jsx("p",{className:"text-sm text-gray-300",children:t.telefone})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-bold text-gray-400 mb-3",children:"Perfil de Acesso"}),e.jsx("div",{className:"space-y-2",children:p.map(l=>{const u=c.role===l.value;return e.jsxs(h.button,{type:"button",whileHover:{scale:1.02},whileTap:{scale:.98},onClick:()=>m({...c,role:l.value}),className:`
                        w-full
                        flex items-center gap-3
                        px-4 py-3
                        rounded-xl
                        border-2
                        transition-all
                        ${u?i[l.color]+" shadow-lg":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}
                      `,children:[e.jsx("span",{className:"text-2xl",children:l.icon}),e.jsx("span",{className:"flex-1 text-left font-bold",children:l.label}),u&&e.jsx(h.span,{initial:{scale:0},animate:{scale:1},className:"text-lg",children:"✓"})]},l.value)})})]}),e.jsx("div",{className:"bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4",children:e.jsxs("div",{className:"flex gap-3",children:[e.jsx("span",{className:"text-xl",children:"ℹ️"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-[#10B981] mb-1",children:"Sobre a mudança de perfil"}),e.jsx("p",{className:"text-xs text-gray-400",children:"Alterar o perfil do usuário irá modificar suas permissões de acesso ao sistema."})]})]})})]}),n&&e.jsx("div",{className:`px-6 py-2 border-t ${n.type==="success"?"bg-green-500/10 border-green-500/20":"bg-red-500/10 border-red-500/20"}`,children:e.jsx("p",{className:`text-xs font-bold ${n.type==="success"?"text-green-400":"text-red-400"}`,children:n.message})}),e.jsxs("div",{className:"px-6 py-4 border-t border-white/5 flex gap-3",children:[e.jsx(h.button,{whileHover:{scale:1.02},whileTap:{scale:.98},onClick:s,disabled:d,className:`
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
              `,children:"Cancelar"}),e.jsx(h.button,{whileHover:{scale:1.02},whileTap:{scale:.98},onClick:v,disabled:d||c.role===t?.role,className:`
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
              `,children:d?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"}),"Salvando..."]}):"✓ Salvar Alterações"})]})]})]})})}const J=t=>{try{if(console.log("📗 Iniciando export Excel..."),!t||t.length===0){console.warn("Nenhum usuário para exportar!");return}const s=t.map(n=>({Nome:n.nome||"","Cargo/Perfil":n.role||"",Email:n.email||"",Telefone:n.telefone||"",Status:n.ativo?"Ativo":"Inativo","Criado em":new Date(n.created_at).toLocaleDateString("pt-BR")})),c=k.json_to_sheet(s),m=k.book_new();k.book_append_sheet(m,c,"Usuários");const d=[{wch:30},{wch:15},{wch:30},{wch:15},{wch:10},{wch:12}];c["!cols"]=d;const a=`usuarios_${new Date().toISOString().split("T")[0]}.xlsx`;G(m,a),setTimeout(()=>{console.log("✅ Excel exportado:",a)},500)}catch(s){console.error("❌ Erro ao exportar Excel:",s),console.error("Erro ao exportar:",s.message)}},K=t=>{try{if(console.log("📕 Iniciando export PDF..."),!t||t.length===0){console.warn("Nenhum usuário para exportar!");return}const s=new H;s.setFontSize(18),s.setTextColor(238,123,77),s.text("Relatório de Usuários",14,20),s.setFontSize(10),s.setTextColor(100,100,100),s.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`,14,28),s.setFontSize(12),s.setTextColor(0,0,0),s.text(`Total de usuários: ${t.length}`,14,36);const c=t.map(a=>[(a.nome||"").substring(0,30),a.role||"",a.telefone||"",a.ativo?"Ativo":"Inativo"]);W(s,{startY:42,head:[["Nome","Cargo","Telefone","Status"]],body:c,theme:"grid",headStyles:{fillColor:[238,123,77],textColor:[0,0,0],fontStyle:"bold",fontSize:10},bodyStyles:{fontSize:9},alternateRowStyles:{fillColor:[245,245,245]},columnStyles:{0:{cellWidth:65},1:{cellWidth:38},2:{cellWidth:35},3:{cellWidth:20,halign:"center"}},margin:{left:14,right:14}});const m=s.getNumberOfPages();for(let a=1;a<=m;a++)s.setPage(a),s.setFontSize(8),s.setTextColor(150,150,150),s.text(`Página ${a} de ${m}`,s.internal.pageSize.getWidth()/2,s.internal.pageSize.getHeight()-10,{align:"center"});const d=`usuarios_${new Date().toISOString().split("T")[0]}.pdf`;s.save(d),setTimeout(()=>{console.log("✅ PDF exportado:",d)},500)}catch(s){console.error("❌ Erro ao exportar PDF:",s),console.error("Erro ao exportar:",s.message)}},y=20;function le(){const{usuario:t}=R(),[s,c]=o.useState([]),[m,d]=o.useState(!0),[a,n]=o.useState(""),[b,p]=o.useState(""),[i,v]=o.useState("todos"),[l,u]=o.useState(1),[B,E]=o.useState(null),[_,F]=o.useState(!1),[C,N]=o.useState(!1),w=o.useRef(null),P=o.useCallback(r=>{p(r),w.current&&clearTimeout(w.current),w.current=setTimeout(()=>n(r),300)},[]),S=o.useCallback(async()=>{if(!t?.tenant_id){console.log("❌ Sem tenant_id");return}d(!0);try{const{data:r,error:g}=await A.from("usuarios").select("id, nome, email, role, active, tenant_id, created_at").eq("tenant_id",t.tenant_id).order("created_at",{ascending:!1}).limit(500);g?(console.error("❌ Erro ao carregar usuários:",g),c([])):(console.log("✅ Usuários carregados:",r?.length),c(r||[]))}catch(r){console.error("❌ Erro inesperado:",r),c([])}finally{d(!1)}},[t?.tenant_id]);o.useEffect(()=>{t?.tenant_id&&S()},[t?.tenant_id,S]),o.useEffect(()=>{console.log("🔍 UsuariosPage - usuario:",t),console.log("🔍 UsuariosPage - tenant_id:",t?.tenant_id),console.log("🔍 UsuariosPage - usuarios:",s.length)},[t,s]),o.useEffect(()=>()=>{w.current&&clearTimeout(w.current)},[]),o.useEffect(()=>{u(1)},[a,i]);const f=s.filter(r=>{const g=r.nome?.toLowerCase().includes(a.toLowerCase())||r.email?.toLowerCase().includes(a.toLowerCase()),x=i==="todos"||r.role===i;return g&&x}),j=Math.ceil(f.length/y),U=f.slice((l-1)*y,l*y),z=(l-1)*y+1,D=Math.min(l*y,f.length),T=(r=null)=>{E(r),F(!0)},I=()=>{F(!1),E(null),S()},L=()=>{J(f),N(!1)},$=()=>{K(f),N(!1)};return m?e.jsx(q,{fullScreen:!1}):e.jsxs("div",{className:"text-white pb-32",children:[e.jsx("div",{className:"px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8",children:e.jsxs(h.div,{initial:{opacity:0,y:-20},animate:{opacity:1,y:0},transition:{duration:.5},children:[e.jsxs("h1",{className:"text-2xl lg:text-4xl font-light text-white mb-2",children:["Gestão de ",e.jsx("span",{className:"text-[#10B981] font-bold",children:"Usuários"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-16 h-0.5 bg-[#10B981] rounded-full"}),e.jsxs("p",{className:"text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]",children:[s.length," ",s.length===1?"usuário cadastrado":"usuários cadastrados"]})]})]})}),e.jsxs("div",{className:"px-4 lg:px-10 mb-8 space-y-4",children:[e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"text",placeholder:"🔍 Buscar usuário...",value:b,onChange:r=>P(r.target.value),className:`
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
            `}),b&&e.jsx("button",{onClick:()=>{p(""),n("")},className:"absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors",children:"✕"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide",children:["todos","Administrador","Diretor","Gestor","Consultor","Operador"].map(r=>e.jsxs(h.button,{whileTap:{scale:.95},onClick:()=>v(r),className:`
                  px-4 py-2.5 lg:px-5 lg:py-3
                  rounded-full
                  text-xs lg:text-sm
                  font-bold
                  uppercase
                  tracking-wide
                  whitespace-nowrap
                  transition-all
                  ${i===r?"bg-[#10B981]/30 text-white shadow-lg shadow-[#10B981]/20 border border-[#10B981]/50":"bg-[#0F172A] text-gray-400 border border-white/5 hover:bg-white/5"}
                `,children:[r==="todos"&&"⚪ Todos",r==="Administrador"&&"👑 Admin",r==="Diretor"&&"🎯 Diretor",r==="Gestor"&&"📊 Gestor",r==="Consultor"&&"💼 Consultor",r==="Operador"&&"⚙️ Operador"]},r))}),e.jsxs("div",{className:"relative flex-shrink-0",children:[e.jsxs(h.button,{whileHover:{scale:1.05},whileTap:{scale:.95},onClick:()=>N(!C),className:`
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
              `,children:[e.jsx("span",{className:"text-lg",children:"📥"}),e.jsx("span",{className:"hidden lg:inline",children:"Exportar"})]}),C&&e.jsxs(h.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},className:`
                  absolute right-0 top-full mt-2
                  bg-[#0F172A]
                  border border-white/10
                  rounded-xl
                  shadow-2xl
                  overflow-hidden
                  z-50
                  min-w-[200px]
                `,children:[e.jsxs("button",{onClick:L,className:`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-green-500/10
                    transition-colors
                  `,children:[e.jsx("span",{className:"text-xl",children:"📗"}),e.jsx("span",{children:"Excel (.xlsx)"})]}),e.jsxs("button",{onClick:$,className:`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-red-500/10
                    transition-colors
                    border-t border-white/5
                  `,children:[e.jsx("span",{className:"text-xl",children:"📕"}),e.jsx("span",{children:"PDF (.pdf)"})]})]})]})]})]}),e.jsx("div",{className:"px-4 lg:px-10",children:f.length===0?e.jsxs(h.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},className:"text-center py-20",children:[e.jsx("div",{className:"text-6xl mb-4 opacity-30",children:"👥"}),e.jsx("p",{className:"text-xl text-gray-400 mb-2",children:a||i!=="todos"?"Nenhum usuário encontrado":"Nenhum usuário cadastrado"}),e.jsx("p",{className:"text-sm text-gray-600 mb-6",children:a||i!=="todos"?"Tente ajustar os filtros":"Comece criando seu primeiro usuário!"}),!a&&i==="todos"&&e.jsxs("p",{className:"text-xs text-white/30 mt-2",children:["tenant_id: ",t?.tenant_id]}),(a||i!=="todos")&&e.jsx("button",{onClick:()=>{p(""),n(""),v("todos")},className:"px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all",children:"Limpar Filtros"})]}):e.jsxs("div",{className:"bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden",children:[e.jsx("div",{className:"p-4 lg:p-6",children:e.jsx("div",{className:"grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6",children:U.map((r,g)=>e.jsx(Z,{user:r,index:g,onClick:()=>T(r)},r.id))})}),e.jsx("div",{className:"px-4 py-4 border-t border-white/5 bg-[#0F172A] rounded-b-3xl",children:e.jsxs("div",{className:"flex flex-col lg:flex-row items-center justify-between gap-4",children:[e.jsxs("p",{className:"text-xs text-gray-600",children:["Exibindo ",e.jsx("span",{className:"text-white font-bold",children:z})," a"," ",e.jsx("span",{className:"text-white font-bold",children:D})," de"," ",e.jsx("span",{className:"text-white font-bold",children:f.length})," itens"]}),j>1&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>u(r=>Math.max(1,r-1)),disabled:l===1,className:"px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed",children:"← Anterior"}),e.jsx("div",{className:"flex items-center gap-1",children:[...Array(j)].map((r,g)=>{const x=g+1;return x===1||x===j||x>=l-1&&x<=l+1?e.jsx("button",{onClick:()=>u(x),className:`
                                w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${l===x?"bg-[#10B981] text-black":"bg-white/5 text-gray-400 hover:bg-white/10"}
                              `,children:x},x):x===l-2||x===l+2?e.jsx("span",{className:"text-gray-600",children:"..."},x):null})}),e.jsx("button",{onClick:()=>u(r=>Math.min(j,r+1)),disabled:l===j,className:"px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed",children:"Próxima →"})]}),e.jsx("p",{className:"text-[9px] text-gray-700 font-black uppercase tracking-widest",children:"LeadCapture Pro · Zafalão Tech"})]})})]})}),e.jsx(M,{onClick:()=>T(null)}),_&&e.jsx(Y,{usuario:B,onClose:I}),C&&e.jsx("div",{className:"fixed inset-0 z-40",onClick:()=>N(!1)})]})}export{le as default};
