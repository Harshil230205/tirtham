(function(){
  // Storage helpers (no JSON, plain key/values)
  const PP = {
    set:(k,v)=>localStorage.setItem(k, String(v || "")),
    get:(k)=>localStorage.getItem(k) || "",
    del:(k)=>localStorage.removeItem(k),
    has:(k)=>!!localStorage.getItem(k),
    clearBooking:()=>{
      ["pp_temple","pp_date","pp_time","pp_members","pp_vehicles"].forEach(PP.del);
    }
  };

  window.PP = PP;

  // Auth helpers
  window.requireAuth = function(){
    if(!PP.has("pp_user_id")) window.location.href="home.html";
  };

  window.renderUserBadge = function(){
    const name = PP.get("pp_user_name") || "Guest";
    const id = PP.get("pp_user_id") || "";
    const elName = document.querySelector("[data-pp-username]");
    const elId = document.querySelector("[data-pp-userid]");
    const avatar = document.querySelector(".user-avatar");
    if(elName) elName.textContent = name;
    if(elId) elId.textContent = id;
    if(avatar){
      const initials = name.trim().split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() || "U";
      avatar.textContent = initials;
    }
  };

  // Bottom nav highlight
  window.highlightNav = function(page){
    document.querySelectorAll(".navlink").forEach(a=>{
      if(a.dataset.page === page){ a.classList.add("active"); }
    });
  };

  // Simple pseudo QR generator (not real QR, but consistent visual)
  const drawPseudoQR = function(canvas, text, size){
    const N = 29; // grid size
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,size,size);
    const seed = Array.from(text).reduce((s,c)=>s + c.charCodeAt(0), 0) || 1;
    const cell = Math.floor(size / N);
    // Finder-like squares
    function finder(x,y){
      ctx.fillStyle="#000"; ctx.fillRect(x*cell,y*cell,7*cell,7*cell);
      ctx.fillStyle="#fff"; ctx.fillRect((x+1)*cell,(y+1)*cell,5*cell,5*cell);
      ctx.fillStyle="#000"; ctx.fillRect((x+2)*cell,(y+2)*cell,3*cell,3*cell);
    }
    finder(1,1); finder(N-8,1); finder(1,N-8);

    for(let r=0;r<N;r++){
      for(let c=0;c<N;c++){
        // skip finder zones
        const inTopLeft = r>=1&&r<8&&c>=1&&c<8;
        const inTopRight = r>=1&&r<8&&c>=N-8&&c<N-1;
        const inBottomLeft = r>=N-8&&r<N-1&&c>=1&&c<8;
        if(inTopLeft||inTopRight||inBottomLeft) continue;

        // hash pattern
        const val = (r*31 + c*17 + seed*13) ^ (r*c + seed);
        if((val & 7) < 3){ // 3/8 filled
          ctx.fillStyle="#000";
          ctx.fillRect(c*cell, r*cell, cell, cell);
        }
      }
    }
    // Quiet zone
    ctx.strokeStyle="#00000020"; ctx.strokeRect(0,0,size,size);
  };

  window.drawPseudoQR = drawPseudoQR;

  // High-res pass card generator → returns dataURL
  window.generatePassPNG = function(opts){
    const {
      userId, userName, temple, date, time, members, vehicles
    } = opts;
    const W = 1200, H = 720;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // background
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,W,H);
    // subtle card border
    ctx.strokeStyle="#e5e7eb"; ctx.lineWidth=4; ctx.strokeRect(12,12,W-24,H-24);

    // Title
    ctx.fillStyle="#1f2937";
    ctx.font="bold 44px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("Pilgrimage Digital Pass", 48, 96);

    // User ID at top-right
    ctx.font="600 28px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle="#374151";
    const idText = "User ID: " + (userId || "-");
    ctx.fillText(idText, W-48-ctx.measureText(idText).width, 96);

    // QR block
    const qrSize = 360;
    const qrCanvas = document.createElement("canvas");
    drawPseudoQR(qrCanvas, userId || temple || "PASS", qrSize);
    ctx.drawImage(qrCanvas, (W-qrSize)/2, 130);

    // Details box
    const left = 120, top = 540;
    ctx.fillStyle="#111827"; ctx.font="700 28px system-ui, -apple-system";
    ctx.fillText(temple || "Selected Temple", left, top);

    ctx.font="400 24px system-ui, -apple-system";
    ctx.fillStyle="#374151";
    ctx.fillText("Name: " + (userName || "-"), left, top + 40);
    ctx.fillText("Date: " + (date || "-") + "   Time: " + (time || "-"), left, top + 80);
    ctx.fillText("Members: " + (members || "1") + "   Vehicles: " + (vehicles || "0"), left, top + 120);

    // Footer badge
    ctx.fillStyle="#2b6cb0"; ctx.fillRect(W-320, H-88, 240, 48);
    ctx.fillStyle="#fff"; ctx.font="600 22px system-ui, -apple-system";
    ctx.fillText("Booking Confirmed", W-300, H-55);

    return c.toDataURL("image/png");
  };

})();