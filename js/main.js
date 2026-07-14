// 首頁輪播：淡入切換、自動播放（5 秒）、點點與左右箭頭。
// render.js 從 JSON 重新渲染輪播內容後，會再呼叫一次 window.setupCarousel 重新初始化。
function setupCarousel(root){
  if(!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel-slide'));
  var dotsBox = root.querySelector('.carousel-dots');
  if(!slides.length || !dotsBox) return;

  var state = root._plc;
  if(state && state.timer) clearInterval(state.timer);
  state = root._plc = { i:0, timer:null };

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  dotsBox.innerHTML = slides.map(function(_, i){
    return '<button class="carousel-dot" type="button" aria-label="第 ' + (i + 1) + ' 張"></button>';
  }).join('');
  var dots = Array.prototype.slice.call(dotsBox.children);

  function go(n){
    state.i = (n + slides.length) % slides.length;
    slides.forEach(function(s, i){ s.classList.toggle('is-active', i === state.i); });
    dots.forEach(function(d, i){ d.classList.toggle('is-active', i === state.i); });
  }
  function stop(){ if(state.timer){ clearInterval(state.timer); state.timer = null; } }
  function start(){
    stop();
    if(reduced || slides.length < 2) return;
    state.timer = setInterval(function(){ go(state.i + 1); }, 5000);
  }
  state.go = go; state.start = start; state.stop = stop;

  dots.forEach(function(d, i){
    d.addEventListener('click', function(){ go(i); start(); });
  });

  // 箭頭與 hover 事件只綁一次，重新渲染 slides 後透過 root._plc 取得最新狀態
  if(!root._bound){
    root._bound = true;
    var prev = root.querySelector('.carousel-arrow.prev');
    var next = root.querySelector('.carousel-arrow.next');
    if(prev) prev.addEventListener('click', function(){ root._plc.go(root._plc.i - 1); root._plc.start(); });
    if(next) next.addEventListener('click', function(){ root._plc.go(root._plc.i + 1); root._plc.start(); });
    root.addEventListener('mouseenter', function(){ root._plc.stop(); });
    root.addEventListener('mouseleave', function(){ root._plc.start(); });
  }

  go(0); start();
}
window.setupCarousel = setupCarousel;

document.addEventListener('DOMContentLoaded', function(){
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      var isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.classList.remove('open');
        document.body.classList.remove('nav-open');
      });
    });
  }

  setupCarousel(document.getElementById('home-carousel'));

  var reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && reveals.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }
});
