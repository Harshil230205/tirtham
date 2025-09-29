/* Pure JS helpers – no JSON used in storage */
function setKV(k, v){ localStorage.setItem(k, String(v||'')) }
function getKV(k){ return localStorage.getItem(k) || '' }
function clearAuth(){
  localStorage.removeItem('pp_userId')
  localStorage.removeItem('pp_name')
}

function updateAuthUI(){
  const btnLogin = document.querySelector('[data-login-btn]')
  const btnLogout = document.querySelector('[data-logout-btn]')
  const avatar = document.querySelector('[data-avatar]')
  const name = getKV('pp_name'); const uid = getKV('pp_userId')
  if(name && uid){
    if(btnLogin) btnLogin.classList.add('hidden')
    if(btnLogout) btnLogout.classList.remove('hidden')
    if(avatar){ avatar.textContent = name.charAt(0).toUpperCase(); avatar.classList.remove('hidden') }
    const hi = document.querySelector('[data-hi]')
    if(hi){ hi.textContent = 'Hi, ' + name }
  }else{
    if(btnLogin) btnLogin.classList.remove('hidden')
    if(btnLogout) btnLogout.classList.add('hidden')
    if(avatar) avatar.classList.add('hidden')
  }
}

function handleLogout(){
  clearAuth(); updateAuthUI()
  alert('Logged out')
  // Optional refresh of current page state
}

function saveLogin(nm, id){
  setKV('pp_name', nm); setKV('pp_userId', id)
}

function saveBooking(fields){
  // fields is a plain object; write each key separately to avoid JSON
  for(const k in fields){ setKV('pp_'+k, fields[k]) }
}

/* Simple pseudo-QR generator (not scannable) seeded by userId */
function drawPseudoQR(canvas, seedText){
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H)
  // seed hash
  let h = 2166136261
  for(let i=0;i<seedText.length;i++){ h ^= seedText.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24) }
  const cols = 33, rows = 33
  const cw = Math.floor(W/cols), ch = Math.floor(H/rows)
  ctx.fillStyle = '#0f172a'
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      h ^= (h<<13); h ^= (h>>>17); h ^= (h<<5)
      const bit = (h>>>24)&1
      if(bit){ ctx.fillRect(c*cw, r*ch, cw-1, ch-1) }
    }
  }
  // quiet border
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 6
  ctx.strokeRect(3,3,W-6,H-6)
}

/* Build high-res pass card 1200x720 with QR and userId on top */
function downloadPassCard(){
  const uid = getKV('pp_userId') || 'GUEST'
  const name = getKV('pp_name') || 'Guest'
  const temple = getKV('pp_temple') || 'Any Temple'
  const date = getKV('pp_date') || '—'
  const time = getKV('pp_time') || '—'
  const members = getKV('pp_members') || '1'
  const vehicle = getKV('pp_vehicle') || 'None'

  const W=1200, H=720
  const canvas=document.createElement('canvas')
  canvas.width=W; canvas.height=H
  const ctx=canvas.getContext('2d')

  // Background
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H)
  // Top bar
  ctx.fillStyle='#f1f5ff'; ctx.fillRect(0,0,W,210)
  // Title
  ctx.fillStyle='#2563eb'; ctx.font='bold 42px system-ui,Segoe UI,Roboto'
  ctx.fillText('Pilgrimage Pass', 40, 70)
  ctx.fillStyle='#111827'; ctx.font='bold 34px system-ui,Segoe UI,Roboto'
  ctx.fillText('User ID: '+uid, 40, 130)

  // QR box on right of top bar
  const qrSize = 150
  const qrCanvas=document.createElement('canvas')
  qrCanvas.width=qrSize; qrCanvas.height=qrSize
  drawPseudoQR(qrCanvas, uid + '|' + temple + '|' + date + ' ' + time)
  ctx.drawImage(qrCanvas, W-40-qrSize, 30, qrSize, qrSize)

  // Details card
  const cardX=40, cardY=240, cardW=W-80, cardH=H-300
  // shadow
  ctx.fillStyle='rgba(0,0,0,.06)'; ctx.fillRect(cardX+6,cardY+8,cardW,cardH)
  // body
  ctx.fillStyle='#ffffff'; ctx.fillRect(cardX,cardY,cardW,cardH)
  // heading
  ctx.fillStyle='#111827'; ctx.font='700 40px system-ui,Segoe UI,Roboto'
  ctx.fillText(temple, cardX+40, cardY+70)
  ctx.fillStyle='#6b7280'; ctx.font='28px system-ui,Segoe UI,Roboto'
  ctx.fillText('Name: '+name, cardX+40, cardY+120)
  ctx.fillText('Date: '+date, cardX+40, cardY+170)
  ctx.fillText('Time: '+time, cardX+40, cardY+220)
  ctx.fillText('Members: '+members, cardX+40, cardY+270)
  ctx.fillText('Vehicle: '+vehicle, cardX+40, cardY+320)

  // Big QR at right inside details
  const big=320
  const bigQR=document.createElement('canvas')
  bigQR.width=big; bigQR.height=big
  drawPseudoQR(bigQR, uid + '|BIG|' + date + ' ' + time)
  ctx.drawImage(bigQR, cardX+cardW - big - 40, cardY+40, big, big)

  const link=document.createElement('a')
  link.download='pilgrimage-pass-'+uid+'.png'
  link.href=canvas.toDataURL('image/png')
  link.click()
}

/* Attach common events if present */
document.addEventListener('DOMContentLoaded', ()=>{
  updateAuthUI()
  const logout=document.querySelector('[data-logout-btn]')
  if(logout){ logout.addEventListener('click', handleLogout) }

  const passBtn=document.querySelector('[data-download-pass]')
  if(passBtn){ passBtn.addEventListener('click', downloadPassCard) }
})