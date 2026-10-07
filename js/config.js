/* Supabase connection + classroom constants */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
"https://haetymgmvotqfyvqwogq.supabase.co";

const SUPABASE_KEY =
"sb_publishable_RdrOGrd2Ov8vxFJPGCvzFA_m7a_4Wo8";

let supabaseClient = null;
function initSupabase(){
  if(!supabaseClient && window.supabase && window.supabase.createClient){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}
initSupabase();


/* =========================================================
   CLASS VARIABLES
========================================================= */

let ROOM_ID = "";
const ROOM_ACCESS = {
  // HR-001 is the bootstrap/admin teacher. All other old demo accounts were removed.
  // New teachers/students are created from Manage People and stored in Supabase.
  teachers: {
    "HR-001": { room:"haroon-quran-teacher-001", name:"Haroon", role:"teacher" }
  },
  students: {}
};

let myId =
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

let myName = "";

let localStream = null;
let screenStream = null;

let cameraOn = true;
let micOn = true;
let screenOn = false;

let joined = false;

const peers = {};
const screenPeers = {};

const pendingCandidates = {};
const pendingScreenCandidates = {};

const creatingPeers = {};

let channel = null;


/* =========================================================
   METERED TURN + STUN
   ONLY ICE SERVER SECTION CHANGED
========================================================= */

const ICE_SERVERS = [
  {
    urls:"stun:stun.relay.metered.ca:80"
  },
  {
    urls:"turn:global.relay.metered.ca:80",
    username:"f797c025642b4bc257d925fe",
    credential:"zYIWWjXnbghdnED3"
  },
  {
    urls:"turn:global.relay.metered.ca:80?transport=tcp",
    username:"f797c025642b4bc257d925fe",
    credential:"zYIWWjXnbghdnED3"
  },
  {
    urls:"turn:global.relay.metered.ca:443",
    username:"f797c025642b4bc257d925fe",
    credential:"zYIWWjXnbghdnED3"
  },
  {
    urls:"turns:global.relay.metered.ca:443?transport=tcp",
    username:"f797c025642b4bc257d925fe",
    credential:"zYIWWjXnbghdnED3"
  }
];


/* =========================================================
   ELEMENTS
========================================================= */

const joinScreen =
  document.getElementById("joinScreen");

const nameInput =
  document.getElementById("nameInput");

const roleInput = document.getElementById("roleInput");
const accessCodeInput = document.getElementById("accessCodeInput");

function normalizeAccessCode(value){
  return (value || "").trim().toUpperCase();
}

function getAccessEntry(role, code){
  const list = role === "teacher" ? ROOM_ACCESS.teachers : ROOM_ACCESS.students;
  return list[normalizeAccessCode(code)] || null;
}
