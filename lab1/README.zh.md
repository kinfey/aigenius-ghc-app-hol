# 实验一：构建点餐应用并选择模型

[English](https://kinfey.github.io/aigenius-ghc-app-hol/lab1/) · [工作坊首页](../zh.html) · [下一步：实验二](../lab2/zh.html)

**目标：**构建并检查适配电脑、平板和手机的本地全栈点餐原型，练习一次聚焦的 Auto 任务。用时 **20 分钟**，属于 **60 分钟课程**的一部分（20 + 15 + 25）。

**限时路线：**0–3 分钟检查课前已安装的起始项目；3–12 分钟使用 Auto 规划并实现一项范围明确的 UI/API 改进；12–17 分钟检查响应式布局与结账；17–20 分钟执行聚焦测试并记录用量。安装和恢复依赖在课前完成。生成耗时过长时，以 [`lab1/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab1/code) 为预备基线。下方从零实现步骤保留为参考；多轮基准测试和第 4 节 Decision Router/Azure 部署均为**课后扩展**，不计入这 20 分钟。

![在浏览器中截取的 Copilot App 会话官方文档](images/copilot-sessions-doc.png)
*参考：[GitHub 会话文档](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)。实际界面可能随版本变化。*

## 1. 准备工作区

1. 安装 Git、Node.js 22.16 以上、Edge 和 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)。登录并确认账号有 Copilot 权限。
2. 课前创建本地文件夹 `ordering-workshop` 并运行 `git init`；采用限时路线时提前准备好起始代码。Git 用于版本管理和可选的课后 SDK 扩展，实验三现有 Browser 画布不要求开发这类扩展。不要在本教程仓库内嵌套学习项目。在 Copilot App 中选择 **Sessions → New → Open local folder**，选中该文件夹；检查内容后再授予信任。
3. 在输入框下选择 **Plan** 模式，然后在模型选择器中选择 **Auto**。Auto 根据任务选择可用模型；选择器会显示响应所用的模型。界面、模型和计费取决于账号及策略。
4. 向 Copilot 提交：

   > 请规划一个点餐应用：前端使用 React/Vite TypeScript，后端使用 Python FastAPI，放在同一本地工作区。使用模拟商品与价格、购物车和模拟结账。适配手机、平板、电脑；支持键盘操作以及加载、空状态和错误状态。提供测试计划与准确运行命令。不要连接真实服务，也不要把密钥放到前端。

5. 审核计划后再批准。如未区分浏览器 UI 和服务器，请先要求修改。切换 **Interactive** 模式，请 Copilot 按计划实现、运行测试并报告准确命令与端口。审核文件改动，逐项批准工具调用，不要一键放行所有操作。
6. 安装依赖时使用 `https://packagefeedproxy.microsoft.io/npm/` 作为 npm 源，使用 `https://packagefeedproxy.microsoft.io/pypi/simple/` 作为 PyPI 源；请 Copilot 为项目配置并安装依赖。不要把凭据粘贴到对话中。

已完成的示例位于 [`lab1/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab1/code)，其 README 包含安装和运行命令。下面是实现过程中的真实 Copilot App 截图；为保护其他会话，已裁剪侧栏。

![Copilot App 展示实验一示例及实现活动](images/copilot-build.png)

## 2. 运行并检查应用

1. 让 Copilot 使用生成的命令启动 API 和前端开发服务器。可以打开 App 内浏览器画布，同时在 Edge 打开本地前端地址。仅在实验期间保持服务器运行。
2. 在 Edge 打开开发者工具（`F12` 或 `Cmd+Option+I`），启用设备模拟，分别检查 **390 × 844**、**768 × 1024** 和 **1440 × 900**。每种尺寸均添加、删除商品，查看购物车并完成**模拟**结账。不得出现横向溢出或无法操作的控件。
3. 暂停 API 后刷新或发起请求：页面应显示错误并允许重试，而不是编造数据。随后重启 API。
4. 请 Copilot 运行生成的测试套件并修复回归。将准确命令和结果记在个人笔记中；不要提交包含个人信息的截图。

以下截图来自实际运行的实验一 Python 后端和 React 应用，使用 Microsoft Edge 分别展示电脑、平板和手机布局：

![1440 像素电脑菜单](images/edge-desktop.png)
![768 像素平板菜单](images/edge-tablet.png)
![390 像素手机菜单](images/edge-phone.png)

添加两个模拟商品后，购物车与模拟结账界面如下：

![添加商品后的购物车](images/edge-cart.png)
![模拟结账确认](images/edge-checkout.png)

## 3. 练习节约 Token 的协作

Copilot App 将 Agent、工作区、工具、模式和模型选择器组合在一起：Agent 可检查文件、修改代码、运行测试并在画布展示结果，用户仍负责审核操作。**Auto** 与下方路由器不是同一功能。

1. 在相同项目中创建新会话，选择 **Auto**。提出范围明确的任务，例如“增加空购物车测试，只修改相关组件和测试”。用 `@` 引用文件，不要反复粘贴整个仓库。
2. 请 Agent 报告使用的模型及界面提供的用量信息。记录任务、模型、耗时、测试结果和可获得的用量/费用信息；界面显示不一定等于最终账单。
3. 再尝试较复杂的任务，例如“追踪 API 失败经过 UI 和服务器的路径，提出修复和回归测试”。观察 Auto 是否更换模型。模型可用性和路由并非固定，不要仅凭名字推断质量或价格。
4. 节省用量：明确验收条件，大改动先规划，先跑针对性测试，避免重复发送大文件，上下文陈旧时创建新会话。上下文大小、工具调用、重试、模型与输出长度均可能影响成本。参阅 [Copilot 计费说明](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)。

### 实测对比：Auto、Decision Router、Sol 与 Terra

以下是 2026 年 10 月 28 日的一次真实演示：四组使用**同一条不含敏感信息的提示词**、相同工作目录和 `--no-custom-instructions`，每次创建新的 CLI 会话。Decision 组使用下一节私有路由器的**启动时路由**与 Azure 分类器，并不是 App 模型选择器的集成。提示词为：

> In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.

| 选择 | 实际执行模型 | 输入 Token | 输出 Token | 缓存读取 Token | Copilot AI Credits | 按积分折算美元 | 模型 API 时间 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Auto | GPT-6 Luna | 14,919 | 130 | 0 | 0.173682 | $0.001737 | 4.313 秒 |
| Decision Router | GPT-6 Luna | 15,169 | 128 | 9,654 | 0.084984 | $0.000850 | 5.719 秒 |
| GPT-6.1 Sol | GPT-6.1 Sol | 15,170 | 104 | 0 | 3.896350 | $0.038964 | 4.475 秒 |
| GPT-6.1 Terra | GPT-6.1 Terra | 15,149 | 74 | 0 | 1.930550 | $0.019306 | 3.145 秒 |

![Copilot App 终端中显示的四组真实用量记录](images/copilot-usage-comparison.png)

**如何理解：**这只是一条小型测试计划任务的一次运行，不是基准测试。输入包含 Agent 上下文；缓存读取 Token 已包含在输入中，不要重复相加。Decision 组读取了 9,654 个缓存输入 Token，其他组没有，因此不能把这次较低的 Copilot 用量**仅归因于路由**。API 时间不是端到端耗时，也不含分类器时间。本次 Auto 和 Decision 都选择了 Luna，后续可能不同。Sol 和 Terra 可用于尝试更深入的分析或复杂实现，但必须在自己的任务上验证质量，不能直接断定谁更优。

上表积分来自 CLI 用量记录。美元列按照官方参考价 **1 credit = 0.01 美元**折算，**不是实际扣费金额**；实际费用取决于套餐、额度及账单。Decision Router 的 Azure 分类器 Token 和 Azure 费用**不包含在内**，且该路由器未报告这些数值；请单独检查 Azure 用量/账单。路由器显示的 `$0.002000` 是基于 10,000 输入和 2,000 输出 Token 的**执行前估算**，不是实测账单。首次路由尝试曾超时；表中的成功运行和任何重试均可能产生额外 Azure 费用。

复现时，先完成下一节可选路由器配置。然后在相同工作目录使用同一提示词运行下列命令，生成的 JSON 文件仅保存在本机：

```bash
TASK='In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.'
copilot --model auto --no-custom-instructions -p "$TASK" --usage-output-file auto-usage.json
copilot --model gpt-6.1-sol --no-custom-instructions -p "$TASK" --usage-output-file sol-usage.json
copilot --model gpt-6.1-terra --no-custom-instructions -p "$TASK" --usage-output-file terra-usage.json
```

在路由器目录中使用相同的 `TASK`，并用 `-C` 指向同一项目。请替换为自己的路径：

```bash
npm start -- -C /path/to/ordering-workshop -p "$TASK" -- --no-custom-instructions --usage-output-file /path/to/decision-usage.json
```

此终端中也需先定义 `TASK`。路由器的 `-C` 指向执行工作区，不是路由器本身目录。比较各用量 JSON 的实际模型、输入、输出、缓存和 `totalNanoAiu`（除以十亿得到 credits）；`lab1/code/compare_usage.py` 可输出表格，`usage-example/` 包含本次运行脱敏后的数据。生成的测试建议必须对照实际代码审核：例如部分回答建议检查表单校验，但示例结账并没有表单。选型前应在可比的缓存条件下多次运行，并执行真实验收测试。

## 4. 课后可选：Microsoft-Decision-1 与 Decision Router

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
