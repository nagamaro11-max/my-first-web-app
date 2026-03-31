#!/bin/bash

# ============================================
# 検証スクリプト (Validation Script)
# HTML 構造、参照ファイル、一般的な問題をチェック
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
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0
VALIDATION_SUCCESSES=0

# ロギング関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((VALIDATION_SUCCESSES++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((VALIDATION_WARNINGS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((VALIDATION_ERRORS++))
}

# HTML ファイル検証関数
validate_html_file() {
    local html_file=$1
    log_info "HTML ファイルを検証しています: $html_file"

    if [ ! -f "$html_file" ]; then
        log_error "HTML ファイルが見つかりません: $html_file"
        return 1
    fi

    local file_size=$(wc -c < "$html_file")
    if [ "$file_size" -lt 50 ]; then
        log_warning "HTML ファイルが非常に小さいです (${file_size} bytes)"
    fi

    # 必須タグのチェック
    if grep -q "<html" "$html_file"; then
        log_success "HTML タグが存在します"
    else
        log_error "HTML タグがありません"
    fi

    if grep -q "<head" "$html_file"; then
        log_success "HEAD セクションが存在します"
    else
        log_error "HEAD セクションがありません"
    fi

    if grep -q "<body" "$html_file"; then
        log_success "BODY セクションが存在します"
    else
        log_error "BODY セクションがありません"
    fi

    if grep -q "<title" "$html_file"; then
        log_success "TITLE タグが存在します"
    else
        log_warning "TITLE タグがありません"
    fi

    if grep -q "<!DOCTYPE" "$html_file"; then
        log_success "DOCTYPE 宣言が存在します"
    else
        log_warning "DOCTYPE 宣言がありません"
    fi

    # メタタグのチェック
    if grep -q 'charset' "$html_file"; then
        log_success "文字エンコーディング指定があります"
    else
        log_warning "文字エンコーディング指定がありません"
    fi

    # viewport メタタグのチェック
    if grep -q 'viewport' "$html_file"; then
        log_success "ビューポート設定があります (レスポンシブ対応)"
    else
        log_warning "ビューポート設定がありません"
    fi
}

# 参照ファイル検証関数
validate_referenced_files() {
    local html_file=$1
    local project_root=$2

    log_info "参照ファイルを検証しています..."

    # CSS ファイルの参照をチェック
    grep -o 'href="[^"]*\.css"' "$html_file" | sed 's/href="\(.*\)"/\1/' | while read -r css_ref; do
        # 絶対パスと相対パスを処理
        if [[ "$css_ref" == /* ]]; then
            css_path="$project_root$css_ref"
        else
            css_path="$(dirname "$html_file")/$css_ref"
        fi

        # .. を含むパスを処理
        css_path=$(cd "$(dirname "$css_path")" 2>/dev/null && pwd)/$(basename "$css_path") 2>/dev/null || true

        if [ -f "$css_path" ]; then
            log_success "CSS ファイルが存在します: $css_ref"
        else
            log_warning "CSS ファイルが見つかりません: $css_ref"
        fi
    done

    # JavaScript ファイルの参照をチェック
    grep -o 'src="[^"]*\.js"' "$html_file" | sed 's/src="\(.*\)"/\1/' | while read -r js_ref; do
        if [[ "$js_ref" == /* ]]; then
            js_path="$project_root$js_ref"
        else
            js_path="$(dirname "$html_file")/$js_ref"
        fi

        if [ -f "$js_path" ]; then
            log_success "JavaScript ファイルが存在します: $js_ref"
        else
            log_warning "JavaScript ファイルが見つかりません: $js_ref"
        fi
    done

    # 画像ファイルの参照をチェック
    grep -o 'src="[^"]*\.\(png\|jpg\|jpeg\|gif\|svg\|webp\)"' "$html_file" | sed 's/src="\(.*\)"/\1/' | while read -r img_ref; do
        if [[ "$img_ref" == /* ]]; then
            img_path="$project_root$img_ref"
        else
            img_path="$(dirname "$html_file")/$img_ref"
        fi

        if [ -f "$img_path" ]; then
            log_success "画像ファイルが存在します: $img_ref"
        else
            log_warning "画像ファイルが見つかりません: $img_ref"
        fi
    done
}

# 一般的な問題をチェック
check_common_issues() {
    local html_file=$1

    log_info "一般的な問題をチェックしています..."

    # 重複する ID の確認
    local duplicate_ids=$(grep -o 'id="[^"]*"' "$html_file" | sort | uniq -d | wc -l)
    if [ "$duplicate_ids" -gt 0 ]; then
        log_warning "重複する ID が見つかりました: $duplicate_ids 個"
    else
        log_success "重複する ID はありません"
    fi

    # 閉じられていないタグの簡易チェック
    local open_divs=$(grep -o '<div' "$html_file" | wc -l)
    local close_divs=$(grep -o '</div>' "$html_file" | wc -l)
    if [ "$open_divs" -eq "$close_divs" ]; then
        log_success "DIV タグが正しく閉じられています ($open_divs)"
    else
        log_warning "DIV タグの数が一致しません: 開き $open_divs, 閉じ $close_divs"
    fi

    # 外部リンクの確認
    local external_links=$(grep -o 'href="http' "$html_file" | wc -l)
    if [ "$external_links" -gt 0 ]; then
        log_info "外部リンクが見つかりました: $external_links 個"
    fi

    # インラインスタイルの警告
    local inline_styles=$(grep -o 'style="' "$html_file" | wc -l)
    if [ "$inline_styles" -gt 0 ]; then
        log_warning "インラインスタイルが見つかりました: $inline_styles 個 (外部 CSS の使用を推奨)"
    else
        log_success "インラインスタイルはありません"
    fi

    # デバッグコメントの確認
    if grep -q '<!-- DEBUG' "$html_file"; then
        log_warning "デバッグコメントが見つかりました"
    else
        log_success "デバッグコメントはありません"
    fi
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   検証プロセス開始${NC}"
echo -e "${CYAN}========================================${NC}"
log_info "プロジェクトルート: $PROJECT_ROOT"
log_info "検証開始時刻: $(date '+%Y-%m-%d %H:%M:%S')"

# ============================================
# プロジェクト構造の確認
# ============================================
echo -e "\n${CYAN}[ステップ 1]${NC} プロジェクト構造を確認しています..."

if [ -f "$PROJECT_ROOT/index.html" ]; then
    log_success "index.html が見つかりました"
else
    log_error "index.html が見つかりません"
fi

if [ -d "$PROJECT_ROOT/css" ]; then
    log_success "css ディレクトリが存在します"
else
    log_warning "css ディレクトリが見つかりません"
fi

if [ -d "$PROJECT_ROOT/js" ]; then
    log_success "js ディレクトリが存在します"
else
    log_warning "js ディレクトリが見つかりません"
fi

if [ -d "$PROJECT_ROOT/img" ]; then
    log_success "img ディレクトリが存在します"
else
    log_warning "img ディレクトリが見つかりません"
fi

# ============================================
# HTML ファイルの検証
# ============================================
echo -e "\n${CYAN}[ステップ 2]${NC} HTML ファイルを検証しています..."

if [ -f "$PROJECT_ROOT/index.html" ]; then
    validate_html_file "$PROJECT_ROOT/index.html"
fi

# 追加の HTML ファイルをチェック
find "$PROJECT_ROOT" -maxdepth 2 -name "*.html" ! -path "*/dist/*" ! -path "*/node_modules/*" | while read -r html_file; do
    if [ "$html_file" != "$PROJECT_ROOT/index.html" ]; then
        log_info "追加の HTML ファイルを検証: $html_file"
        validate_html_file "$html_file"
    fi
done

# ============================================
# 参照ファイルの検証
# ============================================
echo -e "\n${CYAN}[ステップ 3]${NC} 参照ファイルを検証しています..."

if [ -f "$PROJECT_ROOT/index.html" ]; then
    validate_referenced_files "$PROJECT_ROOT/index.html" "$PROJECT_ROOT"
fi

# ============================================
# 一般的な問題のチェック
# ============================================
echo -e "\n${CYAN}[ステップ 4]${NC} 一般的な問題をチェックしています..."

if [ -f "$PROJECT_ROOT/index.html" ]; then
    check_common_issues "$PROJECT_ROOT/index.html"
fi

# ============================================
# CSS ファイルの検証
# ============================================
echo -e "\n${CYAN}[ステップ 5]${NC} CSS ファイルを検証しています..."

if [ -d "$PROJECT_ROOT/css" ]; then
    css_files=$(find "$PROJECT_ROOT/css" -name "*.css" | wc -l)
    if [ "$css_files" -gt 0 ]; then
        log_success "CSS ファイルが見つかりました: $css_files 個"

        find "$PROJECT_ROOT/css" -name "*.css" | while read -r css_file; do
            css_size=$(wc -c < "$css_file")
            log_info "CSS: $(basename "$css_file") (${css_size} bytes)"
        done
    else
        log_warning "CSS ファイルが見つかりません"
    fi
fi

# ============================================
# JavaScript ファイルの検証
# ============================================
echo -e "\n${CYAN}[ステップ 6]${NC} JavaScript ファイルを検証しています..."

if [ -d "$PROJECT_ROOT/js" ]; then
    js_files=$(find "$PROJECT_ROOT/js" -name "*.js" | wc -l)
    if [ "$js_files" -gt 0 ]; then
        log_success "JavaScript ファイルが見つかりました: $js_files 個"

        find "$PROJECT_ROOT/js" -name "*.js" | while read -r js_file; do
            js_size=$(wc -c < "$js_file")
            log_info "JS: $(basename "$js_file") (${js_size} bytes)"
        done
    else
        log_warning "JavaScript ファイルが見つかりません"
    fi
fi

# ============================================
# 検証結果サマリー
# ============================================
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}   検証結果サマリー${NC}"
echo -e "${CYAN}========================================${NC}"

log_info "成功: ${GREEN}$VALIDATION_SUCCESSES${NC}"
log_info "警告: ${YELLOW}$VALIDATION_WARNINGS${NC}"
log_info "エラー: ${RED}$VALIDATION_ERRORS${NC}"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    log_success "検証が完了しました (エラーなし)"
    exit 0
else
    log_error "検証中にエラーが見つかりました ($VALIDATION_ERRORS 個)"
    exit 1
fi
