# Scam Hunt Platform - AWS Infrastructure Makefile

# Configuration
STACK_NAME ?= scam-hunt-platform
REGION ?= us-east-1
ENV ?= dev

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

.PHONY: help install validate build deploy deploy-advanced clean logs metrics monitor health

# Default target
help:
	@echo "$(GREEN)Scam Hunt Platform - AWS Infrastructure$(NC)"
	@echo "======================================"
	@echo ""
	@echo "Available targets:"
	@echo "  $(YELLOW)install$(NC)         Install dependencies (AWS CLI, SAM CLI)"
	@echo "  $(YELLOW)validate$(NC)        Validate SAM template"
	@echo "  $(YELLOW)build$(NC)           Build SAM application"
	@echo "  $(YELLOW)deploy$(NC)          Quick deploy to development"
	@echo "  $(YELLOW)deploy-advanced$(NC) Advanced deploy with monitoring"
	@echo "  $(YELLOW)clean$(NC)           Clean build artifacts"
	@echo "  $(YELLOW)logs$(NC)            Show recent logs"
	@echo "  $(YELLOW)metrics$(NC)         Show key metrics"
	@echo "  $(YELLOW)monitor$(NC)         Open monitoring dashboard"
	@echo "  $(YELLOW)health$(NC)          Check system health"
	@echo ""
	@echo "Environment Management:"
	@echo "  $(YELLOW)env-list$(NC)        List all environments"
	@echo "  $(YELLOW)env-create$(NC)      Create new environment (ENV=name)"
	@echo "  $(YELLOW)env-delete$(NC)      Delete environment (ENV=name)"
	@echo "  $(YELLOW)env-status$(NC)      Show environment status (ENV=name)"
	@echo ""
	@echo "Examples:"
	@echo "  make deploy ENV=staging"
	@echo "  make env-create ENV=staging"
	@echo "  make logs ENV=prod"

# Check if required tools are installed
check-tools:
	@command -v aws >/dev/null 2>&1 || { echo "$(RED)AWS CLI not installed$(NC)"; exit 1; }
	@command -v sam >/dev/null 2>&1 || { echo "$(RED)SAM CLI not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Required tools are installed$(NC)"

# Install dependencies
install:
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	@if ! command -v aws &> /dev/null; then \
		echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"; \
		exit 1; \
	fi
	@if ! command -v sam &> /dev/null; then \
		echo "Please install SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Dependencies check completed$(NC)"

# Validate SAM template
validate: check-tools
	@echo "$(YELLOW)Validating SAM template...$(NC)"
	@sam validate --template template.yaml
	@echo "$(GREEN)✓ Template validation passed$(NC)"

# Build SAM application
build: check-tools validate
	@echo "$(YELLOW)Building SAM application...$(NC)"
	@sam build --cached --parallel
	@echo "$(GREEN)✓ Build completed$(NC)"

# Quick deploy
deploy: build
	@echo "$(YELLOW)Deploying to $(ENV) environment...$(NC)"
	@if [ -z "$(GEMINI_API_KEY)" ]; then \
		echo "$(RED)GEMINI_API_KEY environment variable not set$(NC)"; \
		exit 1; \
	fi
	@sam deploy \
		--stack-name $(STACK_NAME)-$(ENV) \
		--region $(REGION) \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			Environment=$(ENV) \
			GeminiApiKey=$(GEMINI_API_KEY) \
		--confirm-changeset
	@echo "$(GREEN)✓ Deployment completed$(NC)"

# Advanced deploy with monitoring
deploy-advanced: check-tools
	@echo "$(YELLOW)Running advanced deployment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/deploy-with-monitoring.sh
	@echo "$(GREEN)✓ Advanced deployment completed$(NC)"

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf .aws-sam/
	@echo "$(GREEN)✓ Clean completed$(NC)"

# Show logs
logs: check-tools
	@echo "$(YELLOW)Showing logs for $(ENV) environment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/monitor.sh logs

# Show metrics
metrics: check-tools
	@echo "$(YELLOW)Showing metrics for $(ENV) environment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/monitor.sh metrics

# Open monitoring dashboard
monitor: check-tools
	@echo "$(YELLOW)Opening monitoring dashboard for $(ENV) environment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/monitor.sh dashboard

# Check system health
health: check-tools
	@echo "$(YELLOW)Checking health for $(ENV) environment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/monitor.sh health

# Environment management
env-list: check-tools
	@./scripts/manage-environments.sh list

env-create: check-tools
	@./scripts/manage-environments.sh create $(ENV)

env-delete: check-tools
	@./scripts/manage-environments.sh delete $(ENV)

env-status: check-tools
	@./scripts/manage-environments.sh status $(ENV)

env-switch: check-tools
	@./scripts/manage-environments.sh switch $(ENV)

# Development helpers
dev-start: build
	@echo "$(YELLOW)Starting local development server...$(NC)"
	@sam local start-api --port 3001 --host 0.0.0.0

dev-test: build
	@echo "$(YELLOW)Running local tests...$(NC)"
	@sam local invoke AnalyzeFunction --event events/analyze-event.json

# Production deployment with safety checks
prod-deploy: check-tools
	@echo "$(RED)WARNING: Deploying to PRODUCTION$(NC)"
	@echo "This will affect live users. Are you sure?"
	@read -p "Type 'DEPLOY TO PROD' to continue: " confirm; \
	if [ "$$confirm" != "DEPLOY TO PROD" ]; then \
		echo "Deployment cancelled"; \
		exit 1; \
	fi
	@make deploy-advanced ENV=prod

# Rollback (delete and redeploy previous version)
rollback: check-tools
	@echo "$(YELLOW)Rolling back $(ENV) environment...$(NC)"
	@echo "This will delete the current stack and you'll need to redeploy manually"
	@read -p "Continue? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		aws cloudformation delete-stack --stack-name $(STACK_NAME)-$(ENV) --region $(REGION); \
		echo "$(GREEN)Stack deletion initiated$(NC)"; \
	else \
		echo "Rollback cancelled"; \
	fi

# Show stack outputs
outputs: check-tools
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME)-$(ENV) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
		--output table

# Tail logs in real-time
tail: check-tools
	@echo "$(YELLOW)Tailing logs for $(ENV) environment...$(NC)"
	@DEPLOY_ENV=$(ENV) ./scripts/monitor.sh tail