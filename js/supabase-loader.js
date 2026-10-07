
(function(){
  if (window.supabase) return;
  var s=document.createElement("script");
  s.src="https://unpkg.com/@supabase/supabase-js@2";
  s.onload=function(){ window.dispatchEvent(new Event("supabase-ready")); };
  document.head.appendChild(s);
})();
