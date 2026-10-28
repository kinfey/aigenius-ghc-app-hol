# 使用 GitHub Copilot App 构建响应式点餐体验

[English](https://kinfey.github.io/aigenius-ghc-app-hol/) · [GitHub 仓库](https://github.com/kinfey/aigenius-ghc-app-hol)

本工作坊将使用 **GitHub Copilot App** 构建响应式点餐应用，连接麦当劳中国 MCP 服务，并创建需要用户参与确认的点餐画布。这是独立的教学练习，不是麦当劳官方产品。

| 实验 | 成果 | 建议时间 |
| --- | --- | --- |
| [实验一：构建与路由](lab1/zh.html) | 响应式前端、本地 API、Auto 与可选 Decision Router | 90 分钟 |
| [实验二：连接 MCP](lab2/zh.html) | 使用自己的账户查询真实优惠信息 | 60 分钟 |
| [实验三：创建画布](lab3/zh.html) | 可视化点餐流程和明确的确认关卡 | 60 分钟 |

## 开始之前

- 安装 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)、Git、Node.js 22.16 或更高版本和 Microsoft Edge，使用有 Copilot 权限的账号登录。菜单及模型可用性可能随版本和策略变化。
- 实验二、三需要中国大陆地区的麦当劳账户，并能访问 [open.mcd.cn](https://open.mcd.cn/)。服务条款、账户资格、服务可用性和工具参数可能变化。
- 实验一的可选 Decision Router 需要有权访问私有[路由仓库](https://github.com/kinfey/decision-ghc-router)、Copilot CLI，以及已在 Microsoft Foundry 部署 Microsoft-Decision-1 的 Azure 订阅。使用 Auto 不需要这些额外条件。
- 在**新的本地项目**中操作，不要把应用代码写入教程仓库。三个实验沿用同一个应用和会话。
- 真实服务和模型可能产生费用。不要公开 API 密钥、Token、私人端点、地址、订单详情或含有这些信息的截图。使用自己的凭据，已泄露的凭据应立即轮换。

每个实验都提供英文 `README.md` 和简体中文 `README.zh.md`。指南中配图是公开文档的真实浏览器截图，而非伪造的应用成品截图。请按各实验的截图清单自行记录 Copilot App 与 Edge 中的操作，先遮盖个人信息。

从[实验一](lab1/zh.html)开始。
