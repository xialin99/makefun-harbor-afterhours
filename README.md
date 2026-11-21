# 港城夜行 / Harbor Afterhours

[在线使用 / Open in browser](https://xialin99.github.io/makefun-harbor-afterhours/)

[中文](#中文) · [English](#english)

![Preview](screenshots/01-south-docks-pursuit.jpg)

## 中文

### 第一次使用

1. [打开游戏](https://xialin99.github.io/makefun-harbor-afterhours/)，点击 **开始新故事**。
2. 按 **WASD** 走到车旁，按 **E** 上车。用 **W** 加速、**A/D** 转向，沿小地图的黄色路线行驶。
3. 到达目的地后看左上方的下一条任务。按 **F5** 存档，重新打开时点 **继续已保存的故事**。

原创港城动作游戏，包含步行、驾驶、交通、追逐、任务和本地存档。

### 本地运行

在项目根目录执行 `python -m http.server 8080 --directory game`，再用桌面浏览器打开 `http://localhost:8080`。支持 WebGL 渲染与俯视回退。

页面默认显示简体中文，可以在界面选择 English。

## English

### First use

1. [Open the game](https://xialin99.github.io/makefun-harbor-afterhours/) and click **Start a new night**.
2. Walk to the car with **WASD** and press **E** to get in. Hold **W** to accelerate, steer with **A/D**, and follow the yellow route.
3. Read the next task in the upper left after you arrive. Press **F5** to save. Choose **Continue saved story** when you return.

An original harbor-city action game with on-foot travel, driving, traffic, chases, missions, and local saves.

### Run locally

Run `python -m http.server 8080 --directory game` from the repository root and open `http://localhost:8080` in a desktop browser. The game includes a top-down fallback when WebGL is unavailable.

The interface opens in Simplified Chinese. Use the language menu to switch to English.

[中文技术说明](README.details.zh.md) · [English technical notes](README.details.md)

[make.fun 赛事 / Original bounty](https://make.fun/bounty/gta6-01)

## 许可证 / License

MIT. See [LICENSE](LICENSE).

赛事模板组件的授权见 [LICENSE-makefun.txt](LICENSE-makefun.txt)。

Kit components are covered by [LICENSE-makefun.txt](LICENSE-makefun.txt).

Three.js 保留其 [MIT 版权声明](game/vendor/LICENSE)。

Three.js retains its [MIT license notice](game/vendor/LICENSE).

