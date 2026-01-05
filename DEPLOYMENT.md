# Deployment Guide

This document describes how to deploy the Career Data API to AWS Lambda.

## Prerequisites

1. AWS Account with Lambda access
2. AWS IAM user with deployment permissions
3. GitHub repository with Actions enabled

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key for deployment | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key for deployment | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region where Lambda is deployed | `us-east-1` |
| `LAMBDA_FUNCTION_NAME` | (Optional) Lambda function name | `career-data-api` |

## Lambda Environment Variables

The Lambda function requires these environment variables (configured in AWS Console or via CLI):

| Variable            | Description                       |
| ------------------- | --------------------------------- |
| `MONGODB_URI`       | MongoDB Atlas connection string   |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude      |
| `API_ACCESS_KEY`    | Secret key for API authentication |

## Initial Lambda Setup (One-time)

Before the CI/CD pipeline can deploy, create the Lambda function:

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name career-data-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --timeout 60 \
  --memory-size 512 \
  --architectures arm64 \
  --zip-file fileb://function.zip

# Create Function URL for public access
aws lambda create-function-url-config \
  --function-name career-data-api \
  --auth-type NONE

# Add resource-based policy for public invocation
aws lambda add-permission \
  --function-name career-data-api \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE

# Set environment variables
aws lambda update-function-configuration \
  --function-name career-data-api \
  --environment "Variables={MONGODB_URI=your-mongodb-uri,ANTHROPIC_API_KEY=your-anthropic-key,API_ACCESS_KEY=your-api-key}"
```

## IAM Permissions

### Lambda Execution Role

The Lambda execution role needs:

- `AWSLambdaBasicExecutionRole` - CloudWatch Logs access
- Network access to MongoDB Atlas (via public internet)
- Network access to Anthropic API (via public internet)

### Deployment IAM User

The deployment IAM user (used by GitHub Actions) needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:*:*:function:career-data-api"
    }
  ]
}
```

## CI/CD Workflows

### PR Validation (`.github/workflows/pr-validate.yml`)

Runs on pull requests to `main`:

1. Lint & Type Check - ESLint and TypeScript validation
2. Test - Run unit and property-based tests
3. Build - Compile and bundle for Lambda

### Deploy (`.github/workflows/deploy.yml`)

Runs on push to `main`:

1. Build - Compile, test, and create deployment package
2. Deploy - Update Lambda function code via AWS CLI

## Manual Deployment

To deploy manually:

```bash
# Build the deployment package
npm run build

# Deploy to Lambda
aws lambda update-function-code \
  --function-name career-data-api \
  --zip-file fileb://function.zip \
  --publish
```

## Build Output

The build process creates:

- `dist/index.mjs` - Bundled ES module for Lambda
- `dist/package.json` - Package manifest for ES module support
- `function.zip` - Lambda deployment package
