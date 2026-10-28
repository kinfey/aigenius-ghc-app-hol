# 實驗三：在畫布中完成 MCP 引導式點餐

[English](https://kinfey.github.io/aigenius-ghc-app-hol/lab3/) · [简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab3/zh.html) · [實驗二](../lab2/traditional.html) · [工作坊首頁](../traditional.html)

**目標：**基於實驗二應用程式實作逐步引導的真實 MCP 點餐流程，並在 Copilot App 現有的 **Browser 畫布**中開啟。用時 **25 分鐘**；整個課程共 **60 分鐘**：實驗一 20 分鐘 + 實驗二 15 分鐘 + 實驗三 25 分鐘。

**已實作內容：**應用程式、Python MCP 介接器、引導介面、測試和擷取畫面均已提供。預設入口查詢真實服務，失敗時不退回模擬商品或價格。這是 Browser 畫布中的 Web 應用程式，**不是註冊了專用 actions 的 SDK 自訂畫布擴充功能**；Markdown 流程文件也不等於可操作應用程式。

**課堂停止點：**核對真實報價，不建立訂單。應用程式另有單獨確認的真實下單入口，但課程完成不要求購買或付費，付款始終由使用者自行操作。

## 0. 課前準備與時間安排

安裝軟體、還原相依套件、登入 Copilot、啟用 MCP 以及私下設定 Token 均在 60 分鐘課堂之前完成。需要 Python 3.11+、Node.js 22.16+、Microsoft Edge，以及你自己的中國大陸麥當勞帳戶。服務與參數可能變動，以即時 schema 為準。

繼續使用實驗一、二的同一應用程式工作區。參考實作統一維護在 [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code)，不重複建立 `lab3/code`。

| 本實驗時間 | 內容 |
| --- | --- |
| 0–5 分鐘 | 檢查產生的程式碼，啟動應用程式並開啟 Browser 畫布 |
| 5–10 分鐘 | 連接 MCP，選擇用餐方式、必要的地址和門市 |
| 10–18 分鐘 | 查看真實選單，選擇餐點/搭配並請求核價 |
| 18–22 分鐘 | 不購買，檢查確認、過期、修改與結果不確定的處理 |
| 22–25 分鐘 | 執行預先提供的檢查，查看手機版面配置並記錄結果 |

## 1. 擴充實驗二應用程式並執行

在現有 Copilot App 專案工作階段中提交以下實作提示詞：

> 擴充實驗二的 React/TypeScript 與 Python 應用程式，不要另建不相連的示範。實作真實 MCP 引導式點餐：連線 → 用餐方式 → 配送時選擇既有地址 → 門市 → 選單/詳細資料/套餐搭配 → 可用優惠/餐具/備註 → 即時核價 → 單獨可選的真實下單確認 → 使用者手動付款與狀態查詢。探索並驗證即時工具 schema，不編造商品和價格，不向瀏覽器暴露 Token。每次真實建立必須對應新的、單次使用的報價確認；結果不確定時禁止重試。帳戶資料只放在本機伺服器記憶體中。補充離線傳輸層和介面測試、執行命令。在現有 Browser 畫布開啟執行中的應用程式，不要只建立 Markdown 文件。

先審核產生的檔案再核准執行。本儲存庫已包含實際產生的實作，60 分鐘課堂可以直接檢查和擴充，而不是從零逐行撰寫。

在 `lab2/code` 中於課前準備相依套件：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --index-url https://packagefeedproxy.microsoft.io/pypi/simple/ -r requirements.txt
npm install
```

參考 `.env.example` 私下建立被忽略的 `.env`，限制權限（macOS/Linux 使用 `chmod 600 .env`），填入你自己的 `MCD_MCP_TOKEN`。不要貼到聊天、擷取畫面或前端程式碼中，也不要提交 `.env`。然後啟動 API：

```bash
.venv/bin/python -m uvicorn backend.app:app --env-file .env --host 127.0.0.1 --port 8000
```

在同一目錄的第二個終端機執行：

```bash
npm run dev
```

讓 Copilot 在現有 **Browser 畫布**開啟 `http://127.0.0.1:5173/`；需要時在 Edge 開啟同一位址。兩個服務僅接聽本機回送位址。GitHub Pages 發布的是本教學和擷取畫面，**不承載 Python API 或帶帳戶認證資訊的點餐服務**。

Copilot App 的 `mcd-mcp` 與 Python 後端是獨立用戶端，應用程式不會自動繼承 App 的 Token。`OFFERS_MODE` 僅控制舊版實驗二優惠介面，不控制真實點餐精靈。舊模擬介面隔離在 `/?demo=1`，本實驗不使用它。

## 2. 連線並選擇真實門市

以下按鈕名稱及確認文字保留應用程式的簡體中文原文，以便對照現有介面；繁體中文支援範圍為教學文件與 GitHub Pages。

1. 點選「连接并发现工具」，確認真實工具清單，再點選「开始引导」。
2. 選擇「到店自取」或「麦乐送配送」。到店可查詢收藏門市，或填寫城市和位置關鍵字；配送先明確點選「读取我的配送地址」，選擇一個既有地址，再查詢可配送門市。
3. 選擇服務傳回的門市並載入實際選單，不編造門市、地址或商品 ID。如果沒有已儲存地址，請先在麥當勞 App 私下新增；此應用程式不新增地址。
4. 驗證失敗、服務無法使用或 schema 不相容時，檢查可見錯誤並修正設定，不能悄悄切換到範例資料。

![真實 MCP 連線與工具探索](images/live-mcp-connection.png)
*同一應用程式在 Edge 中的實際擷取畫面，也可在 Browser 畫布執行。拍攝時探索到 9 個點餐工具，數量可能變動；未展示 Token 或帳戶資料。*

| 階段 | 使用的 MCP 工具 |
| --- | --- |
| 到店門市 | `query-nearby-stores` |
| 配送地址與可配送門市 | `delivery-query-addresses`、`delivery-query-stores` |
| 選單與餐點設定 | `query-meals`、`query-meal-detail` |
| 門市優惠 | `query-store-coupons` |
| 服務方核價 | `calculate-price` |
| 可選且單獨確認的建立 | `create-order` |
| 實際訂單狀態 | `query-order` |

到店使用 `beType=1`、`orderType=1`，不傳 `beCode`。配送使用 `beType=2`、`orderType=2`，並傳入所選門市實際傳回的 `beCode`；建立訂單還需要所選 `addressId`。

## 3. 選擇餐點、檢查搭配並核價

1. 搜尋想吃的餐點，例如輸入服務使用的名稱「巨无霸」，或按傳回的選單分類篩選。選擇實際傳回的商品，查詢詳細資料。
2. 檢查預設套餐搭配，選擇支援的替換項目和數量，再加入餐籃。目前精靈使用預設特調；複雜或無法識別的設定請使用麥當勞 App。
3. 查詢門市可用優惠，只有與餐點對應的服務傳回優惠記錄才能選擇。查詢不等於領券，優惠是否生效必須以核價結果為準。
4. 確認餐籃，選擇是否需要餐具；配送可填寫不超過 50 字的備註。點選「请求 MCP 实时核价」。
5. 核對服務傳回內容、用餐方式、門市、配送地址、餐點和費用。選單 `currentPrice` 字串以元為單位；最終核價傳回的數值價格/金額/費用欄位以分為單位，介面同時顯示元換算結果。

![支援分類與名稱搜尋的真實選單](images/live-menu-desktop.png)
*服務實際傳回的到店選單，不是離線測試資料。餐點和價格隨帳號、門市、時間變動，擷取畫面不是優惠承諾或價格保證。*

### 練習：「我想要一個大麥克」

記錄中的早餐時段，所選配送門市傳回了 **60 個真實餐點**，但沒有大麥克（服務名稱為「巨无霸」）。正確行為是提示目前門市/時段的結果中未找到，保持餐籃不變，讓使用者查看販售中的餐點，或到官方 App 選擇其他時段。不要編造大麥克編碼，也不要聲稱已購買。以下擷取畫面用實際到店選單重現了未找到的引導。

![目前真實選單未傳回大麥克](images/live-big-mac-unavailable.png)
*擷取畫面反映拍攝時的即時結果，不代表所有門市、所有時段都不販售該商品。*

### 選單剖析問題與實際產生的修復

服務把分類參照和商品詳細資料分開放置：

```text
data.categories[].meals[].code  →  data.meals[code]
```

產生的程式碼中的 [`menu_records`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/backend/ordering.py) 關聯兩者，保留分類和標籤，並去除重複商品。商品編碼來自字典索引鍵，不要求詳細資料值再次攜帶編碼。對應缺失時顯示錯誤，不拼造選單。

```python
code = str(entry["code"])
meal = meals.get(code)
# 驗證服務傳回的對應後：
normalized[code] = {
    **meal,
    "productCode": code,
    "categories": [],
    "tags": [],
}
```

## 4. 核對、停止，或單獨確認一次下單

課堂練習**停在價格核對頁面**。使用下方離線測試示範確認介面，不要求真實購買。

只有當你自行決定購買並接受可能產生的費用時，才開啟真實下單確認區、勾選確認、輸入應用程式要求的原文「确认创建真实订单」，最後點選建立按鈕。到店還必須選擇核價 `takeWayList` 傳回的 `takeWayCode`。這個確認不代表授權付款。

伺服器檢查目前報價 ID、明確確認和 5 分鐘有效期限。修改訂單會使報價失效；工作階段鎖和已使用的提交狀態防止連按兩下、並行重複建立。提交失敗或結果不確定後不自動重試，應先去麥當勞 App 核實，或使用已取得的訂單號碼查詢。

![價格核對與單獨建立確認：離線測試擷取畫面](images/confirmation-offline-test.png)
*頂部明確標示離線 Playwright 測試資料，其中地址、餐點和金額均為測試內容。此圖只證明確認關卡的介面，不是真實報價、真實下單成功或付款成功的證據。*

如果你確實建立了真實訂單，由你自行開啟可識別的服務方付款連結或麥當勞 App 並決定是否付款，應用程式不提交付款。點選「我已支付 / 支付失败，查询实际状态」會呼叫 `query-order`；產生付款連結永遠不等於付款成功。

## 5. 產生的程式碼與驗證

以下完整實作檔案均包含在儲存庫中：

| `lab2/code` 下的檔案 | 職責 |
| --- | --- |
| [`src/LiveOrdering.tsx`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/src/LiveOrdering.tsx)、`src/live.css` | 分步精靈、真實結果、選單搜尋、確認和手動付款交接 |
| `src/main.tsx` | 預設進入真實應用程式，舊模擬介面需要明確指定 `?demo=1` |
| [`backend/ordering.py`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/backend/ordering.py)、`backend/app.py` | MCP 連線/schema 驗證、回應整理、工作階段狀態、報價繫結及單次建立 |
| `backend/test_ordering.py`、`backend/test_app.py` | 隔離傳輸層測試、用餐限制、過期、重播防護與失敗處理 |
| `tests/live.spec.ts`、`tests/workflow.spec.ts`、`playwright.config.ts` | 離線瀏覽器/業務迴歸與響應式版面配置 |
| `scripts/capture-live.mjs` | 真實連線/選單的安全擷取畫面；拒絕地址讀取、建立訂單和訂單狀態操作 |
| `.env.example`、`requirements.txt`、`package.json`、[`README.md`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/README.md) | 私密設定範例、相依套件和完整執行說明 |

在 `lab2/code` 執行：

```bash
.venv/bin/python -m unittest backend.test_app backend.test_ordering
npm run test:ui
npm run build
```

目前包含 **16 個後端測試和 17 個瀏覽器/業務測試**。測試用隔離資料替換真實呼叫，包括建立訂單，不會真實下單。另外已單獨核實真實連線、既有地址讀取和選單載入，均未建立訂單。擷取畫面**不聲稱**真實核價、真實下單或付款已經成功。

![390 像素手機端即時未找到提示](images/live-mobile.png)
*實際 Edge 手機尺寸擷取畫面。進度列在自身區域捲動，頁面無橫向溢位。*

重現發布擷取畫面：

```bash
# 需要已啟動的本機 API/前端和私下設定的伺服器端認證資訊。
# 實際查詢工具與公開位置的到店選單，不讀取地址、不下單。
node scripts/capture-live.mjs

# 完全離線測試，產生明確標示的確認關卡擷取畫面。
CAPTURE_LAB3=1 npm run test:ui -- tests/live.spec.ts -g "guided real entry"
```

真實擷取畫面指令碼預設使用公開位置範例。可用 `CAPTURE_CITY` 和 `CAPTURE_KEYWORD` 換為另一個公開位置；若目前選單變動，應調整「未找到餐點」的擷取畫面預期。發布前逐張檢查，絕不擷取真實地址、私人優惠券、Token、訂單或付款 URL。

## 隱私、邊界與完成標準

帳號資料僅在本機 Python 處理程序中使用，透過 HttpOnly SameSite Cookie 隔離，閒置 2 小時過期。重新整理可還原同一伺服器端工作階段，重新啟動伺服器會遺失工作階段；重新啟動或下單結果不確定後，應先在官方 App 核實，再考慮另建訂單。不要把這個單帳號教學服務暴露到不可信網路。

目前範圍為即時到店/配送、既有地址、一般餐點及可識別套餐組、相符優惠、預設特調、餐具和配送備註。預約、自訂特調、團餐/得來速、新增地址、領券、會員購買和取消訂單不屬於本次限時實驗。

當 Browser 畫布中能執行真實精靈，空白結果/未販售/錯誤都如實顯示，理解選單關聯方式，預先提供的確認測試通過，且不要求購買時，本實驗完成。

**課後選修：**SDK 自訂畫布擴充功能是另一個交付目標。在具備能力的工作階段中按照[官方畫布擴充功能文件](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions)和已安裝 `/create-canvas` 技能執行 guide、scaffold、reload 與驗證。不要把本 Browser 應用程式或 Markdown 流程圖標成已註冊的自訂擴充功能。
