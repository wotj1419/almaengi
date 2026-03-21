"""
국가법령정보센터 API -> 노동법 관련 법령 수집 스크립트
6개 법령의 본문을 조/항/호/목 단위로 파싱 -> JSON 저장
"""

import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import requests
from dotenv import load_dotenv

# ── 설정 ──

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")

SERVICE_KEY = os.getenv("LAW_API_OC")
if not SERVICE_KEY:
    print("ERROR: .env에 LAW_API_OC가 설정되지 않았습니다.")
    sys.exit(1)

# 공공데이터포털 API (목록 검색, 법령일련번호(MST) 획득)
SEARCH_URL = "http://apis.data.go.kr/1170000/law/lawSearchList.do"

# 국가법령정보센터 DRF API (본문 조회)
LAW_URL = "http://www.law.go.kr/DRF/lawService.do"
LAW_OC = "sapphire_5"  # 공개 OC / 국가법령정보센터 API 신청 시 입력한 OC 입력

OUTPUT_DIR = BASE_DIR / "data" / "raw_laws"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_LAWS = [
    "근로기준법",
    "최저임금법",
    "고용보험법",
    "근로자퇴직급여 보장법",
    "국민연금법",
    "산업재해보상보험법",
]

MAX_RETRIES = 3
RETRY_DELAY = 2  # sec


# ── 유틸 ──

def clean_text(text: str | None) -> str:
    """HTML 태그 제거 및 공백 정리."""
    if not text:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.strip()
    return text


def api_call(url: str, params: dict) -> requests.Response | None:
    """API 호출 (최대 3회 재시도)."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.encoding = "utf-8"
            if resp.status_code == 200:
                return resp
            print(f"  [WARN] HTTP {resp.status_code} (시도 {attempt}/{MAX_RETRIES})")
        except requests.RequestException as e:
            print(f"  [WARN] 요청 실패: {e} (시도 {attempt}/{MAX_RETRIES})")
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
    return None


# ── 법령 검색 ──

def search_law_mst(law_name: str) -> tuple[str, str] | None:
    """법령명으로 검색하여 (법령일련번호(MST), 시행일자)를 반환."""
    print(f"  검색 중: {law_name}")
    params = {
        "ServiceKey": SERVICE_KEY,
        "target": "law",
        "query": law_name,
        "numOfRows": "20",
        "pageNo": "1",
    }
    resp = api_call(SEARCH_URL, params)
    if resp is None:
        print(f"  [ERROR] 법령 검색 실패: {law_name}")
        return None

    root = ET.fromstring(resp.text)

    def extract_mst_efyd(item: ET.Element) -> tuple[str, str] | None:
        mst_el = item.find("법령일련번호")
        efyd_el = item.find("시행일자")
        if mst_el is not None and mst_el.text:
            mst = mst_el.text.strip()
            efyd = efyd_el.text.strip() if efyd_el is not None and efyd_el.text else ""
            return mst, efyd
        return None

    # 정확히 일치하는 법령 찾기 (현행 법령 우선)
    for item in root.iter("law"):
        name_el = item.find("법령명한글")
        if name_el is not None and name_el.text and name_el.text.strip() == law_name:
            result = extract_mst_efyd(item)
            if result:
                print(f"  → MST: {result[0]}, 시행일자: {result[1]}")
                return result

    # 정확히 일치하는 게 없으면 첫 번째 결과 사용
    first = root.find(".//law")
    if first is not None:
        result = extract_mst_efyd(first)
        if result:
            name_el = first.find("법령명한글")
            name = name_el.text.strip() if name_el is not None and name_el.text else "?"
            print(f"  → (유사) {name}, MST: {result[0]}, 시행일자: {result[1]}")
            return result

    print(f"  [ERROR] 검색 결과 없음: {law_name}")
    return None


# ── 조문 파싱 ──

def parse_sub_items(parent_el: ET.Element) -> list[dict]:
    """목 파싱."""
    sub_items = []
    for mok in parent_el.iter("목"):
        number_el = mok.find("목번호")
        content_el = mok.find("목내용")
        if number_el is None:
            continue
        sub_items.append({
            "sub_item_number": clean_text(number_el.text),
            "sub_item_content": clean_text(content_el.text) if content_el is not None else "",
        })
    return sub_items


def parse_items(parent_el: ET.Element) -> list[dict]:
    """호 파싱."""
    items = []
    for ho in parent_el.iter("호"):
        number_el = ho.find("호번호")
        content_el = ho.find("호내용")
        if number_el is None:
            continue
        item: dict = {
            "item_number": clean_text(number_el.text),
            "item_content": clean_text(content_el.text) if content_el is not None else "",
        }
        sub_items = parse_sub_items(ho)
        if sub_items:
            item["sub_items"] = sub_items
        items.append(item)
    return items


def parse_paragraphs(article_el: ET.Element) -> list[dict]:
    """항 파싱."""
    paragraphs = []
    for hang in article_el.iter("항"):
        number_el = hang.find("항번호")
        content_el = hang.find("항내용")
        if number_el is None:
            continue
        paragraph: dict = {
            "paragraph_number": clean_text(number_el.text),
            "paragraph_content": clean_text(content_el.text) if content_el is not None else "",
        }
        items = parse_items(hang)
        if items:
            paragraph["items"] = items
        paragraphs.append(paragraph)
    return paragraphs


def parse_articles(root: ET.Element) -> list[dict]:
    """조문 전체 파싱 (삭제 조문 제외)."""
    articles = []
    for jo in root.iter("조문단위"):
        # 삭제 조문 제외
        status_el = jo.find("조문여부")
        if status_el is not None and status_el.text and "삭제" in status_el.text:
            continue

        number_el = jo.find("조문번호")
        if number_el is None:
            continue

        title_el = jo.find("조문제목")
        content_el = jo.find("조문내용")

        article: dict = {
            "article_number": clean_text(number_el.text),
            "article_title": clean_text(title_el.text) if title_el is not None else "",
            "article_content": clean_text(content_el.text) if content_el is not None else "",
        }

        paragraphs = parse_paragraphs(jo)
        if paragraphs:
            article["paragraphs"] = paragraphs

        articles.append(article)

    return articles


# ── 법령 본문 조회 ──

def fetch_law(mst: str, efyd: str, law_name: str) -> dict | None:
    """MST로 법령 본문을 조회하고 파싱."""
    print(f"  본문 조회 중: {law_name} (MST={mst}, efYd={efyd})")
    params = {
        "OC": LAW_OC,
        "target": "law",
        "type": "XML",
        "MST": mst,
        "efYd": efyd,
    }
    resp = api_call(LAW_URL, params)
    if resp is None:
        print(f"  [ERROR] 본문 조회 실패: {law_name}")
        return None

    root = ET.fromstring(resp.text)

    # 기본정보 추출
    info = root.find("기본정보")
    law_id = ""
    effective_date = ""
    if info is not None:
        law_id_el = info.find("법령ID")
        law_id = law_id_el.text.strip() if law_id_el is not None and law_id_el.text else ""
        eff_el = info.find("시행일자")
        effective_date = eff_el.text.strip() if eff_el is not None and eff_el.text else ""

    articles = parse_articles(root)
    print(f"  → {len(articles)}개 조문 파싱 완료")

    return {
        "law_name": law_name,
        "law_id": law_id,
        "effective_date": effective_date,
        "articles": articles,
    }


# ── 메인 ──

def main():
    print("=" * 50)
    print("법령 데이터 수집 시작")
    print("=" * 50)

    success_count = 0

    for law_name in TARGET_LAWS:
        print(f"\n[{law_name}]")

        # 1) 법령 검색 → MST, 시행일자 획득
        result = search_law_mst(law_name)
        if not result:
            continue
        mst, efyd = result
        time.sleep(1)

        # 2) 본문 조회 및 파싱
        law_data = fetch_law(mst, efyd, law_name)
        if not law_data:
            continue
        time.sleep(1)

        # 3) JSON 저장
        output_path = OUTPUT_DIR / f"{law_name}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(law_data, f, ensure_ascii=False, indent=2)
        print(f"  → 저장: {output_path}")
        success_count += 1

    print(f"\n{'=' * 50}")
    print(f"완료: {success_count}/{len(TARGET_LAWS)}개 법령 수집 성공")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
