# LightOS クイックスタート

## 3つの実行方法

### 🚀 最速: v0プレビュー（0分）
チャット内の **Version Box** をクリック → 完了

### ☁️ 簡単: Vercel（1分）
**Publish** ボタンをクリック → デプロイ完了 → URLで共有可能

### 💻 ローカル: Windows（3分）

#### ステップ1: ダウンロード
- GitHub経由:
  1. チャット右上「⋮」→「Settings」→「GitHub」
  2. 「Create Repository」
  3. リポジトリをクローン

#### ステップ2: インストールと起動
```bash
# フォルダに移動
cd lightos

# setup.bat をダブルクリック
# または
npm install
npm run dev
```

#### ステップ3: ブラウザで開く
http://localhost:3000

## トラブル発生時

### エラー: Download ZIPが動作しない
→ **GitHub経由**または**v0プレビュー**を使用

### エラー: localhost:3000に接続できない
```bash
# 1. 診断
check-system.bat

# 2. Node.jsを確認
node --version

# 3. 再インストール
npm install

# 4. 起動
npm run dev
```

### エラー: ポート3000が使用中
```bash
npm run dev -- -p 3001
```
→ http://localhost:3001 を開く

## 使い方

### デスクトップ
- タスクバーのアイコンをクリックしてアプリを起動
- ウィンドウをドラッグして移動
- 角をドラッグしてリサイズ

### ターミナル
```bash
help        # コマンド一覧
ls          # ファイル一覧
cd home     # ディレクトリ移動
cat file    # ファイル表示
```

### ファイルマネージャー
- フォルダをクリックして移動
- 「←」ボタンで戻る
- 「🏠」ボタンでホームへ

## サポートが必要な場合

詳細なガイド:
- `README.md` - 完全なドキュメント
- `TROUBLESHOOTING.md` - トラブルシューティング

問題が解決しない場合:
1. `check-system.bat` の結果をコピー
2. エラーメッセージのスクリーンショット
3. `node --version` の結果
