#!/bin/bash
# 린트 체크 + 자동 수정 + 포맷팅
poetry run ruff check app/ --fix && poetry run ruff format app/
