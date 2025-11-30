# Exhibition Gallery 🎨

展示会を美しく管理するWebアプリケーション

## ✨ 主な機能

### 🔐 ユーザー認証
- Supabase Authによるメール/パスワード認証
- ユーザーごとにデータを分離管理
- セキュアなセッション管理

### 📝 下書き機能
- **下書き保存**: 写真があれば保存可能（他の項目は任意）
- **完成**: 全項目入力必須で完成状態に
- 下書きと登録済みを分けて表示

### 🖼️ 複数画像対応
- 複数の画像を一度にアップロード可能
- ギャラリー形式で表示（最大4枚のプレビュー）
- クリックで拡大表示・スライドショー機能

### 📅 カレンダー連携
- Google Calendarに直接追加
- .icsファイルのダウンロード

### 🗺️ 地図連携
- Google Mapsで場所を確認

### ⭐ その他の機能
- 優先度設定（5段階の星評価）
- 終了日までのカウントダウン表示
- タイムライン表示（終了日が近い順）
- レスポンシブデザイン

## 🚀 セットアップ手順

### 1. 環境変数の設定

`.env`ファイルを作成し、Supabaseの認証情報を設定：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabaseデータベースのセットアップ

Supabase DashboardのSQL Editorで`supabase-migration.sql`を実行してください。

このマイグレーションでは以下を実行します：
- `user_id`カラムの追加（ユーザーごとのデータ分離）
- `status`カラムの追加（draft / complete）
- `image_urls`カラムの追加（複数画像対応）
- Row Level Security (RLS)の設定
- 必要なインデックスの作成

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. ビルド

```bash
npm run build
```

## 🛠️ 技術スタック

- **フロントエンド**: React 18
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase
  - 認証: Supabase Auth
  - データベース: PostgreSQL
  - RLS (Row Level Security)
- **アイコン**: Lucide React
- **ビルドツール**: Vite

## 📦 プロジェクト構造

```
exhibition-gallery/
├── src/
│   ├── components/
│   │   └── Auth.jsx          # 認証コンポーネント
│   ├── App.jsx                # メインアプリケーション
│   └── ...
├── supabase-migration.sql     # データベースマイグレーション
├── package.json
└── README.md
```

## 🎨 デザインコンセプト

- **カラー**: 紫→ピンク→白のグラデーション背景
- **カード**: 白背景、ソフトシャドウ（shadow-md）
- **余白**: 大きめに取り、装飾は最小限
- **フォント**: 上品で読みやすいデザイン

## 📱 使い方

1. **アカウント作成 / ログイン**
   - メールアドレスとパスワードで登録/ログイン

2. **展示会を追加**
   - 「展示会を追加」ボタンをクリック
   - 写真を1枚以上アップロード（複数可）
   - 展示会情報を入力
   - 「下書き保存」または「完成」をクリック

3. **下書きから完成へ**
   - 下書き中のカードから「編集」をクリック
   - 全項目を入力して「完成」をクリック

4. **画像を見る**
   - カード内の画像をクリックで拡大表示
   - 左右の矢印で画像を切り替え

5. **カレンダーに追加**
   - 「Google」ボタンでGoogle Calendarに追加
   - 「.ics」ボタンでカレンダーファイルをダウンロード

## 🔒 セキュリティ

- Row Level Security (RLS)により、ユーザーは自分のデータのみアクセス可能
- Supabase Authによる安全な認証
- 環境変数による機密情報の管理

## 📝 ライセンス

MIT

## 🙏 謝辞

- [Supabase](https://supabase.com/) - バックエンドサービス
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Lucide](https://lucide.dev/) - アイコン
