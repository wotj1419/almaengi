pipeline {
    agent any

    environment {
        PROJECT_DIR = '/home/ubuntu/almaengi'
    }

    stages {
        stage('Deploy') {
            steps {
                sh """
                    cd ${PROJECT_DIR}
                    git fetch origin release
                    git reset --hard origin/release
                    docker compose build be fe ai
                    docker compose up -d be fe ai
                    sleep 5
                    docker compose restart nginx
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