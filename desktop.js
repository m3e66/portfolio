
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reduced.matches && !root.classList.contains('motion-off') && !document.hidden;
  const progress = document.createElement('div');
  progress.className = 'page-progress'; progress.setAttribute('aria-hidden','true');
  document.body.append(progress);
  let scrollFrame = false;
  const progressUpdate = () => {
    scrollFrame = false;
    const extent = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${extent > 0 ? scrollY / extent : 0})`;
  };
  addEventListener('scroll', () => { if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(progressUpdate); } }, {passive:true});
  addEventListener('resize', progressUpdate); progressUpdate();

  const launchButton = document.querySelector('[data-launcher]');
  const launcher = document.getElementById('tool-launcher');
  function closeLauncher() { if (!launcher) return; launcher.hidden=true; launchButton.setAttribute('aria-expanded','false'); }
  launchButton?.addEventListener('click', () => { const open=launcher.hidden; launcher.hidden=!open; launchButton.setAttribute('aria-expanded',String(open)); });
  launcher?.addEventListener('click', e => { if(e.target.closest('[data-app]'))closeLauncher(); });
  document.addEventListener('click', e => { if(!e.target.closest('.tool-launcher, [data-launcher]'))closeLauncher(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape' && launcher && !launcher.hidden){closeLauncher();launchButton.focus();} });
  const clock=document.querySelector('.desktop-clock');
  function updateClock(){if(clock){const now=new Date();clock.dateTime=now.toISOString();clock.textContent=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}}
  updateClock(); setInterval(updateClock,30000);

  const fx=document.getElementById('desktop-fx');
  let lastTrail=0, previousX=0,previousY=0;
  function bit(x,y,burst=false,i=0){
    if(!fx||fx.childElementCount>35)return;
    const pixel=document.createElement('i'); pixel.className=burst?'click-pixel':'cursor-pixel';
    pixel.style.left=x+'px';pixel.style.top=y+'px';
    if(burst){const a=i*Math.PI/4;pixel.style.setProperty('--dx',Math.cos(a)*25+'px');pixel.style.setProperty('--dy',Math.sin(a)*25+'px');}
    fx.append(pixel);setTimeout(()=>pixel.remove(),800);
  }
  if(matchMedia('(pointer:fine)').matches){
    document.addEventListener('pointermove', e => {
      if(!motionAllowed() || e.target.closest('dialog') || e.buttons)return;
      const time=performance.now();if(time-lastTrail<45||Math.hypot(e.clientX-previousX,e.clientY-previousY)<10)return;
      lastTrail=time;previousX=e.clientX;previousY=e.clientY;bit(e.clientX+8,e.clientY+12);
    },{passive:true});
  }
  document.addEventListener('click',e=>{if(!motionAllowed()||e.target.closest('dialog')||e.detail===0)return;for(let i=0;i<8;i++)bit(e.clientX,e.clientY,true,i);});
  const motionButton=document.querySelector('.motion-button');
  function syncMotion(){
    const off=!motionAllowed() && !document.hidden;
    if(motionButton){motionButton.disabled=reduced.matches;motionButton.setAttribute('aria-pressed',String(off));motionButton.textContent=reduced.matches?'Reduced motion':off?'Resume motion':'Pause motion';}
    if(root.classList.contains('motion-off')||reduced.matches){fx?.replaceChildren();document.querySelectorAll('.reveal').forEach(el=>el.classList.remove('is-pending'));}
  }
  new MutationObserver(syncMotion).observe(root,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',syncMotion);document.addEventListener('leo:settings',syncMotion);syncMotion();

  const stage=document.querySelector('.desktop-stage');
  let topWindow=6;
  if(stage){
    const windows=[...stage.querySelectorAll('[data-desktop-window]')];
    function place(win,x,y){
      const maxX=Math.max(0,stage.clientWidth-win.offsetWidth);
      const maxY=Math.max(0,stage.clientHeight-win.offsetHeight);
      win.style.left=Math.round(Math.max(0,Math.min(maxX,x)))+'px';win.style.top=Math.round(Math.max(0,Math.min(maxY,y)))+'px';win.style.right='auto';win.classList.add('is-positioned');win.style.zIndex=String(++topWindow);
    }
    for(const win of windows){
      const handle=win.querySelector('[data-drag]');let drag=null;
      handle.addEventListener('pointerdown', e => {
        if(e.button!==0||innerWidth<=850)return;
        drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:win.offsetLeft,y:win.offsetTop};
        place(win,drag.x,drag.y);win.classList.add('is-dragging');handle.setPointerCapture(e.pointerId);e.preventDefault();
      });
      handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;place(win,drag.x+e.clientX-drag.startX,drag.y+e.clientY-drag.startY);});
      const end=()=>{drag=null;win.classList.remove('is-dragging');};
      handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
      handle.addEventListener('keydown',e=>{if(innerWidth<=850||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?30:10;place(win,win.offsetLeft+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),win.offsetTop+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0));});
      win.querySelector('[data-collapse]')?.addEventListener('click',e=>{const button=e.currentTarget,body=win.querySelector('.mini-window-body');body.hidden=!body.hidden;button.setAttribute('aria-expanded',String(!body.hidden));button.setAttribute('aria-label',body.hidden?'Restore showcase window':'Minimize showcase window');button.textContent=body.hidden?'□':'_';});
    }
    function resetLayout(){windows.forEach(win=>{win.style.removeProperty('left');win.style.removeProperty('top');win.style.removeProperty('right');win.style.removeProperty('z-index');win.classList.remove('is-positioned','is-dragging');});}
    document.querySelector('[data-reset-layout]')?.addEventListener('click',resetLayout);
    let previousNarrow=innerWidth<=850;
    addEventListener('resize',()=>{const narrow=innerWidth<=850;if(narrow!==previousNarrow){resetLayout();previousNarrow=narrow;}});
  }

  const previewImage=document.getElementById('desktop-preview-image');
  if(previewImage){
    const previews=[
      {src:'assets/cultivation-23.webp',alt:'Original golden spell effects in Immortal Cultivation Mod',caption:'IMMORTAL CULTIVATION / IN-GAME',href:'immortal-cultivation.html'},
      {src:'assets/signal-1.png',alt:'Last Signal released game menu and tactical display',caption:'LAST SIGNAL / RELEASED GAME',href:'last-signal.html'},
      {src:'assets/cultivation-14.webp',alt:'Original creature model shown in the cultivation development logs',caption:'MODEL VIEWPORT / CREATURE DESIGN',href:'immortal-cultivation.html'}
    ];
    const tabs=[...document.querySelectorAll('[data-preview]')],link=document.querySelector('.desktop-preview'),caption=document.getElementById('desktop-preview-caption'),play=document.querySelector('[data-preview-play]');
    let selected=2,playing=true,pointerInside=false;
    const select=index=>{selected=index;const p=previews[index];previewImage.src=p.src;previewImage.alt=p.alt;caption.textContent=p.caption;link.href=p.href;link.setAttribute('aria-label',index===1?'Read the Last Signal case study':'Read the Immortal Cultivation case study');tabs.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===index)));};
    tabs.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
    play.addEventListener('click',()=>{playing=!playing;play.setAttribute('aria-pressed',String(playing));play.setAttribute('aria-label',playing?'Pause project slideshow':'Play project slideshow');play.textContent=playing?'Ⅱ':'▶';});
    document.querySelector('.showcase-window').addEventListener('pointerenter',()=>{pointerInside=true;});
    document.querySelector('.showcase-window').addEventListener('pointerleave',()=>{pointerInside=false;});
    setInterval(()=>{if(playing&&motionAllowed()&&!pointerInside&&!document.querySelector('dialog[open]')&&!document.activeElement?.closest('.showcase-window'))select((selected+1)%previews.length);},7000);
  }

  const filterButtons=[...document.querySelectorAll('[data-filter]')],cards=[...document.querySelectorAll('.project-card[data-category]')];
  filterButtons.forEach(button=>button.addEventListener('click',()=>{
    const category=button.dataset.filter;let visible=0;
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    cards.forEach(card=>{const show=category==='all'||card.dataset.category===category;card.hidden=!show;card.classList.remove('is-filtering');if(show){visible++;card.classList.remove('is-pending');card.classList.add('is-visible','is-filtering');}});
    const count=document.querySelector('.filter-count');count.textContent=`${visible} ${visible===1?'item':'items'}`;progressUpdate();
  }));
  document.querySelectorAll('[data-process]').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.getAttribute('aria-controls'));target.hidden=!target.hidden;button.setAttribute('aria-expanded',String(!target.hidden));button.textContent=target.hidden?'Inspect step +':'Close note −';}));
})();
