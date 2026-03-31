#!/bin/bash

# ============================================
# ビルドスクリプト (Build Script)
# HTML/CSS/JS をミニファイして dist フォルダに出力
# ============================================

set -e  # エラーで即座に終了

# 色を定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # 色のリセット

# ロギング関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

log_info "ビルドプロセスを開始します..."
log_info "プロジェクトルート: $PROJECT_ROOT"

# ============================================
# 既存の dist ディレクトリをクリーンアップ
# ============================================
if [ -d "$DIST_DIR" ]; then
    log_info "既存の dist ディレクトリを削除しています..."
    rm -rf "$DIST_DIR"
fi

# ============================================
# dist ディレクトリ構造を作成
# ============================================
log_info "dist ディレクトリ構造を作成しています..."
mkdir -p "$DIST_DIR"
mkdir -p "$DIST_DIR/css"
mkdir -p "$DIST_DIR/js"
mkdir -p "$DIST_DIR/img"

# ============================================
# HTML ファイルをミニファイ (シミュレーション)
# ============================================
log_info "HTML ファイルをミニファイしています..."
if [ -f "$PROJECT_ROOT/index.html" ]; then
    # 注: 実際のミニファイは htmlmin 等を使用
    # ここでは echo でシミュレーション
    cp "$PROJECT_ROOT/index.html" "$DIST_DIR/index.html"
    log_success "index.html をコピーしました"
else
    log_warning "index.html が見つかりません"
fi

# ============================================
# CSS ファイルをミニファイ (シミュレーション)
# ============================================
log_info "CSS ファイルをミニファイしています..."
if [ -d "$PROJECT_ROOT/css" ]; then
    find "$PROJECT_ROOT/css" -name "*.css" | while read -r css_file; do
        filename=$(basename "$css_file")
        # 注: 実際のミニファイは csso や cleancss を使用
        cp "$css_file" "$DIST_DIR/css/$filename"
        log_success "CSS: $filename をコピーしました"
    done
else
    log_warning "css ディレクトリが見つかりません"
fi

# ============================================
# JavaScript ファイルをミニファイ (シミュレーション)
# ============================================
log_info "JavaScript ファイルをミニファイしています..."
if [ -d "$PROJECT_ROOT/js" ]; then
    find "$PROJECT_ROOT/js" -name "*.js" | while read -r js_file; do
        filename=$(basename "$js_file")
        # 注: 実際のミニファイは terser や uglify を使用
        cp "$js_file" "$DIST_DIR/js/$filename"
        log_success "JS: $filename をコピーしました"
    done
else
    log_warning "js ディレクトリが見つかりません"
fi

# ============================================
# 画像ファイルをコピー
# ============================================
log_info "画像ファイルをコピーしています..."
if [ -d "$PROJECT_ROOT/img" ]; then
    find "$PROJECT_ROOT/img" -type f | while read -r img_file; do
        filename=$(basename "$img_file")
        cp "$img_file" "$DIST_DIR/img/$filename"
        log_success "IMG: $filename をコピーしました"
    done
else
    log_warning "img ディレクトリが見つかりません"
fi

# ============================================
# ビルド統計を表示
# ============================================
log_info "ビルド統計を計算しています..."
HTML_COUNT=$(find "$DIST_DIR" -name "*.html" | wc -l)
CSS_COUNT=$(find "$DIST_DIR" -name "*.css" | wc -l)
JS_COUNT=$(find "$DIST_DIR" -name "*.js" | wc -l)
IMG_COUNT=$(find "$DIST_DIR/img" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$DIST_DIR" | cut -f1)

# ============================================
# ビルド完了レポート
# ============================================
log_success "===== ビルド完了レポート ====="
echo -e "${BLUE}HTML ファイル: ${GREEN}$HTML_COUNT${NC}"
echo -e "${BLUE}CSS ファイル: ${GREEN}$CSS_COUNT${NC}"
echo -e "${BLUE}JavaScript ファイル: ${GREEN}$JS_COUNT${NC}"
echo -e "${BLUE}画像ファイル: ${GREEN}$IMG_COUNT${NC}"
echo -e "${BLUE}合計サイズ: ${GREEN}$TOTAL_SIZE${NC}"
echo -e "${BLUE}出力ディレクトリ: ${GREEN}$DIST_DIR${NC}"
log_success "===== ビルド完了 ====="
