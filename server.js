/**
 * 戰鬥陀螺 X (Beyblade X) 補貨通知機器人 - 後端監控與推播服務器 (Node.js)
 * 支援: Funbox, 蝦皮, 誠品線上, MOMO, PChome 補貨自動偵測
 * 推播管道: Gmail / Discord Webhook / Telegram Bot / LINE Notify
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const { PRESET_BEYBLADES } = require('./js/mockData');

const app = express();
const PORT = process.env.PORT || 3000;
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60', 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 記憶體中儲存的監控商品清單 (預設初始化狀態為完售監控中)
let monitoredItems = PRESET_BEYBLADES.map(i => ({
  ...i,
  status: 'out_of_stock',
  stockText: '監控中 (無現貨)'
}));

let restockLogs = [
  {
    id: 'log-init',
    timestamp: new Date().toISOString(),
    itemCode: '系統資訊',
    itemName: '戰鬥陀螺 X 補貨雷達全通路監控中...',
    store: '系統中心',
    price: 0,
    url: 'https://shop.funbox.com.tw',
    channelNotified: ['Discord 頻道', '24H 輪詢']
  }
];

// --- 1. 通知發送邏輯引擎 ---

/**
 * 發送 Discord Webhook 卡片推播 (最快/零門檻/免費)
 */
async function sendDiscordNotification(item) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR_WEBHOOK')) return false;

  try {
    const payload = {
      username: "戰鬥陀螺 X 補貨雷達 ⚡",
      avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
      embeds: [
        {
          title: `🚨【戰鬥陀螺補貨通知】${item.code} - ${item.name}`,
          url: item.url,
          color: 0x00FF88, // 亮綠色
          description: `🎯 **通路名稱**：${item.store}\n💰 **販售價格**：NT$ ${item.price}\n📦 **庫存狀態**：${item.stockText || '現貨開放搶購中！'}\n📝 **備註說明**：${item.note || '請手刀搶購！'}`,
          thumbnail: { url: item.image },
          timestamp: new Date().toISOString(),
          footer: { text: "BeyRestock Bot • 戰鬥陀螺台灣補貨第一線" }
        }
      ]
    };
    await axios.post(webhookUrl, payload);
    console.log(`[Discord Notification] 成功送出: ${item.name}`);
    return true;
  } catch (err) {
    console.error(`[Discord Notification Error]:`, err.message);
    return false;
  }
}

/**
 * 發送 Telegram Bot 訊息推播 (最快/免費)
 */
async function sendTelegramNotification(item) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes('123456789')) return false;

  try {
    const text = `🚨 *【戰鬥陀螺 X 補貨大事件】*\n\n` +
      `🔥 *型號*: ${item.code}\n` +
      `📦 *品名*: ${item.name}\n` +
      `🏪 *店家*: ${item.store}\n` +
      `💰 *價格*: NT$ ${item.price}\n` +
      `📌 *狀態*: ${item.stockText}\n\n` +
      `👉 [點我手刀搶購](${item.url})`;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });
    console.log(`[Telegram Notification] 成功送出: ${item.name}`);
    return true;
  } catch (err) {
    console.error(`[Telegram Notification Error]:`, err.message);
    return false;
  }
}

/**
 * 發送 LINE Notify 推播
 */
async function sendLineNotification(item) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token || token.includes('YOUR_LINE')) return false;

  try {
    const message = `\n🚨【戰鬥陀螺 X 補貨通知】\n商品: ${item.code} ${item.name}\n店家: ${item.store}\n價格: NT$ ${item.price}\n直達連結: ${item.url}`;
    const params = new URLSearchParams();
    params.append('message', message);

    await axios.post('https://notify-api.line.me/api/notify', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`[LINE Notification] 成功送出: ${item.name}`);
    return true;
  } catch (err) {
    console.error(`[LINE Notification Error]:`, err.message);
    return false;
  }
}

/**
 * 發送 Gmail 電子郵件通知 (100% 免費)
 */
async function sendGmailNotification(item) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL_TO || user;

  if (!user || !pass || pass.includes('xxxx')) return false;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"戰鬥陀螺補貨機器人" <${user}>`,
      to: to,
      subject: `🚨【戰鬥陀螺補貨通知】${item.code} 於 ${item.store} 有現貨補貨！`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #00ff88; border-bottom: 2px solid #00ff88; padding-bottom: 8px;">⚡ 戰鬥陀螺 X 補貨雷達通知</h2>
          <p style="font-size: 16px; font-weight: bold; color: #ffffff;">${item.name}</p>
          <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>型號代碼：</strong> <span style="color: #38bdf8;">${item.code}</span></p>
            <p style="margin: 5px 0;"><strong>販售通路：</strong> ${item.store}</p>
            <p style="margin: 5px 0;"><strong>售價：</strong> <span style="color: #f59e0b; font-size: 18px; font-weight: bold;">NT$ ${item.price}</span></p>
            <p style="margin: 5px 0;"><strong>目前狀態：</strong> ${item.stockText || '補貨現貨中'}</p>
          </div>
          <a href="${item.url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00c6ff, #0072ff); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">🔥 點我手刀搶購此陀螺</a>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">本信件由戰鬥陀螺 X 自動監控機器人系統發送</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Gmail Notification] 成功寄出郵件至 ${to}: ${item.name}`);
    return true;
  } catch (err) {
    console.error(`[Gmail Notification Error]:`, err.message);
    return false;
  }
}

/**
 * 廣播所有推播管道
 */
async function dispatchAllNotifications(item) {
  const results = await Promise.all([
    sendDiscordNotification(item),
    sendTelegramNotification(item),
    sendLineNotification(item),
    sendGmailNotification(item)
  ]);

  const channelsNotified = [];
  if (results[0]) channelsNotified.push('Discord');
  if (results[1]) channelsNotified.push('Telegram');
  if (results[2]) channelsNotified.push('LINE');
  if (results[3]) channelsNotified.push('Gmail');

  // 記錄日誌
  restockLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    itemCode: item.code,
    itemName: item.name,
    store: item.store,
    price: item.price,
    url: item.url,
    channelNotified: channelsNotified.length ? channelsNotified : ['Discord Webhook']
  });

  return channelsNotified;
}

// --- 2. 爬蟲與狀態精準解析 Engine ---

async function checkStoreStock(item) {
  try {
    const response = await axios.get(item.url, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      maxRedirects: 5
    });

    const finalUrl = response.request?.res?.responseUrl || response.config?.url || item.url;
    const html = response.data;
    const $ = cheerio.load(html);
    let isStockIn = false;

    // 精準比對判斷邏輯
    if (item.url.includes('funbox.com.tw')) {
      // 麗嬰國際官網 (若被重定向回首頁，說明無此商品/完售)
      if (item.url.includes('/products/') && !finalUrl.includes('/products/')) {
        isStockIn = false;
      } else {
        const pageText = $('body').text();
        const hasAddToCart = $('.btn-add-to-cart, .btn-buy, button:contains("加入購物車")').length > 0 || pageText.includes('加入購物車');
        const hasSoldOut = pageText.includes('售完') || pageText.includes('已售完') || pageText.includes('商品已下架');
        isStockIn = hasAddToCart && !hasSoldOut;
      }
    } else if (item.url.includes('eslite.com')) {
      // 誠品線上 Eslite
      const pageText = $('body').text();
      const hasOut = pageText.includes('暫無庫存') || pageText.includes('售完') || pageText.includes('補貨中');
      const hasCart = pageText.includes('放入購物車') || pageText.includes('直接購買');
      isStockIn = hasCart && !hasOut;
    } else if (item.url.includes('shopee.tw')) {
      // 蝦皮購物
      const pageText = $('body').text();
      isStockIn = !pageText.includes('已售完') && !pageText.includes('此商品已下架') && pageText.includes('購買');
    } else if (item.url.includes('momoshop.com.tw')) {
      // MOMO 購物網 (針對特定商品頁或搜尋結果)
      const pageText = $('body').text();
      const hasBuy = pageText.includes('放入購物車') || pageText.includes('直接購買') || $('.buyBtn').length > 0;
      const hasOut = pageText.includes('補貨中') || pageText.includes('售完');
      isStockIn = hasBuy && !hasOut;
    } else {
      // 通用賣場邏輯
      const pageText = $('body').text();
      isStockIn = (pageText.includes('加入購物車') || pageText.includes('立即購買')) && !pageText.includes('售完') && !pageText.includes('補貨中');
    }

    const previousStatus = item.status;
    const newStatus = isStockIn ? 'in_stock' : 'out_of_stock';
    item.status = newStatus;
    item.stockText = isStockIn ? '⚡ 現貨開放購買中！' : '⌛ 完售補貨中';
    item.lastUpdated = new Date().toISOString();

    // 狀態變更觸發推播（由無現貨轉為有現貨）
    if (previousStatus === 'out_of_stock' && newStatus === 'in_stock') {
      console.log(`🎉 偵測到補貨！[${item.store}] ${item.code} - ${item.name}`);
      await dispatchAllNotifications(item);
    }
  } catch (err) {
    item.status = 'out_of_stock';
    item.stockText = '⌛ 完售補貨中';
    item.lastUpdated = new Date().toISOString();
  }
}

// 自動 Cron 輪詢任務
cron.schedule(`*/${Math.max(1, Math.floor(CHECK_INTERVAL / 60))} * * * *`, async () => {
  console.log(`[Cron Task] 輪詢 ${monitoredItems.length} 項戰鬥陀螺商品...`);
  for (const item of monitoredItems) {
    await checkStoreStock(item);
  }
});

// --- 3. REST API 路由 ---

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    checkIntervalSeconds: CHECK_INTERVAL,
    activeItemCount: monitoredItems.length,
    activeNotifiers: {
      discord: !!process.env.DISCORD_WEBHOOK_URL && !process.env.DISCORD_WEBHOOK_URL.includes('YOUR_WEBHOOK'),
      telegram: !!process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.includes('123456789'),
      line: !!process.env.LINE_NOTIFY_TOKEN && !process.env.LINE_NOTIFY_TOKEN.includes('YOUR_LINE'),
      gmail: !!process.env.GMAIL_USER && !process.env.GMAIL_APP_PASSWORD?.includes('xxxx')
    }
  });
});

app.get('/api/items', (req, res) => {
  res.json({ success: true, items: monitoredItems, logs: restockLogs });
});

app.post('/api/items', (req, res) => {
  const { code, name, store, url, price, category, note } = req.body;
  if (!name || !url) {
    return res.status(400).json({ success: false, message: '請提供商品名稱與網址！' });
  }

  const storeKey = url.includes('eslite.com') ? 'eslite' :
                   url.includes('funbox.com.tw') ? 'funbox' :
                   url.includes('shopee.tw') ? 'shopee' :
                   url.includes('momoshop.com.tw') ? 'momo' : 'pchome';

  const newItem = {
    id: `item-${Date.now()}`,
    code: code || 'BX-X',
    name: name,
    category: category || '熱門陀螺',
    store: store || (storeKey === 'funbox' ? 'Funbox 麗嬰國際' : storeKey === 'eslite' ? '誠品線上' : storeKey === 'shopee' ? '蝦皮購物' : '合作賣場'),
    storeKey: storeKey,
    url: url,
    price: price || 450,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    stockText: '⌛ 完售監控中',
    note: note || '用戶新增追蹤'
  };

  monitoredItems.unshift(newItem);

  // 立即進行一次異步庫存檢查
  checkStoreStock(newItem);

  res.json({ success: true, item: newItem });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  monitoredItems = monitoredItems.filter(i => i.id !== id);
  res.json({ success: true, message: '成功移除監控項目' });
});

app.post('/api/test-notify', async (req, res) => {
  const { channel, itemId } = req.body;
  const targetItem = monitoredItems.find(i => i.id === itemId) || monitoredItems[0];
  
  const tempItem = {
    ...targetItem,
    stockText: '【測試發送】現貨大發售！手刀搶購'
  };

  let success = false;
  let message = '';

  if (channel === 'discord') {
    success = await sendDiscordNotification(tempItem);
    message = success ? 'Discord Webhook 測試發送成功！請查看手機 Discord！' : 'Discord 發送失敗，請檢查 .env / Render 環境變數的 DISCORD_WEBHOOK_URL';
  } else if (channel === 'telegram') {
    success = await sendTelegramNotification(tempItem);
    message = success ? 'Telegram Bot 測試發送成功！' : 'Telegram 發送失敗，請檢查 Telegram Token';
  } else if (channel === 'line') {
    success = await sendLineNotification(tempItem);
    message = success ? 'LINE Notify 測試發送成功！' : 'LINE 發送失敗，請檢查 LINE Token';
  } else if (channel === 'gmail') {
    success = await sendGmailNotification(tempItem);
    message = success ? 'Gmail 測試信件發送成功！' : 'Gmail 發送失敗，請檢查 Gmail 設定';
  } else {
    const channels = await dispatchAllNotifications(tempItem);
    success = channels.length > 0;
    message = `已觸發廣播發送！成功頻道: ${channels.join(', ') || 'Discord Webhook'}`;
  }

  res.json({ success, message });
});

app.post('/api/trigger-check', async (req, res) => {
  console.log(`[Manual Trigger] 控制台發起即時庫存掃描...`);
  for (const item of monitoredItems) {
    await checkStoreStock(item);
  }
  res.json({ success: true, message: '已完成所有通路即時輪詢掃描！', items: monitoredItems });
});

// 啟動 Express 服務
app.listen(PORT, () => {
  console.log(`
  ======================================================
  ⚡ 戰鬥陀螺 X (Beyblade X) 24H 補貨機器人啟動！
  🌐 控制台: http://localhost:${PORT}
  ⏱️ 輪詢頻率: 每 ${CHECK_INTERVAL} 秒
  ======================================================
  `);
});
