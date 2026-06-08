// ─────────────────────────────────────────────────────────────
// front-app CI/CD 파이프라인
//
// Stage 1) Checkout: GitHub에서 소스 받아옴
// Stage 2) SonarQube 분석: JS/TS 정적 분석
// Stage 3) 품질 게이트: 통과 못 하면 빌드 중단
// Stage 4) Kaniko 빌드 + Harbor push: 도커 이미지 만들어서 레지스트리에 올림
// Stage 5) GitOps 업데이트: gb-infra의 values.yaml에서 image tag 갱신 → ArgoCD가 감지
// ─────────────────────────────────────────────────────────────
pipeline {
  agent {
    kubernetes {
      yaml '''
        spec:
          containers:
          - name: git
            image: alpine/git:latest
            command: ["sleep"]
            args: ["infinity"]
          - name: scanner
            image: sonarsource/sonar-scanner-cli:latest
            command: ["sleep"]
            args: ["infinity"]
          - name: kaniko
            image: gcr.io/kaniko-project/executor:debug
            command: ["sleep"]
            args: ["infinity"]
            volumeMounts:
            - name: harbor-dockercfg
              mountPath: /kaniko/.docker
          volumes:
          - name: harbor-dockercfg
            secret:
              secretName: harbor-dockercfg
              items:
              - key: .dockerconfigjson
                path: config.json
      '''
    }
  }

  environment {
    IMAGE       = "harbor.sb.fisa/global_bridge/front-app:${BUILD_NUMBER}"
    REPO        = "https://github.com/Sangam-Beavers/frontend"
    BRANCH      = "feature/#162"
    CONFIG_REPO = "github.com/Sangam-Beavers/gb-infra"
    VALUES_PATH = "charts/front-app/values.yaml"
  }

  stages {
    stage('1) Checkout') {
      steps {
        container('git') {
          sh '''
            set -e
            git clone --depth 1 --branch "${BRANCH}" "https://${REPO}.git" source
            ls -la source/Dockerfile source/nginx.conf source/.dockerignore
          '''
        }
      }
    }

    stage('2) SonarQube 분석') {
      steps {
        container('scanner') {
          dir('source') {
            withSonarQubeEnv('sonarqube') {
              sh 'sonar-scanner'
            }
          }
        }
      }
    }

    stage('3) 품질 게이트') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('4) Harbor 빌드 & push') {
      steps {
        container('kaniko') {
          sh '''
            /kaniko/executor \
              --context `pwd`/source \
              --dockerfile Dockerfile \
              --destination "${IMAGE}" \
              --skip-tls-verify
          '''
        }
      }
    }

    stage('5) Config repo 업데이트 (GitOps)') {
      steps {
        container('git') {
          withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
            sh '''
              set -e
              git config --global user.name  "Jenkins CI"
              git config --global user.email "jenkins@sb.fisa"

              git clone "https://oauth2:${GITHUB_TOKEN}@${CONFIG_REPO}.git" config-repo
              cd config-repo

              # values.yaml의 image.tag를 BUILD_NUMBER로 치환
              sed -i 's|^\\(  tag:\\).*|\\1 "'"${BUILD_NUMBER}"'"|' ${VALUES_PATH}

              echo "=== 변경 결과 ==="
              grep "tag:" ${VALUES_PATH}

              if git diff --quiet; then
                echo "변경사항 없음 — 커밋 생략"
                exit 0
              fi

              git add ${VALUES_PATH}
              git commit -m "ci: bump front-app image to ${BUILD_NUMBER}"
              git push origin main
            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo "✅ 성공! 이미지: ${IMAGE}"
      echo "   → gb-infra 커밋 → ArgoCD 자동 sync → 개발기 배포"
    }
    failure {
      echo "❌ 실패 — Console Output에서 stage 확인"
    }
  }
}
