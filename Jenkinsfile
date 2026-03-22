pipeline {
    agent any

    environment {
        PROJECT_DIR = '/home/ubuntu/almaengi'
    }

    stages {
        stage('Pull Latest Code') {
            steps {
                sh """
                    cd ${PROJECT_DIR}
                    git fetch origin release
                    git diff --name-only HEAD origin/release > /tmp/changed_files.txt
                    cat /tmp/changed_files.txt
                    git reset --hard origin/release
                """
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    def changes = readFile('/tmp/changed_files.txt').trim()
                    env.BUILD_BE = changes.contains('be/') ? 'true' : 'false'
                    env.BUILD_FE = changes.contains('fe/') ? 'true' : 'false'
                    env.BUILD_AI = changes.contains('ai/') ? 'true' : 'false'
                    env.BUILD_INFRA = changes.contains('docker-compose') || changes.contains('nginx/') ? 'true' : 'false'

                    echo "Backend changed: ${env.BUILD_BE}"
                    echo "Frontend changed: ${env.BUILD_FE}"
                    echo "AI changed: ${env.BUILD_AI}"
                    echo "Infra changed: ${env.BUILD_INFRA}"

                    if (env.BUILD_BE == 'false' && env.BUILD_FE == 'false' && env.BUILD_AI == 'false' && env.BUILD_INFRA == 'false') {
                        echo "No service changes detected. Building all as fallback."
                        env.BUILD_BE = 'true'
                        env.BUILD_FE = 'true'
                        env.BUILD_AI = 'true'
                    }
                }
            }
        }

        stage('Build & Deploy') {
            parallel {
                stage('Backend') {
                    when { expression { env.BUILD_BE == 'true' } }
                    steps {
                        sh """
                            cd ${PROJECT_DIR}
                            docker compose build be
                            docker compose up -d be
                        """
                    }
                }
                stage('Frontend') {
                    when { expression { env.BUILD_FE == 'true' } }
                    steps {
                        sh """
                            cd ${PROJECT_DIR}
                            docker compose build fe
                            docker compose up -d fe
                            sleep 5
                            docker compose restart nginx
                        """
                    }
                }
                stage('AI') {
                    when { expression { env.BUILD_AI == 'true' } }
                    steps {
                        sh """
                            cd ${PROJECT_DIR}
                            docker compose build ai
                            docker compose up -d ai
                        """
                    }
                }
            }
        }

        stage('Infra Update') {
            when { expression { env.BUILD_INFRA == 'true' } }
            steps {
                sh """
                    cd ${PROJECT_DIR}
                    docker compose up -d
                """
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 15

                    SERVICES="be nginx postgres redis ai qdrant ai-redis"
                    FAILED=0

                    for SERVICE in $SERVICES; do
                        CONTAINER="almaengi-${SERVICE}-1"
                        STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER 2>/dev/null || echo "not found")
                        if [ "$STATUS" != "running" ]; then
                            echo "[FAIL] $CONTAINER: $STATUS"
                            FAILED=1
                        else
                            echo "[OK] $CONTAINER: running"
                        fi
                    done

                    if [ $FAILED -eq 1 ]; then
                        echo "Some services are not running!"
                        exit 1
                    fi

                    echo "All services are healthy."
                '''
            }
        }
    }

    post {
        success {
            echo '배포 성공!'
        }
        failure {
            echo '배포 실패! 로그 확인:'
            sh """
                docker logs almaengi-be-1 --tail 30 2>&1 || true
                docker logs almaengi-ai-1 --tail 30 2>&1 || true
                docker logs almaengi-nginx-1 --tail 10 2>&1 || true
            """
        }
    }
}