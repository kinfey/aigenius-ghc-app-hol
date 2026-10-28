# 使用 GitHub Copilot App 构建响应式点餐体验

[English](https://kinfey.github.io/aigenius-ghc-app-hol/) · [GitHub 仓库](https://github.com/kinfey/aigenius-ghc-app-hol)

本工作坊共 **60 分钟**，使用 **GitHub Copilot App** 构建响应式点餐应用，连接麦当劳中国 MCP 服务，并在 Browser 画布中运行需要用户参与确认的引导式应用。这是独立的教学练习，不是麦当劳官方产品。

| 实验 | 成果 | 建议时间 |
| --- | --- | --- |
| [实验一：构建与对比](lab1/zh.html) | 响应式应用，同任务比较 Auto 与固定 GPT-6 Luna | 20 分钟 |
| [实验二：连接 MCP](lab2/zh.html) | 连接 MCP 并查询真实只读优惠信息 | 15 分钟 |
| [实验三：画布中的引导式点餐](lab3/zh.html) | 真实 MCP 向导、菜单处理与明确确认关卡 | 25 分钟 |
| **合计** | **三个实验沿用同一应用** | **60 分钟** |

安装工具、恢复示例依赖、登录账号和准备个人 MCP Token 均在**课前**完成。课堂使用已提供的起始实现，控制改动范围。Decision Router/Azure 部署、多轮模型对比、原生 SDK 扩展开发、真实购买和支付列为课后可选内容，不额外占用这 60 分钟，也不是课堂完成条件。

## 开始之前

- 安装 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)、Git、Node.js 22.16 或更高版本和 Microsoft Edge，使用有 Copilot 权限的账号登录。菜单及模型可用性可能随版本和策略变化。
- 实验二、三需要中国大陆地区的麦当劳账户，并能访问 [open.mcd.cn](https://open.mcd.cn/)。服务条款、账户资格、服务可用性和工具参数可能变化。
- 实验一的可选 Decision Router 需要有权访问私有[路由仓库](https://github.com/kinfey/decision-ghc-router)、Copilot CLI，以及已在 Microsoft Foundry 部署 Microsoft-Decision-1 的 Azure 订阅。使用 Auto 或固定 GPT-6 Luna 均不需要这些额外条件。
- 在**新的本地项目**中操作，不要把应用代码写入教程仓库。三个实验沿用同一个应用和主会话；实验一的模型对比使用独立、全新、只读的会话。
- 真实服务和模型可能产生费用。不要公开 API 密钥、Token、私人端点、地址、订单详情或含有这些信息的截图。使用自己的凭据，已泄露的凭据应立即轮换。

每个实验都提供英文 `README.md` 和简体中文 `README.zh.md`。指南中明确区分公开文档截图与工作坊实际实现过程的 App、Edge 截图。真实服务截图绝不能暴露凭据或账户信息。

**当前状态：**三个实验均包含可运行代码与实现截图。实验三直接复用 [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code)，不复制应用；完整[英文](lab3/)和[中文](lab3/zh.html)指南包含生成文件链接及关键截图。Browser 画布应用已实现，注册 SDK 自定义扩展是独立的课后目标。真实连接/菜单截图与明确标注的离线确认截图分开说明，课程取证未真实下单或付款。

GitHub Pages 仅发布双语教程和截图，不承载带凭据的 Python 应用；应用按其 README 在本机运行。

从[实验一](lab1/zh.html)开始。
