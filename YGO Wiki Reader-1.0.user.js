// ==UserScript==
// @name         YGO Wiki Reader
// @namespace    
// @version      1.0
// @description  Improve readability + preview + card image
// @author       5N0WM4N_256
// @match        https://yugioh-wiki.net/*
// @grant        none
// @updateURL    
// @downloadURL  
// @supportURL   https://github.com/183-U001/
// @license      MIT 
// ==/UserScript==

(function () {
  /* =========================
     1. CSS
  ========================= */
  const style = document.createElement("style");
  style.textContent = `
    :root { --menu-width: 260px; }

    body {
      font-size: 18px !important;
      line-height: 1.8 !important;
      background: #fafafa !important;
      color: #222 !important;
      margin: 0;
    }

    a { color: #0055aa !important; }

    pre {
      font-size: 20px !important;
      line-height: 1.6 !important;
      font-family:
        "Yu Gothic Medium",
        "Yu Gothic",
        "Meiryo",
        "Hiragino Kaku Gothic ProN",
        sans-serif;
    }

    #navigator { display: none !important; }
    td.menubar { display: none !important; width: 0 !important; }

    #ygo-page {
      transition: transform 0.3s ease;
      will-change: transform;
    }

    body.ygo-menu-open #ygo-page {
      transform: translateX(var(--menu-width));
    }

    #menubar {
      position: fixed !important;
      top: 0;
      left: 0;
      width: var(--menu-width);
      height: 100vh;
      z-index: 9998;
      background: rgba(255,255,255,0.98);
      box-shadow: 2px 0 8px rgba(0,0,0,0.15);
      transform: translateX(calc(-1 * var(--menu-width)));
      transition: transform 0.3s ease;
      overflow-y: auto;
    }

    #menubar.ygo-open { transform: translateX(0); }

    #menubar-toggle {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 9999;
      padding: 6px 10px;
      font-size: 14px;
      background: rgba(0,85,170,0.9);
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
    }

    .ygo-card-image {
      width: 440px;
      max-width: 100%;
      display: block;
      margin: 16px auto;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    /* =========================
       スマホ専用（指操作デバイスのみ）
    ========================= */
    @media (max-width: 768px) and (pointer: coarse) {
      body {
        font-size: 20px !important;
        line-height: 1.9 !important;
      }

      pre {
        font-size: 22px !important;
        line-height: 1.7 !important;
      }

      #menubar-toggle {
        top: 14px;
        left: 14px;
        padding: 12px 16px;
        font-size: 22px;
        border-radius: 8px;
      }

      :root {
        --menu-width: 300px;
      }

      .ygo-card-image {
        width: 90%;
        max-width: 440px;
        margin: 24px auto;
      }

      #menubar a {
        font-size: 18px !important;
        padding: 10px 8px;
        display: block;
      }
    }
  `;
  document.head.appendChild(style);

  /* =========================
     2. body を wrapper に包む
  ========================= */
  const wrapper = document.createElement("div");
  wrapper.id = "ygo-page";
  while (document.body.firstChild) {
    wrapper.appendChild(document.body.firstChild);
  }
  document.body.appendChild(wrapper);

  /* =========================
     3. menubar
  ========================= */
  const menubar = document.getElementById("menubar");
  if (menubar) document.body.appendChild(menubar);

  const toggle = document.createElement("div");
  toggle.id = "menubar-toggle";
  toggle.textContent = "☰";

  let open = false;
  toggle.addEventListener("click", () => {
    open = !open;
    menubar?.classList.toggle("ygo-open", open);
    document.body.classList.toggle("ygo-menu-open", open);
  });
  document.body.appendChild(toggle);

  /* =========================
     4. カード画像挿入
  ========================= */
  let inserted = false;

  async function insertCardImage() {
    if (inserted) return true;

    const titleH2 = document.querySelector("h2#content_1_0");
    const pre = document.querySelector("pre");
    if (!titleH2 || !pre) return false;

    const text = titleH2.textContent || "";
    const match = text.match(/[\/／]\s*(.+?)》/);
    if (!match) {
      inserted = true;
      return true;
    }

    const enNameRaw = match[1].trim();
    const fileBaseName = enNameRaw.replace(/[^A-Za-z0-9]/g, "");
    const fileName = `${fileBaseName}-MADU-EN-VG-artwork.png`;

    const filePageUrl =
      "https://yugipedia.com/wiki/File:" +
      encodeURIComponent(fileName);

    try {
      const res = await fetch(filePageUrl);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const link = doc.querySelector(".fullImageLink a");

      if (!link) throw new Error();

      const img = document.createElement("img");
      img.className = "ygo-card-image";
      img.src = link.href;
      img.alt = enNameRaw;
      img.loading = "lazy";

      pre.parentNode.insertBefore(img, pre);
      inserted = true;
      return true;

    } catch {
      inserted = true;
      return true;
    }
  }

  /* =========================
     4.5. スワイプでメニュー開閉
  ========================= */
  let touchStartX = null;
  let touchStartY = null;
  const SWIPE_THRESHOLD = 60;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (touchStartX === null || touchStartY === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx > SWIPE_THRESHOLD && !open) {
      open = true;
      menubar?.classList.add("ygo-open");
      document.body.classList.add("ygo-menu-open");
    }

    if (dx < -SWIPE_THRESHOLD && open) {
      open = false;
      menubar?.classList.remove("ygo-open");
      document.body.classList.remove("ygo-menu-open");
    }

    touchStartX = touchStartY = null;
  }, { passive: true });



    /* =========================
   4.8. リンク先 <pre> ホバー表示
    ========================= */

const previewCache = new Map();

const previewBox = document.createElement("div");
previewBox.id = "ygo-preview-box";
document.body.appendChild(previewBox);

const previewStyle = document.createElement("style");
previewStyle.textContent = `
  #ygo-preview-box {
    position: fixed;
    z-index: 10000;
    max-width: 420px;
    max-height: 60vh;
    overflow: auto;
    padding: 12px 14px;
    background: rgba(240, 248, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);

    font-size: 13px;      /* ← 小さく */
    line-height: 1.5;     /* ← 少し詰める */

    display: none;
    white-space: pre-wrap;
  }
`;

document.head.appendChild(previewStyle);

let hoverTimer = null;

function showPreview(x, y, text) {
  previewBox.textContent = text;
  previewBox.style.display = "block";

  const padding = 20;
  const boxWidth = previewBox.offsetWidth;
  const boxHeight = previewBox.offsetHeight;

  let left = x + 20;
  let top = y + 20;

  if (left + boxWidth > window.innerWidth - padding) {
    left = window.innerWidth - boxWidth - padding;
  }
  if (top + boxHeight > window.innerHeight - padding) {
    top = window.innerHeight - boxHeight - padding;
  }

  previewBox.style.left = left + "px";
  previewBox.style.top = top + "px";
}

function hidePreview() {
  previewBox.style.display = "none";
}

async function fetchPreview(url) {
  if (previewCache.has(url)) {
    return previewCache.get(url);
  }

  try {
    const res = await fetch(url, {
      credentials: "same-origin"
    });

    const buffer = await res.arrayBuffer();

    // EUC-JP でデコード（yugioh-wiki用）
    const decoder = new TextDecoder("euc-jp");
    const html = decoder.decode(buffer);

    const doc = new DOMParser().parseFromString(html, "text/html");
    const pre = doc.querySelector("pre");

    if (!pre) {
      previewCache.set(url, "概要なし");
      return "概要なし";
    }

    const text = pre.textContent.trim();
    previewCache.set(url, text);
    return text;

  } catch (e) {
    console.error(e);
    return "取得失敗";
  }
}




document.addEventListener("mouseover", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  if (!link.href.startsWith("https://yugioh-wiki.net/")) return;

  const linkText = link.textContent.trim();

  // 《カード名》形式のみ
  if (!/^《[^》]+》$/.test(linkText)) return;

  hoverTimer = setTimeout(async () => {
    const text = await fetchPreview(link.href);
    showPreview(e.clientX, e.clientY, text);
  }, 300);
});

document.addEventListener("mouseout", (e) => {
  if (hoverTimer) clearTimeout(hoverTimer);
  hidePreview();
});




  /* =========================
     5. 実行
  ========================= */
  let retry = 0;
  const timer = setInterval(() => {
    retry++;
    if (insertCardImage() || retry > 30) clearInterval(timer);
  }, 100);

})();
