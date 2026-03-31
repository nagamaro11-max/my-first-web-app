#!/bin/bash

# ============================================
# デプロイスクリプト (Deployment Script)
# ファイルの検証とデプロイシミュレーション
# ============================================

set -e  # エラーで即座に終了

# 色を定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'  # 色のリセット

# グローバル変数
DEPLOY_ERRORS=0
DEPLOY_WARNINGS=0

# ロギング関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((DEPLOY_WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((DEPLOY_ERRORS++))
}

# ファイル存在確認関数
check_file_exists() {
    local file_path=$1
    local description=$2

    if [ -f "$file_path" ]; then
        log_success "$description が存在します: $file_path"
        return 0
    else
        log_error "$description が見つかりません: $file_path"
        return 1
    fi
}

# ディレクトリ存在確認関数
check_dir_exists() {
    local dir_path=$1
    local description=$2

    if [ -d "$dir_path" ]; then
        log_success "$description ディレクトリが存在します: $dir_path"
        return 0
    else
        log_error "$description ディレクトリが見つかりません: $dir_path"
        return 1
    fi
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   デプロイプロセス開始${NC}"
echo -e "${CYAN}========================================${NC}"
log_info "プロジェクトルート: $PROJECT_ROOT"
log_info "デプロイタイムスタンプ: $(date '+%Y-%m-%d %H:%M:%S')"

# ============================================
# ステップ 1: ビルド済みファイルの検証
# ============================================
echo -e "\n${CYAN}[ステップ 1]${NC} ビルド済みファイルを検証しています..."

check_dir_exists "$DIST_DIR" "dist"

if [ -d "$DIST_DIR" ]; then
    check_file_exists "$DIST_DIR/index.html" "index.html"
    check_dir_exists "$DIST_DIR/css" "CSS"
    check_dir_exists "$DIST_DIR/js" "JavaScript"
fi

# ============================================
# ステップ 2: ファイル権限の確認
# ============================================
echo -e "\n${CYAN}[ステップ 2]${NC} ファイル権限を確認しています..."

if [ -f "$DIST_DIR/index.html" ]; then
    if [ -r "$DIST_DIR/index.html" ]; then
        log_success "index.html の読み取り権限があります"
    else
        log_warning "index.html の読み取り権限がありません"
    fi
fi

# ============================================
# ステップ 3: ファイルサイズチェック
# ============================================
echo -e "\n${CYAN}[ステップ 3]${NC} ファイルサイズをチェックしています..."

if [ -d "$DIST_DIR" ]; then
    TOTAL_SIZE=$(du -sh "$DIST_DIR" 2>/dev/null | cut -f1)
    log_info "dist ディレクトリの合計サイズ: $TOTAL_SIZE"

    # ファイル数をカウント
    FILE_COUNT=$(find "$DIST_DIR" -type f 2>/dev/null | wc -l)
    log_info "ファイル数: $FILE_COUNT"
fi

# ============================================
# ステップ 4: HTML 構文チェック (シミュレーション)
# ============================================
echo -e "\n${CYAN}[ステップ 4]${NC} HTML 構文をチェックしています..."

if [ -f "$DIST_DIR/index.html" ]; then
    # 基本的な HTML タグの確認
    if grep -q "<html" "$DIST_DIR/index.html"; then
        log_success "HTML タグが見つかりました"
    else
        log_warning "HTML タグが見つかりません"
    fi

    if grep -q "<body" "$DIST_DIR/index.html"; then
        log_success "BODY タグが見つかりました"
    else
        log_warning "BODY タグが見つかりません"
    fi

    if grep -q "<head" "$DIST_DIR/index.html"; then
        log_success "HEAD タグが見つかりました"
    else
        log_warning "HEAD タグが見つかりません"
    fi
else
    log_warning "HTML ファイルのチェックをスキップしています (ファイルが見つかりません)"
fi

# ============================================
# ステップ 5: デプロイシミュレーション
# ============================================
echo -e "\n${CYAN}[ステップ 5]${NC} デプロイをシミュレーションしています..."

log_info "1. ファイルを本番サーバーにアップロード中..."
sleep 0.5
log_success "  - ファイルのアップロードが完了しました"

log_info "2. キャッシュをクリア中..."
sleep 0.3
log_success "  - キャッシュをクリアしました"

log_info "3. サービスを再起動中..."
sleep 0.3
log_success "  - サービスの再起動が完了しました"

log_info "4. ヘルスチェック実施中..."
sleep 0.3
log_success "  - ヘルスチェック OK"

# ============================================
# ステップ 6: デプロイ後の確認
# ============================================
echo -e "\n${CYAN}[ステップ 6]${NC} デプロイ後の確認をしています..."

if [ -d "$DIST_DIR" ]; then
    HTML_COUNT=$(find "$DIST_DIR" -name "*.html" | wc -l)
    CSS_COUNT=$(find "$DIST_DIR" -name "*.css" | wc -l)
    JS_COUNT=$(find "$DIST_DIR" -name "*.js" | wc -l)

    log_success "HTML ファイル: $HTML_COUNT 個"
    log_success "CSS ファイル: $CSS_COUNT 個"
    log_success "JavaScript ファイル: $JS_COUNT 個"
fi

# ============================================
# デプロイ完了サマリー
# ============================================
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}   デプロイサマリー${NC}"
echo -e "${CYAN}========================================${NC}"

log_info "デプロイ日時: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "エラー数: ${RED}$DEPLOY_ERRORS${NC}"
log_info "警告数: ${YELLOW}$DEPLOY_WARNINGS${NC}"

if [ $DEPLOY_ERRORS -eq 0 ]; then
    log_success "デプロイが正常に完了しました"
    log_success "本番環境への配備は完了です"
    exit 0
else
    log_error "デプロイ中にエラーが発生しました"
    echo -e "${RED}エラー数: $DEPLOY_ERRORS${NC}"
    exit 1
fi
