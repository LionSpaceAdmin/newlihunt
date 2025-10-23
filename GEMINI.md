# GEMINI.md

## Project Overview

This project is a web application called "Scam Hunter" that uses AI to detect online impersonation scams. The application is built with Next.js, React, and Tailwind CSS for the frontend, and it uses AWS Lambda and the Gemini API for the backend.

The application has a chat interface where users can submit suspicious content (text, links, or images). The backend then analyzes the content using the Gemini API and returns a risk score, a credibility score, and a classification (SAFE, SUSPICIOUS, or HIGH_RISK).

The frontend is a single-page application with a mobile-first design. It uses a WebSocket connection for real-time communication with the backend, with a fallback to a REST API.

The backend is a serverless application built with AWS Lambda. The `analyze` function is the core of the backend logic. It receives a request from the frontend, validates the input, and then uses the Gemini API to perform the analysis.

## Building and Running

### Frontend

To build and run the frontend, you need to have Node.js and npm installed.

1.  Install the dependencies:

```bash
npm install
```

2.  Run the development server:

```bash
npm run dev
```

This will start the development server on `http://localhost:3000`.

### Backend

The backend is an AWS Lambda function. To deploy and run the backend, you need to have an AWS account and the AWS CLI configured.

The `aws` directory contains the necessary files to deploy the Lambda function. The `template.yaml` file defines the AWS resources, and the `deploy.sh` script can be used to deploy the function.

## Development Conventions

- **Code Style:** The project uses ESLint to enforce a consistent code style. You can run the linter with the following command:

```bash
npm run lint
```

- **Testing:** The project uses Jest for testing. You can run the tests with the following command:

```bash
npm run test
```

- **Commits:** The project follows the Conventional Commits specification.
