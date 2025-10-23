terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "scam-hunt-platform"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "scamhunt.ai"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-uploads-${var.environment}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "cleanup_old_uploads"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# DynamoDB table for analysis history
resource "aws_dynamodb_table" "analysis_history" {
  name           = "${var.project_name}-analysis-history-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  range_key      = "timestamp"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "analysisId"
    type = "S"
  }

  global_secondary_index {
    name     = "AnalysisIdIndex"
    hash_key = "analysisId"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}

# DynamoDB table for user sessions
resource "aws_dynamodb_table" "user_sessions" {
  name         = "${var.project_name}-user-sessions-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for Lambda functions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.analysis_history.arn,
          aws_dynamodb_table.user_sessions.arn,
          "${aws_dynamodb_table.analysis_history.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })
}

# Lambda function for analysis
resource "aws_lambda_function" "analyze" {
  filename         = "../aws/lambda/analyze.zip"
  function_name    = "${var.project_name}-analyze-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_ANALYSIS_TABLE = aws_dynamodb_table.analysis_history.name
      DYNAMODB_SESSIONS_TABLE = aws_dynamodb_table.user_sessions.name
      S3_UPLOADS_BUCKET      = aws_s3_bucket.uploads.bucket
      GEMINI_API_KEY         = var.gemini_api_key
      ENVIRONMENT            = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_policy]
  tags       = local.common_tags
}

# Lambda function for URL inspection
resource "aws_lambda_function" "url_inspector" {
  filename         = "../aws/lambda/url-inspector.zip"
  function_name    = "${var.project_name}-url-inspector-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_policy]
  tags       = local.common_tags
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Scam Hunt Platform API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# API Gateway resources and methods for analyze endpoint
resource "aws_api_gateway_resource" "analyze" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "analyze"
}

resource "aws_api_gateway_method" "analyze_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.analyze.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "analyze_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.analyze.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# API Gateway integration for analyze
resource "aws_api_gateway_integration" "analyze_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analyze.id
  http_method = aws_api_gateway_method.analyze_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.analyze.invoke_arn
}

resource "aws_api_gateway_integration" "analyze_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analyze.id
  http_method = aws_api_gateway_method.analyze_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# API Gateway resources and methods for URL inspector endpoint
resource "aws_api_gateway_resource" "url_inspector" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "url-inspector"
}

resource "aws_api_gateway_method" "url_inspector_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.url_inspector.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "url_inspector_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.url_inspector.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# API Gateway integration for URL inspector
resource "aws_api_gateway_integration" "url_inspector_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.url_inspector.id
  http_method = aws_api_gateway_method.url_inspector_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.url_inspector.invoke_arn
}

resource "aws_api_gateway_integration" "url_inspector_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.url_inspector.id
  http_method = aws_api_gateway_method.url_inspector_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# API Gateway method responses
resource "aws_api_gateway_method_response" "analyze_post_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analyze.id
  http_method = aws_api_gateway_method.analyze_post.http_method
  status_code = "200"

  response_headers = {
    "Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "analyze_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analyze.id
  http_method = aws_api_gateway_method.analyze_options.http_method
  status_code = "200"

  response_headers = {
    "Access-Control-Allow-Origin"  = true
    "Access-Control-Allow-Headers" = true
    "Access-Control-Allow-Methods" = true
  }
}

# API Gateway integration responses
resource "aws_api_gateway_integration_response" "analyze_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analyze.id
  http_method = aws_api_gateway_method.analyze_options.http_method
  status_code = aws_api_gateway_method_response.analyze_options_200.status_code

  response_headers = {
    "Access-Control-Allow-Origin"  = "'*'"
    "Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "analyze_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analyze.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "url_inspector_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.url_inspector.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.analyze_post,
    aws_api_gateway_method.analyze_options,
    aws_api_gateway_method.url_inspector_post,
    aws_api_gateway_method.url_inspector_options,
    aws_api_gateway_integration.analyze_post,
    aws_api_gateway_integration.analyze_options,
    aws_api_gateway_integration.url_inspector_post,
    aws_api_gateway_integration.url_inspector_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# Variables for sensitive data
variable "gemini_api_key" {
  description = "Gemini API key for AI analysis"
  type        = string
  sensitive   = true
}

# Outputs
output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_deployment.main.invoke_url
}

output "s3_uploads_bucket" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "dynamodb_analysis_table" {
  description = "DynamoDB table for analysis history"
  value       = aws_dynamodb_table.analysis_history.name
}

output "dynamodb_sessions_table" {
  description = "DynamoDB table for user sessions"
  value       = aws_dynamodb_table.user_sessions.name
}