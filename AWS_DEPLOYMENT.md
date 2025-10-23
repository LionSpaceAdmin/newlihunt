# AWS Deployment Guide for Scam Hunt Platform

This guide will help you deploy the Scam Hunt Platform backend infrastructure to AWS.

## 🏗️ Architecture Overview

The platform uses a hybrid architecture:

### **Frontend & AI (Vercel)**
- **Next.js Application**: Deployed on Vercel
- **Gemini AI Integration**: Direct API calls from Next.js API routes
- **URL Inspection**: Built-in Next.js functionality

### **Backend Infrastructure (AWS)**
- **DynamoDB**: NoSQL database for analysis history and user sessions
- **S3**: Object storage for uploaded images
- **IAM**: Identity and access management
- **CloudWatch**: Logging and monitoring

**Note**: Lambda functions for AI analysis have been removed to avoid duplication with Vercel deployment.

## 📋 Prerequisites

### Required Tools
- AWS CLI v2 or later
- Node.js 18+ 
- Either Terraform 1.0+ OR AWS CLI (for CloudFormation)
- zip utility

### Required Credentials
- AWS account with appropriate permissions
- Gemini API key for AI analysis

### AWS Permissions Required
Your AWS user/role needs the following permissions:
- IAM: Create/manage roles and policies
- Lambda: Create/manage functions
- API Gateway: Create/manage APIs
- DynamoDB: Create/manage tables
- S3: Create/manage buckets
- CloudFormation: Create/manage stacks (if using CloudFormation)

## 🚀 Quick Start

### Option 1: Terraform Deployment (Recommended)

1. **Set up environment variables:**
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=production
export GEMINI_API_KEY=your_gemini_api_key_here
```

2. **Run the deployment script:**
```bash
cd scam-hunt-platform/scripts
./deploy-aws.sh
```

### Option 2: CloudFormation Deployment

1. **Set up environment variables:**
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=production
export GEMINI_API_KEY=your_gemini_api_key_here
```

2. **Run the CloudFormation deployment script:**
```bash
cd scam-hunt-platform/scripts
./deploy-cloudformation.sh
```

## 📁 Infrastructure Components

### Infrastructure Components

**Note**: Lambda functions have been removed from the AWS deployment. All AI processing and URL inspection is now handled by Next.js API routes on Vercel for better performance and simpler architecture.

### DynamoDB Tables

#### Analysis History Table
- **Primary Key**: `userId` (Hash), `timestamp` (Range)
- **GSI**: `AnalysisIdIndex` on `analysisId`
- **TTL**: Enabled on `ttl` attribute
- **Billing**: Pay-per-request

#### User Sessions Table
- **Primary Key**: `userId` (Hash)
- **TTL**: Enabled on `ttl` attribute
- **Billing**: Pay-per-request

### S3 Bucket
- **Purpose**: Store uploaded images
- **Encryption**: AES-256
- **Versioning**: Enabled
- **Lifecycle**: 30-day expiration
- **CORS**: Configured for web access

### API Gateway
**Status**: Removed - No longer needed as all API endpoints are handled by Next.js on Vercel

## 🔧 Configuration

### Environment Variables

After AWS deployment, update your Vercel environment variables:

```bash
# Gemini AI Configuration (Primary)
GEMINI_API_KEY=your_gemini_api_key_here

# AWS Configuration (Backend only)
AWS_REGION=us-east-1
AWS_S3_UPLOADS_BUCKET=scam-hunt-platform-uploads-production
AWS_DYNAMODB_ANALYSIS_TABLE=scam-hunt-platform-analysis-history-production
AWS_DYNAMODB_SESSIONS_TABLE=scam-hunt-platform-user-sessions-production

# Application Configuration
NEXT_PUBLIC_APP_URL=https://lionsofzion.io
ENVIRONMENT=production
```

**Note**: No API Gateway URLs needed as all API calls are handled by Next.js API routes.

### Frontend Deployment

Deploy your Next.js frontend to Vercel:

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy**

## 📊 Monitoring and Logging

### CloudWatch Logs
- Lambda function logs are automatically sent to CloudWatch
- Log groups: `/aws/lambda/scam-hunt-platform-*`

### CloudWatch Metrics
- API Gateway metrics (requests, latency, errors)
- Lambda metrics (invocations, duration, errors)
- DynamoDB metrics (read/write capacity, throttles)

### Recommended Alarms
```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "ScamHunt-HighErrorRate" \
  --alarm-description "High error rate in API Gateway" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Lambda duration
aws cloudwatch put-metric-alarm \
  --alarm-name "ScamHunt-LambdaDuration" \
  --alarm-description "Lambda function taking too long" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 25000 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 Security Best Practices

### IAM Roles
- Lambda functions use least-privilege IAM roles
- No hardcoded credentials in code
- Environment variables for sensitive data

### API Security
- CORS properly configured
- Rate limiting implemented in Lambda
- Input validation and sanitization

### Data Protection
- S3 bucket encryption enabled
- DynamoDB encryption at rest
- TTL configured for data cleanup

## 🚨 Troubleshooting

### Common Issues

#### 1. Lambda Function Timeout
```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/scam-hunt-platform"

# Increase timeout if needed
aws lambda update-function-configuration \
  --function-name scam-hunt-platform-analyze-production \
  --timeout 60
```

#### 2. API Gateway CORS Issues
- Ensure OPTIONS methods are properly configured
- Check response headers in Lambda functions
- Verify allowed origins in CORS configuration

#### 3. DynamoDB Throttling
```bash
# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=scam-hunt-platform-analysis-history-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

#### 4. S3 Upload Issues
- Check bucket policy and CORS configuration
- Verify IAM permissions for Lambda
- Check CloudWatch logs for detailed errors

### Debug Commands

```bash
# Test API endpoints
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/production/analyze \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message"}'

# Check Lambda logs
aws logs tail /aws/lambda/scam-hunt-platform-analyze-production --follow

# Check DynamoDB table
aws dynamodb describe-table --table-name scam-hunt-platform-analysis-history-production

# Check S3 bucket
aws s3 ls s3://scam-hunt-platform-uploads-production
```

## 💰 Cost Optimization

### Expected Costs (Monthly)
- **API Gateway**: ~$3.50 per million requests
- **Lambda**: ~$0.20 per million requests (512MB, 1s duration)
- **DynamoDB**: ~$1.25 per million read/write requests
- **S3**: ~$0.023 per GB stored
- **CloudWatch**: ~$0.50 per GB ingested

### Cost Optimization Tips
1. Use DynamoDB on-demand pricing for variable workloads
2. Set up S3 lifecycle policies for old uploads
3. Monitor and optimize Lambda memory allocation
4. Use CloudWatch Insights for log analysis efficiency

## 🔄 Updates and Maintenance

### Updating Lambda Code
```bash
# Package new code
cd aws/lambda/analyze
zip -r ../packages/analyze.zip .

# Update function
aws lambda update-function-code \
  --function-name scam-hunt-platform-analyze-production \
  --zip-file fileb://../packages/analyze.zip
```

### Infrastructure Updates
```bash
# Terraform
cd terraform
terraform plan
terraform apply

# CloudFormation
aws cloudformation update-stack \
  --stack-name scam-hunt-platform-production \
  --template-body file://infrastructure.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

## 📞 Support

For deployment issues:
1. Check CloudWatch logs first
2. Verify all environment variables are set
3. Ensure AWS permissions are correct
4. Test individual components (Lambda, API Gateway, DynamoDB)

## 🔗 Useful Links

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)