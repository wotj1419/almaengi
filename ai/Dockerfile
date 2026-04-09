FROM python:3.11-slim

WORKDIR /app

# Poetry 설치
RUN pip install --no-cache-dir poetry

# 가상환경을 컨테이너 내부에 생성하지 않음 (Docker 자체가 격리 환경)
RUN poetry config virtualenvs.create false

# 의존성 파일 먼저 복사 (캐시 레이어 활용)
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --only main

# 소스 코드 복사
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
