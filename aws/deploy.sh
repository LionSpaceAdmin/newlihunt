#!/bin/bash

# Scam Hunt Platform - AWS Deployment Script
set -e

# Configuration
STACK_NAME="scam-hunt-platform"
REGION="us-east-1"
ENVIRONMENT="dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Scam Hunt Platform to AWS${NC}"
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}❌ SAM CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY environment variable not set.${NC}"
    read -p "Enter your Gemini API Key: " GEMINI_API_KEY
fi

# Build the SAM application
echo -e "${YELLOW}📦 Building SAM application...${NC}"
sam build

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
sam deploy \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        GeminiApiKey="$GEMINI_API_KEY" \
    --confirm-changeset

# Get outputs
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Stack Outputs:${NC}"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo -e "${GREEN}🎉 Scam Hunt Platform is now deployed!${NC}"