pipeline {
    agent any

    environment {
        // --- SonarCloud ---
        SCANNER_HOME = tool 'sonar-scanner'
        SONAR_TOKEN  = credentials('sonar-token')
        SONAR_ORG    = 'automate-chat-application'
        SONAR_PROJECT_KEY = 'automate-chat-application_mychatappcicd'

        // --- Docker Images ---
        FRONTEND_IMAGE = 'pramod051/chat-frontend:latest'
        BACKEND_IMAGE  = 'pramod051/chat-backend:latest'

        // --- AWS DynamoDB Credentials (Stored in Jenkins) ---
        // Ensure you have created these 'Secret Text' credentials in Jenkins
        AWS_ACCESS_KEY_ID     = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        AWS_REGION            = 'us-east-1' // Change to your actual region
    }

    stages {
        /* -------------------- CODE ANALYSIS -------------------- */
        stage('SonarCloud Analysis') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.organization=${SONAR_ORG} \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.sources=backend,frontend \
                        -Dsonar.host.url=https://sonarcloud.io \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        /* -------------------- BUILD & PUSH -------------------- */
        stage('Build & Push Docker Images') {
            steps {
                script {
                    // 'docker-cred' is the ID of your Docker Hub credentials in Jenkins
                    docker.withRegistry('', 'docker-cred') {
                        sh "docker build -t ${FRONTEND_IMAGE} frontend/"
                        sh "docker push ${FRONTEND_IMAGE}"

                        sh "docker build -t ${BACKEND_IMAGE} backend/"
                        sh "docker push ${BACKEND_IMAGE}"
                    }
                }
            }
        }

        /* -------------------- DEPLOY -------------------- */
        stage('Deploy to EC2') {
            steps {
                // Use double quotes for the shell script to allow Groovy variable interpolation
                sh """
                    # 1. Cleanup existing containers
                    docker rm -f chat-frontend chat-backend || true
                    docker network create chat-net || true

                    # 2. Deploy Backend with DynamoDB Credentials
                    docker run -d \
                      --name chat-backend \
                      --network chat-net \
                      -p 5000:5000 \
                      -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                      -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                      -e AWS_REGION=${AWS_REGION} \
                      ${BACKEND_IMAGE}

                    # 3. Deploy Frontend
                    # Note: Using your EC2 Public IP for the API URL
                    docker run -d \
                      --name chat-frontend \
                      --network chat-net \
                      -p 3000:3000 \
                      -e REACT_APP_API_URL=http://65.0.32.172:5000 \
                      ${FRONTEND_IMAGE}
                """
            }
        }
    }
}
