# 경매 API 명세

---

## 1. 경매 등록

### Request

- **Method**: POST
- **Path Variable**
  - `storeId`(Long): 매장 식별자

**Request Body**

```json
{
  "targetDate": "2026-03-10",
  "targetStartTime": "18:00:00",
  "targetEndTime": "23:59:00",
  "deadline": "2026-03-09T18:00:00",
  "minWage": 10320,
  "maxWage": 15000,
  "recruitCount": 2
}
```

> `minWage`가 제공되지 않을 시 시스템 설정의 법정 최저시급이 적용됩니다.
> `recruitCount` 미제공 시 기본값 1이 사용됩니다.

### Response

**200 등록 성공**

```json
{
  "status": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": null
}
```

**에러 응답 예시**

```json
{
  "status": "A004",
  "message": "상한가는 하한가 이상이어야 합니다.",
  "data": null
}
```

### Status

| status code | error code | message                                   |
| ----------- | ---------- | ----------------------------------------- |
| 200         |            | 요청이 성공적으로 처리되었습니다.         |
| 404         | U001       | 해당 사용자를 찾을 수 없습니다.           |
| 403         | U003       | 접근 권한이 없는 역할입니다.              |
| 404         | S001       | 해당 매장을 찾을 수 없습니다.             |
| 400         | A003       | 하한가는 법정 최저시급 이상이어야 합니다. |
| 400         | A004       | 상한가는 하한가 이상이어야 합니다.        |

---

## 2. 경매 낙찰

### Request

- **Method**: POST
- **Path Variable**
  - `auctionId`(Long): 경매 식별자

**Request Body**

```json
{
  "selectedBidIds": [101, 102]
}
```

### Response

**200 성공**

```json
{
  "status": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": null
}
```

> 경매가 마감(`CLOSED`) 상태로 전환되며 시스템 내부적으로 `Attendances` (예정 출근 기록) 객체가 `ABSENT(결근)` 기본값으로 생성되고, 알바생의 예정 근무 시간이 업데이트 됩니다.

**에러 응답 예시**

```json
{
  "status": "A005",
  "message": "희망 시급은 상한가와 하한가 사이여야 합니다.",
  "data": null
}
```

### Status

| status code | error code | message                                      |
| ----------- | ---------- | -------------------------------------------- |
| 200         |            | 요청이 성공적으로 처리되었습니다.            |
| 404         | U001       | 해당 사용자를 찾을 수 없습니다.              |
| 403         | U003       | 접근 권한이 없는 역할입니다.                 |
| 404         | A001       | 해당 구인 경매를 찾을 수 없습니다.           |
| 400         | A002       | 현재 진행 중인 경매가 아닙니다.              |
| 400         | A006       | 선택된 지원자가 없습니다.                    |
| 400         | A007       | 유효하지 않는 입찰 정보가 포함되어 있습니다. |

---

## 3. 경매 조회

### Request

- **Method**: GET
- **Path Variable**
  - `storeId`(Long): 매장 식별자

### Response

**200 정상 응답**

```json
{
  "status": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "auctionId": 1,
      "storeId": 1,
      "targetDate": "2026-03-10",
      "targetStartTime": "18:00:00",
      "targetEndTime": "23:59:00",
      "deadline": "2026-03-09T18:00:00",
      "minWage": 10320,
      "maxWage": 15000,
      "recruitCount": 2,
      "status": "IN_PROGRESS",
      "winnerIds": []
    }
  ]
}
```

### Status

| status code | message   |
| ----------- | --------- |
| 200         | 정상 응답 |

---

## 4. 경매 상세 조회

### Request

- **Method**: GET
- **Path Variable**
  - `auctionId`(Long): 경매 식별자

### Response

**200 성공 (사장님의 경우)**

```json
{
  "status": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "auction": {
      "auctionId": 1,
      "storeId": 1,
      "targetDate": "2026-03-10",
      "targetStartTime": "18:00:00",
      "targetEndTime": "23:59:00",
      "deadline": "2026-03-09T18:00:00",
      "minWage": 10320,
      "maxWage": 15000,
      "recruitCount": 2,
      "status": "IN_PROGRESS",
      "winnerIds": []
    },
    "bidders": {
      "group1": [
        {
          "bidId": 101,
          "employeeId": 10,
          "applicantName": "알바생김씨",
          "proposedWage": 11000,
          "tags": ["우수", "근속 2년", "결근 0회"],
          "bidTime": "2026-03-08T14:30:00"
        }
      ],
      "group2": [],
      "group3": []
    }
  }
}
```

> 권한이 알바생인 경우 반환 객체의 `bidders` 필드는 `null` 값으로 내려갑니다.

> **bidders 그룹 구분:**
>
> - group1: 이미 주휴 받는 중인 그룹
> - group2: 이번에 대타를 하면 주휴수당을 받게 되는 그룹
> - group3: 이번에 대타를 해도 주휴수당을 받지 않는 그룹

**에러 응답 예시**

```json
{
  "status": "A005",
  "message": "희망 시급은 상한가와 하한가 사이여야 합니다.",
  "data": null
}
```

### Status

| status code | error code | message                                               |
| ----------- | ---------- | ----------------------------------------------------- |
| 200         |            | 요청이 성공적으로 처리되었습니다.                     |
| 404         | U001       | 해당 사용자를 찾을 수 없습니다.                       |
| 404         | A001       | 해당 구인 경매를 찾을 수 없습니다.                    |
| 400         | A010       | 잘못된 시간 형식입니다. (경매 소요 시간 계산 실패 시) |
