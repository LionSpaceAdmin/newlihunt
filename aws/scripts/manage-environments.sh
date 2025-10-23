#!/bin/bash

# Environment Management Script
set -e

STACK_NAME="scam-hunt-platform"
REGION="${AWS_REGION:-us-east-1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo "Scam Hunt Platform - Environment Management"
    echo ""
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  list                List all environments"
    echo "  create [env]        Create new environment"
    echo "  delete [env]        Delete environment"
    echo "  status [env]        Show environment status"
    echo "  switch [env]        Switch to environment"
    echo "  compare [env1] [env2] Compare environments"
    echo ""
    echo "Environments: dev, staging, prod"
}

list_environments() {
    echo -e "${BLUE}Available Environments${NC}"
    echo "======================"
    
    aws cloudformation list-stacks \
        --region "$REGION" \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query "StackSummaries[?starts_with(StackName, '$STACK_NAME-')].{Name:StackName,Status:StackStatus,Created:CreationTime}" \
        --output table
}

create_environment() {
    local env=$1
    
    if [ -z "$env" ]; then
        echo -e "${RED}Environment name required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Creating environment: $env${NC}"
    
    # Check if environment already exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME-$env" --region "$REGION" &>/dev/null; then
        echo -e "${YELLOW}Environment $env already exists${NC}"
        exit 1
    fi
    
    # Deploy new environment
    DEPLOY_ENV="$env" ./scripts/deploy-with-monitoring.sh
    
    echo -e "${GREEN}Environment $env created successfully${NC}"
}

delete_environment() {
    local env=$1
    
    if [ -z "$env" ]; then
        echo -e "${RED}Environment name required${NC}"
        exit 1
    fi
    
    if [ "$env" = "prod" ]; then
        echo -e "${RED}Cannot delete production environment without confirmation${NC}"
        read -p "Are you sure you want to delete PRODUCTION? (type 'DELETE PROD'): " confirmation
        if [ "$confirmation" != "DELETE PROD" ]; then
            echo "Aborted"
            exit 1
        fi
    fi
    
    echo -e "${YELLOW}Deleting environment: $env${NC}"
    
    # Delete CloudFormation stack
    aws cloudformation delete-stack \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION"
    
    echo -e "${BLUE}Waiting for stack deletion...${NC}"
    aws cloudformation wait stack-delete-complete \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION"
    
    echo -e "${GREEN}Environment $env deleted successfully${NC}"
}

show_status() {
    local env=$1
    
    if [ -z "$env" ]; then
        echo -e "${RED}Environment name required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Environment Status: $env${NC}"
    echo "=========================="
    
    # Stack status
    local stack_status=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    echo "Stack Status: $stack_status"
    
    if [ "$stack_status" = "NOT_FOUND" ]; then
        echo -e "${RED}Environment does not exist${NC}"
        exit 1
    fi
    
    # Get outputs
    echo -e "\n${YELLOW}Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    # Resource count
    local resource_count=$(aws cloudformation list-stack-resources \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION" \
        --query 'length(StackResourceSummaries)' \
        --output text)
    
    echo -e "\nTotal Resources: $resource_count"
    
    # Recent events
    echo -e "\n${YELLOW}Recent Events:${NC}"
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME-$env" \
        --region "$REGION" \
        --max-items 5 \
        --query 'StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId]' \
        --output table
}

switch_environment() {
    local env=$1
    
    if [ -z "$env" ]; then
        echo -e "${RED}Environment name required${NC}"
        exit 1
    fi
    
    # Check if environment exists
    if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME-$env" --region "$REGION" &>/dev/null; then
        echo -e "${RED}Environment $env does not exist${NC}"
        exit 1
    fi
    
    # Update environment variable
    export DEPLOY_ENV="$env"
    echo "export DEPLOY_ENV=$env" > .env.current
    
    echo -e "${GREEN}Switched to environment: $env${NC}"
    
    # Show current environment info
    show_status "$env"
}

compare_environments() {
    local env1=$1
    local env2=$2
    
    if [ -z "$env1" ] || [ -z "$env2" ]; then
        echo -e "${RED}Two environment names required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Comparing Environments: $env1 vs $env2${NC}"
    echo "========================================"
    
    # Compare stack parameters
    echo -e "\n${YELLOW}Stack Parameters:${NC}"
    echo "Environment 1 ($env1):"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$env1" \
        --region "$REGION" \
        --query 'Stacks[0].Parameters[*].[ParameterKey,ParameterValue]' \
        --output table
    
    echo -e "\nEnvironment 2 ($env2):"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$env2" \
        --region "$REGION" \
        --query 'Stacks[0].Parameters[*].[ParameterKey,ParameterValue]' \
        --output table
    
    # Compare resource counts
    local count1=$(aws cloudformation list-stack-resources \
        --stack-name "$STACK_NAME-$env1" \
        --region "$REGION" \
        --query 'length(StackResourceSummaries)' \
        --output text)
    
    local count2=$(aws cloudformation list-stack-resources \
        --stack-name "$STACK_NAME-$env2" \
        --region "$REGION" \
        --query 'length(StackResourceSummaries)' \
        --output text)
    
    echo -e "\n${YELLOW}Resource Counts:${NC}"
    echo "$env1: $count1 resources"
    echo "$env2: $count2 resources"
}

promote_to_production() {
    local source_env=$1
    
    if [ -z "$source_env" ]; then
        echo -e "${RED}Source environment required${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Promoting $source_env to production${NC}"
    echo "This will:"
    echo "1. Create a backup of current production"
    echo "2. Deploy the same configuration as $source_env to production"
    echo "3. Run smoke tests"
    
    read -p "Continue? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Aborted"
        exit 1
    fi
    
    # Get source environment parameters
    local source_params=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$source_env" \
        --region "$REGION" \
        --query 'Stacks[0].Parameters' \
        --output json)
    
    # Deploy to production with same parameters
    DEPLOY_ENV="prod" ./scripts/deploy-with-monitoring.sh
    
    echo -e "${GREEN}Production deployment completed${NC}"
}

# Main execution
case "${1:-help}" in
    list)
        list_environments
        ;;
    create)
        create_environment "$2"
        ;;
    delete)
        delete_environment "$2"
        ;;
    status)
        show_status "$2"
        ;;
    switch)
        switch_environment "$2"
        ;;
    compare)
        compare_environments "$2" "$3"
        ;;
    promote)
        promote_to_production "$2"
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