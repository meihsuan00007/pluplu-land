// PluPlu Land — 娃衣選品（shop.html 商品牆＋全站共用商品詳情視窗）
// 從 content/products-store.json 讀取選品，渲染商品牆與詳情視窗。
// 資料來源由 scripts/build-products-json.py 產出；欄位說明見該腳本。
// 詳情視窗已獨立化：只要頁面有 #shop-modal，任何帶 data-product-id 的元素
// 點擊後都會開啟該商品的詳情（首頁「大家的心頭好」也是走這條路）。

(function(){
  var STORE_URL = 'https://myship.7-11.com.tw/general/detail/GM2605058795102';
  var SHIP_TEXT = {
    '現貨': '現貨規格｜下單後 3–10 個工作天出貨',
    '預購': '預購規格｜下單即叫貨，約 10–20 天出貨，不接急單'
  };
  var SOLDOUT_TEXT = '這個品項已經全數售完，若想蹲補貨消息，歡迎加 LINE（@plupluland_tw）問問。';

  var grid = document.getElementById('shop-grid');           // 僅 shop.html 有
  var filterBar = document.getElementById('shop-filter');    // 僅 shop.html 有
  var modal = document.getElementById('shop-modal');         // 詳情視窗（放在需要的頁面）
  var modalBody = document.getElementById('shop-modal-body');
  if(!modal || !modalBody) return;

  var catalog = null;        // {categories, items}
  var catLabel = {};         // key -> label
  var currentCat = 'all';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function money(n){ return 'NT$ ' + Number(n).toLocaleString('zh-Hant-TW'); }

  /* ---------- 商品牆 ---------- */
  function priceHTML(p){
    if(p.on_sale){
      return '<div class="product-price"><span class="price-sale">' + money(p.price) + '</span>' +
             '<del class="price-original">' + money(p.original_price) + '</del></div>';
    }
    return '<div class="product-price">' + money(p.price) + '</div>';
  }

  function cardHTML(p){
    var soldout = p.status === 'sold_out';
    var rightTape = '';
    if(soldout){
      rightTape = '<span class="product-tape product-tape--soldout">售完</span>';
    } else if(p.on_sale){
      rightTape = '<span class="product-tape product-tape--sale">' + esc(p.sale_label || '特價') + '</span>';
    }
    return '' +
      '<button type="button" class="product-card shop-card reveal in" data-id="' + esc(p.id) + '" style="border:0;background:none;padding:0;font:inherit;">' +
        '<div class="product-photo' + (soldout ? ' is-soldout' : '') + '">' +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          '<span class="product-tape">' + esc(catLabel[p.category] || '') + '</span>' +
          rightTape +
        '</div>' +
        '<div class="product-name">' + esc(p.name) + '</div>' +
        priceHTML(p) +
      '</button>';
  }

  function renderGrid(){
    if(!grid) return;
    var items = catalog.items.filter(function(p){
      return currentCat === 'all' || p.category === currentCat;
    });
    grid.innerHTML = items.map(cardHTML).join('');
  }

  function renderFilter(){
    if(!filterBar) return;
    var chips = ['<button type="button" class="filter-chip is-active" data-cat="all">全部</button>'];
    catalog.categories.forEach(function(c){
      var count = catalog.items.filter(function(p){ return p.category === c.key; }).length;
      if(!count) return;
      chips.push('<button type="button" class="filter-chip" data-cat="' + esc(c.key) + '">' + esc(c.label) + '</button>');
    });
    filterBar.innerHTML = chips.join('');
  }

  /* ---------- 詳情視窗 ---------- */
  function variantBtnHTML(v, i){
    var supplyCls = v.supply === '預購' ? ' variant-supply--pre' : '';
    var cls = 'variant-btn' + (v.in_stock ? '' : ' is-soldout');
    var oos = v.in_stock ? '' : '<span class="variant-oos">售完</span>';
    return '<button type="button" class="' + cls + '" data-vidx="' + i + '"' + (v.in_stock ? '' : ' disabled aria-disabled="true"') + '>' +
             '<span class="variant-supply' + supplyCls + '">' + esc(v.supply) + '</span>' +
             esc(v.name) + oos +
           '</button>';
  }

  function openModal(p){
    var soldout = p.status === 'sold_out';
    var tags = (p.tags || []).map(function(t){
      return '<span class="tag-chip">' + esc(t) + '</span>';
    }).join('');
    var priceLine =
      '<div class="modal-price">' +
        (p.on_sale
          ? '<span class="price-sale">' + money(p.price) + '</span><del class="price-original">' + money(p.original_price) + '</del>' +
            '<span class="sale-chip">' + esc(p.sale_label || '特價') + '</span>'
          : money(p.price)) +
      '</div>';
    var soldTape = soldout ? '<span class="product-tape product-tape--soldout">售完</span>' : '';

    modalBody.innerHTML = '' +
      '<div class="modal-media' + (soldout ? ' is-soldout' : '') + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' + soldTape +
      '</div>' +
      '<div class="modal-info">' +
        (tags ? '<div class="tag-chips">' + tags + '</div>' : '') +
        '<h3>' + esc(p.name) + '</h3>' +
        priceLine +
        (p.body_included ? '' : '<p class="note-nobody">＊此品項不含娃寶本體，僅含衣裝／配件本身。</p>') +
        (p.description ? '<p class="modal-desc">' + esc(p.description) + '</p>' : '') +
        (p.reminder ? '<div class="reminder-box">小提醒｜' + esc(p.reminder) + '</div>' : '') +
        '<span class="variant-label">規格（' + p.variants.length + ' 款）</span>' +
        '<div class="variant-list">' + p.variants.map(variantBtnHTML).join('') + '</div>' +
        '<div class="ship-info" id="ship-info"></div>' +
        '<div class="modal-actions">' +
          (soldout
            ? '<span class="btn solid is-disabled" aria-disabled="true">已售完</span>'
            : '<a class="btn solid" href="' + STORE_URL + '" target="_blank" rel="noopener">前往賣貨便選購</a>') +
          '<a class="notice-link" href="notice.html">購物須知・退換貨規則</a>' +
        '</div>' +
      '</div>';

    // 規格選擇：預設選第一個有庫存的規格，出貨時間依所選規格動態顯示；
    // 規格若有專屬圖片（variants[].image），主圖淡入切換成該圖，沒有就退回商品主圖。
    var shipInfo = modalBody.querySelector('#ship-info');
    var mediaImg = modalBody.querySelector('.modal-media img');
    var btns = Array.prototype.slice.call(modalBody.querySelectorAll('.variant-btn'));
    function swapMedia(src, alt){
      if(mediaImg.getAttribute('src') === src){ mediaImg.alt = alt; return; }
      mediaImg.style.opacity = '0';
      var pre = new Image();
      pre.onload = function(){
        mediaImg.src = src;
        mediaImg.alt = alt;
        mediaImg.style.opacity = '1';
      };
      pre.onerror = function(){ mediaImg.style.opacity = '1'; };
      pre.src = src;
    }
    function select(idx){
      var v = p.variants[idx];
      btns.forEach(function(b){
        b.classList.toggle('is-selected', Number(b.getAttribute('data-vidx')) === idx);
      });
      shipInfo.classList.remove('is-soldout');
      shipInfo.textContent = SHIP_TEXT[v.supply];
      swapMedia(v.image || p.image, v.image ? p.name + '｜' + v.name : p.name);
    }
    var firstInStock = -1;
    for(var i = 0; i < p.variants.length; i++){
      if(p.variants[i].in_stock){ firstInStock = i; break; }
    }
    if(soldout || firstInStock === -1){
      shipInfo.classList.add('is-soldout');
      shipInfo.textContent = SOLDOUT_TEXT;
    } else {
      select(firstInStock);
    }
    btns.forEach(function(b){
      if(b.disabled) return;
      b.addEventListener('click', function(){ select(Number(b.getAttribute('data-vidx'))); });
    });

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.shop-modal-panel').scrollTop = 0;
    modal.querySelector('.shop-modal-close').focus();
  }

  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  /* ---------- 事件 ---------- */
  if(grid){
    grid.addEventListener('click', function(e){
      var card = e.target.closest('[data-id]');
      if(!card || !catalog) return;
      var id = card.getAttribute('data-id');
      var item = catalog.items.find(function(p){ return p.id === id; });
      if(item) openModal(item);
    });
  }

  if(filterBar){
    filterBar.addEventListener('click', function(e){
      var chip = e.target.closest('.filter-chip');
      if(!chip) return;
      currentCat = chip.getAttribute('data-cat');
      filterBar.querySelectorAll('.filter-chip').forEach(function(c){
        c.classList.toggle('is-active', c === chip);
      });
      renderGrid();
    });
  }

  // 全站共用：任何帶 data-product-id 的元素（如首頁推薦牆卡片）點擊開啟詳情視窗。
  // 卡片內的「前往賣貨便下單」按鈕要照常外連，不攔截。
  document.addEventListener('click', function(e){
    if(e.target.closest('.product-buy')) return;
    var trigger = e.target.closest('[data-product-id]');
    if(!trigger || !catalog) return;
    var id = trigger.getAttribute('data-product-id');
    var item = catalog.items.find(function(p){ return p.id === id; });
    if(item){
      e.preventDefault();
      openModal(item);
    }
  });

  modal.addEventListener('click', function(e){
    if(e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- 載入資料 ---------- */
  var base = document.body.getAttribute('data-base') || '.';
  fetch(base + '/content/products-store.json', { cache: 'no-store' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(data){
      if(!data || !data.items || !data.items.length) return; // 失敗時保留 HTML 內的備援訊息
      catalog = data;
      data.categories.forEach(function(c){ catLabel[c.key] = c.label; });
      renderFilter();
      renderGrid();
    })
    .catch(function(){ /* 保留備援訊息 */ });
})();
