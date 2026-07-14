// PluPlu Land — 內容渲染器
// 從 /content/*.json 讀取文字與商品資料，填入頁面上帶有 data-field 屬性的元素。
// 若 JSON 尚未載入或欄位不存在，畫面會保留 HTML 裡原本寫好的文字，不會空白。

(function(){
  // 品牌名稱「PluPlu Land」不可被斷行：把中間的空格換成不斷行空格（U+00A0）。
  // 後台編輯者照常輸入一般空格即可，渲染時自動處理。
  function keepBrand(value){
    var NBSP = String.fromCharCode(160); // 不斷行空格 U+00A0
    return (typeof value === 'string')
      ? value.replace(/PluPlu Land/g, 'PluPlu' + NBSP + 'Land')
      : value;
  }

  function setText(key, value){
    if(value === undefined || value === null) return;
    document.querySelectorAll('[data-field="' + key + '"]').forEach(function(el){
      el.textContent = keepBrand(value);
    });
  }
  // 標題專用：支援用全形「｜」手動指定換行點（轉成 <br>），
  // 避免「療癒系」這類詞彙被瀏覽器自動斷在詞中間。內容先經 escape 再轉換。
  function setTitle(key, value){
    if(value === undefined || value === null) return;
    var html = esc(keepBrand(value)).replace(/｜/g, '<br>');
    document.querySelectorAll('[data-field="' + key + '"]').forEach(function(el){
      el.innerHTML = html;
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
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  // 用於「顯示文字」的 escape：同時保護品牌名不斷行
  function escText(s){
    return esc(keepBrand(s));
  }

  // 全站唯一的購買通路：7-11 賣貨便（網站沒有內建金流，所有下單都導去這裡）
  var BUY_URL = 'https://myship.7-11.com.tw/general/detail/GM2605058795102';
  var CART_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="9" cy="21" r="1.5"></circle><circle cx="19" cy="21" r="1.5"></circle>' +
      '<path d="M2 3h3l2.6 12.5a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 8H6"></path>' +
    '</svg>';
  function buyButton(){
    return '<a href="' + BUY_URL + '" class="product-buy" target="_blank" rel="noopener">' +
      CART_SVG + '前往賣貨便下單</a>';
  }

  function productCard(p){
    var tag = p.tag ? '<span class="product-tape">' + escText(p.tag) + '</span>' : '';
    var price = p.price ? '<div class="product-price">' + escText(p.price) + '</div>' : '';
    var note = p.note ? '<p class="product-note">' + escText(p.note) + '</p>' : '';
    var photo =
      '<div class="product-photo"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' + tag + '</div>';
    // 首頁推薦牆的卡片會帶 _link：照片可點回對應分頁（購買按鈕另外連去賣貨便，不可巢狀連結）
    if(p._link){
      photo = '<a href="' + esc(p._link) + '" class="product-photo-link">' + photo + '</a>';
    }
    // _pid：選品商品 id。卡片帶 data-product-id 後，點擊會開啟詳情視窗（js/shop.js）
    var pid = p._pid ? ' data-product-id="' + esc(p._pid) + '"' : '';
    return '<div class="product-card reveal in"' + pid + '>' +
      photo +
      '<div class="product-name">' + escText(p.name) + '</div>' +
      price + note + buyButton() +
    '</div>';
  }

  function renderGrid(containerId, items){
    var el = document.getElementById(containerId);
    if(!el || !items || !items.length) return;
    el.innerHTML = items.map(productCard).join('');
  }

  function renderCarousel(items){
    var root = document.getElementById('home-carousel');
    if(!root || !items || !items.length) return;
    var track = root.querySelector('.carousel-track');
    if(!track) return;
    track.innerHTML = items.map(function(s, i){
      var active = i === 0 ? ' is-active' : '';
      var img = '<img src="' + esc(s.image) + '" alt="' + esc(s.title) + '"' + (i === 0 ? '' : ' loading="lazy"') + '>';
      // 海報式輪播格：圖片已含文案與按鈕設計，整張為連結、不疊文字卡片
      if(s.poster){
        return '<a href="' + esc(s.link || '#') + '" class="carousel-slide carousel-slide--poster' + active + '">' + img + '</a>';
      }
      var eyebrow = s.eyebrow ? '<span class="eyebrow">' + escText(s.eyebrow) + '</span>' : '';
      var subtitle = s.subtitle ? '<p>' + escText(s.subtitle) + '</p>' : '';
      var cta = (s.link && s.link_label)
        ? '<a href="' + esc(s.link) + '" class="btn solid">' + escText(s.link_label) + '</a>' : '';
      return '' +
        '<div class="carousel-slide' + active + '">' +
          img +
          '<div class="carousel-caption">' + eyebrow + '<h2>' + escText(s.title) + '</h2>' + subtitle + cta + '</div>' +
        '</div>';
    }).join('');
    if(window.setupCarousel) window.setupCarousel(root);
  }

  function renderBanners(items){
    var el = document.getElementById('promo-grid');
    if(!el || !items || !items.length) return;
    el.innerHTML = items.slice(0, 3).map(function(b, i){
      var more = b.label_en ? '<span class="promo-more">' + escText(b.label_en) + '</span>' : '';
      var subtitle = b.subtitle ? '<p>' + escText(b.subtitle) + '</p>' : '';
      return '' +
        '<a href="' + esc(b.link || '#') + '" class="promo-item' + (i === 0 ? ' promo-item--tall' : '') + '">' +
          '<img src="' + esc(b.image) + '" alt="' + esc(b.title) + '" loading="lazy">' +
          '<div class="promo-copy">' + more + '<h3>' + escText(b.title) + '</h3>' + subtitle + '</div>' +
        '</a>';
    }).join('');
  }

  function renderTimeline(items){
    var el = document.getElementById('story-timeline');
    if(!el || !items || !items.length) return;
    el.innerHTML = items.map(function(row, i){
      return '' +
        '<div class="timeline-row">' +
          '<div class="timeline-year">' + escText(row.year) + '</div>' +
          '<div class="timeline-line"></div>' +
          '<div class="timeline-copy"><h3>' + escText(row.title) + '</h3><p>' + escText(row.body) + '</p></div>' +
        '</div>';
    }).join('');
  }

  function applySitePage(site, pageKey){
    var page = site[pageKey];
    if(!page) return;
    setText(pageKey + '.eyebrow', page.eyebrow);
    setTitle(pageKey + '.title', page.title);
    setText(pageKey + '.lead', page.lead);
    setImg(pageKey + '.hero_image', page.hero_image);
    if(page.timeline) renderTimeline(page.timeline);
    if(page.carousel) renderCarousel(page.carousel);
    if(page.banners) renderBanners(page.banners);
  }

  function applyContact(site){
    if(!site.contact) return;
    setText('contact.instagram_handle', site.contact.instagram_handle);
    setHref('contact.instagram_url', site.contact.instagram_url);
    setText('contact.hours', site.contact.hours);
  }

  function fetchJSON(url){
    return fetch(url, { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var page = document.body.getAttribute('data-page');
    var base = document.body.getAttribute('data-base') || '.';

    fetchJSON(base + '/content/site.json').then(function(site){
      if(!site) return;
      if(page) applySitePage(site, page);
      applyContact(site);
    });

    if(page === 'home'){
      // 首頁推薦牆「大家的心頭好」：從娃衣選品資料（products-store.json）取真實商品。
      // 排行順序寫死在這裡：口水巾、眼鏡固定為第 1、2 名。
      var FEATURED_IDS = ['31', '30', '24', '01', '02', '03', '09', '11'];
      fetchJSON(base + '/content/products-store.json').then(function(data){
        if(!data || !data.items) return;
        var byId = {};
        data.items.forEach(function(item){ byId[item.id] = item; });
        var featured = [];
        FEATURED_IDS.forEach(function(id, i){
          var item = byId[id];
          if(!item) return;
          featured.push({
            name: item.name,
            price: 'NT$ ' + item.price,
            image: item.image,
            tag: (i === 0 ? 'TOP 1' : (i === 1 ? 'TOP 2' : null)),
            _link: 'shop.html',
            _pid: item.id
          });
        });
        renderGrid('featured-grid', featured);
      });
    }

    if(page === 'hamu_page'){
      fetchJSON(base + '/content/products-hamu.json')
        .then(function(data){
          if(!data || !data.items) return;
          // 娃寶陳列區版面保持俐落：最多只顯示前 6 個品項
          var items = data.items.slice(0, 6);
          // store_id：對應娃衣選品商品編號，卡片帶 data-product-id 後點擊開詳情視窗
          items.forEach(function(item){
            if(item.store_id) item._pid = item.store_id;
          });
          renderGrid('hamu-grid', items);
        });
    }

    if(page === 'goods_page'){
      fetchJSON(base + '/content/products-goods.json')
        .then(function(data){
          if(!data || !data.items) return;
          renderGrid('goods-grid-outerwear', data.items.filter(function(i){ return i.category === 'outerwear'; }));
          renderGrid('goods-grid-hats', data.items.filter(function(i){ return i.category === 'hats'; }));
        });
    }
  });
})();
