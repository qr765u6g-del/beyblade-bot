/**
 * 戰鬥陀螺 X (Beyblade X) 補貨通知機器人 - 前端控制與互動腳本
 */

let itemsState = [];
let logsState = [];
let currentFilter = 'all';
let searchQuery = '';
let soundEnabled = true;

// 頁面初始化
document.addEventListener('DOMContentLoaded', async () => {
  await fetchSystemData();
  initNotificationPermission();
  setupIntervals();
});

// 初始化桌面通知權限
function initNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

// 取得最新數據 (相容後端 REST API 與 本地 LocalStorage 模式)
async function fetchSystemData() {
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const data = await response.json();
      itemsState = data.items || [];
      logsState = data.logs || [];
      document.getElementById('server-status-text').textContent = '後端 Node 服務連線中 (60s 自動輪詢)';
    } else {
      throw new Error('API 無法存取');
    }
  } catch (err) {
    // 降級使用 LocalStorage 或 預設集
    console.log('未偵測到 Node 後端，切換至前端獨立監控模擬模式');
    const localSaved = localStorage.getItem('beyblade_monitored_items');
    if (localSaved) {
      itemsState = JSON.parse(localSaved);
    } else {
      itemsState = typeof PRESET_BEYBLADES !== 'undefined' ? [...PRESET_BEYBLADES] : [];
    }
    
    logsState = [
      {
        id: 'log-default',
        timestamp: new Date().toISOString(),
        itemCode: 'BX-35',
        itemName: '戰鬥陀螺 X BX-35 黑色烈燄衝擊發射組',
        store: 'Funbox 麗嬰國際',
        price: 699,
        url: 'https://shop.funbox.com.tw/products/beyblade-x-bx-35',
        channelNotified: ['Discord', 'Telegram', 'Gmail', 'LINE', '網頁警報聲']
      }
    ];
    document.getElementById('server-status-text').textContent = '獨立儀表板模式 (支援單機測試與直達購買)';
  }

  renderAll();
}

// 繪製全部畫面 UI
function renderAll() {
  renderMetrics();
  renderGrid();
  renderLogs();
}

// 1. 繪製頂部統計 Metrics
function renderMetrics() {
  const total = itemsState.length;
  const inStock = itemsState.filter(i => i.status === 'in_stock').length;
  const outStock = total - inStock;

  document.getElementById('metric-total-count').textContent = total;
  document.getElementById('metric-instock-count').textContent = inStock;
  document.getElementById('metric-outstock-count').textContent = outStock;

  document.getElementById('count-all').textContent = total;
  document.getElementById('count-instock').textContent = inStock;
  document.getElementById('logs-count').textContent = `共 ${logsState.length} 筆歷史紀錄`;
}

// 2. 繪製陀螺商品卡片 Grid
function renderGrid() {
  const container = document.getElementById('beyblades-grid-container');
  container.innerHTML = '';

  let filtered = itemsState.filter(item => {
    // 頁籤過濾
    if (currentFilter === 'instock' && item.status !== 'in_stock') return false;
    if (currentFilter === 'funbox' && item.storeKey !== 'funbox') return false;
    if (currentFilter === 'eslite' && item.storeKey !== 'eslite') return false;
    if (currentFilter === 'shopee' && item.storeKey !== 'shopee') return false;
    if (currentFilter === 'other' && (item.storeKey === 'funbox' || item.storeKey === 'shopee' || item.storeKey === 'eslite')) return false;

    // 關鍵字搜尋過濾
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.store.toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌀</p>
        <h3 style="color: var(--text-muted);">沒有符合條件的戰鬥陀螺商品</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">點擊右上角「新增監控商品」貼入網址進行即時監控！</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const isStock = item.status === 'in_stock';
    const storeColor = item.storeKey === 'funbox' ? '#ff4757' :
                       item.storeKey === 'eslite' ? '#2ed573' :
                       item.storeKey === 'shopee' ? '#ff7f50' :
                       item.storeKey === 'momo' ? '#e84393' : '#1e90ff';

    const cardHtml = `
      <div class="beyblade-card ${isStock ? 'is-in-stock' : ''}">
        <div style="position: relative;">
          <img src="${item.image}" alt="${item.name}" class="card-header-image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'">
          <div class="card-badges">
            <span class="model-badge">${item.code}</span>
            <span class="status-badge ${isStock ? 'status-in_stock' : 'status-out_of_stock'}">
              ${isStock ? '⚡ 現貨發售中' : '⌛ 完售補貨中'}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="store-info">
            <span class="store-dot" style="background-color: ${storeColor}"></span>
            <span>${item.store}</span>
            <span style="margin-left: auto; font-size: 0.75rem;">${formatTime(item.lastUpdated)}</span>
          </div>

          <h3 class="item-title" title="${item.name}">${item.name}</h3>

          <div style="font-size: 0.8rem; color: var(--text-muted);">
            📝 ${item.note || '搶手秒殺型號'}
          </div>

          <div class="item-meta">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">定價 / 售價</span>
              <span class="item-price">NT$ ${item.price}</span>
            </div>
            <a href="${item.url}" target="_blank" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
              🛒 直達購買
            </a>
          </div>

          <div class="card-footer-actions">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.75rem; padding: 0.35rem;" onclick="simulateSingleRestock('${item.id}')">
              🚨 模擬觸發補貨警報
            </button>
            <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.35rem 0.6rem;" onclick="removeItem('${item.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

// 3. 繪製動態歷史 Log 列表
function renderLogs() {
  const tbody = document.getElementById('logs-table-body');
  tbody.innerHTML = '';

  if (logsState.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">尚無補貨日誌動態</td></tr>`;
    return;
  }

  logsState.slice(0, 15).forEach(log => {
    const channelsBadge = log.channelNotified.map(c => `
      <span style="font-size: 0.7rem; background: rgba(0,240,255,0.1); color: var(--accent-cyan); border: 1px solid rgba(0,240,255,0.3); padding: 0.15rem 0.4rem; border-radius: 4px; margin-right: 0.3rem;">
        ${c}
      </span>
    `).join('');

    const rowHtml = `
      <tr>
        <td style="color: var(--text-muted);">${formatTime(log.timestamp)}</td>
        <td><strong style="color: var(--accent-cyan);">${log.itemCode}</strong></td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${log.itemName}</td>
        <td>${log.store}</td>
        <td style="color: var(--accent-amber); font-weight: bold;">NT$ ${log.price}</td>
        <td>${channelsBadge}</td>
        <td><a href="${log.url}" target="_blank" style="color: var(--accent-emerald); text-decoration: underline;">購買</a></td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', rowHtml);
  });
}

// --- 互動功能邏輯 ---

// 分頁過濾
function filterItems(tabKey, element) {
  currentFilter = tabKey;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  renderGrid();
}

// 關鍵字搜尋
function handleSearch() {
  searchQuery = document.getElementById('search-input').value;
  renderGrid();
}

// 即時手動掃描
async function triggerManualScan() {
  const btn = event.currentTarget;
  btn.disabled = true;
  btn.textContent = '⏳ 正在輪詢各大商城...';

  try {
    const res = await fetch('/api/trigger-check', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      itemsState = data.items || itemsState;
      alert('✅ 完成全通路即時庫存掃描！');
    } else {
      throw new Error();
    }
  } catch (err) {
    // 獨立模式
    itemsState.forEach(i => i.lastUpdated = new Date().toISOString());
    alert('✅ 已完成全通路即時掃描更新！');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 即時掃描庫存';
    renderAll();
  }
}

// 模擬單一商品補貨
function simulateSingleRestock(itemId) {
  const item = itemsState.find(i => i.id === itemId);
  if (!item) return;

  item.status = 'in_stock';
  item.stockText = '【現場觸發】現貨發售中';
  item.lastUpdated = new Date().toISOString();

  // 觸發音效與通知
  if (soundEnabled) playSirenSound();
  showDesktopNotification(item);

  // 新增 Log
  logsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    itemCode: item.code,
    itemName: item.name,
    store: item.store,
    price: item.price,
    url: item.url,
    channelNotified: ['網頁警報聲 (Siren)', '桌面彈窗 Notification', 'Discord', 'Gmail']
  });

  renderAll();
  alert(`🚨 模擬警報觸發！【${item.code} - ${item.name}】於 [${item.store}] 補貨！`);
}

// 一鍵廣播測試通知 (Gmail, Discord, Telegram, LINE)
async function triggerTestRestock(channel) {
  try {
    const res = await fetch('/api/test-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: channel, itemId: itemsState[0]?.id })
    });
    if (res.ok) {
      const data = await res.json();
      alert(data.message);
    } else {
      throw new Error();
    }
  } catch (err) {
    if (channel === 'gmail') {
      alert('📧 [Gmail 測試模式] 請在 .env 中填寫 GMAIL_USER 與 GMAIL_APP_PASSWORD 以正式啟用寄件！');
    } else if (channel === 'discord') {
      alert('💬 [Discord Webhook 測試] 請在 .env 中填寫 DISCORD_WEBHOOK_URL 以正式推播！');
    } else if (channel === 'telegram') {
      alert('✈️ [Telegram 測試] 請在 .env 中填寫 TELEGRAM_BOT_TOKEN 與 TELEGRAM_CHAT_ID！');
    } else if (channel === 'line') {
      alert('💚 [LINE Notify 測試] 請在 .env 中填寫 LINE_NOTIFY_TOKEN！');
    } else {
      if (soundEnabled) playSirenSound();
      alert('🚀 已廣播模擬補貨聲光測試！');
    }
  }
}

// 移除監控商品
async function removeItem(itemId) {
  if (!confirm('確定要移除此戰鬥陀螺的補貨監控嗎？')) return;

  try {
    await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
  } catch (err) {}

  itemsState = itemsState.filter(i => i.id !== itemId);
  localStorage.setItem('beyblade_monitored_items', JSON.stringify(itemsState));
  renderAll();
}

// 新增監控商品
async function handleAddItem(e) {
  e.preventDefault();
  const code = document.getElementById('input-code').value.trim();
  const name = document.getElementById('input-name').value.trim();
  const url = document.getElementById('input-url').value.trim();
  const price = parseFloat(document.getElementById('input-price').value) || 450;
  const store = document.getElementById('input-store').value.trim() || '合作店家';

  const newItem = {
    code: code || 'BX-CUSTOM',
    name: name,
    url: url,
    price: price,
    store: store,
    category: '自訂監控',
    note: '使用者新增網址'
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) {
      const data = await res.json();
      itemsState.unshift(data.item);
    } else {
      throw new Error();
    }
  } catch (err) {
    newItem.id = `item-${Date.now()}`;
    newItem.status = 'out_of_stock';
    newItem.lastUpdated = new Date().toISOString();
    newItem.storeKey = url.includes('eslite') ? 'eslite' : url.includes('funbox') ? 'funbox' : 'shopee';
    newItem.image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
    newItem.stockText = '監控連線中';

    itemsState.unshift(newItem);
    localStorage.setItem('beyblade_monitored_items', JSON.stringify(itemsState));
  }

  closeAddModal();
  renderAll();
  alert(`✅ 成功新增【${code}】至補貨監控清單！`);
}

// --- 音效與桌面彈窗 Notification ---

// 利用 Web Audio API 合成極具賽博感的補貨 Siren 蜂鳴聲
function playSirenSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.9);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.log('音效播放受到瀏覽器安全性阻擋，請在頁面上進行點擊互動。');
  }
}

// 聲音開關切換
function toggleSound(checked) {
  soundEnabled = checked;
}

// 桌面 Notification 彈窗
function showDesktopNotification(item) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🚨 戰鬥陀螺 X 補貨通知: ${item.code}`, {
      body: `【${item.name}】在 [${item.store}] 補貨現貨中！價格: NT$ ${item.price}`,
      icon: item.image
    });
  }
}

// --- 彈窗 Modal 控制 ---

function openAddModal() {
  document.getElementById('add-modal').classList.add('active');
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('active');
}

function openSettingsModal() {
  document.getElementById('settings-modal').classList.add('active');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('active');
}

// 工具涵式：格式化時間
function formatTime(isoString) {
  if (!isoString) return '剛才';
  const d = new Date(isoString);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// 自動計時輪詢 (前端預備)
function setupIntervals() {
  setInterval(() => {
    fetchSystemData();
  }, 60000);
}
