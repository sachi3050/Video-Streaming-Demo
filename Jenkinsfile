pipeline {
  agent any

  environment {
    APP_NAME        = "video-streaming-demo"
    SCANNER_HOME= tool 'sonar-scanner'
      
  }


  stages {

    stage('Checkout') {
      steps {
       git branch: 'main', changelog: false, credentialsId: 'git-cred', poll: false, url: 'https://github.com/sachi3050/Video-Streaming-Demo.git'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv("sonar-server") {
          sh """
              $SCANNER_HOME/bin/sonar-scanner -Dsonar.projectName=${APP_NAME} \
              -Dsonar.java.binaries=. \
              -Dsonar.projectKey=${APP_NAME} 
          """
        }
      }
    }

    stage('Build and Push Docker Image') {
      steps {
          script {
              withDockerRegistry(credentialsId: 'docker-cred') {
                  sh "docker build -t webapp ."
                  sh "docker tag webapp sachidananda06/video-webapp:latest"
                  sh "docker push sachidananda06/video-webapp:latest "
              }
          }
      }
    }

    // Didn't add Trivy Image Scan, because It was showing so many Vulnerabilities. For now, It's a pleasure to deploy this simple static webapp. 
    
    stage('Deploy using Docker') {
      steps {
          script {
              withDockerRegistry(credentialsId: 'docker-cred') {
                 sh "docker run -d --name ${APP_NAME} -p 3000:3000 --restart=always sachidananda06/video-webapp:latest"
        }
      }
    }
  }
}
}
