const messages = {
  "Harbor Afterhours": "港城夜行",
  "HARBOR": "港城",
  "AFTERHOURS": "夜行",
  "Harbor": "港城",
  "Afterhours.": "夜行",
  "ONE CITY. ONE NIGHT. ONE CHANCE.": "一座城。一夜时间。一次机会。",
  "A private syndicate is buying the waterfront. Mara has a ledger that can stop them. Get behind the wheel, cross a restless city, and bring the story home.": "一个私人财团正在买下滨水区。玛拉手里有一本可以阻止他们的账簿。开车穿过这座不眠之城，把证据带回来。",
  "Start a new night →": "开始新故事 →",
  "Continue saved story": "继续已保存的故事",
  "Original open-city action · Four story missions · Free roam": "开放城市动作游戏 · 四个故事任务 · 自由探索",
  "Local saves stay in this browser. No network, no account.": "存档留在当前浏览器。无需联网或登录。",
  "WASD · move / drive   E · enter / exit   Mouse + click · fire   Shift · sprint   Space · brake   P · pause   F5 · save": "WASD · 移动 / 驾驶　E · 上车 / 下车　鼠标左键 · 射击　Shift · 冲刺　空格 · 刹车　P · 暂停　F5 · 保存",
  "Main game view": "主游戏画面",
  "City minimap": "城市小地图",
  "MARINA ROW": "码头街",
  "GLASSWORKS": "玻璃厂",
  "SIGNAL QUARTER": "信号街区",
  "SOUTH DOCKS": "南码头",
  "MARINA GARAGE": "码头车库",
  "SIGNAL HOUSE": "信号站",
  "TIDE TABLE": "潮汐表",
  "PIER SUPPLY": "码头物资",
  "MOTH COFFEE": "飞蛾咖啡",
  "BREAKWATER": "防波堤",
  "Marina Garage": "码头车库",
  "Glassworks": "玻璃厂",
  "South Docks": "南码头",
  "Signal House": "信号站",
  "A clean start": "顺利开局",
  "The night ledger": "夜间账簿",
  "Break the tail": "甩掉尾巴",
  "Home before dawn": "黎明前回家",
  "Mara needs a wheelman. Borrow a car and drive to the Glassworks.": "玛拉需要一名司机。找一辆车，开到玻璃厂。",
  "The Glassworks ledger names the people buying the harbor. Deliver it to South Docks.": "玻璃厂的账簿记录了收购港口的人。把账簿送到南码头。",
  "Lose your wanted level, then bring the ledger to Signal House.": "甩掉警察后，把账簿送到信号站。",
  "Return to Marina Garage. Mara will put the ledger on the air.": "回到码头车库，玛拉会通过广播公开账簿。",
  "Mission complete": "任务完成",
  "No valid saved story found. Start a new night.": "找不到有效存档，请开始新故事。",
  "Story saved locally.": "故事已保存到本机。",
  "Cannot save a failed story. Start a new night.": "任务失败后无法存档，请开始新故事。",
  "Press E to get in. Hold W to drive.": "按 E 上车，按住 W 驾驶。",
  "Find a parked car and press E to get in.": "找一辆停着的车，按 E 上车。",
  "Get beyond the patrols on your map. Wait for the wanted stars to clear.": "离开地图上巡逻队的范围，等通缉星消失。",
  "STORY": "故事任务",
  "GET A VEHICLE": "找一辆车",
  "Story complete · Free roam": "故事完成 · 自由探索",
  "The harbor has a voice again.": "港城重新拥有了发声的机会。",
  "HEALTH": "生命",
  "Wanted level": "通缉等级",
  "ON FOOT": "步行",
  " km/h": " 公里/小时",
  " m": " 米",
  "NIGHT ON HOLD": "已暂停",
  "P to resume · F5 to save": "P 继续 · F5 保存",
  "BUSTED": "任务失败",
  "Refresh and continue your last saved story.": "刷新页面，继续上一次保存的故事。",
  "On foot. WASD to move.": "已下车。按 WASD 移动。",
  "Vehicle acquired. Follow the yellow route marker.": "已获得车辆。沿黄色路线行驶。",
  "No vehicle nearby. Move within reach and press E.": "附近没有车辆。靠近车辆后按 E。",
  "Vehicle disabled. Find another ride.": "车辆损坏，请找另一辆车。",
  "Pedestrian hit. Police response intensified.": "撞到行人，警方提高了通缉等级。",
  "Mara needs the car as well. Bring a vehicle.": "玛拉也需要这辆车，请驾车前往。",
  "Lose the police before meeting the contact.": "先甩掉警察，再去见接头人。",
  "The ledger is live. Harbor liberated. Free roam unlocked.": "账簿已公开。港城重获自由，你可以继续探索。",
  "Busted. Load your save or start a new night.": "任务失败。读取存档或开始新故事。"
};
const storageKey = "makefun-harbor-afterhours.language";
let currentLanguage = 'zh';
try { if (localStorage.getItem(storageKey) === 'en') currentLanguage = 'en'; } catch {}
window.uiLanguage = currentLanguage;
window.t = text => window.uiLanguage === 'zh' && Object.hasOwn(messages, text) ? messages[text] : text;
const original = [];
const title = document.title;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
for (let node; (node = walker.nextNode());) {
  if (node.parentElement.closest('script, style, #language')) continue;
  if (Object.hasOwn(messages, node.nodeValue.trim())) original.push([node, node.nodeValue]);
}
const attributes = [...document.querySelectorAll('[aria-label], [placeholder], [title]')].flatMap(el =>
  ['aria-label', 'placeholder', 'title'].filter(name => el.hasAttribute(name)).map(name => [el, name, el.getAttribute(name)]));
const language = document.getElementById('language');
function refresh() {
  document.documentElement.lang = window.uiLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = t(title);
  language.value = window.uiLanguage;
  for (const [node, text] of original) {
    node.nodeValue = text.replace(text.trim(), t(text.trim()));
  }
  for (const [el, name, value] of attributes) el.setAttribute(name, t(value));
}
language.addEventListener('change', () => {
  window.uiLanguage = language.value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(storageKey, window.uiLanguage); } catch {}
  refresh();
  window.dispatchEvent(new Event('ui-language-change'));
});
refresh();
