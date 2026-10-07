
window.addEventListener("load",function(){
  var b=document.getElementById("joinBtn");
  if(!b) return;
  b.addEventListener("click",function(){
    if(b.textContent.trim()==="Join Class"){
      setTimeout(function(){
        if(b.textContent.trim()==="Join Class" && !window.supabase){
          b.disabled=false;
          var t=document.getElementById("toast");
          if(t){ t.textContent="Please wait for the classroom to load"; t.style.display="block"; }
        }
      },50);
    }
  },true);
});
