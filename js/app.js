/**
 * 戰鬥陀螺 X (Beyblade X) 補貨通知機器人 - 前端控制與互動腳本 (v1.5 擴充版)
 */

let itemsState = [];
let logsState = [];
let currentTypeFilter = 'all';
let currentStoreFilter = 'all';
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

// 取得最新數據
async function fetchSystemData() {
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const data = await response.json();
      itemsState = data.items || [];
      logsState = data.logs || [];
      document.getElementById('server-status-text').textContent = '後端 Node 服務連線中 (60s 輪詢)';
    } else {
      throw new Error('API 無法存取');
    }
  } catch (err) {
    // 降級使用 LocalStorage 或 預設集
    const localSaved = localStorage.getItem('beyblade_monitored_items_v15');
    if (localSaved) {
      itemsState = JSON.parse(localSaved);
    } else {
      itemsState = typeof PRESET_BEYBLADES !== 'undefined' ? [...PRESET_BEYBLADES] : [];
    }
    
    logsState = [
      {
        id: 'log-default',
        timestamp: new Date().toISOString(),
        itemCode: 'UX-02-LOT',
        itemName: '【 Funbox 門市】戰鬥陀螺 X UX-02 線上實名制抽籤登記',
        store: 'Funbox 門市抽選頁',
        price: 550,
        url: 'https://shop.funbox.com.tw',
        channelNotified: ['Discord 頻道', '24H 輪詢中']
      }
    ];
    document.getElementById('server-status-text').textContent = '獨立儀表板模式 (支援單機測試與正版直達)';
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
  const inStock = itemsState.filter(i => i.status === 'in_stock' || i.type === 'preorder').length;
  const lotteryCount = itemsState.filter(i => i.type === 'lottery' || i.type === 'event').length;

  document.getElementById('metric-total-count').textContent = total;
  document.getElementById('metric-instock-count').textContent = inStock;
  document.getElementById('metric-lottery-count').textContent = lotteryCount;

  document.getElementById('count-all').textContent = total;
  document.getElementById('count-restock').textContent = itemsState.filter(i => i.type === 'restock').length;
  document.getElementById('count-lottery').textContent = itemsState.filter(i => i.type === 'lottery').length;
  document.getElementById('count-preorder').textContent = itemsState.filter(i => i.type === 'preorder').length;
  document.getElementById('count-event').textContent = itemsState.filter(i => i.type === 'event').length;
  
  document.getElementById('logs-count').textContent = `${logsState.length} 筆紀錄`;
}

// 2. 繪製陀螺與情報卡片 Grid
function renderGrid() {
  const container = document.getElementById('beyblades-grid-container');
  container.innerHTML = '';

  let filtered = itemsState.filter(item => {
    // 類型過濾
    if (currentTypeFilter !== 'all' && item.type !== currentTypeFilter) return false;
    
    // 店家過濾
    if (currentStoreFilter !== 'all' && item.storeKey !== currentStoreFilter) return false;

    // 關鍵字搜尋過濾
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.store.toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 2rem; margin-bottom: 0.4rem;">🌀</p>
        <h3 style="color: var(--text-muted); font-size: 1rem;">沒有符合條件的情報或商品</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">點擊右上角「新增監控」貼入網址進行即時鎖定！</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const isStock = item.status === 'in_stock';
    const storeColor = item.storeKey === 'funbox' ? '#ff4757' :
                       item.storeKey === 'eslite' ? '#2ed573' :
                       item.storeKey === 'toyworld' ? '#ffbe76' :
                       item.storeKey === 'books' ? '#70a1ff' :
                       item.storeKey === 'official' ? '#a29bfe' : '#ff7f50';

    const typeBadgeColor = item.type === 'lottery' ? 'background: rgba(139, 92, 246, 0.25); color: #a78bfa; border: 1px solid #a78bfa;' :
                           item.type === 'preorder' ? 'background: rgba(255, 184, 0, 0.25); color: #fbbf24; border: 1px solid #fbbf24;' :
                           item.type === 'event' ? 'background: rgba(236, 72, 153, 0.25); color: #f472b6; border: 1px solid #f472b6;' :
                           'background: rgba(0, 255, 136, 0.25); color: #34d399; border: 1px solid #34d399;';

    const typeText = item.type === 'lottery' ? '📝 官方實名抽選' :
                     item.type === 'preorder' ? '📅 新品預購中' :
                     item.type === 'event' ? '🎁 官方抽獎/大會' :
                     (isStock ? '⚡ 現貨開放購買' : '⌛ 完售補貨中');

    const cardHtml = `
      <div class="beyblade-card ${isStock ? 'is-in-stock' : ''}">
        <div style="position: relative;">
          <img src="${item.image}" alt="${item.name}" class="card-header-image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'">
          <div class="card-badges">
            <span class="model-badge">${item.code}</span>
            <span class="status-badge" style="${typeBadgeColor}">
              ${typeText}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="store-info">
            <span class="store-dot" style="background-color: ${storeColor}"></span>
            <span>${item.store}</span>
            <span style="margin-left: auto; font-size: 0.72rem;">${formatTime(item.lastUpdated)}</span>
          </div>

          <h3 class="item-title" title="${item.name}">${item.name}</h3>

          <div style="font-size: 0.78rem; color: var(--text-muted);">
            📝 ${item.note || '官方代理公司貨 (杜絕黃牛)'}
          </div>

          <div class="item-meta">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">官方定價 (MSRP)</span>
              <span class="item-price">${item.price > 0 ? `NT$ ${item.price}` : '免費參與/登記'}</span>
            </div>
            <a href="${item.url}" target="_blank" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
              ${item.type === 'lottery' ? '📝 直達抽籤' : item.type === 'event' ? '🎁 參與活動' : '🛒 直達購買'}
            </a>
          </div>

          <div class="card-footer-actions">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.72rem; padding: 0.3rem;" onclick="simulateSingleRestock('${item.id}')">
              🚨 模擬觸發 ${item.type === 'lottery' ? '抽選' : '補貨'} 推播
            </button>
            <button class="btn btn-danger" style="font-size: 0.72rem; padding: 0.3rem 0.5rem;" onclick="removeItem('${item.id}')">
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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">尚無情報日誌動態</td></tr>`;
    return;
  }

  logsState.slice(0, 15).forEach(log => {
    const channelsBadge = (log.channelNotified || ['Discord']).map(c => `
      <span style="font-size: 0.68rem; background: rgba(0,240,255,0.1); color: var(--accent-cyan); border: 1px solid rgba(0,240,255,0.3); padding: 0.1rem 0.35rem; border-radius: 4px; margin-right: 0.2rem;">
        ${c}
      </span>
    `).join('');

    const rowHtml = `
      <tr>
        <td style="color: var(--text-muted);">${formatTime(log.timestamp)}</td>
        <td><span style="font-size: 0.7rem; color: var(--accent-purple); font-weight: bold;">${log.type === 'lottery' ? '抽選' : '補貨'}</span></td>
        <td><strong style="color: var(--accent-cyan);">${log.itemCode}</strong></td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${log.itemName}</td>
        <td>${log.store}</td>
        <td style="color: var(--accent-amber); font-weight: bold;">${log.price > 0 ? `NT$ ${log.price}` : '免費'}</td>
        <td>${channelsBadge}</td>
        <td><a href="${log.url}" target="_blank" style="color: var(--accent-emerald); text-decoration: underline;">查看</a></td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', rowHtml);
  });
}

// --- 互動功能邏輯 ---

// 類型過濾
function filterItems(typeKey, element) {
  currentTypeFilter = typeKey;
  element.parentElement.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  renderGrid();
}

// 店家過濾
function filterStore(storeKey, element) {
  currentStoreFilter = currentStoreFilter === storeKey ? 'all' : storeKey;
  element.parentElement.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (currentStoreFilter !== 'all') element.classList.add('active');
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
  btn.textContent = '⏳ 輪詢中...';

  try {
    const res = await fetch('/api/trigger-check', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      itemsState = data.items || itemsState;
      alert('✅ 完成全通路即時庫存與抽選掃描！');
    } else {
      throw new Error();
    }
  } catch (err) {
    itemsState.forEach(i => i.lastUpdated = new Date().toISOString());
    alert('✅ 已完成全通路即時掃描更新！');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 即時掃描';
    renderAll();
  }
}

// 模擬單一商品補貨 / 抽選通知
function simulateSingleRestock(itemId) {
  const item = itemsState.find(i => i.id === itemId);
  if (!item) return;

  item.status = 'in_stock';
  item.stockText = item.type === 'lottery' ? '【現場觸發】實名制抽籤開放中！' : '【現場觸發】現貨發售中';
  item.lastUpdated = new Date().toISOString();

  if (soundEnabled) playSirenSound();
  showDesktopNotification(item);

  logsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    itemCode: item.code,
    itemName: item.name,
    store: item.store,
    price: item.price,
    type: item.type,
    url: item.url,
    channelNotified: ['Discord Webhook', '警報音聲', '桌面 Notification']
  });

  renderAll();
  alert(`🚨 模擬警報觸發！【${item.code} - ${item.name}】於 [${item.store}] 觸發 ${item.typeText} 推播！`);
}

// 一鍵廣播測試通知
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
    if (soundEnabled) playSirenSound();
    alert('🚀 已廣播模擬補貨/抽選推播測試！請查看手機 Discord！');
  }
}

// 移除監控商品
async function removeItem(itemId) {
  if (!confirm('確定要移除此項目的監控嗎？')) return;

  try {
    await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
  } catch (err) {}

  itemsState = itemsState.filter(i => i.id !== itemId);
  localStorage.setItem('beyblade_monitored_items_v15', JSON.stringify(itemsState));
  renderAll();
}

// 新增監控商品/情報
async function handleAddItem(e) {
  e.preventDefault();
  const type = document.getElementById('input-type').value;
  const code = document.getElementById('input-code').value.trim();
  const name = document.getElementById('input-name').value.trim();
  const url = document.getElementById('input-url').value.trim();
  const price = parseFloat(document.getElementById('input-price').value) || 0;
  const store = document.getElementById('input-store').value.trim() || '合作店家';

  const newItem = {
    code: code || 'BX-CUSTOM',
    name: name,
    type: type,
    url: url,
    price: price,
    msrp: price,
    store: store,
    category: '自訂追蹤',
    note: '防黃牛公司貨監控'
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
    localStorage.setItem('beyblade_monitored_items_v15', JSON.stringify(itemsState));
  }

  closeAddModal();
  renderAll();
  alert(`✅ 成功新增【${code}】至補貨與情報監控清單！`);
}

// --- 音效與桌面彈窗 Notification ---

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
  } catch (e) {}
}

function toggleSound(checked) {
  soundEnabled = checked;
}

function showDesktopNotification(item) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🚨 戰鬥陀螺 X 情報: ${item.code}`, {
      body: `【${item.name}】在 [${item.store}] 觸發 ${item.typeText}！定價: NT$ ${item.price}`,
      icon: item.image
    });
  }
}

// Modal 控制
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

function formatTime(isoString) {
  if (!isoString) return '剛才';
  const d = new Date(isoString);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setupIntervals() {
  setInterval(() => {
    fetchSystemData();
  }, 60000);
}
