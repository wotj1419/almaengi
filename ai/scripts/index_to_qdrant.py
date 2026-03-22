"""
청킹된 법령 문서를 BGE-m3로 임베딩하고 Qdrant에 인덱싱하는 스크립트.
입력: data/chunks/law_chunks.json
출력: Qdrant 컬렉션 'labor_law'
"""

import json
import time
from pathlib import Path

from FlagEmbedding import BGEM3FlagModel
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

CHUNKS_FILE = Path(__file__).parent.parent / "data" / "chunks" / "law_chunks.json"
QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = "labor_law"
VECTOR_SIZE = 1024  # BGE-m3 Dense 벡터 차원
EMBED_BATCH_SIZE = 32
UPSERT_BATCH_SIZE = 100


def load_chunks() -> list[dict]:
    with open(CHUNKS_FILE, encoding="utf-8") as f:
        chunks = json.load(f)
    parent_count = sum(1 for c in chunks if c["chunk_type"] == "parent")
    child_count = sum(1 for c in chunks if c["chunk_type"] == "child")
    print(f"Chunk 로드: 총 {len(chunks)}개 (Parent: {parent_count}, Child: {child_count})")
    return chunks


def load_model() -> BGEM3FlagModel:
    print("BGE-m3 모델 로드 중...")
    start = time.time()
    model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)
    print(f"모델 로드 완료 ({time.time() - start:.1f}초)")
    return model


def embed_chunks(model: BGEM3FlagModel, chunks: list[dict]) -> list[list[float]]:
    sentences = [c["content"] for c in chunks]
    print(f"임베딩 생성 중... (batch_size={EMBED_BATCH_SIZE})")
    start = time.time()
    result = model.encode(sentences, batch_size=EMBED_BATCH_SIZE, max_length=512)
    dense_vecs = result["dense_vecs"]
    elapsed = time.time() - start
    print(f"임베딩 완료: {len(sentences)}개 ({elapsed:.0f}초)")

    return [vec.tolist() for vec in dense_vecs]  # type: ignore[union-attr]


def create_collection(client: QdrantClient) -> None:
    if client.collection_exists(COLLECTION_NAME):
        client.delete_collection(COLLECTION_NAME)
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
    )
    print(f"Qdrant 컬렉션 '{COLLECTION_NAME}' 생성 완료")

    # Payload Index 생성
    for field, schema in [
        ("law_name", PayloadSchemaType.KEYWORD),
        ("article", PayloadSchemaType.INTEGER),
        ("doc_type", PayloadSchemaType.KEYWORD),
        ("chunk_type", PayloadSchemaType.KEYWORD),
    ]:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field,
            field_schema=schema,
        )
    print("Payload Index 생성: law_name, article, doc_type, chunk_type")


def upsert_points(client: QdrantClient, chunks: list[dict], vectors: list[list[float]]) -> None:
    points = []
    for i, chunk in enumerate(chunks):
        point = PointStruct(
            id=i,
            vector=vectors[i],
            payload={
                "chunk_id": chunk["chunk_id"],
                "chunk_type": chunk["chunk_type"],
                "parent_id": chunk.get("parent_id", ""),
                "content": chunk["content"],
                **chunk["metadata"],
            },
        )
        points.append(point)

    print(f"배치 업서트 중... ({UPSERT_BATCH_SIZE}개씩)")
    for i in range(0, len(points), UPSERT_BATCH_SIZE):
        batch = points[i : i + UPSERT_BATCH_SIZE]
        client.upsert(collection_name=COLLECTION_NAME, points=batch)
        print(f"  [{min(i + UPSERT_BATCH_SIZE, len(points))}/{len(points)}] 업서트 완료")

    print(f"인덱싱 완료: 총 {len(points)}개 포인트")


def search_test(client: QdrantClient, model: BGEM3FlagModel) -> None:
    print("\n=== 검색 테스트 ===")
    test_queries = [
        "주휴수당 지급 조건",
        "최저임금 위반 시 벌칙",
        "퇴직금 지급 기준",
    ]

    for query in test_queries:
        query_vector = model.encode([query])["dense_vecs"][0].tolist()  # type: ignore[union-attr]
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=3,
        )
        print(f"\n쿼리: {query}")
        for r in results.points:
            payload = r.payload or {}
            print(f"  [{r.score:.4f}] {payload['chunk_id']}")
            print(f"    {payload['content'][:100]}...")


def main():
    # 1. Chunk 로드
    chunks = load_chunks()

    # 2. 모델 로드 및 임베딩 생성
    model = load_model()
    vectors = embed_chunks(model, chunks)

    # 3. Qdrant 컬렉션 생성 및 인덱싱
    client = QdrantClient(url=QDRANT_URL)
    create_collection(client)
    upsert_points(client, chunks, vectors)

    # 4. 검색 테스트
    search_test(client, model)


if __name__ == "__main__":
    main()
