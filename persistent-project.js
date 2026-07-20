(function(){
  function bindProject(){
    const state=window.projectState;
    if(!state||state.__persistentBound)return;
    state.__persistentBound=true;
    try{localStorage.setItem('researchos-active-project',JSON.stringify({brief:state.brief,plan:state.plan}));}catch{}
    document.querySelectorAll('.nav-item').forEach(button=>button.onclick=()=>renderProjectView(button.dataset.view));
    setTimeout(()=>{if(window.projectState===state&&workspace.textContent.includes('Workspace populated'))renderProjectView('overview');},0);
  }
  try{const saved=localStorage.getItem('researchos-active-project');if(saved){window.projectState=JSON.parse(saved);setTimeout(()=>{document.querySelectorAll('.nav-item').forEach(button=>button.onclick=()=>renderProjectView(button.dataset.view));renderProjectView('overview');},0);}}catch{}
  setInterval(bindProject,100);
})();
