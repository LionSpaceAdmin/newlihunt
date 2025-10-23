#!/bin/bash

# Scam Hunt Platform CloudFormation Deployment Script
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
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo -e "${BLUE}🚀 Starting CloudFormation deployment for Scam Hunt Platform${NC}"
echo -e "${BLUE}Project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Stack Name: ${STACK_NAME}${NC}"

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
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
npm install --production --silent
zip -r ../packages/analyze.zip . -x "*.git*" "node_modules/.cache/*" > /dev/null
cd ..
rm -rf analyze-package

# Package URL inspector Lambda
echo -e "${BLUE}Packaging URL inspector Lambda...${NC}"
cp -r url-inspector url-inspector-package
cp -r shared url-inspector-package/
cd url-inspector-package
npm install --production --silent
zip -r ../packages/url-inspector.zip . -x "*.git*" "node_modules/.cache/*" > /dev/null
cd ..
rm -rf url-inspector-package

echo -e "${GREEN}✅ Lambda packages created${NC}"

# Deploy CloudFormation stack
echo -e "\n${YELLOW}🏗️ Deploying CloudFormation stack...${NC}"

cd ../../aws/cloudformation

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${BLUE}Stack exists, updating...${NC}"
    OPERATION="update-stack"
else
    echo -e "${BLUE}Creating new stack...${NC}"
    OPERATION="create-stack"
fi

# Deploy stack
aws cloudformation $OPERATION \
    --stack-name "$STACK_NAME" \
    --template-body file://infrastructure.yaml \
    --parameters \
        ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        ParameterKey=GeminiApiKey,ParameterValue="$GEMINI_API_KEY" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$AWS_REGION"

# Wait for stack operation to complete
echo -e "${BLUE}Waiting for stack operation to complete...${NC}"
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
else
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
fi

echo -e "${GREEN}✅ CloudFormation stack deployed successfully!${NC}"

# Get stack outputs
echo -e "\n${YELLOW}📋 Retrieving stack outputs...${NC}"

API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`S3UploadsBucket`].OutputValue' \
    --output text)

DYNAMODB_ANALYSIS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBAnalysisTable`].OutputValue' \
    --output text)

DYNAMODB_SESSIONS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBSessionsTable`].OutputValue' \
    --output text)

ANALYZE_LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`AnalyzeLambdaArn`].OutputValue' \
    --output text)

URL_INSPECTOR_LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`UrlInspectorLambdaArn`].OutputValue' \
    --output text)

# Update Lambda functions with actual code
echo -e "\n${YELLOW}🔄 Updating Lambda functions with code...${NC}"

# Update analyze Lambda
echo -e "${BLUE}Updating analyze Lambda...${NC}"
aws lambda update-function-code \
    --function-name "${PROJECT_NAME}-analyze-${ENVIRONMENT}" \
    --zip-file fileb://../lambda/packages/analyze.zip \
    --region "$AWS_REGION" > /dev/null

# Update URL inspector Lambda
echo -e "${BLUE}Updating URL inspector Lambda...${NC}"
aws lambda update-function-code \
    --function-name "${PROJECT_NAME}-url-inspector-${ENVIRONMENT}" \
    --zip-file fileb://../lambda/packages/url-inspector.zip \
    --region "$AWS_REGION" > /dev/null

echo -e "${GREEN}✅ Lambda functions updated with code${NC}"

# Create environment configuration file
echo -e "\n${YELLOW}📝 Creating environment configuration...${NC}"

cat > ../../env.production <<EOF
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

# Lambda ARNs (for reference)
ANALYZE_LAMBDA_ARN=${ANALYZE_LAMBDA_ARN}
URL_INSPECTOR_LAMBDA_ARN=${URL_INSPECTOR_LAMBDA_ARN}
EOF

echo -e "${GREEN}✅ Environment configuration created at ../../env.production${NC}"

# Test API endpoints
echo -e "\n${YELLOW}🧪 Testing API endpoints...${NC}"

# Wait a moment for API Gateway to be ready
sleep 5

# Test analyze endpoint
echo -e "${BLUE}Testing analyze endpoint...${NC}"
ANALYZE_TEST_RESPONSE=$(curl -s -X POST "${API_GATEWAY_URL}/analyze" \
    -H "Content-Type: application/json" \
    -d '{"message":"Test message"}' \
    -w "%{http_code}" \
    -o /tmp/analyze_response.json)

if [[ "$ANALYZE_TEST_RESPONSE" == "200" ]]; then
    echo -e "${GREEN}✅ Analyze endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠️ Analyze endpoint returned: $ANALYZE_TEST_RESPONSE${NC}"
    if [ -f /tmp/analyze_response.json ]; then
        echo -e "${YELLOW}Response: $(cat /tmp/analyze_response.json)${NC}"
    fi
fi

# Test URL inspector endpoint
echo -e "${BLUE}Testing URL inspector endpoint...${NC}"
URL_TEST_RESPONSE=$(curl -s -X POST "${API_GATEWAY_URL}/url-inspector" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}' \
    -w "%{http_code}" \
    -o /tmp/url_response.json)

if [[ "$URL_TEST_RESPONSE" == "200" ]]; then
    echo -e "${GREEN}✅ URL inspector endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠️ URL inspector endpoint returned: $URL_TEST_RESPONSE${NC}"
    if [ -f /tmp/url_response.json ]; then
        echo -e "${YELLOW}Response: $(cat /tmp/url_response.json)${NC}"
    fi
fi

# Cleanup
echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
rm -rf ../lambda/packages
rm -f /tmp/analyze_response.json /tmp/url_response.json

echo -e "\n${GREEN}🎉 CloudFormation deployment completed successfully!${NC}"
echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}Stack Name: ${STACK_NAME}${NC}"
echo -e "${BLUE}API Gateway URL: ${API_GATEWAY_URL}${NC}"
echo -e "${BLUE}S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${BLUE}DynamoDB Analysis Table: ${DYNAMODB_ANALYSIS_TABLE}${NC}"
echo -e "${BLUE}DynamoDB Sessions Table: ${DYNAMODB_SESSIONS_TABLE}${NC}"

echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Update your frontend environment variables with the values above${NC}"
echo -e "${YELLOW}2. Deploy your frontend to Vercel or your preferred hosting platform${NC}"
echo -e "${YELLOW}3. Configure your domain and SSL certificates${NC}"
echo -e "${YELLOW}4. Set up monitoring and alerting${NC}"
echo -e "${YELLOW}5. Configure CloudWatch logs and metrics${NC}"

echo -e "\n${GREEN}🚀 Your Scam Hunt Platform is now live on AWS!${NC}"