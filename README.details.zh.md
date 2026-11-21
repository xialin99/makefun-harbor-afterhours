# 港城夜行

游戏含步行、车辆、车流、追捕、四项故事任务与自由探索。按 E 上车或下车，W 加速，A/D 转向，S 倒车，空格刹车。步行时用 WASD，Shift 冲刺。鼠标瞄准并点击射击。P 暂停，F5 保存。

## 技术说明

有 WebGL 时使用仓库内的 Three.js 渲染器，初始化失败时提供俯视画面。设置 HARBOR_CHROMIUM 后运行 node tests/browser.mjs 可验证驾驶、故事、追捕与存档流程。

[English technical notes](README.details.md)
