-- Exhibition Gallery テーブル構造更新マイグレーション
-- Supabase Dashboard の SQL Editor で実行してください

-- 1. user_id カラムを追加（既存データには NULL を許可）
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. status カラムを追加（既存データはデフォルトで 'complete'）
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'complete' CHECK (status IN ('draft', 'complete'));

-- 3. image_url を image_urls (JSONB配列) に変更
-- 既存の image_url データを配列に変換してから新カラムに移行
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- 既存の image_url データを image_urls に移行
UPDATE exhibitions
SET image_urls =
  CASE
    WHEN image_url IS NOT NULL AND image_url != ''
    THEN jsonb_build_array(image_url)
    ELSE '[]'::jsonb
  END
WHERE image_urls = '[]'::jsonb;

-- 4. 古い image_url カラムを削除（オプション：データ移行後に実行）
-- ALTER TABLE exhibitions DROP COLUMN IF EXISTS image_url;

-- 5. Row Level Security (RLS) を有効化
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

-- 6. RLS ポリシー: ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view their own exhibitions"
ON exhibitions FOR SELECT
USING (auth.uid() = user_id);

-- 7. RLS ポリシー: ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert their own exhibitions"
ON exhibitions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. RLS ポリシー: ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update their own exhibitions"
ON exhibitions FOR UPDATE
USING (auth.uid() = user_id);

-- 9. RLS ポリシー: ユーザーは自分のデータのみ削除可能
CREATE POLICY "Users can delete their own exhibitions"
ON exhibitions FOR DELETE
USING (auth.uid() = user_id);

-- 10. インデックスを作成してパフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_exhibitions_user_id ON exhibitions(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_exhibitions_end_date ON exhibitions(end_date);

-- マイグレーション完了
-- 注意: 既存データがある場合、user_id が NULL のままになります
-- アプリケーション側で既存データの user_id を手動で設定するか、
-- テストデータとして削除してください
