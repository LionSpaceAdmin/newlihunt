# Scam Hunt Platform - AWS Infrastructure

This directory contains the AWS backend infrastructure for the Scam Hunt Platform, including Lambda functions, API Gateway configuration, DynamoDB tables, and S3 storage.

## Architecture Overview

- **API Gateway**: REST API with CORS support and rate limiting
- **Lambda Functions**: 4 serverless functions for different operations
- **DynamoDB**: NoSQL database for analysis history storage
- **S3**: Object storage for image uploads
- **CloudFront**: CDN for global content delivery

## Lambda Functions

### 1. Analyze Function (`/analyze`)
- **Purpose**: AI-powered scam analysis using Google Gemini
- **Method**: POST
- **Features**: Multimodal input support, streaming responses

### 2. History Function (`/history`)
- **Purpose**: Analysis history management
- **Methods**: GET (retrieve), POST (save)
- **Features**: Anonymous user identification, DynamoDB integration

### 3. Upload Function (`/upload`)
- **Purpose**: Secure file uploads to S3
- **Method**: POST
- **Features**: File validation, presigned URLs, 10MB limit

### 4. URL Inspector Function (`/url-inspector`)
- **Purpose**: Safe URL content analysis
- **Method**: POST
- **Features**: Content scraping, suspicious pattern detection

## Prerequisites

1. **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **SAM CLI** - [Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
3. **Google Gemini API Key** - [Get API Key](https://makersuite.google.com/app/apikey)

## Environment Variables

Set these environment variables before deployment:

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
```

## Deployment

### Quick Deploy with Make
```bash
# Development environment
make deploy ENV=dev

# Staging environment  
make deploy ENV=staging

# Production environment (with safety checks)
make prod-deploy
```

### Advanced Deploy with Monitoring
```bash
# Advanced deployment with full monitoring setup
make deploy-advanced ENV=dev

# Or use the script directly
./scripts/deploy-with-monitoring.sh
```

### Manual Deploy
```bash
# Build the application
sam build

# Deploy with parameters
sam deploy \
    --stack-name scam-hunt-platform-dev \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Environment=dev \
        GeminiApiKey=$GEMINI_API_KEY
```

## Local Development

### Start API Gateway locally
```bash
sam local start-api --port 3001
```

### Test individual functions
```bash
# Test analyze function
sam local invoke AnalyzeFunction --event events/analyze-event.json

# Test history function
sam local invoke HistoryFunction --event events/history-event.json
```

## API Endpoints

After deployment, your API will be available at:
```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
```

### Available Endpoints:
- `POST /analyze` - Analyze content for scams
- `GET /history` - Get analysis history
- `POST /history` - Save analysis
- `POST /upload` - Upload images
- `POST /url-inspector` - Inspect URLs

## Monitoring

### CloudWatch Logs
- Function logs: `/aws/lambda/{function-name}`
- API Gateway logs: Available in CloudWatch

### Metrics
- Lambda invocations, duration, errors
- API Gateway requests, latency, 4xx/5xx errors
- DynamoDB read/write capacity, throttles

## Security Features

- **CORS**: Configured for frontend domain
- **Rate Limiting**: 100 requests/second, 200 burst
- **Input Validation**: All inputs sanitized and validated
- **Private S3**: No public access, CloudFront only
- **API Keys**: Stored securely in Lambda environment

## Cost Optimization

- **DynamoDB**: Pay-per-request billing
- **Lambda**: Pay-per-invocation with generous free tier
- **S3**: Lifecycle policy deletes files after 30 days
- **CloudFront**: Caching reduces origin requests

## Troubleshooting

### Common Issues

1. **Deployment fails with permissions error**
   ```bash
   aws sts get-caller-identity  # Check AWS credentials
   ```

2. **Lambda function timeout**
   - Check CloudWatch logs for errors
   - Increase timeout in template.yaml if needed

3. **CORS errors**
   - Verify API Gateway CORS configuration
   - Check frontend API endpoint URL

### Useful Commands

```bash
# View stack outputs
aws cloudformation describe-stacks --stack-name scam-hunt-platform-dev

# Delete stack
aws cloudformation delete-stack --stack-name scam-hunt-platform-dev

# View logs
sam logs --stack-name scam-hunt-platform-dev --tail
```

## Environment-Specific Deployments

### Development
```bash
sam deploy --parameter-overrides Environment=dev
```

### Staging
```bash
sam deploy --parameter-overrides Environment=staging
```

### Production
```bash
sam deploy --parameter-overrides Environment=prod
```

Each environment creates separate resources with appropriate naming conventions.