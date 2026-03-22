import requests, os

# 검색 API 테스트
"""
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('.').resolve().parent / '.env')
key = os.getenv('LAW_API_OC')
resp = requests.get('http://apis.data.go.kr/1170000/law/lawSearchList.do', params={'ServiceKey':key, 'target':'law', 'query':'근로기준법', 'numOfRows':'3', 'pageNo':'1'})
"""

# 본문 조회 API 테스트 
resp = requests.get('https://www.law.go.kr/DRF/lawService.do', params={'OC':'sapphire_5', 'target':'law', 'MST':'265959', 'type':'XML', 'efYd':20251023})

resp.encoding = 'utf-8'
print(resp.status_code)
print(resp.text[:10000])


