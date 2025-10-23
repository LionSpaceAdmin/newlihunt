#!/bin/bash

# Scam Hunt Platform AWS Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="scam-hunt-platform"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo -e "${BLUE}🚀 Starting AWS deployment for Scam Hunt Platform${NC}"
echo -e "${BLUE}Project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if zip is installed
if ! command -v zip &> /dev/null; then
    echo -e "${RED}❌ zip is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY environment variable is required${NC}"
    echo -e "${YELLOW}Please set it with: export GEMINI_API_KEY=your_api_key${NC}"
    exit 1
fi

# Create Lambda deployment packages
echo -e "\n${YELLOW}📦 Creating Lambda deployment packages...${NC}"

# Create temporary directory for Lambda packages
mkdir -p ../aws/lambda/packages

# Package analyze Lambda
echo -e "${BLUE}Packaging analyze Lambda...${NC}"
cd ../aws/lambda
cp -r analyze analyze-package
cp -r shared analyze-package/
cd analyze-package
npm install --production
zip -r ../packages/analyze.zip . -x "*.git*" "node_modules/.cache/*"
cd ..
rm -rf analyze-package

# Package URL inspector Lambda
echo -e "${BLUE}Packaging URL inspector Lambda...${NC}"
cp -r url-inspector url-inspector-package
cp -r shared url-inspector-package/
cd url-inspector-package
npm install --production
zip -r ../packages/url-inspector.zip . -x "*.git*" "node_modules/.cache/*"
cd ..
rm -rf url-inspector-package

echo -e "${GREEN}✅ Lambda packages created${NC}"

# Deploy infrastructure with Terraform
echo -e "\n${YELLOW}🏗️ Deploying infrastructure with Terraform...${NC}"

cd ../../terraform

# Initialize Terraform
echo -e "${BLUE}Initializing Terraform...${NC}"
terraform init

# Plan deployment
echo -e "${BLUE}Planning deployment...${NC}"
terraform plan \
  -var="aws_region=${AWS_REGION}" \
  -var="environment=${ENVIRONMENT}" \
  -var="project_name=${PROJECT_NAME}" \
  -var="gemini_api_key=${GEMINI_API_KEY}" \
  -out=tfplan

# Apply deployment
echo -e "${BLUE}Applying deployment...${NC}"
terraform apply tfplan

# Get outputs
API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
S3_BUCKET=$(terraform output -raw s3_uploads_bucket)
DYNAMODB_ANALYSIS_TABLE=$(terraform output -raw dynamodb_analysis_table)
DYNAMODB_SESSIONS_TABLE=$(terraform output -raw dynamodb_sessions_table)

echo -e "\n${GREEN}✅ Infrastructure deployed successfully!${NC}"

# Update Lambda functions with latest code
echo -e "\n${YELLOW}🔄 Updating Lambda functions...${NC}"

# Update analyze Lambda
echo -e "${BLUE}Updating analyze Lambda...${NC}"
aws lambda update-function-code \
  --function-name "${PROJECT_NAME}-analyze-${ENVIRONMENT}" \
  --zip-file fileb://../aws/lambda/packages/analyze.zip \
  --region "${AWS_REGION}"

# Update URL inspector Lambda
echo -e "${BLUE}Updating URL inspector Lambda...${NC}"
aws lambda update-function-code \
  --function-name "${PROJECT_NAME}-url-inspector-${ENVIRONMENT}" \
  --zip-file fileb://../aws/lambda/packages/url-inspector.zip \
  --region "${AWS_REGION}"

echo -e "${GREEN}✅ Lambda functions updated${NC}"

# Create environment configuration file
echo -e "\n${YELLOW}📝 Creating environment configuration...${NC}"

cat > ../env.production <<EOF
# AWS Configuration
AWS_REGION=${AWS_REGION}
AWS_API_GATEWAY_URL=${API_GATEWAY_URL}
AWS_S3_UPLOADS_BUCKET=${S3_BUCKET}
AWS_DYNAMODB_ANALYSIS_TABLE=${DYNAMODB_ANALYSIS_TABLE}
AWS_DYNAMODB_SESSIONS_TABLE=${DYNAMODB_SESSIONS_TABLE}

# API Endpoints
NEXT_PUBLIC_API_URL=${API_GATEWAY_URL}
AWS_ANALYZE_ENDPOINT=${API_GATEWAY_URL}/analyze
AWS_URL_INSPECTOR_ENDPOINT=${API_GATEWAY_URL}/url-inspector

# Application Configuration
NEXT_PUBLIC_APP_URL=https://scamhunt.ai
ENVIRONMENT=${ENVIRONMENT}
EOF

echo -e "${GREEN}✅ Environment configuration created at ../env.production${NC}"

# Test API endpoints
echo -e "\n${YELLOW}🧪 Testing API endpoints...${NC}"

# Test analyze endpoint
echo -e "${BLUE}Testing analyze endpoint...${NC}"
ANALYZE_TEST=$(curl -s -X POST "${API_GATEWAY_URL}/analyze" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message"}' \
  -w "%{http_code}")

if [[ "${ANALYZE_TEST: -3}" == "200" ]]; then
    echo -e "${GREEN}✅ Analyze endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠️ Analyze endpoint returned: ${ANALYZE_TEST: -3}${NC}"
fi

# Test URL inspector endpoint
echo -e "${BLUE}Testing URL inspector endpoint...${NC}"
URL_TEST=$(curl -s -X POST "${API_GATEWAY_URL}/url-inspector" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  -w "%{http_code}")

if [[ "${URL_TEST: -3}" == "200" ]]; then
    echo -e "${GREEN}✅ URL inspector endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠️ URL inspector endpoint returned: ${URL_TEST: -3}${NC}"
fi

# Cleanup
echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
rm -rf ../aws/lambda/packages
rm -f tfplan

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}API Gateway URL: ${API_GATEWAY_URL}${NC}"
echo -e "${BLUE}S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${BLUE}DynamoDB Analysis Table: ${DYNAMODB_ANALYSIS_TABLE}${NC}"
echo -e "${BLUE}DynamoDB Sessions Table: ${DYNAMODB_SESSIONS_TABLE}${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Update your frontend environment variables with the values above${NC}"
echo -e "${YELLOW}2. Deploy your frontend to Vercel or your preferred hosting platform${NC}"
echo -e "${YELLOW}3. Configure your domain and SSL certificates${NC}"
echo -e "${YELLOW}4. Set up monitoring and alerting${NC}"

echo -e "\n${GREEN}🚀 Your Scam Hunt Platform is now live!${NC}"