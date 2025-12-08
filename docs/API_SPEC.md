# API仕様書

水間プロジェクションマッピングシステムのAPI仕様書

## 概要

このシステムはtRPCを使用した型安全なAPIを提供しています。全てのAPIエンドポイントは `/api/trpc` 配下に配置されています。

## 認証

### セッション管理

認証はManus OAuthを使用したセッションベースの認証です。ログイン後、HTTPOnlyクッキーにセッショントークンが保存されます。

### 権限レベル

- **Public**: 認証不要
- **Protected**: ログインユーザーのみ
- **Admin**: 管理者のみ

## エンドポイント一覧

### 認証API

#### auth.me
現在のユーザー情報を取得します。

**権限**: Public

**リクエスト**: なし

**レスポンス**:
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | undefined
```

**使用例**:
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

#### auth.logout
ログアウトします。

**権限**: Public

**リクエスト**: なし

**レスポンス**:
```typescript
{
  success: true;
}
```

**使用例**:
```typescript
const logoutMutation = trpc.auth.logout.useMutation();
await logoutMutation.mutateAsync();
```

---

### テンプレートAPI

#### templates.getByCategory
カテゴリ別にテンプレートを取得します。

**権限**: Public

**リクエスト**:
```typescript
{
  category: 1 | 2 | 3;
}
```

**レスポンス**:
```typescript
Array<{
  id: number;
  category: number;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

**使用例**:
```typescript
const { data: templates } = trpc.templates.getByCategory.useQuery({ category: 1 });
```

#### templates.getAll
全テンプレートを取得します（管理者のみ）。

**権限**: Admin

**リクエスト**: なし

**レスポンス**:
```typescript
Array<Template>
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### templates.create
新しいテンプレートを作成します（管理者のみ）。

**権限**: Admin

**リクエスト**:
```typescript
{
  category: 1 | 2 | 3;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
}
```

**レスポンス**:
```typescript
{
  templateId: number;
}
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### templates.update
テンプレートを更新します（管理者のみ）。

**権限**: Admin

**リクエスト**:
```typescript
{
  id: number;
  category?: 1 | 2 | 3;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  isActive?: boolean;
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### templates.delete
テンプレートを削除します（ソフトデリート、管理者のみ）。

**権限**: Admin

**リクエスト**:
```typescript
{
  id: number;
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

---

### 動画API

#### videos.create
3つのテンプレートから動画を作成します。

**権限**: Protected

**リクエスト**:
```typescript
{
  template1Id: number;
  template2Id: number;
  template3Id: number;
}
```

**レスポンス**:
```typescript
{
  videoId: number;
  videoUrl: string;
  duration: number;
}
```

**エラー**:
- `UNAUTHORIZED`: 認証されていない場合

**使用例**:
```typescript
const createVideoMutation = trpc.videos.create.useMutation();
const result = await createVideoMutation.mutateAsync({
  template1Id: 1,
  template2Id: 5,
  template3Id: 9,
});
```

#### videos.getUserVideos
ユーザーの動画一覧を取得します。

**権限**: Protected

**リクエスト**: なし

**レスポンス**:
```typescript
Array<{
  id: number;
  userId: number;
  template1Id: number;
  template2Id: number;
  template3Id: number;
  videoUrl: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### videos.getById
動画の詳細を取得します。

**権限**: Protected

**リクエスト**:
```typescript
{
  id: number;
}
```

**レスポンス**:
```typescript
Video | undefined
```

**エラー**:
- `FORBIDDEN`: 他のユーザーの動画にアクセスしようとした場合

#### videos.delete
動画を削除します。

**権限**: Protected

**リクエスト**:
```typescript
{
  id: number;
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `FORBIDDEN`: 他のユーザーの動画を削除しようとした場合

---

### 予約API

#### reservations.create
新しい予約を作成します。

**権限**: Protected

**リクエスト**:
```typescript
{
  videoId: number;
  projectionDate: Date;
  slotNumber: number; // 1-36
}
```

**レスポンス**:
```typescript
{
  reservationId: number;
}
```

**エラー**:
- `BAD_REQUEST`: スロットが既に予約されている場合
- `UNAUTHORIZED`: 認証されていない場合

**使用例**:
```typescript
const createReservationMutation = trpc.reservations.create.useMutation();
const result = await createReservationMutation.mutateAsync({
  videoId: 123,
  projectionDate: new Date('2025-11-20'),
  slotNumber: 10,
});
```

#### reservations.getUserReservations
ユーザーの予約一覧を取得します。

**権限**: Protected

**リクエスト**: なし

**レスポンス**:
```typescript
Array<{
  id: number;
  userId: number;
  videoId: number;
  projectionDate: Date;
  slotNumber: number;
  status: "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}>
```

#### reservations.getAvailableSlots
指定日の予約可能スロットを取得します。

**権限**: Public

**リクエスト**:
```typescript
{
  date: Date;
}
```

**レスポンス**:
```typescript
{
  availableSlots: number[]; // 1-36の配列
}
```

**使用例**:
```typescript
const { data: slots } = trpc.reservations.getAvailableSlots.useQuery({
  date: new Date('2025-11-20'),
});
```

#### reservations.update
予約を更新します（投影1日前まで）。

**権限**: Protected

**リクエスト**:
```typescript
{
  id: number;
  projectionDate?: Date;
  slotNumber?: number;
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `BAD_REQUEST`: 投影1日前を過ぎている場合
- `FORBIDDEN`: 他のユーザーの予約を更新しようとした場合

#### reservations.cancel
予約をキャンセルします（投影1日前まで）。

**権限**: Protected

**リクエスト**:
```typescript
{
  id: number;
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `BAD_REQUEST`: 投影1日前を過ぎている場合
- `FORBIDDEN`: 他のユーザーの予約をキャンセルしようとした場合

---

### 決済API

#### payments.createCheckoutSession
Stripe Checkout Sessionを作成します。

**権限**: Protected

**リクエスト**:
```typescript
{
  planType: "free" | "paid";
}
```

**レスポンス**:
```typescript
{
  sessionId: string;
  url: string;
}
```

**使用例**:
```typescript
const createCheckoutMutation = trpc.payments.createCheckoutSession.useMutation();
const result = await createCheckoutMutation.mutateAsync({
  planType: "paid",
});
// result.urlにリダイレクト
window.location.href = result.url;
```

#### payments.getUserPayments
ユーザーの決済履歴を取得します。

**権限**: Protected

**リクエスト**: なし

**レスポンス**:
```typescript
Array<{
  id: number;
  userId: number;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

---

### 投影システムAPI

#### projection.getSchedulesByDate
指定日の投影スケジュールを取得します。

**権限**: Public

**リクエスト**:
```typescript
{
  date: Date;
}
```

**レスポンス**:
```typescript
Array<{
  id: number;
  reservationId: number;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "in_progress" | "completed" | "failed";
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### projection.createSchedule
投影スケジュールを作成します（管理者のみ）。

**権限**: Admin

**リクエスト**:
```typescript
{
  reservationId: number;
  scheduledTime: Date;
  repeatCount?: number; // デフォルト: 5
}
```

**レスポンス**:
```typescript
{
  scheduleId: number;
}
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### projection.updateScheduleStatus
投影ステータスを更新します（管理者のみ）。

**権限**: Admin

**リクエスト**:
```typescript
{
  id: number;
  status: "scheduled" | "in_progress" | "completed" | "failed";
}
```

**レスポンス**:
```typescript
{
  success: true;
}
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

---

### 管理API

#### admin.getAllUsers
全ユーザーを取得します（管理者のみ）。

**権限**: Admin

**リクエスト**: なし

**レスポンス**:
```typescript
Array<User>
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### admin.getAllReservations
全予約を取得します（管理者のみ）。

**権限**: Admin

**リクエスト**: なし

**レスポンス**:
```typescript
Array<Reservation>
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

#### admin.getAllPayments
全決済を取得します（管理者のみ）。

**権限**: Admin

**リクエスト**: なし

**レスポンス**:
```typescript
Array<Payment>
```

**エラー**:
- `FORBIDDEN`: 管理者権限がない場合

---

## エラーハンドリング

### エラーコード

tRPCは以下のエラーコードを使用します：

- `BAD_REQUEST`: 不正なリクエスト
- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限がない
- `NOT_FOUND`: リソースが見つからない
- `INTERNAL_SERVER_ERROR`: サーバーエラー

### エラーレスポンス例

```typescript
{
  error: {
    code: "FORBIDDEN",
    message: "Admin access required"
  }
}
```

### クライアント側のエラーハンドリング

```typescript
const mutation = trpc.templates.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'FORBIDDEN') {
      toast.error('管理者権限が必要です');
    } else {
      toast.error('エラーが発生しました');
    }
  },
});
```

## レート制限

現在、レート制限は実装されていません。将来的に実装予定です。

## バージョニング

現在のAPIバージョン: v1

APIバージョンはURLに含まれません。破壊的変更が必要な場合は、新しいエンドポイントを追加します。

## サポート

API仕様に関する質問は、[https://help.manus.im](https://help.manus.im) までお問い合わせください。
