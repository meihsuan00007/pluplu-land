// PluPlu Land — 內容渲染器
// 從 /content/*.json 讀取文字與商品資料，填入頁面上帶有 data-field 屬性的元素。
// 若 JSON 尚未載入或欄位不存在，畫面會保留 HTML 裡原本寫好的文字，不會空白。

(function(){
  function setText(key, value){
    if(value === undefined || value === null) return;
    document.querySelectorAll('[data-field="' + key + '"]').forEach(function(el){
      el.textContent = value;
    });
  }
  function setHref(key, value){
    if(!value) return;
    document.querySelectorAll('[data-field-href="' + key + '"]').forEach(function(el){
      el.setAttribute('href', value);
    });
  }
  function setImg(key, value){
    if(!value) return;
    document.querySelectorAll('[data-field-img="' + key + '"]').forEach(function(el){
      el.setAttribute('src', value);
    });
  }

  function productCard(p){
    var tag = p.tag ? '<span class="product-tape">' + p.tag + '</span>' : '';
    return '' +
      '<div class="product-card reveal in">' +
        '<div class="product-photo"><img src="' + p.image + '" alt="' + (p.name || '') + '" loading="lazy">' + tag + '</div>' +
        '<div class="product-name">' + (p.name || '') + '</div>' +
        '<p class="product-note">' + (p.note || '') + '</p>' +
      '</div>';
  }

  function renderGrid(containerId, items){
    var el = document.getElementById(containerId);
    if(!el || !items || !items.length) return;
    el.innerHTML = items.map(productCard).join('');
  }

  function renderTimeline(items){
    var el = document.getElementById('story-timeline');
    if(!el || !items || !items.length) return;
    el.innerHTML = items.map(function(row, i){
      return '' +
        '<div class="timeline-row">' +
          '<div class="timeline-year">' + row.year + '</div>' +
          '<div class="timeline-line"></div>' +
          '<div class="timeline-copy"><h3>' + row.title + '</h3><p>' + row.body + '</p></div>' +
        '</div>';
    }).join('');
  }

  function applySitePage(site, pageKey){
    var page = site[pageKey];
    if(!page) return;
    setText(pageKey + '.eyebrow', page.eyebrow);
    setText(pageKey + '.title', page.title);
    setText(pageKey + '.lead', page.lead);
    setImg(pageKey + '.hero_image', page.hero_image);
    if(page.timeline) renderTimeline(page.timeline);
  }

  function applyContact(site){
    if(!site.contact) return;
    setText('contact.email', site.contact.email);
    setHref('contact.email', 'mailto:' + site.contact.email);
    setText('contact.instagram_handle', site.contact.instagram_handle);
    setHref('contact.instagram_url', site.contact.instagram_url);
    setText('contact.hours', site.contact.hours);
  }

  document.addEventListener('DOMContentLoaded', function(){
    var page = document.body.getAttribute('data-page');
    var base = document.body.getAttribute('data-base') || '.';

    fetch(base + '/content/site.json', { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(site){
        if(!site) return;
        if(page) applySitePage(site, page);
        applyContact(site);
      })
      .catch(function(){ /* keep static fallback text */ });

    if(page === 'hamu_page'){
      fetch(base + '/content/products-hamu.json', { cache: 'no-store' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(data){ if(data && data.items) renderGrid('hamu-grid', data.items); })
        .catch(function(){});
    }

    if(page === 'goods_page'){
      fetch(base + '/content/products-goods.json', { cache: 'no-store' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(data){
          if(!data || !data.items) return;
          renderGrid('goods-grid-outerwear', data.items.filter(function(i){ return i.category === 'outerwear'; }));
          renderGrid('goods-grid-hats', data.items.filter(function(i){ return i.category === 'hats'; }));
        })
        .catch(function(){});
    }
  });
})();
