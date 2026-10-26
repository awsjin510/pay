# 科技業薪資參考

台灣純軟、系統廠、IC 設計的薪資參考網站，資料整理自「薪資紀錄」Google 試算表（已取得授權）。
Next.js 靜態輸出，所有頁面在建置時從 `data/*.json` 產生，可部署到任何靜態主機（Vercel、S3 + CloudFront、GitHub Pages）。

## 開發

```bash
npm install
npm run data:fetch   # 重新下載試算表並清理，輸出 data/*.json
npm run dev          # http://localhost:3000
npm run build        # 靜態檔輸出到 out/
```

`npm run data` 只用 `data/raw/` 裡已快取的 CSV 重新清理，不連網。

## 部署

網站部署在 Cloudflare Workers（靜態資產），網址 <https://pay.operation.tw>，設定在 `wrangler.jsonc`。

```bash
npx wrangler login   # 第一次需要授權
npm run deploy       # 建置並上傳 out/
```

## 資料流程（`etl/`）

| 檔案 | 用途 |
|---|---|
| `build.mjs` | 抓取 → 清理 → 統計，輸出 `submissions` / `companies` / `tracks` / `roles` / `interviews` / `meta` |
| `companies.mjs` | 公司正式名稱與別名、PTT 代號對照（已查證來源寫在檔案開頭） |
| `roles.mjs` | 自由填寫的職務 → 職務分類；相關年資 → 年資分段 |
| `csv.mjs` | CSV 解析 |

清理規則：月薪／年薪單位統一為「萬」、Bonus 百分比換算月數、不合理值不採計並標記 `flags`、
少於 3 筆不顯示統計、含人身攻擊字眼的心得不輸出。完整規則見網站的「資料說明」頁。

新增公司別名：在 `etl/companies.mjs` 的 `COMPANIES` 加入 `aliases`；只在單一產業成立的代號（例如 IC 的「M」「P」）放 `scoped`。
