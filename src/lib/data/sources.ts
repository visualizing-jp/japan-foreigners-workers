/**
 * 厚生労働省「外国人雇用状況」の届出状況。毎年10月末時点。
 * 一覧: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/gaikokujin/gaikokujin-koyou/06.html
 *
 * 別表の Excel があるのは平成28年（2016年）以降。それ以前の報道発表は PDF だけなので、ここには入れない。
 * 2018–2020年のファイルは現在の厚労省サイトから消えているため、国立国会図書館 WARP のコピーを使う。
 * 令和6年の［参考-4］には訂正がある。使うのは報道発表ページに今あるファイルで、別表1の総数は発表文の人数と照合する。
 */

export interface Annual {
  year: number;
  url: string;
}

const WARP = "https://warp.ndl.go.jp/20260323";

export const PAGE_URL =
  "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/gaikokujin/gaikokujin-koyou/06.html";

export const ANNUALS: Annual[] = [
  {
    year: 2016,
    url: `${WARP}/20260305024200/https://www.mhlw.go.jp/file/04-Houdouhappyou-11655000-Shokugyouanteikyokuhakenyukiroudoutaisakubu-Gaikokujinkoyoutaisakuka/648474.xlsx`,
  },
  {
    year: 2017,
    url: `${WARP}/20260305024133/https://www.mhlw.go.jp/file/04-Houdouhappyou-11655000-Shokugyouanteikyokuhakenyukiroudoutaisakubu-Gaikokujinkoyoutaisakuka/8957097520ff.xlsx`,
  },
  {
    year: 2018,
    url: `${WARP}/20260304174331/https://www.mhlw.go.jp/content/11655000/000592978.xlsx`,
  },
  {
    year: 2019,
    url: `${WARP}/20260304174150/https://www.mhlw.go.jp/content/11655000/000590312.xlsx`,
  },
  {
    year: 2020,
    url: `${WARP}/20260304173907/https://www.mhlw.go.jp/content/11655000/000728550.xlsx`,
  },
  { year: 2021, url: "https://www.mhlw.go.jp/content/11655000/000887556.xlsx" },
  { year: 2022, url: "https://www.mhlw.go.jp/content/11655000/001044545.xlsx" },
  { year: 2023, url: "https://www.mhlw.go.jp/content/11655000/001195791.xlsx" },
  { year: 2024, url: "https://www.mhlw.go.jp/content/11655000/001389472.xlsx" },
  { year: 2025, url: "https://www.mhlw.go.jp/content/11655000/001646132.xlsx" },
];
