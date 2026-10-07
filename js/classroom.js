/* Live classroom: WebRTC, Supabase Realtime, chat, screen share, recording, settings */
/* =========================================================
   CREATE CHANNEL
========================================================= */

const pendingChannelHandlers = [];
function channelOn(){
  const args = arguments;
  if(channel){
    return channel.on.apply(channel,args);
  }
  pendingChannelHandlers.push(Array.from(args));
  return channel;
}
function attachPendingChannelHandlers(){
  if(!channel) return;
  while(pendingChannelHandlers.length){
    const args = pendingChannelHandlers.shift();
    channel.on.apply(channel,args);
  }
}

function createRoomChannel(){
  if(!initSupabase()) return null;
  return supabaseClient.channel(
    ROOM_ID,
    {
      config:{
        broadcast:{
          self:false
        },
        presence:{
          key:myId
        }
      }
    }
  );
}



/* =========================================================
   BROADCAST HELPER
========================================================= */

async function sendEvent(
  event,
  payload
){

  if(!channel) return;

  try{

    await channel.send({
      type:"broadcast",
      event:event,
      payload:payload
    });

  }catch(e){

    console.log(
      "Broadcast error:",
      e
    );

  }

}


/* =========================================================
   NAME / TILE HELPERS
========================================================= */

function safeName(name){

  if(!name) return "Participant";

  return name
    .toString()
    .substring(0,40);
}


const TEACHER_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#123d55"/><stop offset="1" stop-color="#07927e"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><circle cx="50" cy="37" r="19" fill="#d8a47b"/><path d="M29 37c1-18 12-27 22-27 14 0 24 11 23 29-6-8-13-12-24-12-8 0-15 4-21 10z" fill="#17202a"/><path d="M27 91c3-23 13-32 23-32s21 9 24 32" fill="#142b3a"/><path d="M39 39c4 3 18 3 23 0" fill="none" stroke="#5f3927" stroke-width="2" stroke-linecap="round"/></svg>`);
const STUDENT_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#253b61"/><stop offset="1" stop-color="#1976d2"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><circle cx="50" cy="39" r="18" fill="#d9a77f"/><path d="M31 38c1-17 10-27 20-27 12 0 21 9 21 27-6-7-13-10-21-10-8 0-14 3-20 10z" fill="#20252c"/><path d="M25 91c3-22 14-31 25-31s22 9 25 31" fill="#1b2738"/><path d="M40 42c4 2 16 2 20 0" fill="none" stroke="#603c2a" stroke-width="2" stroke-linecap="round"/></svg>`);
function setParticipantAvatar(kind, img){ if(img) img.src = kind==='teacher' ? TEACHER_AVATAR : STUDENT_AVATAR; }
setParticipantAvatar('teacher',document.querySelector('.teacherAvatar'));
setParticipantAvatar('student',document.querySelector('.studentAvatar'));

function createBrandBackground(){

  const bg =
    document.createElement("div");

  bg.className =
    "brandBackground";

  bg.innerHTML = `
    <div class="brandInner">
      <div class="quran">HR</div>
      <h3>Haroon Ibn Rasheed</h3>
      <p>Online Quran Academy</p>
    </div>
  `;

  return bg;
}


/* =========================================================
   LOCAL TILE
========================================================= */

function createLocalTile(){

  let tile =
    document.getElementById(
      "tile-" + myId
    );

  if(tile) return tile;

  tile =
    document.createElement("div");

  tile.className =
    "tile local-tile";

  tile.id =
    "tile-" + myId;

  tile.innerHTML = `

    <video
      class="cameraVideo"
      autoplay
      muted
      playsinline
    ></video>

    <video
      class="screenVideo"
      autoplay
      muted
      playsinline
    ></video>

  `;

  tile.appendChild(
    createBrandBackground()
  );

  const nameLabel =
    document.createElement("div");

  nameLabel.className =
    "nameLabel";

  nameLabel.textContent =
    myName;

  tile.appendChild(
    nameLabel
  );

  videoGrid.appendChild(tile);

  const cameraVideo =
    tile.querySelector(
      ".cameraVideo"
    );

  cameraVideo.srcObject =
    localStream;

  cameraVideo.play()
    .catch(()=>{});

  return tile;
}


/* =========================================================
   REMOTE TILE
========================================================= */

function createRemoteTile(
  peerId,
  peerName
){

  let tile =
    document.getElementById(
      "tile-" + peerId
    );

  if(tile){

    const label =
      tile.querySelector(
        ".nameLabel"
      );

    if(label){
      label.textContent =
        safeName(peerName);
    }

    return tile;
  }


  tile =
    document.createElement("div");

  tile.className =
    "tile";

  tile.id =
    "tile-" + peerId;

  tile.dataset.peerId =
    peerId;

  tile.innerHTML = `

    <video
      class="cameraVideo"
      autoplay
      playsinline
    ></video>

    <video
      class="screenVideo"
      autoplay
      muted
      playsinline
    ></video>

  `;

  tile.appendChild(
    createBrandBackground()
  );


  const nameLabel =
    document.createElement("div");

  nameLabel.className =
    "nameLabel";

  nameLabel.textContent =
    safeName(peerName);

  tile.appendChild(
    nameLabel
  );


  videoGrid.appendChild(tile);

  return tile;
}


/* =========================================================
   LAYOUT
========================================================= */

function updateScreenLayout(){

  const sharingTile =
    document.querySelector(
      ".tile.screen-sharing"
    );

  if(sharingTile){

    videoGrid.classList.add(
      "has-screen-share"
    );

  }else{

    videoGrid.classList.remove(
      "has-screen-share"
    );

  }

}


/* =========================================================
   CAMERA / MIC STATE
========================================================= */

function applyLocalState(){

  const tile =
    document.getElementById(
      "tile-" + myId
    );

  if(!tile) return;

  tile.classList.toggle(
    "camera-off",
    !cameraOn
  );
}


/* =========================================================
   JOIN
========================================================= */

joinBtn.onclick =
async function(){
  if(!initSupabase()){
    showToast("Connecting to classroom...");
    await new Promise(r=>setTimeout(r,800));
    if(!initSupabase()){
      showToast("Internet connection required. Please refresh.");
      return;
    }
  }
  const selectedRole = roleInput ? roleInput.value : "student";
  const enteredCode = normalizeAccessCode(accessCodeInput ? accessCodeInput.value : "");
  let accessEntry = getAccessEntry(selectedRole, enteredCode);

  if(!accessEntry && initSupabase()){
    const {data:managedEntry,error:managedError}=await supabaseClient.from("class_access")
      .select("access_code,role,name,room,teacher_code,active")
      .eq("access_code",enteredCode).eq("role",selectedRole).eq("active",true).maybeSingle();
    if(!managedError && managedEntry) accessEntry=managedEntry;
  }

  if(!accessEntry){
    showToast("Invalid access code for this role");
    if(accessCodeInput) accessCodeInput.focus();
    return;
  }

  ROOM_ID = accessEntry.room;

  if(!channel){
    channel = createRoomChannel();
    attachPendingChannelHandlers();
  }
  if(!channel){
    showToast("Unable to connect to classroom");
    return;
  }

  // Identity is controlled by the assigned access code.
  // The user cannot choose another person's name.
  if(!accessEntry || !accessEntry.name){
    showToast("Please enter a valid assigned access code");
    if(accessCodeInput) accessCodeInput.focus();
    return;
  }

  myName = safeName(accessEntry.name);
  if(nameInput) nameInput.value = myName;

  const roomDisplay = document.getElementById("roomDisplay");
  if(roomDisplay){
    roomDisplay.textContent = "Room: " + accessEntry.room.replace("haroon-quran-","") + " · " + selectedRole + " · " + accessEntry.name;
  }


  joinBtn.disabled =
    true;

  joinBtn.textContent =
    "Joining...";


  try{

    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      throw new Error("Camera and microphone are unavailable in this browser/file mode");
      throw new Error("Camera/microphone require HTTPS or localhost");
    }

    localStream =
      await navigator.mediaDevices.getUserMedia({

        video:{
          width:{
            ideal:1920,
            max:1920
          },
          height:{
            ideal:1080,
            max:1080
          },
          frameRate:{
            ideal:30,
            max:30
          }
        },

        audio:{
          echoCancellation:true,
          noiseSuppression:true,
          autoGainControl:true,
          channelCount:1,
          sampleRate:48000
        }

      });


    createLocalTile();

    applyLocalState();


    await new Promise(
      (resolve,reject)=>{

        channel.subscribe(
          async status=>{

            if(status === "SUBSCRIBED"){

              joined = true;
              startClassTimer(Date.now());

              joinScreen.style.display =
                "none";


              await channel.track({

                name:myName,

                cameraOn:
                  cameraOn,

                micOn:
                  micOn
              });


              await sendEvent(
                "hello",
                {
                  from:myId,
                  name:myName,
                  role:selectedRole,
                  accessCode:enteredCode,
                  cameraOn:cameraOn,
                  micOn:micOn
                }
              );


              playJoinSound();


              await sendEvent(
                "participant-joined",
                {
                  from:myId,
                  name:myName
                }
              );


              resolve();

            }


            if(status === "CHANNEL_ERROR"){

              reject(
                new Error(
                  "Supabase channel error"
                )
              );

            }

          }
        );

      }
    );


    updateControlButtons();


    showToast(
      "Class joined successfully"
    );
    if(managePeopleButton) managePeopleButton.style.display = (selectedRole === "teacher" && normalizeAccessCode(enteredCode) === "HR-001") ? "flex" : "none";


  }catch(error){

    console.error(error);

    showToast(
      (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        ? "Open this website using HTTPS to join the live class"
        : "Please allow camera and microphone access"
    );

    joinBtn.disabled =
      false;

    joinBtn.textContent =
      "Join Class";

    if(localStream){

      localStream
        .getTracks()
        .forEach(
          track=>track.stop()
        );

      localStream = null;
    }

  }

};


/* =========================================================
   JOIN SOUND FOR ALREADY CONNECTED USERS
========================================================= */

channelOn(
  "broadcast",
  {
    event:"participant-joined"
  },
  ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    playJoinSound();

  }
);


/* =========================================================
   MICROPHONE TOGGLE SOUND FOR OTHER PARTICIPANTS
========================================================= */

channelOn(
  "broadcast",
  {
    event:"mic-state"
  },
  ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    playMicToggleSound(
      payload.muted === true
    );

  }
);


/* =========================================================
   CREATE CAMERA + AUDIO PEER
   CAMERA + AUDIO FIXED
========================================================= */

async function createPeer(
  peerId,
  peerName,
  initiator
){

  if(peers[peerId]){

    return peers[peerId];

  }


  if(creatingPeers[peerId]){

    return creatingPeers[peerId];

  }


  creatingPeers[peerId] =
    (async()=>{

      if(peers[peerId]){

        return peers[peerId];

      }


      const pc =
        new RTCPeerConnection(
          {
            iceServers:ICE_SERVERS
          }
        );


      const peerData = {

        pc:pc,

        name:safeName(peerName),

        remoteStream:
          new MediaStream()

      };


      peers[peerId] =
        peerData;


      createRemoteTile(
        peerId,
        peerName
      );


      if(localStream){

        localStream
          .getTracks()
          .forEach(track=>{

            try{

              pc.addTrack(
                track,
                localStream
              );

            }catch(error){

              console.error(
                "Add local track error:",
                error
              );

            }

          });

      }


      pc.onicecandidate =
        event=>{

          if(
            event.candidate
          ){

            sendEvent(
              "candidate",
              {
                from:myId,
                to:peerId,
                candidate:event.candidate
              }
            );

          }

        };


      /*
        CAMERA + AUDIO FIX:
        Put BOTH incoming video and audio
        tracks into one MediaStream.
      */
      pc.ontrack =
        event=>{

          try{

            const tile =
              createRemoteTile(
                peerId,
                peerData.name
              );


            const video =
              tile.querySelector(
                ".cameraVideo"
              );


            if(
              event.track &&
              !peerData.remoteStream
                .getTracks()
                .some(
                  track=>
                    track.id ===
                    event.track.id
                )
            ){

              peerData.remoteStream.addTrack(
                event.track
              );

            }


            /*
              IMPORTANT:
              Remote video must NOT be muted,
              otherwise microphone audio is also muted.
            */
            if(
              video.srcObject !==
              peerData.remoteStream
            ){

              video.srcObject =
                peerData.remoteStream;

            }

            video.muted = false;

            video.volume = classroomVolume;


            const playPromise =
              video.play();

            if(playPromise){

              playPromise.catch(
                error=>{
                  console.log(
                    "Remote camera/audio play waiting:",
                    error
                  );
                }
              );

            }


            maybeStartClassWhenPeerExists();

            event.track.onended =
              ()=>{

                console.log(
                  "Remote camera/audio track ended:",
                  peerId,
                  event.track.kind
                );

              };


          }catch(error){

            console.error(
              "Remote camera/audio track error:",
              error
            );

          }

        };


      pc.onconnectionstatechange =
        ()=>{

          console.log(
            "Camera/audio connection:",
            peerId,
            pc.connectionState
          );


          if(
            pc.connectionState ===
            "failed"
          ){

            console.log(
              "Camera/audio connection failed:",
              peerId
            );

          }

        };


      pc.oniceconnectionstatechange =
        ()=>{

          console.log(
            "Camera/audio ICE:",
            peerId,
            pc.iceConnectionState
          );

        };


      if(initiator){

        const offer =
          await pc.createOffer();


        await pc.setLocalDescription(
          offer
        );


        await sendEvent(
          "offer",
          {
            from:myId,
            to:peerId,
            offer:offer,
            name:myName,
            cameraOn:cameraOn,
            micOn:micOn
          }
        );

      }


      return peerData;

    })();


  try{

    return await creatingPeers[peerId];

  }finally{

    delete creatingPeers[peerId];

  }

}


/* =========================================================
   CAMERA OFFER
========================================================= */

channelOn(
  "broadcast",
  {
    event:"offer"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const peerId =
      payload.from;


    const peerData =
      await createPeer(
        peerId,
        payload.name,
        false
      );


    const pc =
      peerData.pc;


    try{

      if(
        pc.signalingState !==
        "stable"
      ){

        console.log(
          "Ignoring duplicate camera offer:",
          peerId
        );

        return;

      }


      await pc.setRemoteDescription(
        payload.offer
      );


      if(
        pendingCandidates[peerId]
      ){

        for(
          const candidate
          of pendingCandidates[peerId]
        ){

          await pc
            .addIceCandidate(
              candidate
            )
            .catch(()=>{});

        }

        delete pendingCandidates[
          peerId
        ];

      }


      const answer =
        await pc.createAnswer();


      await pc.setLocalDescription(
        answer
      );


      await sendEvent(
        "answer",
        {
          from:myId,
          to:peerId,
          answer:answer
        }
      );


    }catch(error){

      console.error(
        "Offer error:",
        error
      );

    }

  }
);


/* =========================================================
   CAMERA ANSWER
========================================================= */

channelOn(
  "broadcast",
  {
    event:"answer"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const peer =
      peers[payload.from];

    if(!peer) return;


    try{

      if(
        peer.pc.signalingState ===
        "have-local-offer"
      ){

        await peer.pc.setRemoteDescription(
          payload.answer
        );

      }


      if(
        pendingCandidates[
          payload.from
        ]
      ){

        for(
          const candidate
          of pendingCandidates[
            payload.from
          ]
        ){

          await peer.pc
            .addIceCandidate(
              candidate
            )
            .catch(()=>{});

        }

        delete pendingCandidates[
          payload.from
        ];

      }

    }catch(error){

      console.error(
        "Answer error:",
        error
      );

    }

  }
);


/* =========================================================
   CAMERA ICE
========================================================= */

channelOn(
  "broadcast",
  {
    event:"candidate"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const peerId =
      payload.from;


    const peer =
      peers[peerId];


    if(
      !peer ||
      !peer.pc.remoteDescription
    ){

      if(
        !pendingCandidates[peerId]
      ){

        pendingCandidates[
          peerId
        ] = [];

      }

      pendingCandidates[
        peerId
      ].push(
        payload.candidate
      );

      return;
    }


    await peer.pc
      .addIceCandidate(
        payload.candidate
      )
      .catch(()=>{});

  }
);


/* =========================================================
   HELLO
========================================================= */

channelOn(
  "broadcast",
  {
    event:"hello"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    const peerId =
      payload.from;


    createRemoteTile(
      peerId,
      payload.name
    );


    const remoteTile =
      document.getElementById(
        "tile-" + peerId
      );


    if(payload.cameraOn === false){

      remoteTile.classList.add(
        "camera-off"
      );

    }else{

      remoteTile.classList.remove(
        "camera-off"
      );

    }


    const initiator =
      myId < peerId;


    await createPeer(
      peerId,
      payload.name,
      initiator
    );


    if(
      screenOn &&
      screenStream
    ){

      await startScreenPeerFor(
        peerId
      );

    }

  }
);


/* =========================================================
   PRESENCE
========================================================= */

channelOn(
  "presence",
  {
    event:"sync"
  },
  async ()=>{

    const state =
      channel.presenceState();


    for(
      const key in state
    ){

      if(key === myId)
        continue;


      const item =
        state[key] &&
        state[key][0];


      if(!item)
        continue;


      createRemoteTile(
        key,
        item.name || "Participant"
      );


      const tile =
        document.getElementById(
          "tile-" + key
        );


      if(item.cameraOn === false){

        tile.classList.add(
          "camera-off"
        );

      }else{

        tile.classList.remove(
          "camera-off"
        );

      }


      const initiator =
        myId < key;


      await createPeer(
        key,
        item.name || "Participant",
        initiator
      );


      if(
        screenOn &&
        screenStream
      ){

        await startScreenPeerFor(
          key
        );

      }

    }

  }
);


/* =========================================================
   MEDIA STATE
========================================================= */

channelOn(
  "broadcast",
  {
    event:"media-state"
  },
  ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    const tile =
      document.getElementById(
        "tile-" + payload.from
      );


    if(!tile) return;


    if(
      payload.cameraOn === false
    ){

      tile.classList.add(
        "camera-off"
      );

    }else{

      tile.classList.remove(
        "camera-off"
      );

    }

  }
);


/* =========================================================
   CAMERA BUTTON
========================================================= */

cameraBtn.onclick =
async function(){

  if(!localStream) return;


  const tracks =
    localStream.getVideoTracks();


  if(!tracks.length) return;


  cameraOn =
    !cameraOn;


  tracks.forEach(
    track=>{
      track.enabled =
        cameraOn;
    }
  );


  applyLocalState();


  updateControlButtons();


  await sendEvent(
    "media-state",
    {
      from:myId,
      name:myName,
      cameraOn:cameraOn,
      micOn:micOn
    }
  );

};


/* =========================================================
   MIC BUTTON
   FIXED
========================================================= */

micBtn.onclick =
async function(){

  if(!localStream) return;


  const tracks =
    localStream.getAudioTracks();


  if(!tracks.length) return;


  micOn =
    !micOn;


  tracks.forEach(
    track=>{
      track.enabled =
        micOn;
    }
  );


  updateControlButtons();


  /*
    Play sound locally.
  */
  playMicToggleSound(
    !micOn
  );


  /*
    Tell everyone else whether
    microphone was muted/unmuted.
  */
  await sendEvent(
    "mic-state",
    {
      from:myId,
      name:myName,
      muted:!micOn
    }
  );


  /*
    Keep existing media state system.
  */
  await sendEvent(
    "media-state",
    {
      from:myId,
      name:myName,
      cameraOn:cameraOn,
      micOn:micOn
    }
  );

};


/* =========================================================
   START SCREEN SHARE BUTTON
========================================================= */

screenBtn.onclick =
async function(){

  if(screenOn){

    await stopScreenShare();

    return;

  }


  await startScreenShare();

};


/* =========================================================
   START SCREEN SHARE
========================================================= */

async function startScreenShare(){

  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getDisplayMedia
  ){

    showToast(
      "Screen sharing is not supported on this browser"
    );

    return;

  }


  try{

    if(window.isSecureContext === false){
      showToast("Screen sharing needs HTTPS on phone and laptop");
      return;
    }
    screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video:{
          frameRate:{ ideal:Number(document.getElementById("setScreenQuality")?.value||15), max:Number(document.getElementById("setScreenQuality")?.value||15) }
        },
        audio:true
      });


    const screenTrack =
      screenStream.getVideoTracks()[0];


    if(
      screenTrack &&
      "contentHint" in screenTrack
    ){

      screenTrack.contentHint =
        "detail";

    }


    screenOn = true;


    const localTile =
      createLocalTile();


    const screenVideo =
      localTile.querySelector(
        ".screenVideo"
      );


    screenVideo.srcObject =
      screenStream;
    screenVideo.muted = true;
    screenVideo.volume = 0;


    localTile.classList.add(
      "screen-sharing"
    );


    screenVideo.play()
      .catch(()=>{});


    updateControlButtons();


    updateScreenLayout();


    for(
      const peerId in peers
    ){

      await startScreenPeerFor(
        peerId
      );

    }


    screenTrack.onended =
      async ()=>{

        if(screenOn){

          await stopScreenShare();

        }

      };


    showToast(
      "Screen sharing started"
    );


  }catch(error){

    console.error(
      "Screen share error:",
      error
    );

    screenStream = null;
    screenOn = false;

    updateControlButtons();

    showToast(
      "Screen sharing cancelled"
    );

  }

}


/* =========================================================
   CREATE SCREEN PEER
========================================================= */

async function startScreenPeerFor(
  peerId
){

  if(
    !screenOn ||
    !screenStream
  ){

    return;

  }


  if(screenPeers[peerId]){

    return;

  }


  const pc =
    new RTCPeerConnection(
      {
        iceServers:ICE_SERVERS
      }
    );


  screenPeers[peerId] =
    pc;


  const screenTrack =
    screenStream.getVideoTracks()[0];

  /* Also send any system/tab audio supplied by the browser with screen sharing. */
  screenStream.getAudioTracks().forEach(track=>{
    try{ pc.addTrack(track,screenStream); }catch(e){ console.log("Screen audio track error",e); }
  });

  if(screenTrack){

    const sender =
      pc.addTrack(
        screenTrack,
        screenStream
      );


    try{

      const params =
        sender.getParameters();


      if(
        !params.encodings ||
        !params.encodings.length
      ){

        params.encodings = [{}];

      }


      params.encodings[0].maxFramerate =
        15;

      params.encodings[0].maxBitrate =
        1800000;

      /* Favor low-latency delivery for live Quran/page sharing. */
      if('' + '"degradationPreference"' + '' in params){
        params.degradationPreference = "maintain-framerate";
      }


      await sender.setParameters(
        params
      );

    }catch(e){

      console.log(
        "Screen sender parameters:",
        e
      );

    }

  }


  pc.onicecandidate =
    event=>{

      if(
        event.candidate
      ){

        sendEvent(
          "screen-candidate",
          {
            from:myId,
            to:peerId,
            candidate:event.candidate
          }
        );

      }

    };


  pc.ontrack =
    event=>{

      const peer =
        peers[peerId];


      const peerName =
        peer ?
        peer.name :
        "Participant";


      const tile =
        createRemoteTile(
          peerId,
          peerName
        );


      const video =
        tile.querySelector(
          ".screenVideo"
        );


      if(
        event.streams &&
        event.streams[0]
      ){

        video.srcObject =
          event.streams[0];

      }


      tile.classList.add(
        "screen-sharing"
      );


      video.play()
        .catch(()=>{});


      updateScreenLayout();

    };


  pc.onconnectionstatechange =
    ()=>{

      if(
        pc.connectionState ===
        "failed"
      ){

        console.log(
          "Screen connection failed:",
          peerId
        );

      }

    };


  const offer =
    await pc.createOffer();


  await pc.setLocalDescription(
    offer
  );


  await sendEvent(
    "screen-offer",
    {
      from:myId,
      to:peerId,
      offer:offer,
      name:myName
    }
  );

}


/* =========================================================
   SCREEN OFFER
========================================================= */

channelOn(
  "broadcast",
  {
    event:"screen-offer"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const peerId =
      payload.from;


    if(
      screenPeers[peerId]
    ){

      screenPeers[
        peerId
      ].close();

      delete screenPeers[
        peerId
      ];

    }


    const pc =
      new RTCPeerConnection(
        {
          iceServers:ICE_SERVERS
        }
      );


    screenPeers[peerId] =
      pc;


    pc.onicecandidate =
      event=>{

        if(
          event.candidate
        ){

          sendEvent(
            "screen-candidate",
            {
              from:myId,
              to:peerId,
              candidate:event.candidate
            }
          );

        }

      };


    pc.ontrack =
      event=>{

        const peer =
          peers[peerId];


        const tile =
          createRemoteTile(
            peerId,
            peer ?
              peer.name :
              payload.name
          );


        const video =
          tile.querySelector(
            ".screenVideo"
          );


        if(
          event.streams &&
          event.streams[0]
        ){

          video.srcObject =
            event.streams[0];

        }


        tile.classList.add(
          "screen-sharing"
        );


        video.play()
          .catch(()=>{});


        updateScreenLayout();

      };


    await pc.setRemoteDescription(
      payload.offer
    );


    if(
      pendingScreenCandidates[
        peerId
      ]
    ){

      for(
        const candidate
        of pendingScreenCandidates[
          peerId
        ]
      ){

        await pc
          .addIceCandidate(
            candidate
          )
          .catch(()=>{});

      }

      delete pendingScreenCandidates[
        peerId
      ];

    }


    const answer =
      await pc.createAnswer();


    await pc.setLocalDescription(
      answer
    );


    await sendEvent(
      "screen-answer",
      {
        from:myId,
        to:peerId,
        answer:answer
      }
    );

  }
);


/* =========================================================
   SCREEN ANSWER
========================================================= */

channelOn(
  "broadcast",
  {
    event:"screen-answer"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const pc =
      screenPeers[
        payload.from
      ];


    if(!pc) return;


    try{

      await pc.setRemoteDescription(
        payload.answer
      );


      if(
        pendingScreenCandidates[
          payload.from
        ]
      ){

        for(
          const candidate
          of pendingScreenCandidates[
            payload.from
          ]
        ){

          await pc
            .addIceCandidate(
              candidate
            )
            .catch(()=>{});

        }

        delete pendingScreenCandidates[
          payload.from
        ];

      }

    }catch(error){

      console.error(
        "Screen answer error:",
        error
      );

    }

  }
);


/* =========================================================
   SCREEN ICE
========================================================= */

channelOn(
  "broadcast",
  {
    event:"screen-candidate"
  },
  async ({payload})=>{

    if(
      !payload ||
      payload.to !== myId
    ) return;


    const peerId =
      payload.from;


    const pc =
      screenPeers[peerId];


    if(
      !pc ||
      !pc.remoteDescription
    ){

      if(
        !pendingScreenCandidates[
          peerId
        ]
      ){

        pendingScreenCandidates[
          peerId
        ] = [];

      }


      pendingScreenCandidates[
        peerId
      ].push(
        payload.candidate
      );

      return;

    }


    await pc
      .addIceCandidate(
        payload.candidate
      )
      .catch(()=>{});

  }
);


/* =========================================================
   STOP SCREEN SHARE
========================================================= */

async function stopScreenShare(){

  if(!screenOn) return;


  screenOn = false;


  if(screenStream){

    screenStream
      .getTracks()
      .forEach(
        track=>track.stop()
      );

    screenStream = null;

  }


  for(
    const peerId in screenPeers
  ){

    try{

      screenPeers[
        peerId
      ].close();

    }catch(e){}

  }


  Object.keys(
    screenPeers
  ).forEach(
    key=>{
      delete screenPeers[key];
    }
  );


  await sendEvent(
    "screen-stop",
    {
      from:myId
    }
  );


  const localTile =
    document.getElementById(
      "tile-" + myId
    );


  if(localTile){

    localTile.classList.remove(
      "screen-sharing"
    );


    const screenVideo =
      localTile.querySelector(
        ".screenVideo"
      );


    if(screenVideo){

      screenVideo.srcObject =
        null;

    }

  }


  document
    .querySelectorAll(
      ".tile.screen-sharing"
    )
    .forEach(tile=>{

      if(
        tile.id !==
        "tile-" + myId
      ){

        tile.classList.remove(
          "screen-sharing"
        );


        const video =
          tile.querySelector(
            ".screenVideo"
          );


        if(video){

          video.srcObject =
            null;

        }

      }

    });


  updateControlButtons();

  updateScreenLayout();


  showToast(
    "Screen sharing stopped"
  );

}


/* =========================================================
   REMOTE SCREEN STOP
========================================================= */

channelOn(
  "broadcast",
  {
    event:"screen-stop"
  },
  ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    const peerId =
      payload.from;


    if(
      screenPeers[peerId]
    ){

      try{

        screenPeers[
          peerId
        ].close();

      }catch(e){}


      delete screenPeers[
        peerId
      ];

    }


    const tile =
      document.getElementById(
        "tile-" + peerId
      );


    if(tile){

      tile.classList.remove(
        "screen-sharing"
      );


      const video =
        tile.querySelector(
          ".screenVideo"
        );


      if(video){

        video.srcObject =
          null;

      }

    }


    updateScreenLayout();

  }
);


/* =========================================================
   CHAT BUTTON
========================================================= */

const chatOriginalParent = chatPanel ? chatPanel.parentElement : null;
chatBtn.onclick=function(e){
  if(e){e.preventDefault();e.stopPropagation();}
  if(!chatPanel) return;
  const mobile=window.innerWidth<=760;
  if(mobile){
    if(!chatPanel.classList.contains("mobile-chat-open")){
      document.body.appendChild(chatPanel);
      chatPanel.classList.add("mobile-chat-open");
      chatPanel.style.display="grid";
      chatPanel.style.gridTemplateRows="48px minmax(0,1fr) 62px";
      setTimeout(()=>{if(chatInput){chatInput.focus();}},80);
    }else{
      chatPanel.classList.remove("mobile-chat-open");
      chatPanel.style.display="none";
    }
  }else{
    if(chatPanel.parentElement!==chatOriginalParent) chatOriginalParent.appendChild(chatPanel);
    chatPanel.classList.remove("mobile-chat-open");
    chatPanel.style.display=chatPanel.style.display==="grid"||chatPanel.style.display==="flex"?"none":"grid";
    if(chatPanel.style.display!=="none") setTimeout(()=>{if(chatInput)chatInput.focus();},50);
  }
};

/* =========================================================
   SEND CHAT
========================================================= */

async function sendChatMessage(){

  const text =
    chatInput.value.trim();


  if(!text) return;


  await sendEvent(
    "chat-message",
    {
      from:myId,
      name:myName,
      message:text
    }
  );


  addMessage(
    myName,
    text
  );


  chatInput.value =
    "";

}


sendChat.onclick =
sendChatMessage;


chatInput.addEventListener(
  "keydown",
  event=>{

    if(
      event.key ===
      "Enter"
    ){

      event.preventDefault();

      sendChatMessage();

    }

  }
);


/* =========================================================
   RECEIVE CHAT
========================================================= */

channelOn(
  "broadcast",
  {
    event:"chat-message"
  },
  ({payload})=>{

    if(
      !payload ||
      payload.from === myId
    ) return;


    addMessage(
      payload.name ||
      "Participant",

      payload.message ||
      ""
    );

  }
);


function addMessage(
  name,
  text
){

  const item =
    document.createElement("div");

  item.className =
    "message";


  const sender =
    document.createElement("b");

  sender.textContent =
    safeName(name);


  const message =
    document.createElement("div");

  message.textContent =
    text;


  item.appendChild(
    sender
  );

  item.appendChild(
    message
  );


  messages.appendChild(
    item
  );


  messages.scrollTop =
    messages.scrollHeight;

}


/* =========================================================
   TIMER + LOCAL RECORDING + SETTINGS
========================================================= */

let classStartedAt = null;
let timerHandle = null;
let mediaRecorder = null;
let recordingCanvas = null;
let recordingCtx = null;
let recordingRAF = null;
let recordingAudioContext = null;
let recordingAudioDestination = null;
let recordingChunks = [];
let recordingRunning = false;
let recordingAutoStarted = false;
let classroomVolume = 1;

const timerEl = document.getElementById("timer");
const topClassTimer = document.getElementById("topClassTimer");
const recordBtn = document.getElementById("recordBtn");
const recordingIndicator = document.getElementById("recordingIndicator");
const settingsModal = document.getElementById("settingsModal");
const settingsClose = document.getElementById("settingsClose");
const settingsDone = document.getElementById("settingsDone");
const settingsButton = document.getElementById("settingsButton");

function formatTimer(ms){
  const sec = Math.max(0, Math.floor(ms/1000));
  const h = String(Math.floor(sec/3600)).padStart(2,"0");
  const m = String(Math.floor((sec%3600)/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return "◷  &nbsp;"+h+":"+m+":"+s;
}

function startClassTimer(startAt){
  if(!startAt) startAt = Date.now();
  if(!classStartedAt) classStartedAt = startAt;
  if(timerHandle) return;
  const tick=()=>{ const t=formatTimer(Date.now()-classStartedAt); if(timerEl) timerEl.innerHTML=t; if(topClassTimer) topClassTimer.textContent=t.replace("◷  &nbsp;",""); };
  tick();
  timerHandle=setInterval(tick,1000);
  const c=document.getElementById("setConnection"); if(c) c.textContent="Connected";
  maybeStartRecording();
}

function stopClassTimer(){
  if(timerHandle){ clearInterval(timerHandle); timerHandle=null; }
  classStartedAt=null;
  if(timerEl) timerEl.innerHTML="◷  &nbsp;00:00:00"; if(topClassTimer) topClassTimer.textContent="00:00:00";
}

async function announceClassStart(){
  if(classStartedAt) return;
  const startedAt=Date.now();
  startClassTimer(startedAt);
  try{ await sendEvent("class-start",{from:myId,startedAt}); }catch(e){}
}

channelOn("broadcast",{event:"class-start"},({payload})=>{
  if(!payload || payload.from===myId) return;
  startClassTimer(Number(payload.startedAt)||Date.now());
});

function maybeStartClassWhenPeerExists(){
  const count=document.querySelectorAll("#videoGrid .tile").length;
  if(count>=2){
    announceClassStart();
    if(!recordingAutoStarted) maybeStartRecording();
  }
}

function recordingMime(){
  const types=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
  return types.find(t=>window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
}

async function startLocalRecording(){
  if(recordingRunning) return true;
  if(!window.MediaRecorder){ showToast("Recording is not supported by this browser"); return false; }
  if(window.isSecureContext === false){ showToast("Recording needs HTTPS"); return false; }

  let displayStream=null;
  let finalStream=null;
  let canvasStream=null;
  let usingCanvas=false;
  try{
    /* Laptop/desktop: record the selected screen. Ask for audio too. */
    if(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia){
      try{
        displayStream=await navigator.mediaDevices.getDisplayMedia({
          video:{frameRate:{ideal:30,max:30}},
          audio:true
        });
      }catch(displayError){
        console.log("Display capture unavailable, trying classroom recorder",displayError);
        displayStream=null;
      }
    }

    const displayTrack=displayStream && displayStream.getVideoTracks()[0];
    if(displayTrack){
      finalStream=new MediaStream([displayTrack]);
      usingCanvas=false;
    }else{
      /* Mobile fallback: record the classroom stage itself, so phones without
         browser screen-capture support can still record the live class. */
      const stage=document.querySelector('.stage');
      const videos=[...document.querySelectorAll('#videoGrid video')].filter(v=>v.srcObject);
      if(!stage || !HTMLCanvasElement.prototype.captureStream){
        throw new Error("No screen capture or classroom recording support");
      }
      recordingCanvas=document.createElement('canvas');
      recordingCanvas.width=Math.max(640,Math.floor(stage.clientWidth*2));
      recordingCanvas.height=Math.max(360,Math.floor(stage.clientHeight*2));
      recordingCtx=recordingCanvas.getContext('2d');
      canvasStream=recordingCanvas.captureStream(30);
      finalStream=new MediaStream(canvasStream.getVideoTracks());
      usingCanvas=true;

      const draw=()=>{
        if(!recordingRunning && !usingCanvas) return;
        const ctx=recordingCtx, w=recordingCanvas.width, h=recordingCanvas.height;
        ctx.fillStyle='#031827'; ctx.fillRect(0,0,w,h);
        const tiles=[...document.querySelectorAll('#videoGrid .tile')];
        if(tiles.length===0){ ctx.fillStyle='#ffffff'; ctx.font='bold 28px Arial'; ctx.textAlign='center'; ctx.fillText('Haroon Ibn Rasheed Online Quran Academy',w/2,h/2); }
        else{
          const gap=12, tw=w, th=(h-gap*(tiles.length-1))/tiles.length;
          tiles.forEach((tile,i)=>{
            const v=tile.classList.contains('screen-sharing') ? tile.querySelector('.screenVideo') : tile.querySelector('.cameraVideo');
            const x=0,y=i*(th+gap);
            ctx.fillStyle='#101815'; ctx.fillRect(x,y,tw,th);
            if(v && v.readyState>=2 && v.videoWidth){
              const scale=Math.min(tw/v.videoWidth,th/v.videoHeight); const dw=v.videoWidth*scale, dh=v.videoHeight*scale;
              ctx.drawImage(v,(tw-dw)/2,y+(th-dh)/2,dw,dh);
            }
            const label=tile.querySelector('.nameLabel');
            if(label){ ctx.fillStyle='rgba(23,43,58,.9)'; ctx.fillRect(10,y+th-42,Math.min(260,tw-20),32); ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.textAlign='left'; ctx.fillText(label.textContent||'Participant',20,y+th-20); }
          });
        }
        recordingRAF=requestAnimationFrame(draw);
      };
      draw();
    }

    recordingAudioContext=new (window.AudioContext||window.webkitAudioContext)();
    recordingAudioDestination=recordingAudioContext.createMediaStreamDestination();
    try{ await recordingAudioContext.resume(); }catch(e){}

    /* Mix microphone, remote classroom voices, and screen/tab audio when supplied. */
    const audioStreams=[];
    if(localStream && localStream.getAudioTracks().length) audioStreams.push(localStream);
    Object.values(peers).forEach(p=>{ if(p.remoteStream && p.remoteStream.getAudioTracks().length) audioStreams.push(p.remoteStream); });
    if(displayStream && displayStream.getAudioTracks().length) audioStreams.push(displayStream);
    if(screenStream && screenStream.getAudioTracks().length) audioStreams.push(screenStream);
    audioStreams.forEach(st=>{
      try{ const src=recordingAudioContext.createMediaStreamSource(st); src.connect(recordingAudioDestination); }catch(e){ console.log("Recording audio source error",e); }
    });
    recordingAudioDestination.stream.getAudioTracks().forEach(t=>finalStream.addTrack(t));

    const mime=recordingMime();
    mediaRecorder=new MediaRecorder(finalStream,mime?{mimeType:mime}:undefined);
    recordingChunks=[];
    mediaRecorder.ondataavailable=e=>{ if(e.data && e.data.size) recordingChunks.push(e.data); };
    mediaRecorder.onstop=()=>{
      const blob=new Blob(recordingChunks,{type:mediaRecorder.mimeType||'video/webm'});
      const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Haroon-Quran-Class-Recording-'+stamp+'.webm'; a.style.display='none'; document.body.appendChild(a); a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
      recordingChunks=[]; recordingRunning=false; recordingAutoStarted=false;
      recordingIndicator.classList.remove('show'); recordBtn.classList.remove('active');
      const label=recordBtn.querySelector('span:last-child'); if(label) label.textContent='Recording';
      try{ if(displayStream) displayStream.getTracks().forEach(t=>t.stop()); }catch(e){}
      try{ if(canvasStream) canvasStream.getTracks().forEach(t=>t.stop()); }catch(e){}
      if(recordingRAF){ cancelAnimationFrame(recordingRAF); recordingRAF=null; }
      recordingCanvas=null; recordingCtx=null;
      try{ recordingAudioContext.close(); }catch(e){}
      recordingAudioContext=null; recordingAudioDestination=null;
      showToast('Recording saved to Downloads / Files');
    };

    if(displayTrack) displayTrack.onended=()=>{ if(recordingRunning) stopLocalRecording(); };
    mediaRecorder.start(1000);
    recordingRunning=true; recordingAutoStarted=false;
    recordingIndicator.classList.add('show'); recordBtn.classList.add('active');
    const label=recordBtn.querySelector('span:last-child'); if(label) label.textContent='Stop Recording';
    showToast(usingCanvas?'Classroom recording started':'Screen recording started');
    return true;
  }catch(error){
    console.error('Recording error:',error);
    try{ if(displayStream) displayStream.getTracks().forEach(t=>t.stop()); }catch(e){}
    try{ if(canvasStream) canvasStream.getTracks().forEach(t=>t.stop()); }catch(e){}
    if(recordingRAF){cancelAnimationFrame(recordingRAF);recordingRAF=null;}
    try{ if(recordingAudioContext) recordingAudioContext.close(); }catch(e){}
    recordingCanvas=null; recordingCtx=null; recordingAudioContext=null; recordingAudioDestination=null; recordingRunning=false;
    showToast('Recording is not supported on this browser');
    return false;
  }
}

function stopLocalRecording(){
  if(mediaRecorder && recordingRunning){
    return new Promise(resolve=>{
      const r=mediaRecorder;
      const oldStop=r.onstop;
      r.onstop=()=>{
        if(oldStop) oldStop();
        resolve();
      };
      try{ r.stop(); }catch(e){ resolve(); }
    });
  }
  return Promise.resolve(false);
}

/* Recording starts only from the Recording button so the browser can show its screen-selection prompt. */
function maybeStartRecording(){ return false; }
if(recordBtn) recordBtn.onclick=()=>{ if(recordingRunning) stopLocalRecording(); else startLocalRecording(); };

function openSettings(){
  if(!settingsModal) return;
  settingsModal.classList.add("show"); settingsModal.setAttribute("aria-hidden","false");
  document.getElementById("setMic").value=micOn?"on":"off";
  document.getElementById("setCamera").value=cameraOn?"on":"off";
  document.getElementById("setConnection").textContent=joined?"Connected":"Not connected";
  document.getElementById("setVolume").value=Math.round(classroomVolume*100);
  populateOutputs();
}
function closeSettings(){ if(settingsModal){settingsModal.classList.remove("show"); settingsModal.style.display="none"; settingsModal.setAttribute("aria-hidden","true");} }
window.openSettings=openSettings; window.closeSettings=closeSettings;
if(settingsButton) settingsButton.addEventListener("click",function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  openSettings();
},true);
if(settingsClose) settingsClose.addEventListener("click",closeSettings);
if(settingsDone) settingsDone.addEventListener("click",closeSettings);
if(settingsModal) settingsModal.addEventListener("click",function(e){
  if(e.target===settingsModal) closeSettings();
});

/* Settings fallback: open it even if another sidebar handler interferes. */
document.addEventListener("pointerdown",function(e){
  var b=e.target.closest && e.target.closest("#settingsButton");
  if(!b) return;
  var m=document.getElementById("settingsModal");
  if(m){ m.classList.add("show"); m.style.display="flex"; m.setAttribute("aria-hidden","false"); }
},true);

document.getElementById("setMic").onchange=()=>{ const on=document.getElementById("setMic").value==="on"; if(on!==micOn) micBtn.click(); };
document.getElementById("setCamera").onchange=()=>{ const on=document.getElementById("setCamera").value==="on"; if(on!==cameraOn) cameraBtn.click(); };
document.getElementById("setVolume").oninput=e=>{ classroomVolume=Number(e.target.value)/100; document.querySelectorAll("#videoGrid video.cameraVideo,#videoGrid video.screenVideo").forEach(v=>v.volume=classroomVolume); };
document.getElementById("setPermissions").onclick=async()=>{ try{ if(navigator.permissions && navigator.permissions.query){ const c=await navigator.permissions.query({name:"camera"}); const m=await navigator.permissions.query({name:"microphone"}); showToast("Camera: "+c.state+" · Microphone: "+m.state); } else showToast("Browser controls permissions for this classroom"); }catch(e){showToast("Browser controls permissions for this classroom");} };
async function populateOutputs(){
  const sel=document.getElementById("setOutput");
  if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  try{ const devs=await navigator.mediaDevices.enumerateDevices(); sel.innerHTML="<option value=\"default\">System default</option>"; devs.filter(d=>d.kind==="audiooutput").forEach((d,i)=>{const o=document.createElement("option");o.value=d.deviceId;o.textContent=d.label||("Speaker "+(i+1));sel.appendChild(o);}); }catch(e){}
}
document.getElementById("setOutput").onchange=async e=>{ const id=e.target.value; if(id==="default") return; const vids=document.querySelectorAll("#videoGrid video"); for(const v of vids){ if(typeof v.setSinkId==="function"){ try{await v.setSinkId(id);}catch(err){} } } };
document.getElementById("setAppearance").onchange=e=>{ document.body.dataset.appearance=e.target.value; if(e.target.value==="light"){document.documentElement.style.filter="invert(.88) hue-rotate(180deg)";}else document.documentElement.style.filter="none"; };

/* Stop the live class timer on the other device when the other participant leaves. */
channelOn("broadcast",{event:"participant-left"},({payload})=>{
  if(!payload || payload.from===myId) return;
  stopClassTimer();
  const tile=document.getElementById("tile-"+payload.from);
  if(tile) tile.remove();
  updateScreenLayout();
  const count=document.querySelectorAll("#videoGrid .tile").length;
  const pc=document.getElementById("participantCount"); if(pc) pc.textContent="("+count+")";
  const sn=document.getElementById("studentName"); if(sn && count<2) sn.textContent="Waiting...";
});

/* =========================================================
   LEAVE
========================================================= */

leaveBtn.onclick =
async function(){
  if(recordingRunning){ await stopLocalRecording(); }
  stopClassTimer();

  if(
    screenOn
  ){

    await stopScreenShare();

  }


  for(
    const peerId in peers
  ){

    try{

      peers[
        peerId
      ].pc.close();

    }catch(e){}

  }


  for(
    const peerId in screenPeers
  ){

    try{

      screenPeers[
        peerId
      ].close();

    }catch(e){}

  }


  if(localStream){

    localStream
      .getTracks()
      .forEach(
        track=>track.stop()
      );

    localStream =
      null;

  }


  try{ await sendEvent("participant-left",{from:myId}); }catch(e){}

  try{

    await channel.untrack();

  }catch(e){}


  try{

    await channel.unsubscribe();

  }catch(e){}


  joined =
    false;


  location.reload();

};



leaveBtn2.onclick = leaveBtn.onclick;

/* Mobile audio playback recovery */
document.addEventListener("touchstart",()=>{ document.querySelectorAll("#videoGrid video").forEach(v=>{ if(v.srcObject) v.play().catch(()=>{}); }); },{passive:true});
document.addEventListener("click",()=>{ document.querySelectorAll("#videoGrid video").forEach(v=>{ if(v.srcObject) v.play().catch(()=>{}); }); },{passive:true});


/* =========================================================
   SIDEBAR NAVIGATION — keeps the classroom camera as default view
========================================================= */
(function(){
  const sideButtons=[...document.querySelectorAll('.sidebar .sidebtn')];
  const center=document.querySelector('.center');
  const right=document.querySelector('.right');
  if(!sideButtons.length) return;
  let infoPanel=document.getElementById('sectionInfoPanel');
  if(!infoPanel){
    infoPanel=document.createElement('div'); infoPanel.id='sectionInfoPanel'; infoPanel.className='section-info-panel hidden';
    infoPanel.innerHTML='<div class="section-info-card"><h2 id="sectionInfoTitle"></h2><p id="sectionInfoText"></p></div>';
    document.querySelector('.main').appendChild(infoPanel);
  }
  const showInfo=(title,text)=>{ center.style.display='none'; if(right) right.style.display='none'; infoPanel.classList.remove('hidden'); document.getElementById('sectionInfoTitle').textContent=title; document.getElementById('sectionInfoText').textContent=text; };
  const showClass=()=>{ infoPanel.classList.add('hidden'); center.style.display='grid'; if(right) right.style.display='grid'; };
  sideButtons.forEach((btn,i)=>btn.addEventListener('click',function(e){
     e.preventDefault();

     /* Manage People and Settings have dedicated handlers.
        Prevent the generic sidebar handler from opening the wrong modal. */
     if(btn.id==='managePeopleButton'){
       sideButtons.forEach(x=>x.classList.remove('active'));
       btn.classList.add('active');
       return;
     }
     if(btn.id==='settingsButton'){
       sideButtons.forEach(x=>x.classList.remove('active'));
       btn.classList.add('active');
       openSettings();
       return;
     }

     sideButtons.forEach(x=>x.classList.remove('active'));
     btn.classList.add('active');

     if(i===0){ showClass(); return; }
     if(i===1){ showInfo('Courses','Nazra Quran · Tajweed · Qirat · Translation · Tafseer · Hifz · Noorani Qaida · Basic Islamic Studies'); return; }
     if(i===2){ showInfo('My Classes','Your live Quran classes will appear here.'); return; }
     if(i===3){ showClass(); if(chatBtn) chatBtn.click(); return; }
   }));
})();

/* =========================================================
   PAGE START
========================================================= */

updateControlButtons();


const originalCreateRemoteTile = createRemoteTile;
createRemoteTile = function(peerId, peerName){
  const tile = originalCreateRemoteTile(peerId, peerName);
  const labels = [...document.querySelectorAll('#videoGrid .nameLabel')];
  if(labels.length){
    document.getElementById('participantCount').textContent='('+document.querySelectorAll('#videoGrid .tile').length+')';
    const names=labels.map(x=>x.textContent).filter(Boolean);
    if(names[0]) document.getElementById('teacherName').textContent=names[0];
    if(names[1]) document.getElementById('studentName').textContent=names[1];
  }
  maybeStartClassWhenPeerExists();
  return tile;
};
const originalCreateLocalTile = createLocalTile;
createLocalTile = function(){
  const tile=originalCreateLocalTile();
  document.getElementById('nameDisplay').textContent=myName;
  document.getElementById('participantCount').textContent='('+document.querySelectorAll('#videoGrid .tile').length+')';
  document.getElementById('teacherName').textContent=myName;
  maybeStartClassWhenPeerExists();
  return tile;
};
