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
                    git reset --hard origin/release
                """
            }
        }

        stage('Build & Deploy') {
            parallel {
                stage('Backend') {
                    steps {
                        sh """
                            cd ${PROJECT_DIR}
                            docker compose build be
                            docker compose up -d be
                        """
                    }
                }
                stage('Frontend') {
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
                cd ${PROJECT_DIR}
                docker compose logs --tail 30 be
                docker compose logs --tail 30 ai
                docker compose logs --tail 10 nginx
            """
        }
    }
}