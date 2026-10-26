// De-identification applied before anything is published.

// Person-directed insults and unverified factual accusations. Plain negative opinions
// ("不推", "爛公司", "幹話") are fine and are not matched.
export const HARSH =
  /智商|智障|白癡|白痴|垃圾(老人|主管|同事|老闆)|廢物(長官|主管|老闆)|腦殘|低能|無腦人|很笨|米蟲|臭魚爛蝦|亂咬人|罵三字經|騙騙?客戶|沒路用|舔上級/;

// Common surnames, minus characters that often precede a title in ordinary words
// (向主管, 擔任主管, 工程PM, 最高主管, 對方主管).
const SURNAMES =
  "王李張劉陳楊黃趙吳周徐孫馬朱胡郭何林羅鄭梁謝宋唐許韓馮鄧曹彭曾蕭田袁潘蔣蔡余杜葉蘇魏呂丁沈姚盧姜崔鍾譚陸汪范廖賈夏韋白鄒孟熊秦邱江尹薛段雷侯龍史陶黎賀顧毛郝龔邵嚴戴莫孔湯簡賴洪翁游施柯詹";
// "許董", "林經理", "陳 PM" → "○董" … so a comment never names a specific person.
const NAMED_TITLE = new RegExp(`[${SURNAMES}](?=\\s?(董事長|董|總經理|總|副總|協理|處長|經理|副理|課長|主管|老闆|老闆娘|PM|HR)(?![a-z]))`, "gi");
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PHONE = /(?:\+?886[-\s]?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3}/g;

export function scrubComment(text) {
  return text.replace(EMAIL, "（已移除 email）").replace(PHONE, "（已移除電話）").replace(NAMED_TITLE, "○");
}

const titleKey = (s) => s.normalize("NFKC").toLowerCase().replace(/[\s._\-()（）]/g, "");

// A job title or 職級 string that appears only once in the whole dataset can point at one
// person, so it is replaced by its category before publishing.
export function rareTitleFilter(rows, field) {
  const counts = new Map();
  for (const r of rows) {
    const k = titleKey(r[field] ?? "");
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return (value) => (value && (counts.get(titleKey(value)) ?? 0) >= 2 ? value : null);
}
