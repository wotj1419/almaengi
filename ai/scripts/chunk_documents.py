"""법령 JSON을 Parent-Child 구조로 청킹하는 스크립트.

입력: data/raw_laws/*.json
출력: data/chunks/law_chunks.json
"""

import json
import glob
import os
import re
from pathlib import Path


RAW_LAWS_DIR = Path(__file__).parent.parent / "data" / "raw_laws"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "chunks"
OUTPUT_FILE = OUTPUT_DIR / "law_chunks.json"


def clean_text(text: str) -> str:
    """HTML 태그 제거, 불필요한 공백 정리."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\t+", " ", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def build_paragraph_text(paragraph: dict) -> str:
    """항 하나의 전체 텍스트를 조립 (항 + 호 + 목)."""
    parts = [clean_text(paragraph["paragraph_content"])]
    for item in paragraph.get("items", []):
        parts.append(clean_text(item["item_content"]))
        for sub_item in item.get("sub_items", []):
            parts.append(clean_text(sub_item.get("sub_item_content", "")))
    return "\n".join(p for p in parts if p)


def build_parent_content(article: dict) -> str:
    """조 전체 텍스트를 조립 (Parent용)."""
    parts = [clean_text(article["article_content"])]
    for para in article.get("paragraphs", []):
        parts.append(build_paragraph_text(para))
    return "\n".join(p for p in parts if p)


def make_child_prefix(article: dict) -> str:
    """Child content 앞에 붙일 조 접두사. 예: '제55조(휴일)'"""
    num = article["article_number"]
    title = article.get("article_title", "")
    if title:
        return f"제{num}조({title})"
    return f"제{num}조"


def chunk_article(article: dict, law_name: str, effective_date: str) -> list[dict]:
    """하나의 조문을 Parent + Child 청크 리스트로 변환."""
    chunks = []
    art_num = article["article_number"]
    art_title = article.get("article_title", "")

    # 장/편 헤더(제목 없는 조문)는 스킵
    if not art_title:
        return chunks

    chunk_id_base = f"{law_name}_제{art_num}조"
    prefix = make_child_prefix(article)

    base_metadata = {
        "law_name": law_name,
        "article": int(art_num) if art_num.isdigit() else art_num,
        "article_title": art_title,
        "doc_type": "law",
        "effective_date": effective_date,
    }

    # Parent Chunk (조 단위)
    parent_content = build_parent_content(article)
    parent_chunk = {
        "chunk_id": chunk_id_base,
        "chunk_type": "parent",
        "content": parent_content,
        "metadata": {
            **base_metadata,
            "related_articles": [],
            "concepts": [],
            "target": "",
        },
    }
    chunks.append(parent_chunk)

    paragraphs = article.get("paragraphs", [])

    if not paragraphs:
        # 항이 없는 조문: 조 자체가 Child (= Parent와 동일 content)
        child_chunk = {
            "chunk_id": chunk_id_base,
            "chunk_type": "child",
            "parent_id": chunk_id_base,
            "content": parent_content,
            "metadata": {**base_metadata},
        }
        chunks.append(child_chunk)
    else:
        # 항별로 Child 생성
        for para in paragraphs:
            para_num_raw = para["paragraph_number"]
            # 원문자(①②③...) → 숫자 추출
            para_num = extract_paragraph_number(para_num_raw)

            para_text = build_paragraph_text(para)
            child_content = f"{prefix} {para_text}"

            child_id = f"{chunk_id_base}_제{para_num}항"
            child_chunk = {
                "chunk_id": child_id,
                "chunk_type": "child",
                "parent_id": chunk_id_base,
                "content": child_content,
                "metadata": {
                    **base_metadata,
                    "paragraph": para_num,
                },
            }
            chunks.append(child_chunk)

    return chunks


def extract_paragraph_number(raw: str) -> int:
    """원문자(①②③...) 또는 숫자 문자열에서 항 번호 추출."""
    circled_digits = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
    raw = raw.strip()
    if raw in circled_digits:
        return circled_digits.index(raw) + 1
    digits = re.sub(r"\D", "", raw)
    return int(digits) if digits else 1


def process_law_file(filepath: str) -> list[dict]:
    """법령 JSON 파일 하나를 청킹."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    law_name = data["law_name"]
    effective_date = data.get("effective_date", "")
    chunks = []

    for article in data.get("articles", []):
        chunks.extend(chunk_article(article, law_name, effective_date))

    return chunks


def main():
    all_chunks = []
    law_files = sorted(glob.glob(str(RAW_LAWS_DIR / "*.json")))

    if not law_files:
        print("법령 파일이 없습니다. data/raw_laws/ 디렉토리를 확인하세요.")
        return

    for filepath in law_files:
        law_chunks = process_law_file(filepath)
        law_name = os.path.splitext(os.path.basename(filepath))[0]
        parent_count = sum(1 for c in law_chunks if c["chunk_type"] == "parent")
        child_count = sum(1 for c in law_chunks if c["chunk_type"] == "child")
        print(f"  {law_name}: Parent {parent_count}개, Child {child_count}개")
        all_chunks.extend(law_chunks)

    # 출력 디렉토리 생성 및 저장
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    # 통계
    total_parents = sum(1 for c in all_chunks if c["chunk_type"] == "parent")
    total_children = sum(1 for c in all_chunks if c["chunk_type"] == "child")
    child_lengths = [len(c["content"]) for c in all_chunks if c["chunk_type"] == "child"]
    avg_child_len = sum(child_lengths) / len(child_lengths) if child_lengths else 0

    print(f"\n총 법령 수: {len(law_files)}개")
    print(f"총 Parent 수: {total_parents}개")
    print(f"총 Child 수: {total_children}개")
    print(f"평균 Child 길이: {avg_child_len:.0f}자")
    print(f"\n출력: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
