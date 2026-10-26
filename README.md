# 科技業薪資參考

台灣純軟、系統廠、IC 設計與雲端資安的薪資參考網站：<https://pay.operation.tw>

- **資料**：「薪資紀錄」Google 試算表（已取得授權）＋網站投稿（人工審核）＋公開資訊觀測站官方非主管薪資。
- **網站**：Next.js 靜態輸出，所有頁面在建置時從 `data/*.json` 產生。
- **API**：`worker/index.ts`（Cloudflare Worker + D1 `pay-db`），只處理 `/api/*`：投稿、下架申請／回報、已核准投稿列表。

## 開發

```bash
npm install
npm run data:fetch   # 重新抓試算表、官方薪資、已核准投稿並清理 → data/*.json、public/data/*.csv
npm run dev          # 只看頁面：http://localhost:3000
npm run preview      # 建置後用 wrangler dev 跑頁面＋API＋本機 D1：http://localhost:8787
```

`npm run data` 只用 `data/raw/` 的快取重新清理，不連網。第一次跑 `npm run preview` 前先建本機資料表：
`npx wrangler d1 migrations apply pay-db --local`。

## 部署

- **自動**：Cloudflare Workers Builds 連接本 repo，push 到 `main` 會執行 `npm run data:fetch && npm run build` 再 `npx wrangler deploy`。
  建置紀錄在 Cloudflare Dashboard → Workers 和 Pages → pay → 部署。Node 版本由 `.node-version` 指定。
- **手動**：`npx wrangler login` 後執行 `npm run deploy`。
- **資料表變更**：在 `worker/migrations/` 新增 SQL 檔，執行 `npm run db:migrate`。

## 審核投稿與處理回報

```bash
npm run review                    # 列出待審投稿與未處理回報
npm run review -- approve 3 4     # 核准投稿（下次部署時上線）
npm run review -- reject 5
npm run review -- resolve 2       # 回報結案
```

核准後 push 任一 commit 或執行 `npm run deploy`，網站就會帶入新資料。
下架：把資料編號（例如 `soft-12`、`web-3`）加進 `etl/takedowns.json` 的 `rows`（整筆移除）或 `comments`（只移除心得），再部署。

## 資料流程（`etl/`）

| 檔案 | 用途 |
|---|---|
| `build.mjs` | 抓取 → 清理 → 去識別 → 統計，輸出網站資料與開放資料 CSV |
| `companies.mjs` | 公司正式名稱、別名、PTT 代號（查證來源寫在檔案開頭）、雲端／資安公司標記 |
| `roles.mjs` | 自由填寫的職務 → 職務分類；相關年資 → 年資分段 |
| `sectors.mjs` | 雲端／資安職務判斷與細分（SRE、資安研究員、SOC…） |
| `official.mjs` | 證交所／櫃買中心開放資料：非擔任主管全時員工薪資 |
| `privacy.mjs` | 人身攻擊字眼、姓氏＋職稱與聯絡資訊遮蔽、罕見職稱歸類 |
| `takedowns.json` | 下架清單 |
| `csv.mjs` | CSV 解析 |

新增公司別名：在 `etl/companies.mjs` 的 `COMPANIES` 加入 `aliases`；只在單一產業成立的代號（例如 IC 的「M」「P」）放 `scoped`；
名稱與上市櫃公司撞名但不是同一間的，加 `official: false`。
