# データベース設計書

水間プロジェクションマッピングシステムのデータベース設計

## 概要

このシステムはMySQL 8.0（またはTiDB）を使用し、Drizzle ORMでデータベースアクセスを行います。

## ER図

```
users (1) ----< (N) videos
users (1) ----< (N) reservations
users (1) ----< (N) payments
videos (1) ----< (N) reservations
reservations (1) ----< (N) projectionSchedules
templates (1) ----< (N) videos (template1Id)
templates (1) ----< (N) videos (template2Id)
templates (1) ----< (N) videos (template3Id)
```

## テーブル定義

### users
ユーザー情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| openId | VARCHAR(64) | NO | - | Manus OAuth ID（ユニーク） |
| name | TEXT | YES | NULL | ユーザー名 |
| email | VARCHAR(320) | YES | NULL | メールアドレス |
| loginMethod | VARCHAR(64) | YES | NULL | ログイン方法（google, line等） |
| role | ENUM('user', 'admin') | NO | 'user' | ユーザーロール |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |
| lastSignedIn | TIMESTAMP | NO | CURRENT_TIMESTAMP | 最終ログイン日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (openId)

**備考**:
- openIdはManus OAuthから取得した一意の識別子
- roleが'admin'のユーザーは管理画面にアクセス可能
- システムオーナーは自動的にadminロールが付与される

---

### templates
テンプレート動画を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| category | INT | NO | - | カテゴリ（1-3） |
| title | VARCHAR(255) | NO | - | テンプレートタイトル |
| description | TEXT | YES | NULL | テンプレート説明 |
| thumbnailUrl | TEXT | NO | - | サムネイル画像URL |
| videoUrl | TEXT | NO | - | 動画ファイルURL |
| duration | INT | NO | - | 動画の長さ（秒） |
| isActive | BOOLEAN | NO | TRUE | 有効フラグ |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (category, isActive)

**備考**:
- categoryは1（1番目）、2（2番目）、3（3番目）の3種類
- isActiveがFALSEのテンプレートは選択画面に表示されない
- 各カテゴリには複数のテンプレートが存在可能

---

### videos
生成された動画を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| userId | INT | NO | - | ユーザーID（外部キー） |
| template1Id | INT | NO | - | 1番目のテンプレートID（外部キー） |
| template2Id | INT | NO | - | 2番目のテンプレートID（外部キー） |
| template3Id | INT | NO | - | 3番目のテンプレートID（外部キー） |
| videoUrl | TEXT | NO | - | 生成動画URL |
| duration | INT | NO | - | 動画の長さ（秒） |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (userId)
- INDEX (template1Id)
- INDEX (template2Id)
- INDEX (template3Id)

**備考**:
- 3つのテンプレートを組み合わせて1つの動画を生成
- durationは通常30秒（各テンプレート10秒×3）
- videoUrlは生成された動画ファイルのS3 URL

---

### reservations
投影予約を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| userId | INT | NO | - | ユーザーID（外部キー） |
| videoId | INT | NO | - | 動画ID（外部キー） |
| projectionDate | TIMESTAMP | NO | - | 投影日（UTC） |
| slotNumber | INT | NO | - | スロット番号（1-36） |
| status | ENUM('confirmed', 'cancelled') | NO | 'confirmed' | 予約ステータス |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (userId)
- INDEX (videoId)
- INDEX (projectionDate, slotNumber)
- UNIQUE KEY (projectionDate, slotNumber, status) WHERE status='confirmed'

**備考**:
- 1日あたり36スロット（15分間隔）
- slotNumberは1-36の範囲
- 同じ日時・スロットに複数の予約は不可（statusがconfirmedの場合）
- 投影1日前までは変更・キャンセル可能

---

### payments
決済情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| userId | INT | NO | - | ユーザーID（外部キー） |
| amount | INT | NO | - | 金額（円） |
| status | ENUM('pending', 'succeeded', 'failed') | NO | 'pending' | 決済ステータス |
| stripePaymentIntentId | VARCHAR(255) | YES | NULL | Stripe Payment Intent ID |
| stripeCheckoutSessionId | VARCHAR(255) | YES | NULL | Stripe Checkout Session ID |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (userId)
- INDEX (stripePaymentIntentId)
- INDEX (stripeCheckoutSessionId)

**備考**:
- amountは円単位（無料体験: 0円、有料サービス: 5,000円）
- statusはWebhookで更新される
- Stripe IDは決済の追跡に使用

---

### projectionSchedules
投影スケジュールを管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| reservationId | INT | NO | - | 予約ID（外部キー） |
| startTime | TIMESTAMP | NO | - | 開始時刻（UTC） |
| endTime | TIMESTAMP | NO | - | 終了時刻（UTC） |
| status | ENUM('scheduled', 'in_progress', 'completed', 'failed') | NO | 'scheduled' | 投影ステータス |
| actualStartTime | TIMESTAMP | YES | NULL | 実際の開始時刻 |
| actualEndTime | TIMESTAMP | YES | NULL | 実際の終了時刻 |
| errorMessage | TEXT | YES | NULL | エラーメッセージ |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (reservationId)
- INDEX (startTime)
- INDEX (status)

**備考**:
- 1つの予約につき1つの投影スケジュール
- 15分間のセッション（startTimeからendTimeまで）
- 実際の投影時間はactualStartTime/actualEndTimeに記録
- エラー発生時はerrorMessageに詳細を記録

---

### systemSettings
システム設定を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 主キー |
| settingKey | VARCHAR(255) | NO | - | 設定キー（ユニーク） |
| settingValue | TEXT | NO | - | 設定値 |
| description | TEXT | YES | NULL | 説明 |
| createdAt | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | NO | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (settingKey)

**備考**:
- システム全体の設定を管理
- 設定例: 投影時間帯、スロット数、料金設定など

---

## リレーション

### users → videos
- 1人のユーザーは複数の動画を作成可能
- ON DELETE CASCADE（ユーザー削除時、関連動画も削除）

### users → reservations
- 1人のユーザーは複数の予約を作成可能
- ON DELETE CASCADE（ユーザー削除時、関連予約も削除）

### users → payments
- 1人のユーザーは複数の決済履歴を持つ
- ON DELETE CASCADE（ユーザー削除時、関連決済も削除）

### videos → reservations
- 1つの動画は複数回予約可能
- ON DELETE RESTRICT（動画削除時、予約がある場合は削除不可）

### reservations → projectionSchedules
- 1つの予約につき1つの投影スケジュール
- ON DELETE CASCADE（予約削除時、関連スケジュールも削除）

### templates → videos
- 1つのテンプレートは複数の動画で使用可能
- ON DELETE RESTRICT（テンプレート削除時、使用中の場合は削除不可）

---

## データ容量見積もり

### 想定ユーザー数
- 初年度: 1,000ユーザー
- 3年後: 10,000ユーザー

### テーブルサイズ見積もり（3年後）

| テーブル名 | レコード数 | 1レコードサイズ | 合計サイズ |
|-----------|-----------|---------------|-----------|
| users | 10,000 | 500 bytes | 5 MB |
| templates | 100 | 1 KB | 100 KB |
| videos | 50,000 | 300 bytes | 15 MB |
| reservations | 100,000 | 200 bytes | 20 MB |
| payments | 50,000 | 300 bytes | 15 MB |
| projectionSchedules | 100,000 | 250 bytes | 25 MB |
| systemSettings | 50 | 500 bytes | 25 KB |

**合計**: 約80 MB（インデックス含まず）

---

## バックアップ戦略

### 自動バックアップ
- 毎日深夜2:00（JST）に自動バックアップ
- 保持期間: 30日間

### リストア手順
1. Manus管理UIからバックアップ一覧を表示
2. リストアしたいバックアップを選択
3. リストア実行

---

## マイグレーション

### マイグレーション実行

```bash
# スキーマ変更をデータベースに適用
pnpm db:push
```

### マイグレーション履歴

Drizzle ORMはスキーマファイル（`drizzle/schema.ts`）を基準にマイグレーションを自動生成します。

---

## セキュリティ

### アクセス制御
- アプリケーションレベルでの権限チェック
- 管理者操作は`role='admin'`チェック必須

### データ暗号化
- 通信: TLS 1.2以上
- 保存: データベース暗号化（Manus Platform標準機能）

### 個人情報保護
- ユーザーの個人情報（name, email）は暗号化推奨
- 決済情報はStripeで管理（自システムには保存しない）

---

## パフォーマンス最適化

### インデックス戦略
- 頻繁に検索されるカラムにインデックスを作成
- 複合インデックスの使用（projectionDate, slotNumber等）

### クエリ最適化
- N+1問題の回避（Drizzle ORMのリレーション機能を活用）
- 必要なカラムのみ取得（SELECT *を避ける）

### キャッシュ戦略
- テンプレート一覧: 1時間キャッシュ
- システム設定: 10分キャッシュ

---

## モニタリング

### 監視項目
- データベース接続数
- スロークエリ（1秒以上）
- テーブルサイズ
- インデックス使用率

### アラート設定
- 接続数が最大の80%を超えた場合
- スロークエリが1分間に10回以上発生した場合

---

## サポート

データベース設計に関する質問は、[https://help.manus.im](https://help.manus.im) までお問い合わせください。
