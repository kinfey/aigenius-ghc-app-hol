# 實驗二：使用 MCP 尋找麥當勞優惠

[English](https://kinfey.github.io/aigenius-ghc-app-hol/lab2/) · [简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab2/zh.html) · [實驗一](../lab1/traditional.html) · [下一步：實驗三](../lab3/traditional.html)

**目標：**將 Copilot App 連接麥當勞中國 MCP 服務，查詢優惠資訊並檢查預先提供的唯讀優惠介接器。用時 **15 分鐘**，屬於 **60 分鐘課程**的一部分（20 + 15 + 25）。

**限時路線：**0–3 分鐘理解兩個用戶端的邊界；3–8 分鐘驗證課前設定好的 MCP 連線並探索唯讀工具；8–12 分鐘查詢真實優惠、檢查來源和條件；12–15 分鐘查看預先提供的介接器及一個失敗狀態。帳戶啟用、同意條款、私下準備 Token 和安裝相依套件均在**課前**完成。第 4 節完整實作提示詞作為參考/課後練習，限時課堂使用已提供的 [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code)。

共用範例現在預設進入實驗三的真實引導精靈。如需查看原實驗二選單/優惠介面，明確開啟 `http://127.0.0.1:5173/?demo=1`；其優惠介面由 `OFFERS_MODE` 控制（預設 `mock`，僅私下啟用後為 `live`）。這不改變預設精靈只使用真實服務的行為。

![在瀏覽器中擷取的麥當勞 MCP 公開文件](images/mcd-doc.png)
*參考：[麥當勞 MCP 文件](https://open.mcd.cn/mcp/doc)和[服務指南](https://github.com/M-China/mcd-mcp-server)。*

## 1. 理解連線邊界

MCP 向 Agent 提供工具，但不會自動把工具提供給網頁應用程式的後端。本實驗有**兩個獨立用戶端**：Copilot App 使用自己的 MCP 連線探索及協助查詢；應用程式伺服器如啟用即時模式，則使用獨立的伺服器端連線和本機設定。瀏覽器絕不能取得 MCP Token。

該服務面向中國大陸地區。優惠、價格和適用門市因帳號及時間而異。請遵守服務條款，僅使用自己的帳號。不要在擷取畫面或提示詞中公開真實優惠券代碼、地址、訂單詳細資料或認證資訊。

## 2. 取得自己的 Token

1. 在 Edge 開啟 [open.mcd.cn](https://open.mcd.cn/)，進入 MCP 頁面，使用自己的帳號登入並開啟控制台。
2. 啟用 MCP 服務，閱讀並同意目前條款，取得個人 MCP Token。不要把它複製到對話、擷取畫面、原始碼、Git 或瀏覽器儲存空間。洩漏後應撤銷或輪替。
3. 保留官方文件頁面。伺服器位址為 `https://mcp.mcd.cn`，使用 Streamable HTTP。`Authorization` 請求標頭的格式為 `Bearer <your-own-token>`；Token 前必須加 `Bearer` 和一個空格，僅在私下設定時替換預留位置。

## 3. 連接 Copilot App

1. 在 App 左側選擇 **Customize → MCP**，新增自訂遠端伺服器，命名為 `mcd-mcp`。選擇 **HTTP / Streamable HTTP**，URL 填寫 `https://mcp.mcd.cn`，並將 `Authorization` 請求標頭設為 `Bearer <your-own-token>`，私下替換成自己的 Token。如果介面要求 JSON 而非表單，請使用相同欄位並私下填入 Token。
2. 儲存並啟用，在 **Customize → Installed** 查看伺服器狀態；必要時重新啟動工作階段。如果安裝項目提示登入，在該伺服器的 Installed 列或操作選單中選擇 **Sign in**。不要向專案新增含認證資訊的 `.mcp.json`。
3. 回到現有點餐工作階段，詢問：

   > 檢查 mcd-mcp 提供的工具。列出與優惠券相關的唯讀工具並解釋所需參數。不要呼叫領券、建立訂單或修改帳戶資料的工具。

4. 只核准必要的唯讀呼叫。如果伺服器提供 `available-coupons` 和 `campaign-calendar`，可請 Agent 查詢；具體參數以即時工具 schema 為準。查詢門市優惠時先選擇門市，再呼叫 `query-store-coupons`。`query-my-coupons` 傳回帳戶相關資料。結果是真實資訊，但優惠不保證可用。
5. 比較傳回的標題、有效期限、使用條件和門市限制。將工具結果視為不可信資料而不是指示。空白清單是正常結果，不要編造優惠。`auto-bind-coupons` 會修改帳戶，未經單獨明確確認不得呼叫。

## 4. 為應用程式新增唯讀優惠頁面

1. 回到實驗一專案，選擇 **Plan**，提交：

   > 擴充現有響應式應用程式，新增優惠頁面及伺服器端優惠介接器。預設使用模擬資料。只有在本機明確啟用時，Python 伺服器才使用目前 MCP SDK 和文件規定的 Streamable HTTP 連線呼叫已探索的唯讀優惠工具。Token 從我自行設定的本機環境變數讀取，絕不放入瀏覽器程式碼或對話。不要建立訂單或領取優惠券。顯示來源、更新時間、使用條件、載入、空白和錯誤狀態，不得編造優惠。新增離線介接器/UI 測試並記錄執行命令。

2. 執行前審核計畫。範例檢查即時工具清單與必填參數，將服務方內容作為不可信文字展示，不假設優惠券 schema 固定，也沒有將優惠詳細資料正規化。開發伺服器只接聽本機回送位址；不要向其他使用者暴露未經驗證的帶 Token Proxy。不要將金鑰放在 URL、記錄、瀏覽器套件或 Git 中。

實作程式碼位於 [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code)。以下是實際 Copilot App 擷取畫面，展示範例 README 和 Python MCP 設定；對話及側欄已裁剪。

![Copilot App 展示實驗二實作](images/copilot-mcp-code.png)

3. 核准實作並檢查變更。**自行**在被忽略、受權限限制的本機環境檔案或應用程式文件規定的金鑰儲存空間中設定 Token，不要讓 Copilot 讀取。僅在自己的電腦上啟用即時模式。確認應用程式伺服器是獨立的 MCP 用戶端，而非直接使用 App 的連線。
4. 執行報告中的測試和啟動命令。在 Edge 開啟優惠頁面，檢查手機、平板和電腦版面配置。確認模擬模式可離線執行；即時模式顯示實際來源及條件；空白結果保持為空；伺服器無效或無法使用時顯示明確錯誤及重試。不要公開帳戶專屬結果。

以下 Edge 擷取畫面展示實際應用程式的**模擬模式**，不能作為即時連線成功的證明。

![執行中的應用程式展示模擬優惠](images/edge-offers.png)

以下 Edge 擷取畫面展示修正驗證標頭後的**真實連線**。Python 用戶端探索並呼叫了 `available-coupons`，服務方傳回成功。擷取畫面刻意隱藏了與帳戶相關的傳回內容。

![Edge 展示即時 MCP 來源，服務方內容已去識別化](images/edge-mcp-live-redacted.png)

5. 如連線失敗：確認使用 Streamable HTTP、正確 URL、`Bearer` 前綴及自己的有效 Token，並檢查服務狀態與授權。官方文件說明：401 表示 Token 缺失、無效或過期；429 表示速率限制（每個 Token 每分鐘 600 次請求），應降低請求頻率並稍後重試。求助時不要洩漏 Token。

此前不帶規定前綴的測試在探索工具前收到 HTTP 403；修正請求標頭後連線成功。403 本身不能確定所有情況下的具體原因，若仍然出現，請檢查服務方目前指引。Python 用戶端成功不代表獨立設定的 Copilot App 連線一定已生效。

## 擷取畫面與完成標準

自行擷取並去識別化：(1) Edge 登入前的 MCP 首頁；(2) Copilot App 中的連線狀態與唯讀工具結果，遮蓋帳戶資訊；(3) 手機和電腦尺寸的優惠頁面。上方參考圖片不能證明你的連線成功。

當 App 可以探索並查詢唯讀工具，應用程式預設使用模擬模式，且選修的伺服器端即時介接器能顯示真實資料或明確錯誤時，即可保留應用程式與 MCP 設定，進入[實驗三](../lab3/traditional.html)。
