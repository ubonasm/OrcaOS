# トラブルシューティングガイド

## よくある問題と解決方法

### 1. Download ZIPでエラー38が表示される

**原因**: v0のダウンロード機能の一時的な問題

**解決方法**:

#### 方法A: GitHub経由でダウンロード（推奨）
1. チャット画面右上の「⋮」→「Settings」→「GitHub」
2. 「Create Repository」をクリック
3. GitHubリポジトリが作成されます
4. リポジトリをクローン:
   ```bash
   git clone <リポジトリURL>
   cd <プロジェクト名>
   npm install
   npm run dev
   ```

#### 方法B: v0プレビューを使用
- チャット内の「Version Box」をクリックして直接ブラウザで実行

#### 方法C: Vercelにデプロイ
- チャット画面右上の「Publish」ボタンをクリック

### 2. localhost:3000が開かない

**症状**: ブラウザで「このサイトにアクセスできません」「ERR_CONNECTION_REFUSED」

**診断手順**:

1. **Node.jsの確認**
   ```bash
   node --version
   ```
   - バージョンが表示されない場合: https://nodejs.org/ からインストール

2. **依存関係の確認**
   ```bash
   npm install
   ```
   - エラーが出る場合は、node_modulesフォルダを削除して再実行

3. **サーバーの手動起動**
   ```bash
   npm run dev
   ```
   - エラーメッセージを確認
   - 「Local: http://localhost:3000」と表示されたら成功

4. **ポートの確認**
   - ポート3000が使用中の場合、`start.bat`は自動的に3001を使用します
   - 手動で別のポートを指定:
     ```bash
     npm run dev -- -p 3001
     ```

### 3. setup.batやstart.batが動作しない

**解決方法**:

#### PowerShellで実行
```powershell
# setup.ps1を右クリック→「PowerShellで実行」
```

#### 手動でコマンド実行
コマンドプロンプトを開いて:
```bash
cd C:\path\to\lightos
npm install
npm run dev
```

### 4. ファイルが見当たらない

**確認事項**:

1. ZIPファイルを正しく展開したか確認
2. 以下のファイルが存在するか確認:
   - `package.json`
   - `app/page.tsx`
   - `components/desktop.tsx`
   - `setup.bat`

3. ファイルが見つからない場合:
   - GitHub経由で再度ダウンロード
   - または v0プレビューで直接実行

### 5. npm が認識されない

**症状**: `'npm' は、内部コマンドまたは外部コマンド...として認識されていません`

**解決方法**:

1. Node.jsを再インストール
2. インストール時に「Add to PATH」にチェックが入っていることを確認
3. コマンドプロンプトを再起動
4. 再度確認:
   ```bash
   node --version
   npm --version
   ```

### 6. 依存関係のエラー

**症状**: `Cannot find module 'next'` などのエラー

**解決方法**:

```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesを削除
rmdir /s /q node_modules

# package-lock.jsonを削除
del package-lock.json

# 再インストール
npm install

# 起動
npm run dev
```

### 7. ビルドエラー

**症状**: TypeScriptやReactのエラー

**解決方法**:

```bash
# 型定義の再インストール
npm install --save-dev @types/react @types/node

# .next フォルダを削除
rmdir /s /q .next

# 再起動
npm run dev
```

### 8. ブラウザで画面が真っ白

**確認事項**:

1. ブラウザのコンソールを開いてエラーを確認（F12キー）
2. サーバーが正常に起動しているか確認
3. 正しいURL（http://localhost:3000）にアクセスしているか確認

**解決方法**:

- ページをリロード（Ctrl + Shift + R）
- ブラウザのキャッシュをクリア
- 別のブラウザで試す

## システム要件の確認

`check-system.bat` をダブルクリックすると、以下を自動診断します:

- Node.jsのインストール状態
- npmのバージョン
- プロジェクトファイルの存在
- 依存関係のインストール状態
- ポート3000の使用状況

## それでも解決しない場合

以下の情報を収集してサポートに連絡してください:

1. エラーメッセージの全文（スクリーンショット）
2. `check-system.bat` の実行結果
3. 使用しているNode.jsのバージョン (`node --version`)
4. 使用しているOS（Windows 10/11など）
5. 実行したコマンドと結果

## 推奨: v0プレビューまたはVercelで実行

ローカル実行で問題が多い場合は、以下の方法を推奨します:

- **v0プレビュー**: Version Boxをクリックするだけで即座に実行
- **Vercel**: Publishボタンで簡単にデプロイ、どこからでもアクセス可能
```

```batch file="" isHidden
