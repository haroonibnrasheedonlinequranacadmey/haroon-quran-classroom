/* Classroom UI helpers, identity, controls and icons */
function updateAccessIdentity(){
  const role = roleInput ? roleInput.value : "student";
  const code = normalizeAccessCode(accessCodeInput ? accessCodeInput.value : "");
  const entry = getAccessEntry(role, code);
  const status = document.getElementById("accessStatus");

  if(entry){
    if(nameInput){
      nameInput.value = entry.name;
      nameInput.readOnly = true;
    }
    if(status){
      status.textContent = "Access verified · " + entry.name + " · Assigned room: " + entry.room;
      status.style.color = "#7ee1bd";
    }
  }else{
    if(nameInput){
      nameInput.value = "";
      nameInput.readOnly = true;
    }
    if(status){
      status.textContent = code ? "Access code not found for this role." : "";
      status.style.color = "#8da8b5";
    }
  }
}

if(roleInput){
  roleInput.addEventListener("change", updateAccessIdentity);
}
if(accessCodeInput){
  accessCodeInput.addEventListener("input", updateAccessIdentity);
  accessCodeInput.addEventListener("blur", updateAccessIdentity);
}

const joinBtn =
  document.getElementById("joinBtn");

const videoGrid =
  document.getElementById("videoGrid");

const cameraBtn =
  document.getElementById("cameraBtn");

const micBtn =
  document.getElementById("micBtn");

const screenBtn =
  document.getElementById("screenBtn");

const chatBtn =
  document.getElementById("chatBtn");

const leaveBtn =
  document.getElementById("leaveBtn");
const leaveBtn2 = document.getElementById("leaveBtn2");

const chatPanel =
  document.querySelector(".chat");

const messages =
  document.getElementById("messages");

const chatInput =
  document.getElementById("chatInput");

const sendChat =
  document.getElementById("sendChat");

const toast =
  document.getElementById("toast");

const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

if(emojiBtn && emojiPicker){
  emojiBtn.onclick = function(e){
    e.stopPropagation();
    emojiPicker.classList.toggle("show");
  };
  emojiPicker.querySelectorAll("button").forEach(btn=>{
    btn.onclick = function(){
      if(chatInput){
        chatInput.value += btn.textContent;
        chatInput.focus();
      }
      emojiPicker.classList.remove("show");
    };
  });
  document.addEventListener("click", function(e){
    if(!emojiPicker.contains(e.target) && e.target !== emojiBtn){
      emojiPicker.classList.remove("show");
    }
  });
}


/* =========================================================
   CONTROL ICONS
========================================================= */

const cameraOnIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 10l4.5-3A1 1 0 0 1 21 7.8v8.4a1 1 0 0 1-1.5.8L15 14"/>
  <rect x="3" y="6" width="12" height="12" rx="2"/>
</svg>
<span>Camera</span>
`;

const cameraOffIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3l18 18"/>
  <path d="M15 10l4.5-3A1 1 0 0 1 21 7.8v8.4a1 1 0 0 1-1.5.8L15 14"/>
  <path d="M9.6 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10"/>
</svg>
<span>Camera</span>
`;

const micOnIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="2" width="6" height="12" rx="3"/>
  <path d="M5 10a7 7 0 0 0 14 0"/>
  <path d="M12 19v3"/>
  <path d="M8 22h8"/>
</svg>
<span>Mic</span>
`;

const micOffIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3l18 18"/>
  <rect x="9" y="2" width="6" height="12" rx="3"/>
  <path d="M5 10a7 7 0 0 0 8.8 6.8"/>
  <path d="M12 19v3"/>
  <path d="M8 22h8"/>
</svg>
<span>Mic</span>
`;

const screenOnIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="14" rx="2"/>
  <path d="M8 22h8"/>
  <path d="M12 18v4"/>
</svg>
<span>Screen</span>
`;

const screenOffIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="14" rx="2"/>
  <path d="M8 22h8"/>
  <path d="M12 18v4"/>
</svg>
<span>Screen</span>
`;


function updateControlButtons(){

  cameraBtn.innerHTML =
    cameraOn ?
      cameraOnIcon :
      cameraOffIcon;

  micBtn.innerHTML =
    micOn ?
      micOnIcon :
      micOffIcon;

  screenBtn.innerHTML =
    screenOn ?
      screenOnIcon :
      screenOffIcon;


  cameraBtn.classList.toggle(
    "active",
    cameraOn
  );

  cameraBtn.classList.toggle(
    "off",
    !cameraOn
  );


  micBtn.classList.toggle(
    "active",
    micOn
  );

  micBtn.classList.toggle(
    "off",
    !micOn
  );


  screenBtn.classList.toggle(
    "screen-active",
    screenOn
  );

}


/* =========================================================
   SMALL TOAST
========================================================= */

function showToast(text){

  toast.textContent = text;

  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  },2200);
}


/* =========================================================
   JOIN SOUND
   ORIGINAL JOIN SOUND — UNCHANGED
========================================================= */

function playJoinSound(){

  try{

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if(!AudioContext) return;

    const ctx =
      new AudioContext();

    const now =
      ctx.currentTime;

    const gain =
      ctx.createGain();

    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(
      0,
      now
    );

    gain.gain.linearRampToValueAtTime(
      0.16,
      now + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 1.25
    );

    const osc1 =
      ctx.createOscillator();

    osc1.type = "sine";

    osc1.frequency.setValueAtTime(
      880,
      now
    );

    osc1.connect(gain);

    osc1.start(now);
    osc1.stop(now + 0.45);


    const osc2 =
      ctx.createOscillator();

    osc2.type = "sine";

    osc2.frequency.setValueAtTime(
      1175,
      now + 0.42
    );

    osc2.connect(gain);

    osc2.start(now + 0.42);
    osc2.stop(now + 1.2);

    setTimeout(()=>{
      ctx.close().catch(()=>{});
    },1600);

  }catch(e){

    console.log(
      "Join sound unavailable:",
      e
    );

  }

}


/* =========================================================
   MICROPHONE MUTE / UNMUTE SOUND
========================================================= */

function playMicToggleSound(isMuted){

  try{

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if(!AudioContext) return;

    const ctx =
      new AudioContext();

    const now =
      ctx.currentTime;

    const gain =
      ctx.createGain();

    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(
      0,
      now
    );

    gain.gain.linearRampToValueAtTime(
      0.11,
      now + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.32
    );


    const osc =
      ctx.createOscillator();

    osc.type = "sine";


    if(isMuted){

      osc.frequency.setValueAtTime(
        520,
        now
      );

      osc.frequency.exponentialRampToValueAtTime(
        260,
        now + 0.22
      );

    }else{

      osc.frequency.setValueAtTime(
        520,
        now
      );

      osc.frequency.exponentialRampToValueAtTime(
        880,
        now + 0.22
      );

    }


    osc.connect(gain);

    osc.start(now);

    osc.stop(
      now + 0.30
    );


    setTimeout(()=>{
      ctx.close().catch(()=>{});
    },500);

  }catch(e){

    console.log(
      "Mic toggle sound unavailable:",
      e
    );

  }

}
