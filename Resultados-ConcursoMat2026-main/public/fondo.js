(function(){
  var f=document.querySelector('.fondo'); if(!f) return;
  f.innerHTML='<canvas></canvas>';
  var c=f.firstChild, x=c.getContext('2d'), P=[], W,H,dpr=Math.min(devicePixelRatio||1,2);
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.round(Math.min(90,W*H/16000)); while(P.length<n)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.6+.8}); P.length=n;}
  function paso(){x.clearRect(0,0,W,H);var D=150;
    for(var i=0;i<P.length;i++){var a=P[i]; if(!reduce){a.x+=a.vx;a.y+=a.vy; if(a.x<0||a.x>W)a.vx*=-1; if(a.y<0||a.y>H)a.vy*=-1;}
      for(var j=i+1;j<P.length;j++){var b=P[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<D){x.strokeStyle='rgba(150,205,255,'+(.3*(1-d/D))+')';x.lineWidth=1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();}}
      x.fillStyle='rgba(190,235,255,.9)';x.shadowColor='#8fe0ff';x.shadowBlur=8;x.beginPath();x.arc(a.x,a.y,a.r,0,7);x.fill();x.shadowBlur=0;}
    if(!reduce)requestAnimationFrame(paso);}
  size();addEventListener('resize',size);paso();
  var S=['f(x)','sin θ','∫f(x)dx','∠90°','Σ','lim x→∞','x²+y²=r²','n!','√','∞','×','≈','π','Δ','cos θ','a²+b²=c²','log x','÷','%','θ'];
  for(var i=0;i<22;i++){var s=document.createElement('span');s.className='simbolo';s.textContent=S[i%S.length];
    s.style.left=(Math.random()*92)+'vw';s.style.top=(Math.random()*110)+'vh';s.style.fontSize=(1.3+Math.random()*2.2)+'rem';
    s.style.setProperty('--d',(28+Math.random()*30)+'s');s.style.setProperty('--r',(6+Math.random()*6)+'s');s.style.setProperty('--a',(Math.random()*24-12)+'deg');
    s.style.animationDelay=(-Math.random()*40)+'s,'+(-Math.random()*8)+'s';f.appendChild(s);}
})();
