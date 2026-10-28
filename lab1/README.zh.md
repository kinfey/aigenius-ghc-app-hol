# 实验一：构建点餐应用并选择模型

[English](https://kinfey.github.io/aigenius-ghc-app-hol/lab1/) · [工作坊首页](../zh.html) · [下一步：实验二](../lab2/zh.html)

**目标：**构建可在电脑、平板和手机运行的本地全栈点餐原型，并比较 Auto 与可选的独立启动的 Decision Router。建议 90 分钟。

![在浏览器中截取的 Copilot App 会话官方文档](images/copilot-sessions-doc.png)
*参考：[GitHub 会话文档](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)。实际界面可能随版本变化。*

## 1. 准备工作区

1. 安装 Git、Node.js 22.16 以上、Edge 和 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)。登录并确认账号有 Copilot 权限。
2. 创建空的本地文件夹 `ordering-workshop`。在 Copilot App 中选择 **Sessions → New → Open local folder**，选中该文件夹；检查内容后再授予信任。
3. 在输入框下选择 **Plan** 模式，然后在模型选择器中选择 **Auto**。Auto 根据任务选择可用模型；选择器会显示响应所用的模型。界面、模型和计费取决于账号及策略。
4. 向 Copilot 提交：

   > 请规划一个点餐应用：前端使用 React/Vite TypeScript，后端使用 Node.js TypeScript API，放在同一本地工作区。使用模拟商品与价格、购物车和模拟结账。适配手机、平板、电脑；支持键盘操作以及加载、空状态和错误状态。提供测试计划与准确运行命令。不要连接真实服务，也不要把密钥放到前端。

5. 审核计划后再批准。如未区分浏览器 UI 和服务器，请先要求修改。切换 **Interactive** 模式，请 Copilot 按计划实现、运行测试并报告准确命令与端口。审核文件改动，逐项批准工具调用，不要一键放行所有操作。
6. 安装依赖时使用允许的 npm 源。本工作坊使用 `https://packagefeedproxy.microsoft.io/npm/`；请 Copilot 为项目配置并安装依赖。不要把凭据粘贴到对话中。

## 2. 运行并检查应用

1. 让 Copilot 使用生成的命令启动 API 和前端开发服务器。可以打开 App 内浏览器画布，同时在 Edge 打开本地前端地址。仅在实验期间保持服务器运行。
2. 在 Edge 打开开发者工具（`F12` 或 `Cmd+Option+I`），启用设备模拟，分别检查 **390 × 844**、**768 × 1024** 和 **1440 × 900**。每种尺寸均添加、删除商品，查看购物车并完成**模拟**结账。不得出现横向溢出或无法操作的控件。
3. 暂停 API 后刷新或发起请求：页面应显示错误并允许重试，而不是编造数据。随后重启 API。
4. 请 Copilot 运行生成的测试套件并修复回归。将准确命令和结果记在个人笔记中；不要提交包含个人信息的截图。

## 3. 练习节约 Token 的协作

Copilot App 将 Agent、工作区、工具、模式和模型选择器组合在一起：Agent 可检查文件、修改代码、运行测试并在画布展示结果，用户仍负责审核操作。**Auto** 与下方路由器不是同一功能。

1. 在相同项目中创建新会话，选择 **Auto**。提出范围明确的任务，例如“增加空购物车测试，只修改相关组件和测试”。用 `@` 引用文件，不要反复粘贴整个仓库。
2. 请 Agent 报告使用的模型及界面提供的用量信息。记录任务、模型、耗时、测试结果和可获得的用量/费用信息；界面显示不一定等于最终账单。
3. 再尝试较复杂的任务，例如“追踪 API 失败经过 UI 和服务器的路径，提出修复和回归测试”。观察 Auto 是否更换模型。模型可用性和路由并非固定，不要仅凭名字推断质量或价格。
4. 节省用量：明确验收条件，大改动先规划，先跑针对性测试，避免重复发送大文件，上下文陈旧时创建新会话。上下文大小、工具调用、重试、模型与输出长度均可能影响成本。参阅 [Copilot 计费说明](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)。

## 4. 可选：Microsoft-Decision-1 与 Decision Router

**重要：**私有路由器仓库目前记录的是实验性的 **Copilot CLI** 原生扩展，并没有验证 Copilot App 的模型选择器支持该路由器。以下步骤在独立终端中针对同一项目运行；其余实验继续使用 App。不要声称 CLI 路由会自动配置或路由 App 会话。若无法访问路由器，可直接继续使用 Auto。

1. 打开 [Microsoft Foundry](https://ai.azure.com/) 自己的项目 → **Model catalog** → **Microsoft-Decision-1** → **Deploy**。部署名称使用 `Decision-1` 或记录实际名称。可用性、配额、权限和价格因环境而异。从部署详情获取自己的资源端点和密钥。参考[官方指南](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision)。
2. 拥有私有仓库权限后，在应用文件夹**之外**克隆。若无权限，联系仓库所有者；不要将私有源码复制到本公开教程。终端运行：

   ```bash
   gh repo clone kinfey/decision-ghc-router
   cd decision-ghc-router
   npm install --registry=https://packagefeedproxy.microsoft.io/npm/
   cp -n .env.example .env
   chmod 600 .env
   ```

3. 私下编辑路由器的 `.env`，不要发到对话或截图：

   ```dotenv
   JEV_PROVIDER=azure
   AZURE_DECISION_ENDPOINT=https://<your-resource>.services.ai.azure.com/providers/microsoft/v1/systemone
   AZURE_DECISION_API_KEY=<your-own-key>
   AZURE_DECISION_MODEL=Decision-1
   JEV_FALLBACK_CHEAPEST=0
   ```

   如果部署名不同，请改成实际名称。不要提交 `.env`，也不要让 Copilot 读取它。分类器接收任务文本和候选模型元数据，提示词中不要放密钥或个人信息。
4. 安装用户级扩展并启动仓库文档指定的实验性 CLI：

   ```bash
   npm run install:router
   npm run router
   ```

   审核后仅接受所需的目录信任和 `user:decision-router` hook 权限。在 CLI 选择 `/model` → **Decision Router**，或输入 `/model decision/router`。提交不含敏感信息的测试任务，查看显示的执行模型与估算费用。用 `/model` 选择普通模型可绕过路由器。
5. 如需在新 CLI 会话中操作点餐项目，先按上述步骤安装，再切换到项目目录，运行 `COPILOT_ALLOW_GET_PROVIDER_ENDPOINT=true copilot --experimental` 并选择路由器。保留克隆的路由器目录。以后可在该目录运行 `npm run uninstall:router`，重启 CLI 后卸载。
6. 将任务、所选模型、估算和结果与 Auto 实验对比。Decision-1 只做**分类**，实际任务仍由 Copilot 模型执行。Azure 分类和 Copilot 执行分别计费。路由估算不包含重试、后续工具调用等费用；自定义提供程序的显示值及 CLI 用量计数不是可靠的账单上限。请查看 GitHub 和 Azure 账单。

如未出现路由器，检查 Node 版本、私有仓库权限、CLI 实验模式、hook 权限及[路由器说明](https://github.com/kinfey/decision-ghc-router)。凭据缺失、网络错误或置信度不足会明确报错，不要通过分享密钥来绕过问题。

## 截图与完成标准

自行截取并脱敏：(1) Copilot App 中的计划与 Auto 选择器；(2) Edge 中三个视口尺寸；(3) 可选的 Foundry 部署详情（隐藏端点和密钥）及 CLI 路由器选择。上方参考图片不能替代这些截图。

当三个尺寸均可使用、API 离线时 UI 能提示错误、测试通过且结账为模拟模式时，即可保留项目并进入[实验二](../lab2/zh.html)。
