# OrcaOS - Web-based OS Simulator

超軽量なウェブベースのOSシミュレーター。デスクトップUI、ターミナル、ファイルマネージャーを備えています。

## 特徴

- デスクトップ環境（ウィンドウのドラッグ、リサイズ、最小化、最大化）
- 高機能ターミナル（30以上のLinuxコマンドをサポート）
- ファイルマネージャー（仮想ファイルシステム）
- モダンなダークテーマ
- 完全にブラウザで動作
- クロスプラットフォーム対応（Windows、macOS、Linux）

## 最も簡単な実行方法

### 方法1: v0プレビュー（推奨・最速）
チャット内の **Version Box** をクリックするだけで即座に実行できます。

### 方法2: Vercelにデプロイ
右上の **Publish** ボタンをクリックして、オンラインで公開できます。

### 方法3: GitHubからダウンロード
1. チャット画面右上「⋮」→「Settings」→「GitHub」
2. 「Create Repository」をクリック
3. リポジトリをクローン:
   ```bash
   git clone <リポジトリURL>
   cd orcaos
   npm install
   npm run dev
   ```

## Windowsでローカル実行

### 自動セットアップ（推奨）

1. プロジェクトフォルダを開く
2. `setup.bat` をダブルクリック
3. 自動的にインストールと起動が完了します

### 2回目以降の起動

`start.bat` をダブルクリックするだけ

### 手動セットアップ

コマンドプロンプトで:

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

## macOS/Linuxでローカル実行

### 自動セットアップ（推奨）

```bash
# 実行権限を付与
chmod +x setup.sh start.sh check-system.sh

# セットアップを実行
./setup.sh
```

### 2回目以降の起動

```bash
./start.sh
```

### 手動セットアップ

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

## システム要件

- Node.js 18以上（https://nodejs.org/ からダウンロード）
- Windows 10/11、macOS、またはLinux
- モダンなウェブブラウザ

## トラブルシューティング

### Download ZIPでエラーが出る場合

エラー38が表示される場合は、以下のいずれかの方法をお試しください:

1. **GitHub経由**（上記の方法3を参照）
2. **v0プレビュー**で直接実行（Version Boxをクリック）
3. **Vercel**にデプロイ（Publishボタンをクリック）

### localhost:3000に接続できない場合

#### Windows
```bash
check-system.bat
```

#### macOS/Linux
```bash
./check-system.sh
```

#### Node.jsを確認
```bash
node --version
```
表示されない場合は https://nodejs.org/ からインストール

#### 依存関係を再インストール
```bash
npm install
```

#### サーバーを手動起動
```bash
npm run dev
```

#### 別のポートを使用
```bash
npm run dev -- -p 3001
```
ブラウザで http://localhost:3001 を開く

詳細は `TROUBLESHOOTING.md` を参照してください。

## 利用可能なターミナルコマンド

### ファイル操作
- `ls [dir]` - ディレクトリの内容を表示
- `cd <dir>` - ディレクトリを移動
- `pwd` - 現在のディレクトリを表示
- `cat <file>` - ファイルの内容を表示
- `mkdir <dir>` - ディレクトリを作成
- `touch <file>` - 空のファイルを作成
- `rm <file>` - ファイル/ディレクトリを削除
- `cp <src> <dst>` - ファイルをコピー
- `mv <src> <dst>` - ファイルを移動/名前変更
- `find <name>` - ファイルを名前で検索
- `grep <text> <file>` - ファイル内のテキストを検索

### テキストエディタ
- `vi <file>` - viエディタ（シミュレート）
- `nano <file>` - nanoエディタ（シミュレート）
- `echo <text> [> file]` - テキストを表示/ファイルに書き込み

### システム情報
- `clear` - ターミナルをクリア
- `date` - 現在の日時を表示
- `uname` - システム情報を表示
- `whoami` - 現在のユーザーを表示
- `uptime` - システム稼働時間を表示
- `df` - ディスク使用状況を表示
- `ps` - プロセス一覧を表示
- `env` - 環境変数を表示
- `help` - コマンド一覧を表示
- `history` - コマンド履歴のヒント

### 使用例

```bash
# ディレクトリを作成してファイルを作成
$ mkdir myproject
$ cd myproject
$ touch readme.txt
$ echo "Hello OrcaOS" > readme.txt
$ cat readme.txt

# ファイルを検索
$ find readme
$ grep Hello readme.txt

# システム情報を確認
$ uname
$ date
$ whoami
```

## プロジェクト構造

```
orcaos/
├── app/
│   ├── page.tsx          # メインページ
│   ├── layout.tsx        # レイアウト
│   └── globals.css       # グローバルスタイル
├── components/
│   ├── desktop.tsx       # デスクトップ環境
│   ├── window.tsx        # ウィンドウコンポーネント
│   ├── terminal.tsx      # ターミナルアプリ
│   ├── file-manager.tsx  # ファイルマネージャー
│   └── taskbar.tsx       # タスクバー（ロゴ表示）
├── hooks/
│   └── use-file-system.ts # 仮想ファイルシステム（拡張版）
├── public/
│   └── orcaos01.jpg      # OrcaOSロゴ
├── setup.bat             # Windowsセットアップスクリプト
├── start.bat             # Windows起動スクリプト
├── check-system.bat      # Windowsシステム診断ツール
├── setup.sh              # macOS/Linuxセットアップスクリプト
├── start.sh              # macOS/Linux起動スクリプト
└── check-system.sh       # macOS/Linuxシステム診断ツール
```

## 技術スタック

- Next.js 16（React 19）
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Next.js Image optimization

## ライセンス

MIT License
