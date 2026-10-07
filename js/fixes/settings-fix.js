
/*
  DELETE / DEACTIVATE FEATURE:
  The Manage People > Delete button sets active=false.
  Run the updated SQL policy above once in Supabase SQL Editor.
  HR-001 is protected and cannot be deleted.
  The old code then fails the active=true join check.
*/

/* HR-001 Settings reliability fix */
(function(){
  function forceHR001Settings(){
    var codeEl=document.getElementById('accessCodeInput');
    var code=codeEl ? String(codeEl.value||'').trim().toUpperCase() : '';
    var roleEl=document.getElementById('roleInput');
    var role=roleEl ? String(roleEl.value||'').trim().toLowerCase() : '';
    var modal=document.getElementById('settingsModal');
    if(code==='HR-001' && role==='teacher' && modal){
      modal.classList.add('show');
      modal.style.setProperty('display','flex','important');
      modal.setAttribute('aria-hidden','false');
    }
  }
  document.addEventListener('click',function(e){
    var b=e.target && e.target.closest ? e.target.closest('#settingsButton') : null;
    if(!b) return;
    forceHR001Settings();
    setTimeout(forceHR001Settings,50);
  },true);
})();
