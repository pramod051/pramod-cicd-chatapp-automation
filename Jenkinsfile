pipeline {
    agent any

    environment {
        // SonarCloud
        SCANNER_HOME = tool 'sonar-scanner'
        SONAR_TOKEN  = credentials('sonar-token')
        SONAR_ORG    = 'automate-chat-application'
        SONAR_PROJECT_KEY = 'automate-chat-application_chatwithteams'

        // Docker images
        FRONTEND_IMAGE = 'pramod051/chat-frontend:latest'
        BACKEND_IMAGE  = 'pramod051/chat-backend:latest'

        // Database This is existing currently we have commented out
        //DB_HOST     = credentials('DB_HOST')
        //DB_USER     = credentials('DB_USER')
        //DB_PASSWORD = credentials('DB_PASSWORD')
        //DB_NAME     = credentials('DB_NAME')
        
        // Database ENV VARS from Jenkins Credentials new add
        DB_HOST = credentials('DB_HOST')
        DB_USER = credentials('DB_USER')
        DB_PASSWORD = credentials('DB_PASSWORD')
        DB_NAME = credentials('DB_NAME')
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
                    docker.withRegistry('', 'docker-cred') {

                        sh 'docker build -t $FRONTEND_IMAGE frontend/'
                        sh 'docker push $FRONTEND_IMAGE'

                        sh 'docker build -t $BACKEND_IMAGE backend/'
                        sh 'docker push $BACKEND_IMAGE'
                    }
                }
            }
        }

        /* -------------------- DEPLOY -------------------- */
        stage('Deploy to EC2') {
            steps {
                sh '''
                docker rm -f chat-frontend chat-backend || true

                docker network create chat-net || true

                docker run -d \
                  --name chat-backend \
                  --network chat-net \
                  -p 5000:5000 \
                  -e DB_HOST=${DB_HOST} \
                  -e DB_USER=${DB_USER} \
                  -e DB_PASSWORD=${DB_PASSWORD} \
                  -e DB_NAME=${DB_NAME} \
                  ${BACKEND_IMAGE}

                docker run -d \
                  --name chat-frontend \
                  --network chat-net \
                  -p 3000:3000 \
                  -e REACT_APP_API_URL=http://65.0.32.172:5000 \
                  ${FRONTEND_IMAGE}
                '''
            }
        }
    }
}

