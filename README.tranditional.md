# 使用 GitHub Copilot App 建置響應式點餐體驗

[English](https://kinfey.github.io/aigenius-ghc-app-hol/) · [简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/zh.html) · [GitHub 儲存庫](https://github.com/kinfey/aigenius-ghc-app-hol)

本工作坊共 **60 分鐘**，使用 **GitHub Copilot App** 建置響應式點餐應用程式，連接麥當勞中國 MCP 服務，並在 Browser 畫布中執行需要使用者參與確認的引導式應用程式。這是獨立的教學練習，不是麥當勞官方產品。

| 實驗 | 成果 | 建議時間 |
| --- | --- | --- |
| [實驗一：建置與比較](lab1/traditional.html) | 響應式應用程式，以相同任務比較 Auto 與固定 GPT-6 Luna | 20 分鐘 |
| [實驗二：連接 MCP](lab2/traditional.html) | 連接 MCP 並查詢真實唯讀優惠資訊 | 15 分鐘 |
| [實驗三：畫布中的引導式點餐](lab3/traditional.html) | 真實 MCP 精靈、選單處理與明確確認關卡 | 25 分鐘 |
| **合計** | **三個實驗沿用同一應用程式** | **60 分鐘** |

安裝工具、還原範例相依套件、登入帳號和準備個人 MCP Token 均在**課前**完成。課堂使用已提供的起始實作，控制變更範圍。Decision Router/Azure 部署、多輪模型比較、原生 SDK 擴充功能開發、真實購買和付款列為課後選修內容，不額外佔用這 60 分鐘，也不是課堂完成條件。

## 開始之前

- 安裝 [GitHub Copilot App](https://github.com/features/copilot/copilot-app)、Git、Node.js 22.16 或更新版本和 Microsoft Edge，使用有 Copilot 權限的帳號登入。選單及模型可用性可能隨版本和原則變動。
- 實驗二、三需要中國大陸地區的麥當勞帳戶，並能存取 [open.mcd.cn](https://open.mcd.cn/)。服務條款、帳戶資格、服務可用性和工具參數可能變動。
- 實驗一的選修 Decision Router 需要有權存取私人[路由儲存庫](https://github.com/kinfey/decision-ghc-router)、Copilot CLI，以及已在 Microsoft Foundry 部署 Microsoft-Decision-1 的 Azure 訂用帳戶。使用 Auto 或固定 GPT-6 Luna 均不需要這些額外條件。
- 在**新的本機專案**中操作，不要把應用程式碼寫入教學儲存庫。三個實驗沿用同一個應用程式和主工作階段；實驗一的模型比較使用獨立、全新、唯讀的工作階段。
- 真實服務和模型可能產生費用。不要公開 API 金鑰、Token、私人端點、地址、訂單詳細資料或含有這些資訊的螢幕擷取畫面。使用自己的認證資訊，已洩漏的認證資訊應立即輪替。

每個實驗都提供英文 `README.md`、簡體中文 `README.zh.md` 和繁體中文 `README.tranditional.md`。指南中明確區分公開文件的螢幕擷取畫面與工作坊實際實作過程的 App、Edge 螢幕擷取畫面。真實服務的擷取畫面絕不能暴露認證資訊或帳戶資訊。

**目前狀態：**三個實驗均包含可執行程式碼與實作擷取畫面。實驗三直接重用 [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code)，不複製應用程式；完整[英文](lab3/)、[簡體中文](lab3/zh.html)和[繁體中文](lab3/traditional.html)指南包含產生的檔案連結及關鍵擷取畫面。Browser 畫布應用程式已實作，註冊 SDK 自訂擴充功能是獨立的課後目標。真實連接/選單擷取畫面與明確標示的離線確認擷取畫面分開說明，課程取證未真實下單或付款。

GitHub Pages 僅發布三語教學和擷取畫面，不承載帶認證資訊的 Python 應用程式；應用程式依其 README 在本機執行。

從[實驗一](lab1/traditional.html)開始。
