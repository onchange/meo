# CLAUDE.md — MEOポテンシャル診断

## プロジェクト概要

MEO対策会社（株式会社山西屋）向けの営業支援ツール。
市区町村と業種を選択すると、政府統計オープンデータ（e-Stat API）に基づいた
「MEOポテンシャルスコア」と競合分析レポートを自動生成する。

公開URL: https://meo-potential.pages.dev/

## アーキテクチャ

2段構成の静的サイト。バックエンドサーバー不要。

1. **scripts/** — TypeScriptスクリプトで e-Stat API からデータ取得 → JSON化
2. **public/** — 静的 HTML/CSS/JS フロントエンド（JSONを読み込んでブラウザ内で処理）

## ディレクトリ構成

```
meo/
├── public/                  # フロントエンド（Cloudflare Pagesで配信）
│   ├── index.html
│   ├── styles.css
│   ├── app.js               # メインアプリケーション
│   ├── score.js             # スコア算出ロジック（純粋関数）
│   ├── chart.js             # チャート描画（Chart.js + SVGゲージ）
│   ├── map.js               # エリアマップ描画（Leaflet）
│   └── data/                # JSONデータ（data/ からコピー）
├── scripts/                 # データ取得・加工（TypeScript + vitest）
│   ├── src/
│   │   ├── types.ts         # 型定義
│   │   ├── stat-ids.ts      # 統計表ID・業種コード定数
│   │   ├── e-stat-client.ts # e-Stat APIクライアント（ページング・リトライ）
│   │   ├── fetch-census.ts  # 経済センサスデータ取得
│   │   ├── fetch-population.ts  # 人口データ取得（3テーブル）
│   │   ├── calculate-averages.ts # 平均値算出
│   │   └── add-coordinates.ts   # 市区町村座標付与
│   └── __tests__/           # テスト（45テスト）
├── data/                    # スクリプト出力先（マスタデータ）
├── package.json
└── serve.json
```

## コマンド

```bash
# ローカル開発サーバー
npm run dev

# データ更新（scripts/ 内で実行、要 ESTAT_API_KEY）
cd scripts && npm install
npm run fetch:census
npm run fetch:population
npm run add-coordinates
npm run calculate

# data/ → public/data/ への同期 + Cloudflare Pagesデプロイ
npm run deploy

# テスト
cd scripts && npm test
```

## 環境変数

- `ESTAT_API_KEY` — e-Stat APIのアプリケーションID（scripts/ のみで使用、フロントエンドには不要）
- scripts/.env.example を参照

## データフロー

```
e-Stat API → scripts/ → data/*.json → npm run sync-data → public/data/ → ブラウザ内処理 → レポート表示
```

## スコア算出ロジック

```
totalScore = 競合密度スコア × 0.4 + 人口規模スコア × 0.3 + 昼間人口比スコア × 0.3
```

- 競合密度スコア: `min(100, (人口あたり事業所数 / 全国平均) × 50)`
- 人口規模スコア: `min(100, 人口 / 3000)`
- 昼間人口比スコア: `min(100, 昼夜間人口比 × 50)`
- 実装: public/score.js（純粋関数、テスト: scripts/__tests__/score.test.ts）

## 業種コード対応表（e-Stat内部コード）

| 表示名 | コード |
|---|---|
| 歯科診療所 | 833 |
| 一般診療所（内科等） | 832 |
| 美容業（美容院） | 783 |
| 理容業 | 782 |
| 飲食店 | 76 |
| 療術業（整骨院・鍼灸院等） | 835 |
| 学習塾 | 823 |
| 不動産代理業・仲介業 | 682 |

※ 標準産業分類の番号とは異なる。scripts/src/stat-ids.ts に定義。

## e-Stat 統計表ID

| データ | 統計表ID |
|---|---|
| 経済センサス（事業所数） | 0004005687 |
| 国勢調査（総人口） | 0003433219 |
| 国勢調査（年齢3区分比率） | 0003445163 |
| 国勢調査（昼夜間人口比） | 0003454499 |

## コーディング規約

- scripts/: TypeScript（tsx実行、vitest）
- public/: 素の HTML/CSS/JS（ビルドツール不要）
- UIは日本語
- Chart.js / Leaflet はCDN読み込み
- ライトテーマ（白背景 #f8fafc、アクセント #2563eb）

## デプロイ

Cloudflare Pages（`npm run deploy`）。`public/` を配信ディレクトリとして使用。

## 注意事項

- e-Stat APIのレート制限あり（スクリプトは1秒間隔 + 3回リトライで対応済み）
- 市区町村座標は中心点の近似値（8件の未マッチあり）
- 地図上の競合ピンは統計データに基づく散布表示であり、実際の店舗位置ではない

## 今後の予定

- 地図の実店舗プロット（Google Places API等）
- 業種の追加
- PDF出力機能
- 営業トークのバリエーション追加
- データ更新の自動化
