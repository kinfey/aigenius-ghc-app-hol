# 實驗一：建置點餐應用程式並選擇模型

[English](https://kinfey.github.io/aigenius-ghc-app-hol/lab1/) · [简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab1/zh.html) · [工作坊首頁](../traditional.html) · [下一步：實驗二](../lab2/traditional.html)

**目標：**建置並檢查適用於電腦、平板和手機的本機全端點餐原型，並用同一個小任務比較 **Auto 與只使用 GPT-6 Luna（`gpt-6-luna`）**。用時 **20 分鐘**，屬於 **60 分鐘課程**的一部分（20 + 15 + 25）。

**限時路線：**0–3 分鐘檢查課前已安裝的起始專案；3–12 分鐘使用 Auto 規劃並實作一項範圍明確的 UI/API 改進；12–17 分鐘檢查響應式版面配置、結帳並執行針對性測試；17–20 分鐘用相同的簡短規劃提示詞分別執行 Auto 與固定 GPT-6 Luna，比較實際記錄。安裝和還原相依套件在課前完成。產生程式碼耗時過長時，以 [`lab1/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab1/code) 為備用基準。下方從零實作步驟保留為參考；多輪基準測試和第 4 節 Decision Router/Azure 部署均為**課後延伸**，不計入這 20 分鐘。

![在瀏覽器中擷取的 Copilot App 工作階段官方文件](images/copilot-sessions-doc.png)
*參考：[GitHub 工作階段文件](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)。實際介面可能隨版本變動。*

## 1. 準備工作區

1. 安裝 Git、Node.js 22.16 以上、Edge 和 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)。登入並確認帳號有 Copilot 權限。
2. 課前建立本機資料夾 `ordering-workshop` 並執行 `git init`；採用限時路線時提前準備好起始程式碼。Git 用於版本管理和選修的課後 SDK 擴充功能，實驗三現有 Browser 畫布不要求開發這類擴充功能。不要在本教學儲存庫內巢狀建立學習專案。在 Copilot App 中選擇 **Sessions → New → Open local folder**，選取該資料夾；檢查內容後再授予信任。
3. 在輸入框下選擇 **Plan** 模式，然後在模型選擇器中選擇 **Auto**。Auto 根據任務選擇可用模型；選擇器會顯示回應所用的模型。介面、模型和計費取決於帳號及原則。
4. 向 Copilot 提交：

   > 請規劃一個點餐應用程式：前端使用 React/Vite TypeScript，後端使用 Python FastAPI，放在同一本機工作區。使用模擬商品與價格、購物車和模擬結帳。適用於手機、平板、電腦；支援鍵盤操作以及載入、空白狀態和錯誤狀態。提供測試計畫與準確執行命令。不要連接真實服務，也不要把金鑰放到前端。

5. 審核計畫後再核准。如未區分瀏覽器 UI 和伺服器，請先要求修改。切換 **Interactive** 模式，請 Copilot 按計畫實作、執行測試並回報準確命令與連接埠。審核檔案變更，逐項核准工具呼叫，不要一鍵放行所有操作。
6. 安裝相依套件時使用 `https://packagefeedproxy.microsoft.io/npm/` 作為 npm 來源，使用 `https://packagefeedproxy.microsoft.io/pypi/simple/` 作為 PyPI 來源；請 Copilot 為專案設定並安裝相依套件。不要把認證資訊貼到對話中。

已完成的範例位於 [`lab1/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab1/code)，其 README 包含安裝和執行命令。以下是實作過程中的真實 Copilot App 擷取畫面；為保護其他工作階段，已裁剪側欄。

![Copilot App 展示實驗一範例及實作活動](images/copilot-build.png)

## 2. 執行並檢查應用程式

1. 讓 Copilot 使用產生的命令啟動 API 和前端開發伺服器。可以開啟 App 內瀏覽器畫布，同時在 Edge 開啟本機前端位址。僅在實驗期間保持伺服器執行。
2. 在 Edge 開啟開發人員工具（`F12` 或 `Cmd+Option+I`），啟用裝置模擬，分別檢查 **390 × 844**、**768 × 1024** 和 **1440 × 900**。每種尺寸均新增、刪除商品，查看購物車並完成**模擬**結帳。不得出現橫向溢位或無法操作的控制項。
3. 暫停 API 後重新整理或發出請求：頁面應顯示錯誤並允許重試，而不是編造資料。隨後重新啟動 API。
4. 請 Copilot 執行產生的測試套件並修復迴歸問題。將準確命令和結果記在個人筆記中；不要提交包含個人資訊的擷取畫面。

以下擷取畫面來自實際執行的實驗一 Python 後端和 React 應用程式，使用 Microsoft Edge 分別展示電腦、平板和手機版面配置：

![1440 像素電腦選單](images/edge-desktop.png)
![768 像素平板選單](images/edge-tablet.png)
![390 像素手機選單](images/edge-phone.png)

新增兩個模擬商品後，購物車與模擬結帳介面如下：

![新增商品後的購物車](images/edge-cart.png)
![模擬結帳確認](images/edge-checkout.png)

## 3. 比較 Auto 與只使用 GPT-6 Luna

Copilot App 將 Agent、工作區、工具、模式和模型選擇器組合在一起：Agent 可檢查檔案、修改程式碼、執行測試並在畫布展示結果，使用者仍負責審核操作。**Auto** 與下方路由器不是同一功能。

1. 在相同專案中建立全新 App 工作階段並選擇 **Auto**，提交下方不含敏感資訊的簡短規劃提示詞，不使用工具、不修改程式碼。
2. 針對未變更的同一基準建立另一個工作階段，在 App 模型選擇器中明確選擇 **GPT-6 Luna**，不要選擇 Auto 或 Decision Router。提交完全相同的提示詞後，核實實際執行模型為 `gpt-6-luna`。第二組不要繼承第一組答案。如果帳號未提供該模型，記錄「無法使用」，不要悄悄替換。
3. 記錄兩組回答、實際模型、可取得的輸入/輸出/快取用量、API 時間及點數，並對照應用程式與測試檢查建議。App 與獨立 CLI 是不同執行入口；以下 CLI 命令重現的是 CLI 實測，不是操作 App 模型選擇器。更複雜任務、多輪測量和路由器比較放在課後。
4. 節省用量：明確驗收條件，大幅變更先規劃，先執行針對性測試，避免重複傳送大型檔案，內容過時時建立新工作階段。內容大小、工具呼叫、重試、模型與輸出長度均可能影響成本。參閱 [Copilot 計費說明](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)。

### 新增實測：Auto 與固定 GPT-6 Luna

2026 年 10 月 28 日，在相同乾淨工作目錄啟動兩個全新的獨立 CLI 工作階段，停用自訂指示和內建 MCP，使用完全相同的下列提示詞。兩組均未呼叫工具或修改程式碼。固定組直接使用 `--model gpt-6-luna`，不經過 Decision Router 或 Azure 分類器：

> In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.

| 選擇 | 實際執行模型 | 輸入 Token | 輸出 Token | 快取讀取 Token | Copilot AI Credits | 模型 API 時間 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Auto | GPT-6 Luna | 14,559 | 119 | 0 | 0.1691370 | 3.973 秒 |
| 只使用固定 GPT-6 Luna | GPT-6 Luna | 14,593 | 137 | 9,321 | 0.0820635 | 4.648 秒 |

![真實 Auto 與固定 Luna CLI 用量記錄的去識別化摘要](images/auto-luna-comparison.png)
*由真實、已去識別化的 CLI 用量 JSON 轉譯的摘要圖，不是 App 模型選擇器擷取畫面。不包含工作階段 ID、含私人資料的提示詞或認證資訊。*

**如何理解：**本任務中 Auto 實際選中了 Luna，固定組則明確鎖定 Luna。兩組都涵蓋了響應式、餐籃和結帳檢查；固定組明確提到不觸發真實付款。不過，兩組都建議驗證結帳輸入，而範例結帳只是沒有輸入表單的確認對話方塊，因此都需要人工修正。不能據此判定品質勝負，也不能當作程式撰寫基準。

固定組讀取了 9,321 個快取 Token，Auto 沒有快取讀取。因此，較低的記錄點數**不能證明固定 Luna 天生比 Auto 便宜**。API 時間不是端對端耗時，點數也不是最終帳單。這兩組屬於新的獨立樣本，不要與下方舊四組資料混成受控排名。

無需安裝選修路由器即可重現：

```bash
TASK='In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.'
copilot --model auto --no-custom-instructions --no-auto-update --disable-builtin-mcps --disable-mcp-server mcd-mcp --no-ask-user -p "$TASK" --usage-output-file auto-usage.json
copilot --model gpt-6-luna --no-custom-instructions --no-auto-update --disable-builtin-mcps --disable-mcp-server mcd-mcp --no-ask-user -p "$TASK" --usage-output-file luna-usage.json
```

原始記錄僅私下保留。在 `lab1/code` 中查看已提供的去識別化資料：

```bash
python3 compare_usage.py Auto=usage-example/auto-vs-luna-auto.json FixedLuna=usage-example/auto-vs-luna-fixed.json
```

### 課後歷史參考：Auto、Decision Router、Sol 與 Terra

以下是 2026 年 10 月 28 日的一次真實示範：四組使用**同一條不含敏感資訊的提示詞**、相同工作目錄和 `--no-custom-instructions`，每次建立新的 CLI 工作階段。Decision 組使用下一節私人路由器的**啟動時路由**與 Azure 分類器，並不是 App 模型選擇器的整合。提示詞為：

> In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.

| 選擇 | 實際執行模型 | 輸入 Token | 輸出 Token | 快取讀取 Token | Copilot AI Credits | 按點數換算美元 | 模型 API 時間 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Auto | GPT-6 Luna | 14,919 | 130 | 0 | 0.173682 | $0.001737 | 4.313 秒 |
| Decision Router | GPT-6 Luna | 15,169 | 128 | 9,654 | 0.084984 | $0.000850 | 5.719 秒 |
| GPT-6.1 Sol | GPT-6.1 Sol | 15,170 | 104 | 0 | 3.896350 | $0.038964 | 4.475 秒 |
| GPT-6.1 Terra | GPT-6.1 Terra | 15,149 | 74 | 0 | 1.930550 | $0.019306 | 3.145 秒 |

![Copilot App 終端機中顯示的四組真實用量記錄](images/copilot-usage-comparison.png)

**如何理解：**這只是一條小型測試計畫任務的一次執行，不是基準測試。輸入包含 Agent 內容；快取讀取 Token 已包含在輸入中，不要重複相加。Decision 組讀取了 9,654 個快取輸入 Token，其他組沒有，因此不能把這次較低的 Copilot 用量**僅歸因於路由**。API 時間不是端對端耗時，也不含分類器時間。本次 Auto 和 Decision 都選擇了 Luna，後續可能不同。Sol 和 Terra 可用於嘗試更深入的分析或複雜實作，但必須在自己的任務上驗證品質，不能直接斷定誰更優。

上表點數來自 CLI 用量記錄。美元欄按照官方參考價 **1 credit = 0.01 美元**換算，**不是實際扣款金額**；實際費用取決於方案、額度及帳單。Decision Router 的 Azure 分類器 Token 和 Azure 費用**不包含在內**，且該路由器未回報這些數值；請單獨檢查 Azure 用量/帳單。路由器顯示的 `$0.002000` 是基於 10,000 輸入和 2,000 輸出 Token 的**執行前估算**，不是實測帳單。首次路由嘗試曾逾時；表中的成功執行和任何重試均可能產生額外 Azure 費用。

重現時，先完成下一節選修路由器設定。然後在相同工作目錄使用同一提示詞執行下列命令，產生的 JSON 檔案僅儲存在本機：

```bash
TASK='In three concise bullets, propose a test plan for a responsive ordering app that includes menu, cart, and simulated checkout. Do not use tools.'
copilot --model auto --no-custom-instructions -p "$TASK" --usage-output-file auto-usage.json
copilot --model gpt-6.1-sol --no-custom-instructions -p "$TASK" --usage-output-file sol-usage.json
copilot --model gpt-6.1-terra --no-custom-instructions -p "$TASK" --usage-output-file terra-usage.json
```

在路由器目錄中使用相同的 `TASK`，並用 `-C` 指向同一專案。請替換為自己的路徑：

```bash
npm start -- -C /path/to/ordering-workshop -p "$TASK" -- --no-custom-instructions --usage-output-file /path/to/decision-usage.json
```

此終端機中也需先定義 `TASK`。路由器的 `-C` 指向執行工作區，不是路由器本身目錄。比較各用量 JSON 的實際模型、輸入、輸出、快取和 `totalNanoAiu`（除以十億得到 credits）；`lab1/code/compare_usage.py` 可輸出表格，`usage-example/` 包含本次執行去識別化後的資料。產生的測試建議必須對照實際程式碼審核：例如部分回答建議檢查表單驗證，但範例結帳並沒有表單。選型前應在可比較的快取條件下多次執行，並執行真實驗收測試。

## 4. 課後選修：Microsoft-Decision-1 與 Decision Router

**重要：**私人路由器儲存庫目前記錄的是實驗性的 **Copilot CLI** 原生擴充功能，並沒有驗證 Copilot App 的模型選擇器支援該路由器。以下步驟在獨立終端機中針對同一專案執行；其餘實驗繼續使用 App。不要聲稱 CLI 路由會自動設定或路由 App 工作階段。若無法存取路由器，可直接繼續使用 Auto。

1. 開啟 [Microsoft Foundry](https://ai.azure.com/) 自己的專案 → **Model catalog** → **Microsoft-Decision-1** → **Deploy**。部署名稱使用 `Decision-1` 或記錄實際名稱。可用性、配額、權限和價格因環境而異。從部署詳細資料取得自己的資源端點和金鑰。參考[官方指南](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision)。
2. 擁有私人儲存庫權限後，在應用程式資料夾**之外**複製儲存庫。若無權限，聯絡儲存庫擁有者；不要將私人原始碼複製到本公開教學。終端機執行：

   ```bash
   gh repo clone kinfey/decision-ghc-router
   cd decision-ghc-router
   npm install --registry=https://packagefeedproxy.microsoft.io/npm/
   cp -n .env.example .env
   chmod 600 .env
   ```

3. 私下編輯路由器的 `.env`，不要傳到對話或擷取畫面：

   ```dotenv
   JEV_PROVIDER=azure
   AZURE_DECISION_ENDPOINT=https://<your-resource>.services.ai.azure.com/providers/microsoft/v1/systemone
   AZURE_DECISION_API_KEY=<your-own-key>
   AZURE_DECISION_MODEL=Decision-1
   JEV_FALLBACK_CHEAPEST=0
   ```

   如果部署名稱不同，請改成實際名稱。不要提交 `.env`，也不要讓 Copilot 讀取它。分類器接收任務文字和候選模型中繼資料，提示詞中不要放金鑰或個人資訊。
4. 安裝使用者層級擴充功能並啟動儲存庫文件指定的實驗性 CLI：

   ```bash
   npm run install:router
   npm run router
   ```

   審核後僅接受所需的目錄信任和 `user:decision-router` hook 權限。在 CLI 選擇 `/model` → **Decision Router**，或輸入 `/model decision/router`。提交不含敏感資訊的測試任務，查看顯示的執行模型與估算費用。用 `/model` 選擇一般模型可略過路由器。
5. 如需在新 CLI 工作階段中操作點餐專案，先按上述步驟安裝，再切換到專案目錄，執行 `COPILOT_ALLOW_GET_PROVIDER_ENDPOINT=true copilot --experimental` 並選擇路由器。保留複製的路由器目錄。以後可在該目錄執行 `npm run uninstall:router`，重新啟動 CLI 後解除安裝。
6. 將任務、所選模型、估算和結果與 Auto 實驗比較。Decision-1 只做**分類**，實際任務仍由 Copilot 模型執行。Azure 分類和 Copilot 執行分別計費。路由估算不包含重試、後續工具呼叫等費用；自訂提供者的顯示值及 CLI 用量計數不是可靠的帳單上限。請查看 GitHub 和 Azure 帳單。

如未出現路由器，檢查 Node 版本、私人儲存庫權限、CLI 實驗模式、hook 權限及[路由器說明](https://github.com/kinfey/decision-ghc-router)。認證資訊缺失、網路錯誤或信賴度不足會明確報錯，不要透過分享金鑰來略過問題。

## 擷取畫面與完成標準

自行擷取並去識別化：(1) Copilot App 中的計畫、Auto/固定 Luna 的選擇與回答；(2) Edge 中三個檢視區尺寸；(3) 選修的 Foundry 部署詳細資料（隱藏端點和金鑰）及 CLI 路由器選擇。上方參考圖片不能替代這些擷取畫面。

當三個尺寸均可使用、API 離線時 UI 能提示錯誤、測試通過、結帳為模擬模式，並記錄同提示詞的 Auto/固定 Luna 比較（或註明模型無法使用）後，即可保留專案並進入[實驗二](../lab2/traditional.html)。
