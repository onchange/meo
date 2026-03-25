# CLAUDE.md — MEOポテンシャル診断

## プロジェクト概要

MEO対策会社（株式会社山西屋）向けの営業支援ツール。
市区町村名と業種を選択すると、政府統計オープンデータに基づいた
「MEOポテンシャルスコア」と競合分析レポートを自動生成する。

## アーキテクチャ

2段構成:
1. `scripts/` — Node.js/TSスクリプトでe-Stat APIからデータ取得 → JSON化
2. `src/` — 静的HTML/CSS/JSフロントエンド（JSONを読み込んで表示）

バックエンドサーバー不要。Cloudflare Pagesに静的デプロイ。

## ディレクトリ構成

- `prototype/` — UIプロトタイプ（ダミーデータ、参照用）
- `scripts/` — データ取得・加工スクリプト
- `src/` — 本番フロントエンド
- `data/` — 生成されたJSONデータ
- `docs/` — 仕様書・ドキュメント

## コマンド

### データ取得
```bash
cd scripts
npm install
ESTAT_API_KEY=あなたのキー npx ts-node fetch-census.ts
ESTAT_API_KEY=あなたのキー npx ts-node fetch-population.ts
npx ts-node calculate-averages.ts
npx ts-node generate-json.ts
```

### ローカル確認
```bash
npx serve src

# プロトタイプ確認
npx serve prototype
```

## 環境変数

- `ESTAT_API_KEY` — e-Stat APIのアプリケーションID

## データフロー

```
e-Stat API → scripts/ → data/*.json → src/app.js（ブラウザ内処理）→ レポート表示
```

## コーディング規約

- scripts/: TypeScript（ts-node実行）
- src/: 素のHTML/CSS/JS（ビルドツール不要）
- UIは日本語
- チャート: Chart.js CDN読み込み、ゲージ: 自前SVG
- 地図: Leaflet + OpenStreetMap（CDN読み込み、APIキー不要）
- レスポンシブ対応（iPad横向き優先）

## 詳細仕様

`yamanishiya-meo-potential-spec.md` を参照。
