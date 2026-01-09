# LightOS セットアップスクリプト (PowerShell)

Write-Host "================================" -ForegroundColor Cyan
Write-Host " LightOS セットアップ" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Node.jsのバージョン確認
Write-Host "Node.jsのバージョンを確認中..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.jsが見つかりました: $nodeVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "エラー: Node.jsがインストールされていません。" -ForegroundColor Red
    Write-Host "https://nodejs.org/ からNode.jsをインストールしてください。" -ForegroundColor Red
    Read-Host "Enterキーを押して終了"
    exit 1
}

# 依存関係のインストール
Write-Host "依存関係をインストール中..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "エラー: インストールに失敗しました。" -ForegroundColor Red
    Read-Host "Enterキーを押して終了"
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host " インストール完了！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "開発サーバーを起動します..." -ForegroundColor Yellow
Write-Host "ブラウザで http://localhost:3000 を開いてください。" -ForegroundColor Cyan
Write-Host ""
Write-Host "サーバーを停止するには Ctrl+C を押してください。" -ForegroundColor Yellow
Write-Host ""

Start-Process "http://localhost:3000"
npm run dev
