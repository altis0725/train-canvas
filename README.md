# 水間プロジェクションマッピングシステム

電車車両内への動画投影予約システム

## 概要

水間プロジェクションマッピングシステムは、電車車両内でユーザーが作成した動画を投影できる革新的なサービスです。ユーザーは3段階のテンプレート選択により簡単に動画を作成し、希望の日時に投影予約を行うことができます。

## 主要機能

### 1. 認証機能
- LINE Login統合（Manus OAuth経由）
- セッション管理
- ユーザー情報管理

### 2. 動画作成機能
- 3段階テンプレート選択（各10秒×3本=30秒）
- リアルタイムプレビュー
- 動画ダウンロード機能
- ユーザーごとの動画管理

### 3. 投影予約システム
- カレンダーベースの予約UI
- 先着順予約ロジック（36スロット/日、15分間隔）
- 予約変更・キャンセル機能（投影1日前まで）
- 予約履歴管理

### 4. 決済機能
- Stripe統合
- 無料体験プラン（20秒）
- 有料サービスプラン（5,000円で1分間）
- 決済履歴管理

### 5. マイページ
- 予約履歴表示
- 生成動画一覧
- 決済履歴表示
- 動画ダウンロード

### 6. 管理画面
- ユーザー管理
- テンプレート動画管理（CRUD）
- 予約管理
- 決済状況確認
- システム統計情報

### 7. 投影システム連携
- 投影スケジュール管理API
- 投影ステータス追跡
- 15分間セッション管理

## 技術スタック

### フロントエンド
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS 4** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **wouter** - ルーティング

### バックエンド
- **Express 4** - Webフレームワーク
- **tRPC 11** - 型安全なAPI
- **Drizzle ORM** - データベースORM

### データベース
- **MySQL/TiDB** - メインデータベース

### 認証
- **Manus OAuth** - 認証プロバイダー
- **LINE Login** - ソーシャルログイン

### 決済
- **Stripe** - クレジットカード決済

### インフラ
- **Manus Platform** - ホスティング・デプロイ

## セットアップ

### 前提条件
- Node.js 22.13.0以上
- pnpm 9.0.0以上
- MySQL 8.0以上（またはTiDB）

### インストール

```bash
# 依存関係のインストール
pnpm install

# データベースマイグレーション
pnpm db:push
```

### 環境変数

以下の環境変数が自動的に設定されます：

```
DATABASE_URL=<MySQL接続文字列>
JWT_SECRET=<セッション署名シークレット>
VITE_APP_ID=<Manus OAuth アプリケーションID>
OAUTH_SERVER_URL=<Manus OAuthサーバーURL>
VITE_OAUTH_PORTAL_URL=<Manus ログインポータルURL>
STRIPE_SECRET_KEY=<Stripeシークレットキー>
STRIPE_WEBHOOK_SECRET=<Stripe Webhookシークレット>
VITE_STRIPE_PUBLISHABLE_KEY=<Stripe公開可能キー>
```

### 開発サーバー起動

```bash
pnpm dev
```

開発サーバーは `http://localhost:3000` で起動します。

### テスト実行

```bash
# 全テスト実行
pnpm test

# 特定のテストファイル実行
pnpm test server/auth.test.ts
```

## プロジェクト構造

```
mizuma-projection/
├── client/                 # フロントエンドコード
│   ├── public/            # 静的ファイル
│   └── src/
│       ├── components/    # Reactコンポーネント
│       ├── pages/         # ページコンポーネント
│       ├── lib/           # ユーティリティ
│       └── App.tsx        # ルート設定
├── server/                # バックエンドコード
│   ├── _core/            # フレームワークコア
│   ├── routers.ts        # tRPCルーター
│   ├── db.ts             # データベースヘルパー
│   └── *.test.ts         # テストファイル
├── drizzle/              # データベーススキーマ
│   └── schema.ts         # テーブル定義
└── shared/               # 共有定数・型
```

## API仕様

### 認証API
- `auth.me` - 現在のユーザー情報取得
- `auth.logout` - ログアウト

### テンプレートAPI
- `templates.getByCategory` - カテゴリ別テンプレート取得
- `templates.getAll` - 全テンプレート取得（管理者のみ）
- `templates.create` - テンプレート作成（管理者のみ）
- `templates.update` - テンプレート更新（管理者のみ）
- `templates.delete` - テンプレート削除（管理者のみ）

### 動画API
- `videos.create` - 動画作成
- `videos.getUserVideos` - ユーザーの動画一覧取得
- `videos.getById` - 動画詳細取得
- `videos.delete` - 動画削除

### 予約API
- `reservations.create` - 予約作成
- `reservations.getUserReservations` - ユーザーの予約一覧取得
- `reservations.getAvailableSlots` - 予約可能スロット取得
- `reservations.update` - 予約更新
- `reservations.cancel` - 予約キャンセル

### 決済API
- `payments.createCheckoutSession` - Checkout Session作成
- `payments.getUserPayments` - ユーザーの決済履歴取得

### 投影システムAPI
- `projection.getSchedulesByDate` - 日付別投影スケジュール取得
- `projection.createSchedule` - 投影スケジュール作成（管理者のみ）
- `projection.updateScheduleStatus` - 投影ステータス更新（管理者のみ）

### 管理API
- `admin.getAllUsers` - 全ユーザー取得（管理者のみ）
- `admin.getAllReservations` - 全予約取得（管理者のみ）
- `admin.getAllPayments` - 全決済取得（管理者のみ）

## データベース設計

### テーブル一覧

#### users
ユーザー情報を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| openId | VARCHAR(64) | Manus OAuth ID |
| name | TEXT | ユーザー名 |
| email | VARCHAR(320) | メールアドレス |
| loginMethod | VARCHAR(64) | ログイン方法 |
| role | ENUM | ユーザーロール（user/admin） |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |
| lastSignedIn | TIMESTAMP | 最終ログイン日時 |

#### templates
テンプレート動画を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| category | INT | カテゴリ（1-3） |
| title | VARCHAR(255) | タイトル |
| description | TEXT | 説明 |
| thumbnailUrl | TEXT | サムネイルURL |
| videoUrl | TEXT | 動画URL |
| duration | INT | 動画長（秒） |
| isActive | BOOLEAN | 有効フラグ |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

#### videos
生成動画を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| userId | INT | ユーザーID |
| template1Id | INT | テンプレート1 ID |
| template2Id | INT | テンプレート2 ID |
| template3Id | INT | テンプレート3 ID |
| videoUrl | TEXT | 生成動画URL |
| duration | INT | 動画長（秒） |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

#### reservations
予約情報を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| userId | INT | ユーザーID |
| videoId | INT | 動画ID |
| projectionDate | TIMESTAMP | 投影日 |
| slotNumber | INT | スロット番号（1-36） |
| status | ENUM | ステータス（confirmed/cancelled） |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

#### payments
決済情報を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| userId | INT | ユーザーID |
| amount | INT | 金額（円） |
| status | ENUM | ステータス（pending/succeeded/failed） |
| stripePaymentIntentId | VARCHAR(255) | Stripe Payment Intent ID |
| stripeCheckoutSessionId | VARCHAR(255) | Stripe Checkout Session ID |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

#### projectionSchedules
投影スケジュールを管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| reservationId | INT | 予約ID |
| startTime | TIMESTAMP | 開始時刻 |
| endTime | TIMESTAMP | 終了時刻 |
| status | ENUM | ステータス（scheduled/in_progress/completed/failed） |
| actualStartTime | TIMESTAMP | 実際の開始時刻 |
| actualEndTime | TIMESTAMP | 実際の終了時刻 |
| errorMessage | TEXT | エラーメッセージ |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

#### systemSettings
システム設定を管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INT | 主キー |
| settingKey | VARCHAR(255) | 設定キー |
| settingValue | TEXT | 設定値 |
| description | TEXT | 説明 |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

## テスト

### テストカバレッジ

全36テストが成功しています：

- **認証機能**: 5テスト
  - ユーザー情報取得
  - ログアウト機能
  
- **テンプレート管理**: 10テスト
  - カテゴリ別取得
  - CRUD操作
  - 権限チェック

- **動画作成**: 8テスト
  - 動画生成
  - 一覧取得
  - 削除機能
  - 権限チェック

- **予約システム**: 9テスト
  - 予約作成
  - 予約変更
  - 予約キャンセル
  - スロット取得
  - 権限チェック

- **決済機能**: 4テスト
  - Checkout Session作成
  - 決済履歴取得
  - 権限チェック

### テスト実行方法

```bash
# 全テスト実行
pnpm test

# カバレッジ付きテスト実行
pnpm test --coverage
```

## デプロイ

### Manus Platformへのデプロイ

1. 管理UIの「Publish」ボタンをクリック
2. デプロイが自動的に開始されます
3. デプロイ完了後、公開URLが発行されます

### 環境変数の設定

管理UI > Settings > Secretsから環境変数を設定できます。

### カスタムドメインの設定

管理UI > Settings > Domainsからカスタムドメインを設定できます。

## ライセンス

© 2025 水間プロジェクションマッピングシステム. All rights reserved.

## サポート

ご質問やサポートが必要な場合は、[https://help.manus.im](https://help.manus.im) までお問い合わせください。
