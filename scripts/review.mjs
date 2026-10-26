// Review queue for web submissions and reports, run against the remote D1 database.
//
//   npm run review                      # list pending submissions and open reports
//   npm run review -- approve 3 4       # publish submissions 3 and 4 (on the next build)
//   npm run review -- reject 5
//   npm run review -- resolve 2         # close report 2
import { execFileSync } from "node:child_process";

const DB = "pay-db";

function sql(command) {
  const out = execFileSync("npx", ["wrangler", "d1", "execute", DB, "--remote", "--json", "--command", command], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return JSON.parse(out)[0]?.results ?? [];
}

const ids = (args) => {
  const list = args.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!list.length) throw new Error("請給至少一個編號");
  return list.join(",");
};

const [action, ...args] = process.argv.slice(2);

if (!action) {
  const subs = sql(
    "SELECT id, created_at, track, company, role, yoe, monthly, bonus_months, annual, certifications, comment FROM submissions WHERE status = 'pending' ORDER BY id",
  );
  console.log(`\n待審投稿：${subs.length} 筆`);
  for (const s of subs) {
    console.log(`#${s.id} [${s.created_at}] ${s.track}｜${s.company}｜${s.role}｜年資 ${s.yoe ?? "—"}｜月薪 ${s.monthly} 萬｜Bonus ${s.bonus_months ?? "—"}｜年薪 ${s.annual ?? "—"}`);
    if (s.certifications) console.log(`   證照：${s.certifications}`);
    if (s.comment) console.log(`   心得：${s.comment}`);
  }
  const reports = sql("SELECT id, created_at, kind, target, message, contact FROM reports WHERE status = 'open' ORDER BY id");
  console.log(`\n未處理回報：${reports.length} 筆`);
  for (const r of reports) {
    console.log(`#${r.id} [${r.created_at}] ${r.kind}｜${r.target ?? ""}｜${r.contact ?? "未留聯絡方式"}`);
    console.log(`   ${r.message}`);
  }
} else if (action === "approve" || action === "reject") {
  sql(`UPDATE submissions SET status = '${action === "approve" ? "approved" : "rejected"}' WHERE id IN (${ids(args)})`);
  console.log(`已${action === "approve" ? "核准" : "退回"}：${args.join(", ")}`);
  if (action === "approve") console.log("下次部署（push 到 main 或 npm run deploy）時會出現在網站上。");
} else if (action === "resolve") {
  sql(`UPDATE reports SET status = 'resolved' WHERE id IN (${ids(args)})`);
  console.log(`已結案：${args.join(", ")}`);
} else {
  console.error(`不認得的指令：${action}`);
  process.exit(1);
}
