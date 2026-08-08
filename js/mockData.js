/**
 * 戰鬥陀螺 X (Beyblade X) 補貨通知系統 - 預設商品與通路資料
 */

const PRESET_BEYBLADES = [
  {
    id: 'bx-35',
    code: 'BX-35',
    name: '戰鬥陀螺 X BX-35 黑色烈燄衝擊發射組 / 隨機強化包 Vol.4',
    category: '特別限定組',
    store: 'Funbox 麗嬰國際',
    storeKey: 'funbox',
    url: 'https://shop.funbox.com.tw/products/beyblade-x-bx-35',
    price: 699,
    status: 'in_stock', // in_stock | out_of_stock | checking
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    stockText: '現貨發售中',
    note: 'Funbox 官網正版公司貨'
  },
  {
    id: 'ux-01',
    code: 'UX-01',
    name: '戰鬥陀螺 X UX-01 德拉克特攻 / 噬魔霸龍 (Dran Dagger)',
    category: 'UX 獨特系列',
    store: '誠品線上 Eslite',
    storeKey: 'eslite',
    url: 'https://www.eslite.com/product/1005201242682',
    price: 495,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    stockText: '完售補貨中',
    note: '誠品線上文具館代理版'
  },
  {
    id: 'bx-36',
    code: 'BX-36',
    name: '戰鬥陀螺 X BX-36 鯨魚水浪 5-80E / Whale Wave 戰鬥陀螺',
    category: 'BX 基礎系列',
    store: '蝦皮購物 麗嬰旗艦店',
    storeKey: 'shopee',
    url: 'https://shopee.tw/search?keyword=BX-36%20%E6%84%9B%EAC%E5%A9%A6%E6%8E%A7',
    price: 395,
    status: 'in_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    stockText: '熱銷現貨供應',
    note: '蝦皮商城 24H 快速出貨'
  },
  {
    id: 'ux-02',
    code: 'UX-02',
    name: '戰鬥陀螺 X UX-02 赫爾斯魔槌 / 烈焰巨神特別版',
    category: 'UX 獨特系列',
    store: 'Funbox 麗嬰國際',
    storeKey: 'funbox',
    url: 'https://shop.funbox.com.tw/products/ux-02-hells-hammer',
    price: 550,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    stockText: '線上抽籤預購中',
    note: '需實名制登記抽籤購買'
  },
  {
    id: 'cx-01',
    code: 'CX-01',
    name: '戰鬥陀螺 X CX-01 極限爆裂終極對戰組 (含雙發射器+X拉軌賽道)',
    category: '對戰組合套裝',
    store: 'MOMO 購物網',
    storeKey: 'momo',
    url: 'https://www.momoshop.com.tw/search/searchShop.jsp?keyword=Beyblade%20CX-01',
    price: 1999,
    status: 'in_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
    stockText: '庫存僅剩 3 件',
    note: 'MOMO 滿額折抵優惠中'
  },
  {
    id: 'bxg-01',
    code: 'BXG-01',
    name: '戰鬥陀螺 X BXG-01 鳳凰飛翼 9-60GF 金屬重攻特別版 (G1 大會限定)',
    category: '會場/限定版',
    store: 'PChome 24h 購物',
    storeKey: 'pchome',
    url: 'https://24h.pchome.com.tw/store/DEAS01',
    price: 850,
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    stockText: '缺貨中 (貨到通知)',
    note: '搶手極品限定款式'
  }
];

const STORE_CHANNELS = [
  { key: 'funbox', name: 'Funbox 麗嬰國際', color: '#ff4757', icon: '🛍️', domain: 'shop.funbox.com.tw' },
  { key: 'eslite', name: '誠品線上 Eslite', color: '#2ed573', icon: '📚', domain: 'eslite.com' },
  { key: 'shopee', name: '蝦皮購物 Shopee', color: '#ff7f50', icon: '🧡', domain: 'shopee.tw' },
  { key: 'momo', name: 'MOMO 購物網', color: '#e84393', icon: '💖', domain: 'momoshop.com.tw' },
  { key: 'pchome', name: 'PChome 24h', color: '#1e90ff', icon: '🛒', domain: 'pchome.com.tw' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRESET_BEYBLADES, STORE_CHANNELS };
}
