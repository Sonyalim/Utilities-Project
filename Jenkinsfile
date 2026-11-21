pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.65.1-noble'
    }
  }

  options {
    timestamps()
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Run tests') {
      steps {
        sh 'npm test'
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/junit.xml'
      archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/html/**'
    }
  }
}
