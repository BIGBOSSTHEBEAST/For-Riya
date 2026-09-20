(() => {
  'use strict';
  const story = window.STORY;
  const $ = s => document.querySelector(s);
  const make = (tag, className, text) => { const el = document.createElement(tag); if(className) el.className = className; if(text !== undefined) el.textContent = text; return el; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, lightboxIndex = 0, toastTimer, lastFocus, bodyOverflow;
  const media = [...story.photos];
  for (const memory of story.memories) for (const item of (memory.photos || (memory.media ? [memory.media] : []))) if(!media.some(m => m.src === item.src)) media.push(item);
  function go(id){$(id).scrollIntoView({behavior: paused ? 'instant' : 'smooth', block:'start'});}
  function toast(text){clearTimeout(toastTimer);$('#toast').textContent = text;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),6000);}
  function imageElement(item, controls=false){
    const el = document.createElement(item.type === 'video' ? 'video' : 'img'); el.src = item.src;
    if(item.type === 'video'){el.controls = controls;el.playsInline=true;el.preload='metadata';if(item.poster)el.poster=item.poster;el.setAttribute('aria-label',item.alt || item.caption || 'Our video');}
    else{el.alt=item.alt || item.caption || 'A memory of us';el.loading='lazy';el.decoding='async';}
    el.addEventListener('error',()=>{if(!el.nextElementSibling?.classList.contains('media-error')){const note=make('p','media-error','This memory couldn’t load.');el.after(note);el.hidden=true;}});
    return el;
  }
  function mediaButton(item){const button=make('button','media-button');button.setAttribute('aria-label','Open '+(item.caption || item.alt || 'memory'));button.append(imageElement(item));button.addEventListener('click',()=>openLightbox(media.findIndex(m=>m.src===item.src)));return button;}
  // Each memory is an independent collage: staged entrance, photo focus, note, and keepsake.
  story.memories.forEach((memory, index) => {
    const numberEl=make('span','scene-number',String(index+1).padStart(2,'0'));numberEl.setAttribute('aria-hidden','true');
    const scene=make('article',`memory-scene layout-${memory.layout ?? index%4}`);
    scene.id=`memory-${index+1}`;
    scene.setAttribute('aria-labelledby',`${scene.id}-title`);
    scene.dataset.index=index;
    const atmosphere=make('div','scene-atmosphere');atmosphere.setAttribute('aria-hidden','true');
    atmosphere.append(make('span','scene-spark spark-a','✧'),make('span','scene-spark spark-b','✦'),make('span','scene-spark spark-c','♡'),make('span','scene-ripple'),make('span','scene-flower'));
    const content=make('div','scene-content');
    const heading=make('div','scene-heading');if(memory.label && !/^MEMORY\s*\d+$/i.test(memory.label))heading.append(make('p','eyebrow',memory.label));
    if(memory.date)heading.append(make('time','scene-date',memory.date));
    const title=make('h3','',memory.title);title.id=`${scene.id}-title`;heading.append(title);if(memory.text)heading.append(make('p','scene-description',memory.text));
    const collage=make('div','memory-collage');collage.setAttribute('aria-label',`Photos for memory ${index+1}`);
    const items=memory.photos || (memory.media ? [memory.media] : []);
    const photoItems=items.length?items:[null,null,null];
    const captions=[['my favorite','with you','us, always','K+R','all my love','forever ours','only you','our little world','you & me','still you','always, yours','to the moon'][index%12], ...['always','forever','K+R','you & me','all my love','our little world','still you','to be continued'].slice((index*2)%7), 'always', 'forever'];
    photoItems.forEach((item,photoIndex)=>{
      const frame=make('div',`collage-frame frame-${photoIndex%3}`);frame.style.setProperty('--slot',photoIndex);frame.style.setProperty('--angle',`${[-9,7,-3][photoIndex%3]}deg`);
      if(item){const button=mediaButton(item);frame.append(button,make('span','frame-caption',item.caption || captions[photoIndex%captions.length]));}
      else{
        const button=make('button','photo-placeholder');button.setAttribute('aria-label',`Bring photo frame ${photoIndex+1} forward in memory ${index+1}`);button.setAttribute('aria-pressed','false');
        const art=make('span','placeholder-art');art.setAttribute('aria-hidden','true');
        button.append(art,make('span','placeholder-mark','♡'),make('span','placeholder-label',`YOUR PHOTO ${String(photoIndex+1).padStart(2,'0')}`));
        button.addEventListener('click',()=>{
          const was=frame.classList.contains('focused');
          collage.querySelectorAll('.collage-frame').forEach(f=>{f.classList.remove('focused');f.querySelector('.photo-placeholder')?.setAttribute('aria-pressed','false');});
          frame.classList.toggle('focused',!was);button.setAttribute('aria-pressed',String(!was));
        });
        frame.append(button,make('span','frame-caption',captions[photoIndex%captions.length]));
      }
      collage.append(frame);
    });
    const note=make('div','memory-note');const noteButton=make('button','note-toggle');noteButton.setAttribute('aria-expanded','false');noteButton.setAttribute('aria-controls',`${scene.id}-note`);noteButton.append(make('span','note-icon','♡'),make('span','','Click for a memo'),make('span','note-plus','+'));
    const noteBody=make('div','note-body');noteBody.id=`${scene.id}-note`;noteBody.hidden=true;
    noteBody.append(make('p','note-handwriting',memory.note || memory.text));
    noteButton.addEventListener('click',()=>{const open=noteButton.getAttribute('aria-expanded')!=='true';noteButton.setAttribute('aria-expanded',String(open));noteBody.hidden=!open;note.classList.toggle('note-open',open);noteButton.querySelector('.note-plus').textContent=open?'−':'+';});
    note.append(noteButton,noteBody);
    const actions=make('div','scene-actions');
    const keep=make('button','keep-memory');keep.setAttribute('aria-label',`Spread and light up the photos for memory ${index+1}`);keep.setAttribute('aria-pressed','false');keep.append(make('span','','♡'));
    keep.addEventListener('click',()=>{
      const lit=keep.getAttribute('aria-pressed')!=='true';
      keep.setAttribute('aria-pressed',String(lit));keep.firstChild.textContent=lit?'♥':'♡';
      keep.setAttribute('aria-label',lit?`Gather the photos for memory ${index+1}`:`Spread and light up the photos for memory ${index+1}`);
      collage.querySelectorAll('.collage-frame').forEach(frame=>{frame.classList.remove('focused');frame.querySelector('.photo-placeholder')?.setAttribute('aria-pressed','false');});
      collage.classList.toggle('spread',lit);scene.classList.toggle('kept',lit);
    });actions.append(keep);
    content.append(heading,collage,note,actions);scene.append(atmosphere,numberEl,content);$('#timeline').append(scene);
    const dot=make('button','memory-dot');dot.setAttribute('aria-label',`Memory ${index+1}: ${memory.title}`);dot.addEventListener('click',()=>go(`#${scene.id}`));$('#memory-dots').append(dot);
  });
  const sceneObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('arrived');});
  },{threshold:.12});
  document.querySelectorAll('.memory-scene').forEach(scene=>sceneObserver.observe(scene));
  const activeObserver=new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(entry=>{
      const index=Number(entry.target.dataset.index);
      $('#memory-position').textContent=`${String(index+1).padStart(2,'0')} / ${story.memories.length}`;
      document.querySelectorAll('.memory-dot').forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');});
    });
  },{rootMargin:'-20% 0px -55% 0px',threshold:0});
  document.querySelectorAll('.memory-scene').forEach(scene=>activeObserver.observe(scene));
  $('#memory-position').textContent=`01 / ${story.memories.length}`;
  $('.memory-dot')?.setAttribute('aria-current','step');

  const revealed=new Set();
  let activeReasonAudio=null;
  story.reasons.forEach((reason,index)=>{
    const wrapper=make('div','reason-wrapper reveal');
    const button=make('button','reason');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Reveal reason ${index+1}`);
    const inner=make('span','reason-inner');const front=make('span','reason-front');
    front.append(make('span','reason-number',String(index+1).padStart(2,'0')),make('span','','TAP TO DISCOVER'));
    const back=make('span','reason-back');back.setAttribute('aria-hidden','true');
    const photo=make('span','reason-photo');
    if(reason.photo){const item=typeof reason.photo==='string'?{src:reason.photo,alt:reason.title}:reason.photo;photo.append(imageElement(item));}
    else{photo.classList.add('awaiting-photo');photo.setAttribute('aria-hidden','true');photo.append(make('span','reason-photo-heart','♡'));}
    back.append(photo,make('strong','',reason.title),make('span','reason-message',reason.message));inner.append(front,back);button.append(inner);wrapper.append(button);
    let sound=null,replay=null;
    if(reason.audio){
      sound=new Audio(reason.audio);sound.preload='metadata';sound.controls=false;sound.hidden=true;sound.className='reason-audio-player';sound.setAttribute('aria-label','Listen to your laugh');
      replay=make('button','reason-audio text-button','Play sound again ♫');replay.hidden=true;
      const play=()=>{
        if(activeReasonAudio){activeReasonAudio.pause();activeReasonAudio.currentTime=0;}
        activeReasonAudio=sound;sound.currentTime=0;sound.muted=false;sound.volume=1;
        sound.play().then(()=>{replay.textContent='Pause sound ♫';}).catch(()=>{replay.textContent='Play sound ♫';});
      };
      replay.addEventListener('click',()=>{if(!sound.paused){sound.pause();replay.textContent='Play sound again ♫';}else play();});
      sound.addEventListener('ended',()=>{replay.textContent='Play sound again ♫';});
      sound.addEventListener('error',()=>{replay.textContent='Sound unavailable';});
      wrapper.append(sound,replay);wrapper.playSound=play;
    }
    button.addEventListener('click',()=>{
      const open=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(open));wrapper.classList.toggle('opened',open);
      button.setAttribute('aria-label',open?`${reason.title}. ${reason.message} Tap to close.`:`Reveal reason ${index+1}`);
      front.setAttribute('aria-hidden',String(open));back.setAttribute('aria-hidden',String(!open));
      
      if(replay)replay.hidden=!open;
      if(open){revealed.add(index);wrapper.playSound?.();}else if(sound){sound.pause();sound.currentTime=0;}
      $('#reason-count').textContent=`${revealed.size} of ${story.reasons.length} little reasons discovered`;
      if(revealed.size===story.reasons.length&&!$('#reason-count').dataset.done){$('#reason-count').dataset.done='true';toast('And a thousand more I haven’t found the words for yet.');}
    });
    $('#reason-cards').append(wrapper);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)activeReasonAudio?.pause();});
  $('#reason-count').textContent=`0 of ${story.reasons.length} little reasons discovered`;
  function renderLightbox(){const item=media[lightboxIndex];$('#lightbox-media').querySelector('video')?.pause();$('#lightbox-media').replaceChildren(imageElement(item,true));$('#lightbox-caption').textContent=`${item.caption || ''} · ${lightboxIndex+1} / ${media.length}`;$('#lightbox-prev').disabled=media.length<2;$('#lightbox-next').disabled=media.length<2;}
  function openLightbox(index){if(index<0 || !media.length)return;lastFocus=document.activeElement;lightboxIndex=index;renderLightbox();bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';$('#lightbox').showModal();$('#close-lightbox').focus();}
  function closeLightbox(){$('#lightbox').close();}
  function stepLightbox(delta){lightboxIndex=(lightboxIndex+delta+media.length)%media.length;renderLightbox();}
  $('#close-lightbox').addEventListener('click',closeLightbox);$('#lightbox').addEventListener('close',()=>{$('#lightbox-media').querySelector('video')?.pause();document.body.style.overflow=bodyOverflow || '';lastFocus?.focus();});$('#lightbox').addEventListener('click',event=>{if(event.target===$('#lightbox'))closeLightbox();});$('#lightbox-prev').addEventListener('click',()=>stepLightbox(-1));$('#lightbox-next').addEventListener('click',()=>stepLightbox(1));$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stepLightbox(1);}if(e.key==='ArrowLeft'){e.preventDefault();stepLightbox(-1);}});
  let touchX=0,touchY=0;$('#lightbox-media').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;},{passive:true});$('#lightbox-media').addEventListener('touchend',e=>{if(e.target.tagName==='VIDEO')return;const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))stepLightbox(dx<0?1:-1);},{passive:true});
  story.letter.forEach(paragraph=>$('#letter-body').append(make('p','',paragraph)));
  $('#envelope').addEventListener('click',()=>{if($('#envelope').classList.contains('open')){go('#letter-paper');return;}$('#envelope').classList.add('open');$('#envelope').setAttribute('aria-expanded','true');$('#letter-hint').textContent='For you. Every word.';setTimeout(()=>{$('#letter-paper').hidden=false;go('#letter-paper');$('#letter-paper').focus({preventScroll:true});},paused?0:850);});
  const scratchCanvas=$('#scratch-cover'),scratchBox=$('.scratch-box');
  const scratchContext=scratchCanvas.getContext('2d',{willReadFrequently:true});
  let giftRevealed=false,scratching=false,lastScratch=null;
  function revealGift(){
    if(giftRevealed)return;giftRevealed=true;scratching=false;
    scratchBox.classList.add('gift-revealed');$('#gift-code').removeAttribute('aria-hidden');
    $('#scratch-status').textContent='Your gift code is revealed. Press and hold the code to copy it.';
    $('#reveal-code').hidden=true;scratchCanvas.setAttribute('aria-hidden','true');
  }
  function paintScratchCover(){
    if(giftRevealed||!scratchBox.clientWidth)return;
    const w=scratchBox.clientWidth,h=scratchBox.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    scratchCanvas.width=Math.round(w*dpr);scratchCanvas.height=Math.round(h*dpr);
    scratchContext.setTransform(dpr,0,0,dpr,0,0);scratchContext.globalCompositeOperation='source-over';
    const foil=scratchContext.createLinearGradient(0,0,w,h);foil.addColorStop(0,'#d7b889');foil.addColorStop(.45,'#ead6b2');foil.addColorStop(1,'#b48c64');
    scratchContext.fillStyle=foil;scratchContext.fillRect(0,0,w,h);
    scratchContext.strokeStyle='#49304118';scratchContext.lineWidth=1;
    for(let x=-h;x<w;x+=13){scratchContext.beginPath();scratchContext.moveTo(x,0);scratchContext.lineTo(x+h,h);scratchContext.stroke();}
    scratchContext.fillStyle='#4a3040';scratchContext.textAlign='center';scratchContext.textBaseline='middle';
    scratchContext.font='italic 23px Georgia';scratchContext.fillText('A little surprise for you',w/2,h/2-14);
    scratchContext.font='12px system-ui';scratchContext.fillText('SCRATCH TO REVEAL',w/2,h/2+22);
  }
  function scratchAt(event){
    const rect=scratchCanvas.getBoundingClientRect(),point={x:event.clientX-rect.left,y:event.clientY-rect.top};
    scratchContext.globalCompositeOperation='destination-out';scratchContext.lineWidth=42;scratchContext.lineCap='round';scratchContext.lineJoin='round';
    scratchContext.beginPath();scratchContext.moveTo((lastScratch||point).x,(lastScratch||point).y);scratchContext.lineTo(point.x,point.y);scratchContext.stroke();
    scratchContext.beginPath();scratchContext.arc(point.x,point.y,21,0,Math.PI*2);scratchContext.fill();lastScratch=point;
  }
  scratchCanvas.addEventListener('pointerdown',event=>{if(giftRevealed||event.button>0)return;scratching=true;lastScratch=null;scratchCanvas.setPointerCapture(event.pointerId);scratchAt(event);});
  scratchCanvas.addEventListener('pointermove',event=>{if(scratching)scratchAt(event);});
  function endScratch(){
    if(!scratching)return;scratching=false;lastScratch=null;
    const pixels=scratchContext.getImageData(0,0,scratchCanvas.width,scratchCanvas.height).data;
    let cleared=0,samples=0;for(let i=3;i<pixels.length;i+=64){samples++;if(pixels[i]<100)cleared++;}
    if(cleared/samples>.38)revealGift();
  }
  scratchCanvas.addEventListener('pointerup',endScratch);scratchCanvas.addEventListener('pointercancel',endScratch);scratchCanvas.addEventListener('lostpointercapture',endScratch);
  $('#reveal-code').addEventListener('click',revealGift);
  new ResizeObserver(paintScratchCover).observe(scratchBox);
  $('#finish').addEventListener('click',()=>{$('#ending').hidden=false;requestAnimationFrame(()=>{paintScratchCover();go('#ending');});});
  $('#replay').addEventListener('click',()=>go('#opening'));$('#begin').addEventListener('click',()=>go('#memory-1'));$('#secret').addEventListener('click',()=>toast(story.secret));
  for(let i=0;i<14;i++){const star=make('span','ambient-light');star.style.left=`${(i*37+13)%100}%`;star.style.top=`${(i*23+7)%100}%`;star.style.animationDelay=`-${i}s`;$('#lights').append(star);}
  const sky=make('div','opening-sky');sky.setAttribute('aria-hidden','true');
  for(let i=0;i<10;i++){
    const spark=make('span','sky-spark sky-star',i%3===0?'✧':'·');
    spark.style.left=`${4+(i*37)%92}%`;spark.style.top=`${8+(i*19)%62}%`;
    spark.style.setProperty('--spark-size',`${10+i%7}px`);
    spark.style.setProperty('--spark-duration',`${7+i%7}s`);spark.style.animationDelay=`-${i*.73}s`;
    sky.append(spark);
  }
  $('#opening').prepend(sky);
  function setMotion(value){paused=value;document.documentElement.classList.toggle('motion-paused',paused);$('#motion').textContent=paused?'Motion off':'Motion on';$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').setAttribute('aria-label',paused?'Enable decorative animations':'Pause decorative animations');}
  setMotion(paused);$('#motion').addEventListener('click',()=>setMotion(!paused));reduced.addEventListener('change',e=>setMotion(e.matches));
  const chapterObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)));
  chapterObserver.observe($('#opening')); document.querySelectorAll('.memory-scene').forEach(el=>chapterObserver.observe(el));
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}},{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));document.documentElement.classList.add('js');
  let scheduled=false;
  function updateScroll(){
    const total=document.documentElement.scrollHeight-innerHeight;
    $('.reading-progress').style.transform=`scaleX(${total>0?scrollY/total:0})`;
    if(!paused){
      document.querySelectorAll('.memory-scene.in-view').forEach(scene=>{
        const distance=Math.max(-1,Math.min(1,(scene.getBoundingClientRect().top+scene.offsetHeight/2-innerHeight/2)/innerHeight));
        scene.style.setProperty('--drift',`${distance*18}px`);
      });
    }
    scheduled=false;
  }
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});addEventListener('resize',updateScroll);updateScroll();
})();


