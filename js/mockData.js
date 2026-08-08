/**
 * 戰鬥陀螺 X (Beyblade X) 補貨通知系統 - 預設商品與多功能通知資料
 */

const PRESET_BEYBLADES = [
  {
    id: 'bx-35',
    code: 'BX-35',
    type: 'restock', // restock (現貨) | lottery (抽選) | preorder (預購) | event (抽獎活動)
    typeText: '⚡ 現貨補貨',
    name: '戰鬥陀螺 X BX-35 黑色烈燄衝擊發射組 / 隨機包 Vol.4',
    category: '特別限定組',
    store: 'Funbox 麗嬰國際',
    storeKey: 'funbox',
    url: 'https://shop.funbox.com.tw/products/beyblade-x-bx-35',
    price: 699,
    msrp: 699,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    stockText: '⌛ 完售監控中',
    note: '麗嬰國際官方原價公司貨 (防黃牛規避)'
  },
  {
    id: 'lottery-funbox-01',
    code: 'UX-02-LOT',
    type: 'lottery',
    typeText: '📝 實名制抽選',
    name: '【 Funbox 門市】戰鬥陀螺 X UX-02 赫爾斯魔槌 線上實名制抽籤登記',
    category: '官方限定抽選',
    store: 'Funbox 門市抽選頁',
    storeKey: 'funbox',
    url: 'https://shop.funbox.com.tw/',
    price: 550,
    msrp: 550,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    stockText: '📝 抽籤登記中 (中籤憑身分證領取)',
    note: '杜絕黃牛！Funbox 官方實名制抽籤購買'
  },
  {
    id: 'preorder-eslite-01',
    code: 'CX-02-PRE',
    type: 'preorder',
    typeText: '📅 新品預購',
    name: '戰鬥陀螺 X CX-02 世代爆裂對戰發射組 (首批限量預購)',
    category: '新品首發預購',
    store: '誠品線上 Eslite',
    storeKey: 'eslite',
    url: 'https://www.eslite.com/search?q=%E6%88%B0%E9%AC%B5%E9%99%80%E8%9E%BA',
    price: 1280,
    msrp: 1280,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
    stockText: '📅 首批開放預購',
    note: '誠品文具館正版代理，預計 9 月發貨'
  },
  {
    id: 'event-fbtw-01',
    code: 'FB-EVENT',
    type: 'event',
    typeText: '🎁 官方抽獎/大會',
    name: '【戰鬥陀螺 TW 官方活動】G1 大會參賽資格與免費陀螺抽獎活動',
    category: '官方活動獎勵',
    store: '戰鬥陀螺 TW 官方 FB',
    storeKey: 'official',
    url: 'https://www.facebook.com/BeybladeTW',
    price: 0,
    msrp: 0,
    status: 'in_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    stockText: '🎁 官方活動進行中',
    note: '戰鬥陀螺台灣代理商 Takara Tomy 公開活動'
  },
  {
    id: 'ux-01',
    code: 'UX-01',
    type: 'restock',
    typeText: '⚡ 現貨補貨',
    name: '戰鬥陀螺 X UX-01 德拉克特攻 / 噬魔霸龍 (Dran Dagger)',
    category: 'UX 獨特系列',
    store: '鼎美 Toy World',
    storeKey: 'toyworld',
    url: 'https://www.toyworld.com.tw/',
    price: 495,
    msrp: 495,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    stockText: '⌛ 完售監控中',
    note: '鼎美專櫃正版公司貨'
  },
  {
    id: 'books-01',
    code: 'BX-36',
    type: 'restock',
    typeText: '⚡ 現貨補貨',
    name: '戰鬥陀螺 X BX-36 鯨魚水浪 5-80E 戰鬥陀螺',
    category: 'BX 基礎系列',
    store: '博客來 Books.com',
    storeKey: 'books',
    url: 'https://www.books.com.tw/',
    price: 395,
    msrp: 395,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    stockText: '⌛ 完售監控中',
    note: '博客來網路書店正版婦幼館'
  }
];

const STORE_CHANNELS = [
  { key: 'funbox', name: 'Funbox 麗嬰國際', color: '#ff4757', icon: '🛍️' },
  { key: 'eslite', name: '誠品線上 Eslite', color: '#2ed573', icon: '📚' },
  { key: 'toyworld', name: '鼎美 Toy World', color: '#ffbe76', icon: '🧸' },
  { key: 'books', name: '博客來 Books', color: '#70a1ff', icon: '📖' },
  { key: 'shopee', name: '蝦皮官方旗艦', color: '#ff7f50', icon: '🧡' },
  { key: 'official', name: '戰鬥陀螺 TW 官方', color: '#a29bfe', icon: '📢' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRESET_BEYBLADES, STORE_CHANNELS };
}
