# MEOポテンシャル診断

株式会社山西屋向けのMEO営業支援ツール。
都道府県・市区町村・業種を選択すると、政府統計データに基づいた競合分析レポートを自動生成します。

**https://meo-potential.pages.dev/**

## 機能

- **MEOポテンシャルスコア** — 競合密度・人口規模・昼間人口比から算出した100点満点のスコア
- **エリア競合密度** — 同業種の事業所数を都道府県平均・全国平均と比較
- **人口あたり店舗密度** — 人口1万人あたりの事業所数
- **エリア人口プロフィール** — 総人口・昼夜間人口比・年齢構成
- **エリアマップ** — Leaflet + OpenStreetMap による競合分布の可視化
- **営業トーク生成** — コピー可能なテンプレート文

## データソース

- [e-Stat](https://www.e-stat.go.jp/) 経済センサス-活動調査（令和3年）
- [e-Stat](https://www.e-stat.go.jp/) 国勢調査（令和2年）

## セットアップ

```bash
# ローカル開発サーバー
npm run dev
# → http://localhost:3000/
```

### データ更新（通常は不要）

```bash
cd scripts
npm install
cp .env.example .env  # ESTAT_API_KEY を設定

npm run fetch:census
npm run fetch:population
npm run add-coordinates
npm run calculate
```

### デプロイ

```bash
npm run deploy
```

## 技術構成

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（ビルド不要） |
| チャート | Chart.js 4.x |
| 地図 | Leaflet 1.9 + OpenStreetMap |
| データ取得 | TypeScript + e-Stat API |
| テスト | vitest（45テスト） |
| ホスティング | Cloudflare Pages |
