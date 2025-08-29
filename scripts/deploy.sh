#!/bin/bash

# 图片水印处理系统 - 自动部署脚本
# 支持开发、测试、生产环境的自动化部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="image-watermark"
REPO_URL="https://github.com/your-username/image-watermark.git"
DEFAULT_BRANCH="main"
DEFAULT_ENV="production"

# 函数：打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

print_info() {
    print_message $BLUE "$1"
}

print_success() {
    print_message $GREEN "$1"
}

print_warning() {
    print_message $YELLOW "$1"
}

print_error() {
    print_message $RED "$1"
}

# 函数：显示帮助信息
show_help() {
    echo "图片水印处理系统 - 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -e, --env ENV          部署环境 (development|staging|production) [默认: production]"
    echo "  -b, --branch BRANCH    Git 分支 [默认: main]"
    echo "  -d, --dir DIRECTORY    部署目录 [默认: /var/www/image-watermark]"
    echo "  -u, --user USER        部署用户 [默认: deploy]"
    echo "  -p, --pm2              使用 PM2 管理进程"
    echo "  -D, --docker           使用 Docker 部署"
    echo "  -c, --clean            清理旧文件"
    echo "  -s, --skip-build       跳过构建步骤"
    echo "  -t, --test             运行测试"
    echo "  -h, --help             显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -e production -b main -p"
    echo "  $0 --env staging --docker --clean"
    echo "  $0 --help"
}

# 默认值
ENVIRONMENT=$DEFAULT_ENV
BRANCH=$DEFAULT_BRANCH
DEPLOY_DIR="/var/www/$APP_NAME"
DEPLOY_USER="deploy"
USE_PM2=false
USE_DOCKER=false
CLEAN_DEPLOY=false
SKIP_BUILD=false
RUN_TESTS=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -d|--dir)
            DEPLOY_DIR="$2"
            shift 2
            ;;
        -u|--user)
            DEPLOY_USER="$2"
            shift 2
            ;;
        -p|--pm2)
            USE_PM2=true
            shift
            ;;
        -D|--docker)
            USE_DOCKER=true
            shift
            ;;
        -c|--clean)
            CLEAN_DEPLOY=true
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -t|--test)
            RUN_TESTS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 验证环境参数
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "无效的环境: $ENVIRONMENT"
    print_info "支持的环境: development, staging, production"
    exit 1
fi

# 函数：检查依赖
check_dependencies() {
    print_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    print_info "Node.js 版本: $node_version"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装"
        exit 1
    fi
    
    # 检查 PM2 (如果需要)
    if [[ "$USE_PM2" == true ]] && ! command -v pm2 &> /dev/null; then
        print_warning "PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    # 检查 Docker (如果需要)
    if [[ "$USE_DOCKER" == true ]] && ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    
    print_success "依赖检查完成"
}

# 函数：创建部署目录
setup_deploy_directory() {
    print_info "设置部署目录: $DEPLOY_DIR"
    
    if [[ "$CLEAN_DEPLOY" == true ]] && [[ -d "$DEPLOY_DIR" ]]; then
        print_warning "清理现有部署目录..."
        rm -rf "$DEPLOY_DIR"
    fi
    
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR/logs"
    mkdir -p "$DEPLOY_DIR/uploads"
    mkdir -p "$DEPLOY_DIR/temp"
    
    print_success "部署目录设置完成"
}

# 函数：克隆或更新代码
deploy_code() {
    print_info "部署代码 (分支: $BRANCH)..."
    
    if [[ -d "$DEPLOY_DIR/.git" ]]; then
        print_info "更新现有代码库..."
        cd "$DEPLOY_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        print_info "克隆代码库..."
        git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
        cd "$DEPLOY_DIR"
    fi
    
    print_success "代码部署完成"
}

# 函数：安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    cd "$DEPLOY_DIR"
    
    # 清理 node_modules (如果是清理部署)
    if [[ "$CLEAN_DEPLOY" == true ]] && [[ -d "node_modules" ]]; then
        print_info "清理现有依赖..."
        rm -rf node_modules package-lock.json
    fi
    
    npm ci --production
    print_success "依赖安装完成"
}

# 函数：运行测试
run_tests() {
    if [[ "$RUN_TESTS" == true ]]; then
        print_info "运行测试..."
        cd "$DEPLOY_DIR"
        npm test
        print_success "测试通过"
    fi
}

# 函数：构建应用
build_application() {
    if [[ "$SKIP_BUILD" == false ]]; then
        print_info "构建应用..."
        cd "$DEPLOY_DIR"
        
        # 设置环境变量
        export NODE_ENV="$ENVIRONMENT"
        
        npm run build
        print_success "应用构建完成"
    else
        print_warning "跳过构建步骤"
    fi
}

# 函数：Docker 部署
deploy_with_docker() {
    print_info "使用 Docker 部署..."
    cd "$DEPLOY_DIR"
    
    # 构建 Docker 镜像
    docker build -t "$APP_NAME:$ENVIRONMENT" .
    
    # 停止现有容器
    if docker ps -q -f name="$APP_NAME" | grep -q .; then
        print_info "停止现有容器..."
        docker stop "$APP_NAME"
        docker rm "$APP_NAME"
    fi
    
    # 启动新容器
    docker run -d \
        --name "$APP_NAME" \
        --restart unless-stopped \
        -p 3000:3000 \
        -v "$DEPLOY_DIR/uploads:/app/uploads" \
        -v "$DEPLOY_DIR/temp:/app/temp" \
        -v "$DEPLOY_DIR/logs:/app/logs" \
        -e NODE_ENV="$ENVIRONMENT" \
        "$APP_NAME:$ENVIRONMENT"
    
    print_success "Docker 部署完成"
}

# 函数：PM2 部署
deploy_with_pm2() {
    print_info "使用 PM2 部署..."
    cd "$DEPLOY_DIR"
    
    # 停止现有进程
    if pm2 list | grep -q "$APP_NAME"; then
        print_info "停止现有 PM2 进程..."
        pm2 stop "$APP_NAME"
        pm2 delete "$APP_NAME"
    fi
    
    # 启动新进程
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    pm2 save
    
    print_success "PM2 部署完成"
}

# 函数：传统部署
deploy_traditional() {
    print_info "使用传统方式部署..."
    cd "$DEPLOY_DIR"
    
    # 查找并停止现有进程
    if pgrep -f "npm.*start" > /dev/null; then
        print_info "停止现有进程..."
        pkill -f "npm.*start"
        sleep 2
    fi
    
    # 启动应用
    nohup npm start > logs/app.log 2>&1 &
    
    print_success "传统部署完成"
}

# 函数：健康检查
health_check() {
    print_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            print_success "应用启动成功！"
            return 0
        fi
        
        print_info "等待应用启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    print_error "健康检查失败，应用可能未正常启动"
    return 1
}

# 函数：部署后清理
post_deploy_cleanup() {
    print_info "执行部署后清理..."
    
    # 清理临时文件
    cd "$DEPLOY_DIR"
    rm -rf temp/*
    
    # 清理旧日志 (保留最近7天)
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    print_success "清理完成"
}

# 主部署流程
main() {
    print_info "开始部署 $APP_NAME"
    print_info "环境: $ENVIRONMENT"
    print_info "分支: $BRANCH"
    print_info "目录: $DEPLOY_DIR"
    
    # 检查依赖
    check_dependencies
    
    # 设置部署目录
    setup_deploy_directory
    
    # 部署代码
    deploy_code
    
    # 安装依赖
    install_dependencies
    
    # 运行测试
    run_tests
    
    # 构建应用
    build_application
    
    # 根据选择的方式部署
    if [[ "$USE_DOCKER" == true ]]; then
        deploy_with_docker
    elif [[ "$USE_PM2" == true ]]; then
        deploy_with_pm2
    else
        deploy_traditional
    fi
    
    # 健康检查
    if health_check; then
        # 部署后清理
        post_deploy_cleanup
        
        print_success "🎉 部署成功完成！"
        print_info "应用访问地址: http://localhost:3000"
    else
        print_error "❌ 部署失败！"
        exit 1
    fi
}

# 错误处理
trap 'print_error "部署过程中发生错误，退出码: $?"' ERR

# 执行主流程
main "$@"
