# 日本で働く外国人は、どこから来たか

厚生労働省「外国人雇用状況」の届出状況（各年10月末時点）を、国籍・在留資格・都道府県で見る。

- 想定URL: https://japan-foreigners-workers.visualizing.jp/
- 期間: 2016–2025年。別表の Excel がある年。
- 対象: 事業主に雇用される外国人労働者。特別永住者、在留資格「外交」「公用」は含まない。数値は届出件数。

```bash
npm install
npm run fetch
npm run normalize
npm run verify
npm run data
npm run dev
```

出典の対応は [`docs/data-sources.md`](docs/data-sources.md)。
