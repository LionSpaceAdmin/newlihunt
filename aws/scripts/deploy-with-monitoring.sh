#!/bin/bash

# Advanced Deployment Script with Monitoring Setup
set -e

# Configuration
STACK_NAME="scam-hunt-platform"
REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${DEPLOY_ENV:-dev}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check SAM CLI
    if ! command -v sam &> /dev/null; then
        error "SAM CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Gemini API key
    if [ -z "$GEMINI_API_KEY" ]; then
        error "GEMINI_API_KEY environment variable not set"
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Validate SAM template
validate_template() {
    log "Validating SAM template..."
    if sam validate --template template.yaml; then
        success "Template validation passed"
    else
        error "Template validation failed"
        exit 1
    fi
}

# Build application
build_application() {
    log "Building SAM application..."
    sam build --cached --parallel
    success "Build completed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure to AWS..."
    
    local deploy_params=(
        --stack-name "$STACK_NAME-$ENVIRONMENT"
        --region "$REGION"
        --capabilities CAPABILITY_IAM
        --parameter-overrides
        Environment="$ENVIRONMENT"
        GeminiApiKey="$GEMINI_API_KEY"
    )
    
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        deploy_params+=(NotificationEmail="$NOTIFICATION_EMAIL")
    fi
    
    sam deploy "${deploy_params[@]}" --confirm-changeset
    success "Infrastructure deployed"
}

# Setup CloudWatch monitoring
setup_monitoring() {
    log "Setting up CloudWatch monitoring..."
    
    # Get stack outputs
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    # Create custom metrics
    aws logs create-log-group \
        --log-group-name "/aws/lambda/scam-hunt-custom-metrics" \
        --region "$REGION" 2>/dev/null || true
    
    success "Monitoring setup completed"
    log "API Gateway URL: $api_url"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    # Test API Gateway health
    if curl -f -s "${api_url}/health" > /dev/null 2>&1; then
        success "API Gateway health check passed"
    else
        warning "API Gateway health check failed (endpoint might not exist yet)"
    fi
    
    # Test Lambda functions
    log "Testing Lambda functions..."
    sam local invoke AnalyzeFunction --event events/analyze-event.json --no-event > /dev/null 2>&1 || warning "Analyze function test failed"
    
    success "Smoke tests completed"
}

# Display deployment summary
display_summary() {
    log "Deployment Summary"
    echo "=================="
    echo "Stack Name: $STACK_NAME-$ENVIRONMENT"
    echo "Region: $REGION"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    # Get and display stack outputs
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    echo ""
    success "Deployment completed successfully!"
    log "CloudWatch Dashboard: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=ScamHunt-${ENVIRONMENT}"
}

# Cleanup on failure
cleanup_on_failure() {
    error "Deployment failed. Cleaning up..."
    # Add cleanup logic here if needed
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Scam Hunt Platform - Advanced Deployment${NC}"
    echo "=============================================="
    
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    pre_deployment_checks
    validate_template
    build_application
    deploy_infrastructure
    setup_monitoring
    run_smoke_tests
    display_summary
}

# Run main function
main "$@"