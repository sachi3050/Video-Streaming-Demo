pipeline {
  agent any

  environment {
    APP_NAME        = "video-streaming-demo"
    DOCKERHUB_NS    = "your-dockerhub-username"      // <-- change me
    IMAGE_TAG       = "v${env.BUILD_NUMBER}"
    IMAGE_LATEST    = "${DOCKERHUB_NS}/${APP_NAME}:latest"
    IMAGE_VERSIONED = "${DOCKERHUB_NS}/${APP_NAME}:${IMAGE_TAG}"

    // Sonar (configure server in Jenkins > System, tool in Global Tool Config)
    SONARQUBE_ENV   = "SonarQube-Server"             // Jenkins server name
  }

  options { timestamps() }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv("${SONARQUBE_ENV}") {
          // Requires "SonarScanner" tool configured (Manage Jenkins > Global Tool Configuration)
          sh """
            sonar-scanner \
              -Dsonar.projectKey=${APP_NAME} \
              -Dsonar.projectName=${APP_NAME}
          """
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh """
          docker build -t ${IMAGE_VERSIONED} .
          docker tag ${IMAGE_VERSIONED} ${IMAGE_LATEST}
        """
      }
    }

    stage('Trivy Image Scan') {
      steps {
        // Fail build on HIGH/CRITICAL vulns
        sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${IMAGE_VERSIONED}"
      }
    }

    stage('Docker Hub Login & Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh """
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker push ${IMAGE_VERSIONED}
            docker push ${IMAGE_LATEST}
          """
        }
      }
    }

    stage('Deploy to EC2 via SSH') {
      steps {
        sshagent(credentials: ['ec2-ssh-key']) {
          sh """
            ssh -o StrictHostKeyChecking=no ubuntu@<EC2_PUBLIC_IP> '
              echo "Pulling and restarting ${APP_NAME}..." &&
              echo "$(/usr/bin/docker --version)" &&
              docker pull ${IMAGE_VERSIONED} &&
              docker rm -f ${APP_NAME} || true &&
              docker run -d --name ${APP_NAME} -p 3000:3000 --restart=always ${IMAGE_VERSIONED}
            '
          """
        }
      }
    }
  }

  post {
    always {
      echo "Pipeline finished with status: ${currentBuild.currentResult}"
    }
  }
}
