(()=>{
  "use strict";
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery=matchMedia('(max-width: 760px)');
  const compactServiceQuery=matchMedia('(max-width: 980px)');
  const AUTO_CYCLE=3000;

  const observeVisibility=(el,callback,threshold=.12)=>{
    if(!el)return()=>{};
    if(!('IntersectionObserver'in window)){callback(true);return()=>{}};
    const io=new IntersectionObserver(entries=>entries.forEach(e=>callback(e.isIntersecting,e)),{threshold});
    io.observe(el);return()=>io.disconnect();
  };

  /* Header and accessible mobile navigation */
  const header=$('[data-header]');
  const onScroll=()=>header?.classList.toggle('is-scrolled',scrollY>10);
  onScroll();addEventListener('scroll',onScroll,{passive:true});
  const menuButton=$('[data-menu-toggle]');
  const mobileMenu=$('[data-mobile-menu]');
  const menuLinks=mobileMenu?$$('a,button',mobileMenu):[];
  let menuOpen=false;
  const setMenu=open=>{
    if(!mobileMenu||!menuButton)return;
    menuOpen=open;
    mobileMenu.classList.toggle('is-open',open);
    document.body.classList.toggle('menu-open',open);
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');
    mobileMenu.toggleAttribute('inert',!open);
    if(open){requestAnimationFrame(()=>menuLinks[0]?.focus())}
    else{menuButton.focus({preventScroll:true})}
  };
  if(mobileMenu)mobileMenu.setAttribute('inert','');
  menuButton?.addEventListener('click',()=>setMenu(!menuOpen));
  menuLinks.forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen)setMenu(false)});
  addEventListener('resize',()=>{if(innerWidth>980&&menuOpen)setMenu(false)});

  /* Reveal and on-screen animation state. Content stays visible by default. */
  const revealNodes=$$('.reveal');
  const liveNodes=$$('[data-fx-section],.hero,.home-intro,.project-focus,.team-band,.emergency-band,.contact-opening,.coverage-band');
  if('IntersectionObserver'in window){
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target)}
    }),{threshold:.06,rootMargin:'180px 0px'});
    revealNodes.forEach(el=>revealObserver.observe(el));
    const liveObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-live',entry.isIntersecting)),{threshold:.03,rootMargin:'120px 0px'});
    liveNodes.forEach(el=>liveObserver.observe(el));
    setTimeout(()=>revealNodes.forEach(el=>el.classList.add('in-view')),1400);
  }else{
    revealNodes.forEach(el=>el.classList.add('in-view'));
    liveNodes.forEach(el=>el.classList.add('is-live'));
  }

  /* Hero */
  const hero=$('[data-hero]');
  if(hero){
    const slides=$$('[data-hero-slide]',hero),current=$('[data-hero-current]',hero),progress=$('[data-hero-progress]',hero),playButton=$('[data-hero-toggle]',hero);
    let index=0,timer=null,manualPause=false,hoverPause=false,inView=true,startX=0;
    const duration=AUTO_CYCLE;
    const paused=()=>manualPause||hoverPause||!inView||reduced;
    const resetProgress=()=>{
      if(!progress)return;
      progress.style.transition='none';progress.style.width='0';
      if(paused())return;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{progress.style.transition=`width ${duration}ms linear`;progress.style.width='100%'}));
    };
    const show=n=>{
      if(!slides.length)return;
      slides[index].classList.remove('is-active');
      index=(n+slides.length)%slides.length;
      slides[index].classList.add('is-active');
      if(current)current.textContent=String(index+1).padStart(2,'0');
      resetProgress();
    };
    const stop=()=>{clearInterval(timer);timer=null};
    const start=()=>{stop();resetProgress();if(!reduced&&!paused())timer=setInterval(()=>show(index+1),duration)};
    $('[data-hero-prev]',hero)?.addEventListener('click',()=>{show(index-1);start()});
    $('[data-hero-next]',hero)?.addEventListener('click',()=>{show(index+1);start()});
    playButton?.addEventListener('click',()=>{manualPause=!manualPause;playButton.textContent=manualPause?'▶':'Ⅱ';playButton.setAttribute('aria-label',manualPause?'Play hero autoplay':'Pause hero autoplay');start()});
    hero.addEventListener('touchstart',e=>{startX=e.touches[0].clientX},{passive:true});
    hero.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>45){show(index+(d<0?1:-1));start()}},{passive:true});
    observeVisibility(hero,v=>{inView=v;v?start():stop()},.2);
    start();
  }

  /* Seamless rails; native snap on small screens for timeline/facility */
  function makeCloneInert(node){
    node.setAttribute('aria-hidden','true');
    node.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
    node.querySelectorAll('img').forEach(img=>img.setAttribute('loading','lazy'));
  }
  function autoRail(selector,{mobileNative=false}={}){
    const rail=$(selector);if(!rail)return;
    const mask=rail.parentElement;
    const originalChildren=[...rail.children];
    if(mobileQuery.matches&&mask){
      let index=0,timer=null,visible=false,hold=false;
      const gap=()=>parseFloat(getComputedStyle(rail).columnGap||getComputedStyle(rail).gap||'0')||0;
      const step=()=>{const first=originalChildren[0];return first?first.getBoundingClientRect().width+gap():0};
      const stop=()=>{clearTimeout(timer);timer=null};
      const show=n=>{index=(n+originalChildren.length)%originalChildren.length;mask.scrollTo({left:index*step(),behavior:reduced?'auto':'smooth'})};
      const schedule=()=>{stop();if(!visible||hold||reduced)return;timer=setTimeout(()=>{show(index+1);schedule()},AUTO_CYCLE)};
      const pause=()=>{hold=true;stop()};
      const resume=()=>{hold=false;schedule()};
      mask.addEventListener('pointerdown',pause,{passive:true});
      mask.addEventListener('pointerup',resume,{passive:true});
      mask.addEventListener('pointercancel',resume,{passive:true});
      observeVisibility(mask,v=>{visible=v;v?schedule():stop()},.02);
      return;
    }
    if(originalChildren.length<2)return;
    if(!rail.dataset.cloned){
      originalChildren.forEach(child=>{const clone=child.cloneNode(true);makeCloneInert(clone);rail.appendChild(clone)});
      rail.dataset.cloned='1';
    }
    const originalCount=originalChildren.length;
    let index=0,timer=null,visible=false,hold=false,drag=false,pointerId=null,startX=0,baseX=0,moved=false,resetTimer=null;
    const gap=()=>parseFloat(getComputedStyle(rail).columnGap||getComputedStyle(rail).gap||'0')||0;
    const step=()=>{const first=rail.children[0];return first?first.getBoundingClientRect().width+gap():0};
    const xForIndex=()=>-(index*step());
    const setPosition=(animate=true)=>{
      rail.style.transition=animate?'transform .8s cubic-bezier(.22,.7,.22,1)':'none';
      rail.style.transform=`translate3d(${xForIndex()}px,0,0)`;
    };
    const stop=()=>{clearTimeout(timer);timer=null;clearTimeout(resetTimer);resetTimer=null};
    const schedule=()=>{
      stop();
      if(!visible||hold||drag||reduced)return;
      timer=setTimeout(()=>{
        index+=1;
        setPosition(true);
        if(index>=originalCount){
          resetTimer=setTimeout(()=>{index=0;setPosition(false);requestAnimationFrame(schedule)},850);
        }else schedule();
      },AUTO_CYCLE);
    };
    rail.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      drag=true;pointerId=e.pointerId;startX=e.clientX;baseX=xForIndex();moved=false;stop();rail.style.transition='none';rail.setPointerCapture?.(e.pointerId);
    });
    rail.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==pointerId)return;
      const dx=e.clientX-startX;
      if(Math.abs(dx)>6)moved=true;
      if(moved)rail.style.transform=`translate3d(${baseX+dx}px,0,0)`;
    });
    const finish=e=>{
      if(!drag)return;
      const dx=e.clientX-startX;
      drag=false;
      try{rail.releasePointerCapture?.(e.pointerId)}catch(_){ }
      if(Math.abs(dx)>45)index=Math.max(0,Math.min(originalCount,index+(dx<0?1:-1)));
      setPosition(true);
      if(index>=originalCount)resetTimer=setTimeout(()=>{index=0;setPosition(false);schedule()},850);else schedule();
      setTimeout(()=>moved=false,0);
    };
    rail.addEventListener('pointerup',finish);rail.addEventListener('pointercancel',finish);
    rail.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation()}},true);
    addEventListener('resize',()=>{setPosition(false);schedule()},{passive:true});
    observeVisibility(mask||rail,v=>{visible=v;if(v){setPosition(false);schedule()}else stop()},.02);
  }
  autoRail('[data-loop-rail]');
  autoRail('[data-timeline-rail]',{mobileNative:true});
  autoRail('[data-facility-rail]',{mobileNative:true});

  /* Home focus carousel with centered initial card and seamless edge clones */
  const focus=$('[data-focus-carousel]');
  if(focus){
    const track=$('[data-focus-track]',focus),originalCards=$$('.focus-card',focus),dotsWrap=$('[data-focus-dots]',focus),viewport=$('.focus-viewport',focus);
    const originalCount=originalCards.length;
    let logicalIndex=originalCount>1?1:0,physicalIndex=logicalIndex+1,timer=null,resetTimer=null,visible=false,hold=false,startX=0;

    if(track&&originalCount>1){
      const firstClone=originalCards[0].cloneNode(true);
      const lastClone=originalCards[originalCount-1].cloneNode(true);
      [firstClone,lastClone].forEach(clone=>{clone.dataset.carouselClone='true';clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','')});
      track.insertBefore(lastClone,originalCards[0]);
      track.appendChild(firstClone);
    }

    const cards=track?$$('.focus-card',track):originalCards;
    originalCards.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Show project ${i+1}`);b.addEventListener('click',()=>{showLogical(i);restart()});dotsWrap?.appendChild(b)});
    const dots=dotsWrap?$$('button',dotsWrap):[];

    function setPosition(animate=true){
      if(!cards.length||!viewport||!track)return;
      clearTimeout(resetTimer);
      if(!animate)track.style.transition='none';else track.style.transition='';
      const card=cards[physicalIndex];
      logicalIndex=(physicalIndex-1+originalCount)%originalCount;
      cards.forEach((c,i)=>c.classList.toggle('is-active',i===physicalIndex));
      dots.forEach((d,i)=>d.classList.toggle('is-active',i===logicalIndex));
      const x=viewport.clientWidth/2-(card.offsetLeft+card.offsetWidth/2);
      track.style.transform=`translate3d(${x}px,0,0)`;
      if(!animate){track.offsetHeight;requestAnimationFrame(()=>{track.style.transition=''})}
    }

    function showLogical(n,animate=true){
      if(!originalCount)return;
      logicalIndex=(n+originalCount)%originalCount;
      physicalIndex=logicalIndex+1;
      setPosition(animate);
    }

    function move(step){
      if(originalCount<2)return;
      physicalIndex+=step;
      setPosition(true);
      resetTimer=setTimeout(()=>{
        if(physicalIndex===0){physicalIndex=originalCount;setPosition(false)}
        else if(physicalIndex===originalCount+1){physicalIndex=1;setPosition(false)}
      },700);
    }

    const stop=()=>{clearInterval(timer);timer=null};
    function restart(){stop();if(!reduced&&visible&&!hold)timer=setInterval(()=>move(1),AUTO_CYCLE)}
    $('[data-focus-prev]',focus)?.addEventListener('click',()=>{move(-1);restart()});
    $('[data-focus-next]',focus)?.addEventListener('click',()=>{move(1);restart()});
    viewport?.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});
    viewport?.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>45){move(d<0?1:-1);restart()}},{passive:true});
    addEventListener('resize',()=>setPosition(false),{passive:true});
    observeVisibility(focus,v=>{visible=v;v?restart():stop()},.1);
    requestAnimationFrame(()=>setPosition(false));
  }

  /* Portfolio stage */
  const projectCarousel=$('[data-project-carousel]');
  if(projectCarousel){
    const slides=$$('.project-slide',projectCarousel),count=$('[data-project-count]',projectCarousel),progress=$('[data-project-progress]',projectCarousel),track=$('[data-project-track]',projectCarousel);
    let index=0,timer=null,visible=false,hold=false,startX=0;const duration=AUTO_CYCLE;
    const progressRun=()=>{if(!progress)return;progress.style.transition='none';progress.style.width='0';if(!visible||hold||reduced)return;requestAnimationFrame(()=>requestAnimationFrame(()=>{progress.style.transition=`width ${duration}ms linear`;progress.style.width='100%'}))};
    const show=n=>{if(!slides.length)return;slides[index].classList.remove('is-active');index=(n+slides.length)%slides.length;slides[index].classList.add('is-active');if(count)count.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;progressRun()};
    const stop=()=>{clearInterval(timer);timer=null};const start=()=>{stop();progressRun();if(!reduced&&visible&&!hold)timer=setInterval(()=>show(index+1),duration)};
    $('[data-project-prev]',projectCarousel)?.addEventListener('click',()=>{show(index-1);start()});$('[data-project-next]',projectCarousel)?.addEventListener('click',()=>{show(index+1);start()});
    track?.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});track?.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>45){show(index+(d<0?1:-1));start()}},{passive:true});
    observeVisibility(projectCarousel,v=>{visible=v;v?start():stop()},.12);show(0);
  }

  /* Portfolio filters */
  const filters=$('[data-project-filters]');
  if(filters){
    const stories=$$('[data-story-category]');
    filters.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;$$('button',filters).forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');stories.forEach(s=>s.classList.toggle('is-hidden',b.dataset.filter!=='all'&&s.dataset.storyCategory!==b.dataset.filter))});
  }

  /* Accessible lightbox */
  const modal=$('[data-lightbox-modal]');let lastLightboxTrigger=null;
  const lightboxFocusables=()=>modal?$$('button,a,[tabindex]:not([tabindex="-1"])',modal):[];
  const closeLightbox=()=>{if(!modal)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('menu-open');lastLightboxTrigger?.focus()};
  $$('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{if(!modal)return;lastLightboxTrigger=button;const img=$('img',modal);if(img){img.src=button.dataset.lightbox;img.alt=button.closest('.project-slide')?.querySelector('img')?.alt||'Project image'}modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('menu-open');requestAnimationFrame(()=>$('[data-lightbox-close]',modal)?.focus())}));
  $('[data-lightbox-close]')?.addEventListener('click',closeLightbox);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeLightbox()});
  document.addEventListener('keydown',e=>{
    if(!modal?.classList.contains('is-open'))return;
    if(e.key==='Escape'){closeLightbox();return}
    if(e.key==='Tab'){const fs=lightboxFocusables();if(!fs.length)return;const first=fs[0],last=fs[fs.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  });

  /* Accordion */
  $$('[data-accordion] .principle button').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.principle');const open=!item.classList.contains('is-open');$$('[data-accordion] .principle').forEach(x=>{x.classList.remove('is-open');$('button',x)?.setAttribute('aria-expanded','false')});item.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open))}));

  /* Customer strategy */
  const strategy=$('[data-customer-strategy]');
  if(strategy){
    const stages=$$('[data-strategy-stage]',strategy),panels=$$('[data-strategy-panel]',strategy),line=$('[data-strategy-line]',strategy);let index=0,timer=null,visible=false,hold=false;const duration=AUTO_CYCLE;
    function show(n){index=(n+stages.length)%stages.length;stages.forEach((s,i)=>{const active=i===index;s.classList.toggle('is-active',active);s.setAttribute('aria-selected',String(active));s.setAttribute('tabindex',active?'0':'-1')});panels.forEach((p,i)=>p.classList.toggle('is-active',i===index));if(line){const pct=(index/(stages.length-1))*100;line.style.width=`${pct}%`;strategy.style.setProperty('--strategy-progress',`${pct}%`)}}
    const stop=()=>{clearInterval(timer);timer=null};const start=()=>{stop();if(!reduced&&visible&&!hold)timer=setInterval(()=>show(index+1),duration)};
    stages.forEach((s,i)=>{s.addEventListener('click',()=>{show(i);start()});s.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();show(i+1);stages[(i+1)%stages.length].focus();start()}if(['ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();show(i-1);stages[(i-1+stages.length)%stages.length].focus();start()}})});
    observeVisibility(strategy,v=>{visible=v;strategy.classList.toggle('is-live',v);v?start():stop()},.15);show(0);
  }


  /* About-page image stack: automatic crossfade every three seconds. */
  $$('.story-stack').forEach(stack=>{
    const frames=$$('figure',stack);if(frames.length<2)return;
    stack.classList.add('auto-story-gallery');
    frames.forEach((frame,i)=>frame.classList.toggle('is-auto-active',i===0));
    let index=0,timer=null,visible=false;
    const show=n=>{index=(n+frames.length)%frames.length;frames.forEach((frame,i)=>frame.classList.toggle('is-auto-active',i===index))};
    const stop=()=>{clearInterval(timer);timer=null};
    const start=()=>{stop();if(!reduced&&visible)timer=setInterval(()=>show(index+1),AUTO_CYCLE)};
    observeVisibility(stack,v=>{visible=v;v?start():stop()},.02);
  });


  /* Every service visual advances automatically on a consistent 3-second cycle. */
  $$('.service-visual').forEach(visual=>{
    const frames=[...visual.children].filter(el=>el.matches('img,.maintenance-after,.civil-finish'));
    if(frames.length<2){visual.classList.add('single-auto-motion');return}
    visual.classList.add('auto-image-gallery');
    frames.forEach((frame,i)=>{frame.classList.add('auto-frame');frame.classList.toggle('is-auto-active',i===0)});
    let index=0,timer=null,visible=false,hold=false;
    const show=n=>{index=(n+frames.length)%frames.length;frames.forEach((frame,i)=>frame.classList.toggle('is-auto-active',i===index))};
    const stop=()=>{clearInterval(timer);timer=null};
    const start=()=>{stop();if(!reduced&&visible&&!hold)timer=setInterval(()=>show(index+1),AUTO_CYCLE)};
    observeVisibility(visual,v=>{visible=v;v?start():stop()},.02);
  });


  /* Keep secondary service detail compact on phones while core scope remains visible */
  const syncServiceDetails=()=>{$$('.service-more,.scope-more').forEach(d=>{if(compactServiceQuery.matches)d.removeAttribute('open');else d.setAttribute('open','')})};
  syncServiceDetails();compactServiceQuery.addEventListener?.('change',syncServiceDetails);

  /* Service index active chapter */
  const serviceIndex=$('.service-index');
  if(serviceIndex&&'IntersectionObserver'in window){
    const links=$$('a[href^="#"]',serviceIndex),sections=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;links.forEach(a=>a.classList.toggle('is-active',a.getAttribute('href')===`#${entry.target.id}`));const active=links.find(a=>a.classList.contains('is-active'));active?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest',inline:'center'})}),{rootMargin:'-25% 0px -60%',threshold:.05});
    sections.forEach(s=>io.observe(s));
  }


  /* External map enhancement; the local branded preview remains as a reliable fallback. */
  const mapFrame=$('[data-map-frame]');
  if(mapFrame){
    mapFrame.addEventListener('load',()=>mapFrame.closest('.map-full')?.classList.add('map-loaded'),{once:true});
  }

  /* Counters */
  if('IntersectionObserver'in window){const co=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target,target=+el.dataset.count,start=performance.now();const tick=now=>{const p=Math.min((now-start)/1000,1);el.textContent=Math.round(target*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);co.unobserve(el)}),{threshold:.5});$$('[data-count]').forEach(el=>co.observe(el))}

  /* Static contact form */
  const form=$('[data-contact-form]');
  if(form){
    const requested=new URLSearchParams(location.search).get('service');
    if(requested){const select=form.querySelector('[name=service]');if(select)[...select.options].forEach(o=>{if(o.text.toLowerCase().includes(requested.toLowerCase()))select.value=o.value})}
    form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form);const subject=encodeURIComponent(`Flow Fusion service request — ${d.get('service')}`);const body=encodeURIComponent(`Name: ${d.get('name')}\nCompany: ${d.get('company')}\nEmail: ${d.get('email')}\nPhone: ${d.get('phone')}\nService: ${d.get('service')}\nEquipment: ${d.get('equipment')}\nUrgency: ${d.get('urgency')}\nPreferred visit: ${d.get('visit_date')}\nPreferred contact: ${d.get('contact_method')}\nLocation: ${d.get('location')}\n\nRequirement:\n${d.get('message')}\n\nNote: Attach selected photos or reports manually in your email application.`);location.href=`mailto:info@flowfusionuae.com?subject=${subject}&body=${body}`;const status=$('[data-form-status]');if(status)status.textContent='Your email application should now open. Please attach selected files manually.'})
  }

  $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();
