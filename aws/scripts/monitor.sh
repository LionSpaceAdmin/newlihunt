#!/bin/bash

# Monitoring and Logging Script
set -e

STACK_NAME="scam-hunt-platform"
REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${DEPLOY_ENV:-dev}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo "Scam Hunt Platform - Monitoring Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  logs [function]     Show logs for specific function or all"
    echo "  metrics            Show key metrics"
    echo "  alarms             Show alarm status"
    echo "  dashboard          Open CloudWatch dashboard"
    echo "  tail [function]    Tail logs in real-time"
    echo "  health             Check system health"
    echo ""
    echo "Functions: analyze, history, upload, url-inspector"
    echo ""
    echo "Examples:"
    echo "  $0 logs analyze"
    echo "  $0 tail"
    echo "  $0 metrics"
}

get_function_name() {
    local function_type=$1
    aws cloudformation describe-stack-resources \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query "StackResources[?LogicalResourceId=='${function_type^}Function'].PhysicalResourceId" \
        --output text
}

show_logs() {
    local function_type=${1:-"all"}
    
    if [ "$function_type" = "all" ]; then
        echo -e "${BLUE}Showing logs for all functions...${NC}"
        for func in analyze history upload url-inspector; do
            echo -e "\n${YELLOW}=== $func Function Logs ===${NC}"
            local func_name=$(get_function_name "$func")
            if [ -n "$func_name" ]; then
                aws logs describe-log-streams \
                    --log-group-name "/aws/lambda/$func_name" \
                    --region "$REGION" \
                    --order-by LastEventTime \
                    --descending \
                    --max-items 1 \
                    --query 'logStreams[0].logStreamName' \
                    --output text | xargs -I {} aws logs get-log-events \
                    --log-group-name "/aws/lambda/$func_name" \
                    --log-stream-name {} \
                    --region "$REGION" \
                    --query 'events[-10:].message' \
                    --output text
            fi
        done
    else
        local func_name=$(get_function_name "$function_type")
        if [ -n "$func_name" ]; then
            echo -e "${BLUE}Showing logs for $function_type function...${NC}"
            sam logs --stack-name "$STACK_NAME-$ENVIRONMENT" --name "${function_type^}Function" --region "$REGION"
        else
            echo -e "${RED}Function $function_type not found${NC}"
        fi
    fi
}

tail_logs() {
    local function_type=${1:-""}
    
    if [ -n "$function_type" ]; then
        echo -e "${BLUE}Tailing logs for $function_type function...${NC}"
        sam logs --stack-name "$STACK_NAME-$ENVIRONMENT" --name "${function_type^}Function" --region "$REGION" --tail
    else
        echo -e "${BLUE}Tailing logs for all functions...${NC}"
        sam logs --stack-name "$STACK_NAME-$ENVIRONMENT" --region "$REGION" --tail
    fi
}

show_metrics() {
    echo -e "${BLUE}Key Metrics Summary${NC}"
    echo "==================="
    
    # API Gateway metrics
    echo -e "\n${YELLOW}API Gateway Metrics (Last 1 hour):${NC}"
    aws cloudwatch get-metric-statistics \
        --namespace AWS/ApiGateway \
        --metric-name Count \
        --dimensions Name=ApiName,Value="$STACK_NAME-$ENVIRONMENT" \
        --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 3600 \
        --statistics Sum \
        --region "$REGION" \
        --query 'Datapoints[0].Sum' \
        --output text | xargs -I {} echo "Total Requests: {}"
    
    # Lambda metrics
    echo -e "\n${YELLOW}Lambda Function Invocations (Last 1 hour):${NC}"
    for func in analyze history upload url-inspector; do
        local func_name=$(get_function_name "$func")
        if [ -n "$func_name" ]; then
            local invocations=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/Lambda \
                --metric-name Invocations \
                --dimensions Name=FunctionName,Value="$func_name" \
                --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
                --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
                --period 3600 \
                --statistics Sum \
                --region "$REGION" \
                --query 'Datapoints[0].Sum' \
                --output text 2>/dev/null || echo "0")
            echo "$func: $invocations invocations"
        fi
    done
    
    # DynamoDB metrics
    echo -e "\n${YELLOW}DynamoDB Metrics (Last 1 hour):${NC}"
    local table_name=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
        --output text)
    
    if [ -n "$table_name" ]; then
        local read_capacity=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/DynamoDB \
            --metric-name ConsumedReadCapacityUnits \
            --dimensions Name=TableName,Value="$table_name" \
            --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 3600 \
            --statistics Sum \
            --region "$REGION" \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        echo "Read Capacity Units: $read_capacity"
    fi
}

show_alarms() {
    echo -e "${BLUE}CloudWatch Alarms Status${NC}"
    echo "========================"
    
    aws cloudwatch describe-alarms \
        --alarm-name-prefix "ScamHunt-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]' \
        --output table
}

open_dashboard() {
    local dashboard_url="https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=ScamHunt-${ENVIRONMENT}"
    echo -e "${BLUE}Opening CloudWatch Dashboard...${NC}"
    echo "URL: $dashboard_url"
    
    # Try to open in browser (macOS/Linux)
    if command -v open &> /dev/null; then
        open "$dashboard_url"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$dashboard_url"
    else
        echo "Please open the URL manually in your browser"
    fi
}

check_health() {
    echo -e "${BLUE}System Health Check${NC}"
    echo "==================="
    
    # Check stack status
    local stack_status=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    echo "Stack Status: $stack_status"
    
    if [ "$stack_status" = "CREATE_COMPLETE" ] || [ "$stack_status" = "UPDATE_COMPLETE" ]; then
        echo -e "${GREEN}✅ Stack is healthy${NC}"
    else
        echo -e "${RED}❌ Stack has issues${NC}"
    fi
    
    # Check API Gateway
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -n "$api_url" ]; then
        echo "API Gateway URL: $api_url"
        if curl -f -s "$api_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API Gateway is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  API Gateway accessibility unknown${NC}"
        fi
    fi
    
    # Check recent errors
    echo -e "\n${YELLOW}Recent Errors (Last 10 minutes):${NC}"
    local error_count=0
    for func in analyze history upload url-inspector; do
        local func_name=$(get_function_name "$func")
        if [ -n "$func_name" ]; then
            local errors=$(aws logs filter-log-events \
                --log-group-name "/aws/lambda/$func_name" \
                --start-time $(($(date +%s) - 600))000 \
                --filter-pattern "ERROR" \
                --region "$REGION" \
                --query 'length(events)' \
                --output text 2>/dev/null || echo "0")
            if [ "$errors" -gt 0 ]; then
                echo "$func: $errors errors"
                ((error_count += errors))
            fi
        fi
    done
    
    if [ "$error_count" -eq 0 ]; then
        echo -e "${GREEN}✅ No recent errors${NC}"
    else
        echo -e "${RED}❌ $error_count recent errors found${NC}"
    fi
}

# Main execution
case "${1:-help}" in
    logs)
        show_logs "$2"
        ;;
    metrics)
        show_metrics
        ;;
    alarms)
        show_alarms
        ;;
    dashboard)
        open_dashboard
        ;;
    tail)
        tail_logs "$2"
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac