# セキュリティレビュー（公開前確認）

## 重大懸念
- JWT セッション署名鍵 (`JWT_SECRET`) が未設定でも起動する実装。`server/_core/sdk.ts` で空シークレットを許容しており、空鍵で任意の `openId` を持つトークンを偽造可能。`OWNER_OPEN_ID` を使えば管理者権限を奪取できる。
- Stripe の秘密鍵/署名検証鍵が未設定でも空文字で進む（`server/stripe-webhook.ts`, `server/routers.ts`）。署名検証が実質無効化され、だれでも偽の支払いイベントを送れる。
- 決済の success/cancel URL を `ctx.req.headers.origin` から組み立てており、任意 Origin を差し込めるオープンリダイレクトとなる。信頼済みベース URL 固定が必要。
- LINE OAuth リダイレクト URI を `host`/`x-forwarded-proto` から構築し、一時 Cookie が緩い属性のまま。Host スプーフィングでリダイレクト先を改ざんされ得る。

## 推奨対応
1. 起動時に必須環境変数（`JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, OAuth 関連）を検証し、欠如時はプロセスを落とす。
2. JWT シークレットを必須化し、既存 Cookie を無効化（キー変更）して再ログインを強制。可能ならキーのローテーション設計を追加。
3. Stripe: 秘密鍵/署名秘密を必須化し、Webhook でイベント ID の冪等チェック・重複防止を追加。
4. success/cancel URL と LINE リダイレクト URI は信頼済みベース URL（設定値）から生成し、Origin/Host ヘッダは使わない。LINE 一時 Cookie は `secure: true`, `sameSite: 'lax'` 以上でセット。
