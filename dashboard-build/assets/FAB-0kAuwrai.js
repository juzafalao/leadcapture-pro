import{j as e,m as s}from"./motion-CnUDAaLS.js";import{u as i}from"./react-vendor-DDxOQdDP.js";function r({onClick:t}){const n=i(),a=()=>n.pathname.includes("marcas")?"Marca":n.pathname.includes("segmentos")?"Segmento":n.pathname.includes("usuarios")?"Usuário":"Novo";return e.jsxs(s.button,{initial:{scale:0,opacity:0},animate:{scale:1,opacity:1},whileHover:{scale:1.1},whileTap:{scale:.9},onClick:t,className:`
        fixed
        bottom-8
        right-8
        w-16
        h-16
        lg:w-auto
        lg:h-auto
        lg:px-6
        lg:py-4
        bg-[#10B981]
        hover:bg-[#059669]
        text-black
        rounded-full
        shadow-2xl
        shadow-[#10B981]/50
        flex
        items-center
        justify-center
        gap-2
        font-bold
        transition-all
        z-40
      `,children:[e.jsx("span",{className:"text-2xl",children:"+"}),e.jsx("span",{className:"hidden lg:inline uppercase tracking-wide",children:a()})]})}export{r as F};
