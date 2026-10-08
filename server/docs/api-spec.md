# 월계ON-AI API 명세서

- Base URL (로컬): `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

## 공통 응답 형식

모든 API는 성공·실패 모두 아래 형식으로 응답합니다. `result`가 없으면 필드가 생략됩니다.

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": { }
}
```

### 공통 코드

| HTTP | code | message | 발생 상황 |
| --- | --- | --- | --- |
| 200 | COMMON200 | 성공적으로 요청을 처리했습니다. | 조회·수정 성공 |
| 201 | COMMON201 | 성공적으로 생성했습니다. | 생성 성공 |
| 400 | COMMON400 | 입력값이 올바르지 않아요 | 파라미터 형식 오류, 바디 검증 실패 (`result`에 필드별 메시지) |
| 401 | COMMON401 | 로그인이 필요해요 | 로그인이 필요한 API에 토큰이 없거나, 잘못됐거나, 만료됨 |
| 403 | COMMON403 | 접근 권한이 없어요 | 권한 부족 |
| 404 | COMMON404 | 요청한 경로를 찾을 수 없어요 | 존재하지 않는 API 경로 |
| 405 | COMMON405 | 지원하지 않는 HTTP 메서드예요 | 잘못된 메서드 |
| 500 | COMMON500 | 서버 오류가 발생했어요 | 처리되지 않은 서버 오류 |

도메인 코드 형식: `{도메인}{HTTP 상태코드}` (예: `STORE404`)

## 인증

- 로그인 API로 받은 `accessToken`을 헤더에 담아 보냅니다: `Authorization: Bearer {accessToken}`
- 토큰 유효기간: 24시간
- 로그인 없이 쓸 수 있는 API: 회원가입, 로그인, 가게·업종 조회(`GET /api/stores/**`)
- 그 외 API는 모두 로그인이 필요하며, 토큰이 없으면 `COMMON401`

로컬(H2) 샘플 계정 (비밀번호 모두 `password1234`)

| email | 유형 |
| --- | --- |
| `owner@test.com` | 사장님(OWNER) |
| `resident@test.com` | 주민(RESIDENT) |

---

## Member

### 회원가입

| 항목 | 내용 |
| --- | --- |
| API명 | 회원가입 |
| HTTP Method | `POST` |
| API Path | `/api/members/signup` |
| Header | `Content-Type: application/json` |
| Request | Body<br>`email` (필수): 이메일 형식<br>`password` (필수): 8~64자<br>`nickname` (필수): 30자 이하<br>`role` (필수): `RESIDENT`(주민) 또는 `OWNER`(사장님) |
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String) |
| 로직 간단 설명 | 이메일 중복을 확인한 뒤 비밀번호를 BCrypt로 암호화해 회원을 저장한다. `ADMIN`으로는 가입할 수 없다. 가입만 하고 토큰은 발급하지 않으므로 이어서 로그인 API를 호출한다.<br><br>**result 필드**<br>`memberId`: 생성된 회원 ID<br>`email`: 가입한 이메일<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드 (`RESIDENT` / `OWNER` / `ADMIN`)<br>`roleName`: 회원 유형 한글 이름 (주민 / 사장님 / 관리자) |
| 상태코드 | COMMON201: 회원가입 성공<br>COMMON400: 입력값 검증 실패 (`result`에 필드별 메시지)<br>MEMBER400: 가입할 수 없는 회원 유형 (`ADMIN`)<br>MEMBER409: 이미 가입된 이메일 |

Request 예시

```json
{
  "email": "new@test.com",
  "password": "abcd1234",
  "nickname": "새사장",
  "role": "OWNER"
}
```

Response 예시 (201)

```json
{
  "isSuccess": true,
  "code": "COMMON201",
  "message": "성공적으로 생성했습니다.",
  "result": {
    "memberId": 3,
    "email": "new@test.com",
    "nickname": "새사장",
    "role": "OWNER",
    "roleName": "사장님"
  }
}
```

Response 예시 (400, 입력값 검증 실패)

```json
{
  "isSuccess": false,
  "code": "COMMON400",
  "message": "입력값이 올바르지 않아요",
  "result": {
    "email": "이메일 형식이 올바르지 않아요",
    "password": "비밀번호는 8~64자로 입력해 주세요",
    "nickname": "닉네임을 입력해 주세요"
  }
}
```

### 로그인

| 항목 | 내용 |
| --- | --- |
| API명 | 로그인 |
| HTTP Method | `POST` |
| API Path | `/api/members/login` |
| Header | `Content-Type: application/json` |
| Request | Body<br>`email` (필수): 이메일<br>`password` (필수): 비밀번호 |
| Response | `accessToken` (String)<br>`tokenType` (String)<br>`expiresIn` (Long)<br>`memberId` (Long)<br>`nickname` (String)<br>`role` (String) |
| 로직 간단 설명 | 이메일로 회원을 찾고 비밀번호가 맞으면 Access Token(JWT)을 발급한다. 보안을 위해 이메일이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않고 같은 에러로 응답한다.<br><br>**result 필드**<br>`accessToken`: 인증 토큰. 이후 요청 헤더에 `Authorization: Bearer {accessToken}`으로 사용<br>`tokenType`: 항상 `Bearer`<br>`expiresIn`: 토큰 유효시간 (초 단위, 86400 = 24시간)<br>`memberId`: 회원 ID<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드 (화면 분기용: `RESIDENT` / `OWNER`) |
| 상태코드 | COMMON200: 로그인 성공<br>COMMON400: 이메일·비밀번호 누락<br>MEMBER401: 이메일 또는 비밀번호가 올바르지 않음 |

Request 예시

```json
{
  "email": "owner@test.com",
  "password": "password1234"
}
```

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "memberId": 1,
    "nickname": "샘플사장님",
    "role": "OWNER"
  }
}
```

### 내 정보 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 내 정보 조회 |
| HTTP Method | `GET` |
| API Path | `/api/members/me` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | 없음 |
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String) |
| 로직 간단 설명 | 토큰에 담긴 회원 ID로 로그인한 회원의 정보를 조회한다. 앱 시작 시 로그인 상태 확인용으로 쓸 수 있다.<br><br>**result 필드**<br>`memberId`: 회원 ID<br>`email`: 이메일<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드 (`RESIDENT` / `OWNER` / `ADMIN`)<br>`roleName`: 회원 유형 한글 이름 (주민 / 사장님 / 관리자) |
| 상태코드 | COMMON200: 내 정보 조회 성공<br>COMMON401: 토큰 없음·잘못됨·만료<br>MEMBER404: 탈퇴 등으로 회원이 존재하지 않음 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "memberId": 1,
    "email": "owner@test.com",
    "nickname": "샘플사장님",
    "role": "OWNER",
    "roleName": "사장님"
  }
}
```

Response 예시 (401)

```json
{
  "isSuccess": false,
  "code": "COMMON401",
  "message": "로그인이 필요해요"
}
```

---

## Store

### 가게 목록 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 가게 목록 조회 |
| HTTP Method | `GET` |
| API Path | `/api/stores` |
| Header | 없음 |
| Request | Query `category` (선택): 업종 코드. 아래 [업종 코드](#업종-코드) 참고 |
| Response | `count` (Int)<br>`stores` (Array)<br>`stores[].storeId` (Long)<br>`stores[].name` (String)<br>`stores[].category` (String)<br>`stores[].categoryName` (String)<br>`stores[].address` (String)<br>`stores[].latitude` (Double)<br>`stores[].longitude` (Double)<br>`stores[].thumbnailUrl` (String \| null)<br>`stores[].stepFree` (Boolean) |
| 로직 간단 설명 | 지도 마커·목록에 쓸 가게 요약 정보를 조회한다. `category`가 있으면 해당 업종만, 없으면 전체를 반환한다.<br><br>**result 필드**<br>`count`: 조회된 가게 수<br>`stores`: 가게 요약 목록<br>`stores[].storeId`: 가게 ID (상세 조회에 사용)<br>`stores[].name`: 가게 이름<br>`stores[].category`: 업종 코드 (예: `CAFE_BAKERY_PUB`)<br>`stores[].categoryName`: 업종 한글 이름 (예: 카페·베이커리·주점)<br>`stores[].address`: 주소<br>`stores[].latitude`: 위도 (지도 마커 위치)<br>`stores[].longitude`: 경도 (지도 마커 위치)<br>`stores[].thumbnailUrl`: 대표 이미지 URL (없으면 `null`)<br>`stores[].stepFree`: 입구에 턱이 없으면 `true` |
| 상태코드 | COMMON200: 가게 목록 조회 성공<br>COMMON400: 존재하지 않는 업종 코드 |

Request 예시

```
GET /api/stores?category=CAFE_BAKERY_PUB
```

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "count": 1,
    "stores": [
      {
        "storeId": 2,
        "name": "[샘플] 광운 카페",
        "category": "CAFE_BAKERY_PUB",
        "categoryName": "카페·베이커리·주점",
        "address": "서울 노원구 월계동 (샘플 주소)",
        "latitude": 37.6202,
        "longitude": 127.0578,
        "thumbnailUrl": null,
        "stepFree": false
      }
    ]
  }
}
```

### 업종 목록 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 업종 목록 조회 |
| HTTP Method | `GET` |
| API Path | `/api/stores/categories` |
| Header | 없음 |
| Request | 없음 |
| Response | Array<br>`[].code` (String)<br>`[].name` (String) |
| 로직 간단 설명 | 가게 목록 필터에 쓸 업종 대분류(코드·이름)를 화면 표시 순서대로 반환한다.<br><br>**result 필드** (배열)<br>`[].code`: 업종 코드. 가게 목록 조회의 `category` 값으로 사용<br>`[].name`: 업종 한글 이름 (화면 표시용) |
| 상태코드 | COMMON200: 업종 목록 조회 성공 |

Response 예시 (200, 일부 생략)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": [
    { "code": "RESTAURANT", "name": "음식점" },
    { "code": "CAFE_BAKERY_PUB", "name": "카페·베이커리·주점" },
    { "code": "FOOD_RETAIL", "name": "식품 판매" }
  ]
}
```

#### 업종 코드

| code | name |
| --- | --- |
| `RESTAURANT` | 음식점 |
| `CAFE_BAKERY_PUB` | 카페·베이커리·주점 |
| `FOOD_RETAIL` | 식품 판매 |
| `BEAUTY` | 뷰티 |
| `FASHION` | 패션·잡화 |
| `LIVING` | 생활·리빙 |
| `EDUCATION` | 교육 |
| `PET` | 반려동물 |
| `HOBBY_LEISURE` | 취미·레저 |
| `GENERAL_RETAIL` | 종합 소매·유통 |
| `ELECTRONICS` | IT·통신·전기·전자 |
| `CONSTRUCTION_INTERIOR` | 건축·인테리어·설비 |
| `AUTO_TRANSPORT` | 자동차·운송 |
| `MANUFACTURING` | 제조·산업기계 |
| `ADVERTISING_MEDIA` | 광고·미디어 |
| `ETC_SERVICE` | 기타 서비스 |

### 가게 상세 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 가게 상세 조회 |
| HTTP Method | `GET` |
| API Path | `/api/stores/{storeId}` |
| Header | 없음 |
| Request | Path `storeId` (필수, Long): 가게 ID |
| Response | `storeId` (Long)<br>`name` (String)<br>`category` (String)<br>`categoryName` (String)<br>`address` (String)<br>`latitude` (Double)<br>`longitude` (Double)<br>`phone` (String \| null)<br>`businessHours` (String)<br>`description` (String)<br>`thumbnailUrl` (String \| null)<br>`accessibility.stepFree` (Boolean)<br>`accessibility.elevator` (Boolean) |
| 로직 간단 설명 | 가게 ID로 상세 정보(연락처, 운영시간, 소개, 접근성 정보)를 조회한다. 없으면 `STORE404`.<br><br>**result 필드**<br>`storeId`: 가게 ID<br>`name`: 가게 이름<br>`category`: 업종 코드 (예: `RESTAURANT`)<br>`categoryName`: 업종 한글 이름 (예: 음식점)<br>`address`: 주소<br>`latitude`: 위도<br>`longitude`: 경도<br>`phone`: 전화번호 (없으면 `null`)<br>`businessHours`: 운영시간, 자유 형식 문자열 (예: 매일 11:00-21:00)<br>`description`: 가게 소개<br>`thumbnailUrl`: 대표 이미지 URL (없으면 `null`)<br>`accessibility.stepFree`: 입구에 턱이 없으면 `true`<br>`accessibility.elevator`: 엘리베이터가 있으면 `true` |
| 상태코드 | COMMON200: 가게 상세 조회 성공<br>COMMON400: storeId가 숫자가 아님<br>STORE404: 해당 ID의 가게가 없음 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "storeId": 1,
    "name": "[샘플] 월계 분식",
    "category": "RESTAURANT",
    "categoryName": "음식점",
    "address": "서울 노원구 월계동 (샘플 주소)",
    "latitude": 37.6195,
    "longitude": 127.06,
    "phone": "02-000-0001",
    "businessHours": "매일 11:00-21:00",
    "description": "떡볶이와 김밥이 맛있는 동네 분식집",
    "thumbnailUrl": null,
    "accessibility": {
      "stepFree": true,
      "elevator": false
    }
  }
}
```

Response 예시 (404)

```json
{
  "isSuccess": false,
  "code": "STORE404",
  "message": "가게를 찾을 수 없어요"
}
```

---

## Shortform

> 숏폼은 AI가 가게 정보를 바탕으로 나레이션 스크립트를 작성하고 TTS·영상 합성을 거쳐 생성하는 짧은 소개 영상입니다.
> 생성 흐름: 생성 요청(`POST /api/generation`) → 비동기 처리 → 상태 폴링(`GET /api/generation/{id}`) → 완료 후 숏폼 조회

### 숏폼 피드 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 숏폼 피드 조회 |
| HTTP Method | `GET` |
| API Path | `/api/shortforms` |
| Header | 없음 |
| Request | Query `storeId` (선택, Long): 특정 가게의 숏폼만 조회<br>Query `page` (선택, Int, 기본값 0): 페이지 번호 (0부터 시작)<br>Query `size` (선택, Int, 기본값 10): 페이지 크기 |
| Response | `totalCount` (Int)<br>`page` (Int)<br>`size` (Int)<br>`hasNext` (Boolean)<br>`shortforms` (Array)<br>`shortforms[].shortformId` (Long)<br>`shortforms[].storeId` (Long)<br>`shortforms[].storeName` (String)<br>`shortforms[].videoUrl` (String)<br>`shortforms[].thumbnailUrl` (String \| null)<br>`shortforms[].title` (String)<br>`shortforms[].duration` (Int)<br>`shortforms[].createdAt` (String) |
| 로직 간단 설명 | 전체 숏폼을 최신순으로 페이지네이션하여 반환한다. `storeId`가 있으면 해당 가게의 숏폼만 반환한다. 피드 화면에서 스와이프로 영상을 넘길 때 다음 배치를 미리 요청하는 방식으로 사용한다.<br><br>**result 필드**<br>`totalCount`: 조건에 맞는 전체 숏폼 수<br>`page`: 현재 페이지 번호 (0부터 시작)<br>`size`: 요청된 페이지 크기<br>`hasNext`: 다음 페이지 존재 여부<br>`shortforms[].shortformId`: 숏폼 ID<br>`shortforms[].storeId`: 가게 ID (가게 상세로 이동 시 사용)<br>`shortforms[].storeName`: 가게 이름<br>`shortforms[].videoUrl`: 재생할 영상 파일 URL<br>`shortforms[].thumbnailUrl`: 로딩 전 표시할 썸네일 이미지 URL (없으면 `null`)<br>`shortforms[].title`: 숏폼 제목<br>`shortforms[].duration`: 영상 길이 (초 단위)<br>`shortforms[].createdAt`: 생성 일시 (ISO 8601, 예: `2025-10-08T14:30:00`) |
| 상태코드 | COMMON200: 조회 성공<br>COMMON400: 잘못된 파라미터 (page·size 음수 등) |

Request 예시

```
GET /api/shortforms?page=0&size=5
GET /api/shortforms?storeId=1&page=0&size=5
```

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "totalCount": 3,
    "page": 0,
    "size": 5,
    "hasNext": false,
    "shortforms": [
      {
        "shortformId": 1,
        "storeId": 1,
        "storeName": "[샘플] 월계 분식",
        "videoUrl": "https://storage.example.com/shortforms/1.mp4",
        "thumbnailUrl": "https://storage.example.com/thumbnails/1.jpg",
        "title": "동네 사람들이 사랑하는 월계 분식",
        "duration": 30,
        "createdAt": "2025-10-08T14:30:00"
      }
    ]
  }
}
```

### 숏폼 단건 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 숏폼 단건 조회 |
| HTTP Method | `GET` |
| API Path | `/api/shortforms/{shortformId}` |
| Header | 없음 |
| Request | Path `shortformId` (필수, Long) |
| Response | `shortformId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`storeCategory` (String)<br>`storeCategoryName` (String)<br>`videoUrl` (String)<br>`thumbnailUrl` (String \| null)<br>`title` (String)<br>`script` (String)<br>`duration` (Int)<br>`createdAt` (String) |
| 로직 간단 설명 | 숏폼 ID로 상세 정보를 조회한다. 영상 URL과 AI가 생성한 나레이션 스크립트, 연결된 가게 정보를 포함한다. 자막 표시나 가게 상세 이동에 활용한다.<br><br>**result 필드**<br>`shortformId`: 숏폼 ID<br>`storeId`: 가게 ID<br>`storeName`: 가게 이름<br>`storeCategory`: 업종 코드 (예: `RESTAURANT`)<br>`storeCategoryName`: 업종 한글 이름 (예: 음식점)<br>`videoUrl`: 재생할 영상 파일 URL<br>`thumbnailUrl`: 썸네일 이미지 URL (없으면 `null`)<br>`title`: 숏폼 제목<br>`script`: AI가 생성한 나레이션 스크립트 전문 (자막 표시용)<br>`duration`: 영상 길이 (초 단위)<br>`createdAt`: 생성 일시 (ISO 8601) |
| 상태코드 | COMMON200: 조회 성공<br>SHORTFORM404: 해당 숏폼 없음 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "shortformId": 1,
    "storeId": 1,
    "storeName": "[샘플] 월계 분식",
    "storeCategory": "RESTAURANT",
    "storeCategoryName": "음식점",
    "videoUrl": "https://storage.example.com/shortforms/1.mp4",
    "thumbnailUrl": "https://storage.example.com/thumbnails/1.jpg",
    "title": "동네 사람들이 사랑하는 월계 분식",
    "script": "월계동 골목 깊숙이 자리한 월계 분식. 직접 만든 떡볶이와 바삭한 김밥으로 주민들의 마음을 사로잡고 있습니다...",
    "duration": 30,
    "createdAt": "2025-10-08T14:30:00"
  }
}
```

Response 예시 (404)

```json
{
  "isSuccess": false,
  "code": "SHORTFORM404",
  "message": "숏폼을 찾을 수 없어요"
}
```

---

## Generation

> AI 숏폼 생성은 비동기로 처리됩니다. 요청 후 `generationId`를 받아 상태 폴링으로 완료 여부를 확인하세요.
> `status` 값: `PENDING`(대기 중) → `PROCESSING`(생성 중) → `COMPLETED`(완료) / `FAILED`(실패)

### AI 숏폼 생성 요청

| 항목 | 내용 |
| --- | --- |
| API명 | AI 숏폼 생성 요청 |
| HTTP Method | `POST` |
| API Path | `/api/generation` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: application/json` |
| Request | Body<br>`storeId` (필수, Long): 숏폼을 생성할 가게 ID |
| Response | `generationId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`status` (String)<br>`requestedAt` (String) |
| 로직 간단 설명 | 특정 가게에 대한 AI 숏폼 생성을 요청한다. 내부적으로 가게 정보 스크래핑 → AI 스크립트 생성 → TTS 음성 합성 → 영상 합성 순으로 비동기 처리된다. 완료까지 수십 초가 소요되므로 클라이언트는 상태 조회 API를 폴링해야 한다. 동일 가게에 이미 진행 중인 요청이 있으면 409로 거절한다.<br><br>**result 필드**<br>`generationId`: 생성 요청 ID (상태 조회 API에 사용)<br>`storeId`: 요청한 가게 ID<br>`storeName`: 요청한 가게 이름<br>`status`: 요청 직후 항상 `PENDING`<br>`requestedAt`: 요청 일시 (ISO 8601) |
| 상태코드 | COMMON201: 생성 요청 접수<br>COMMON400: 필수 필드 누락<br>COMMON401: 토큰 없음·만료<br>STORE404: 가게가 존재하지 않음<br>GENERATION409: 해당 가게에 이미 진행 중(`PENDING` / `PROCESSING`)인 생성 요청 있음 |

Request 예시

```json
{
  "storeId": 1
}
```

Response 예시 (201)

```json
{
  "isSuccess": true,
  "code": "COMMON201",
  "message": "성공적으로 생성했습니다.",
  "result": {
    "generationId": 7,
    "storeId": 1,
    "storeName": "[샘플] 월계 분식",
    "status": "PENDING",
    "requestedAt": "2025-10-08T15:00:00"
  }
}
```

Response 예시 (409, 이미 진행 중)

```json
{
  "isSuccess": false,
  "code": "GENERATION409",
  "message": "이미 생성 중인 요청이 있어요"
}
```

### AI 숏폼 생성 상태 조회

| 항목 | 내용 |
| --- | --- |
| API명 | AI 숏폼 생성 상태 조회 |
| HTTP Method | `GET` |
| API Path | `/api/generation/{generationId}` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | Path `generationId` (필수, Long) |
| Response | `generationId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`status` (String)<br>`shortformId` (Long \| null)<br>`errorMessage` (String \| null)<br>`requestedAt` (String) |
| 로직 간단 설명 | 생성 요청 ID로 AI 숏폼 생성 진행 상태를 조회한다. 클라이언트는 `COMPLETED` 또는 `FAILED`가 될 때까지 폴링(예: 3초 간격)한다. `COMPLETED`이면 `shortformId`로 숏폼을 바로 조회할 수 있다.<br><br>**result 필드**<br>`generationId`: 생성 요청 ID<br>`storeId`: 가게 ID<br>`storeName`: 가게 이름<br>`status`: 현재 상태 (`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED`)<br>`shortformId`: 생성 완료된 숏폼 ID. `COMPLETED`일 때만 값이 있고 그 외엔 `null`<br>`errorMessage`: 실패 사유 메시지. `FAILED`일 때만 값이 있고 그 외엔 `null`<br>`requestedAt`: 최초 요청 일시 (ISO 8601) |
| 상태코드 | COMMON200: 조회 성공<br>COMMON401: 토큰 없음·만료<br>GENERATION403: 자신이 요청하지 않은 생성 요청<br>GENERATION404: 해당 생성 요청 없음 |

Response 예시 (200, 완료)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "generationId": 7,
    "storeId": 1,
    "storeName": "[샘플] 월계 분식",
    "status": "COMPLETED",
    "shortformId": 5,
    "errorMessage": null,
    "requestedAt": "2025-10-08T15:00:00"
  }
}
```

Response 예시 (200, 처리 중)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "generationId": 7,
    "storeId": 1,
    "storeName": "[샘플] 월계 분식",
    "status": "PROCESSING",
    "shortformId": null,
    "errorMessage": null,
    "requestedAt": "2025-10-08T15:00:00"
  }
}
```

---

## Scrap

> 스크랩은 관심 가게를 저장하는 기능입니다. 모든 스크랩 API는 로그인이 필요합니다.

### 스크랩 추가

| 항목 | 내용 |
| --- | --- |
| API명 | 스크랩 추가 |
| HTTP Method | `POST` |
| API Path | `/api/scraps` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: application/json` |
| Request | Body<br>`storeId` (필수, Long): 스크랩할 가게 ID |
| Response | `scrapId` (Long)<br>`storeId` (Long)<br>`name` (String)<br>`category` (String)<br>`categoryName` (String)<br>`address` (String)<br>`thumbnailUrl` (String \| null)<br>`stepFree` (Boolean)<br>`scrappedAt` (String) |
| 로직 간단 설명 | 가게를 내 스크랩 목록에 추가한다. 동일 가게를 중복 스크랩하면 409로 거절한다.<br><br>**result 필드**<br>`scrapId`: 스크랩 ID<br>`storeId`: 가게 ID<br>`name`: 가게 이름<br>`category`: 업종 코드<br>`categoryName`: 업종 한글 이름<br>`address`: 주소<br>`thumbnailUrl`: 대표 이미지 URL (없으면 `null`)<br>`stepFree`: 입구에 턱이 없으면 `true`<br>`scrappedAt`: 스크랩한 일시 (ISO 8601) |
| 상태코드 | COMMON201: 스크랩 추가 성공<br>COMMON400: storeId 누락<br>COMMON401: 토큰 없음·만료<br>STORE404: 가게가 존재하지 않음<br>SCRAP409: 이미 스크랩한 가게 |

Request 예시

```json
{
  "storeId": 1
}
```

Response 예시 (201)

```json
{
  "isSuccess": true,
  "code": "COMMON201",
  "message": "성공적으로 생성했습니다.",
  "result": {
    "scrapId": 5,
    "storeId": 1,
    "name": "[샘플] 월계 분식",
    "category": "RESTAURANT",
    "categoryName": "음식점",
    "address": "서울 노원구 월계동 (샘플 주소)",
    "thumbnailUrl": null,
    "stepFree": true,
    "scrappedAt": "2025-10-08T16:00:00"
  }
}
```

### 스크랩 취소

| 항목 | 내용 |
| --- | --- |
| API명 | 스크랩 취소 |
| HTTP Method | `DELETE` |
| API Path | `/api/scraps/{storeId}` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | Path `storeId` (필수, Long): 스크랩 취소할 가게 ID |
| Response | 없음 (`result` 생략) |
| 로직 간단 설명 | 스크랩한 가게를 목록에서 제거한다. 스크랩하지 않은 가게에 요청하면 404로 응답한다. |
| 상태코드 | COMMON200: 스크랩 취소 성공<br>COMMON401: 토큰 없음·만료<br>STORE404: 가게가 존재하지 않음<br>SCRAP404: 스크랩하지 않은 가게 |

Request 예시

```
DELETE /api/scraps/1
```

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다."
}
```

### 내 스크랩 목록 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 내 스크랩 목록 조회 |
| HTTP Method | `GET` |
| API Path | `/api/scraps` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | 없음 |
| Response | `count` (Int)<br>`scraps` (Array)<br>`scraps[].scrapId` (Long)<br>`scraps[].storeId` (Long)<br>`scraps[].name` (String)<br>`scraps[].category` (String)<br>`scraps[].categoryName` (String)<br>`scraps[].address` (String)<br>`scraps[].thumbnailUrl` (String \| null)<br>`scraps[].stepFree` (Boolean)<br>`scraps[].scrappedAt` (String) |
| 로직 간단 설명 | 로그인한 회원이 스크랩한 가게 목록을 최신순으로 반환한다. 프로필 화면의 스크랩 탭에서 사용한다.<br><br>**result 필드**<br>`count`: 스크랩한 가게 수<br>`scraps[].scrapId`: 스크랩 ID<br>`scraps[].storeId`: 가게 ID<br>`scraps[].name`: 가게 이름<br>`scraps[].category`: 업종 코드<br>`scraps[].categoryName`: 업종 한글 이름<br>`scraps[].address`: 주소<br>`scraps[].thumbnailUrl`: 대표 이미지 URL (없으면 `null`)<br>`scraps[].stepFree`: 입구에 턱이 없으면 `true`<br>`scraps[].scrappedAt`: 스크랩한 일시 (ISO 8601) |
| 상태코드 | COMMON200: 조회 성공<br>COMMON401: 토큰 없음·만료 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "count": 2,
    "scraps": [
      {
        "scrapId": 5,
        "storeId": 1,
        "name": "[샘플] 월계 분식",
        "category": "RESTAURANT",
        "categoryName": "음식점",
        "address": "서울 노원구 월계동 (샘플 주소)",
        "thumbnailUrl": null,
        "stepFree": true,
        "scrappedAt": "2025-10-08T16:00:00"
      },
      {
        "scrapId": 3,
        "storeId": 2,
        "name": "[샘플] 광운 카페",
        "category": "CAFE_BAKERY_PUB",
        "categoryName": "카페·베이커리·주점",
        "address": "서울 노원구 월계동 (샘플 주소)",
        "thumbnailUrl": null,
        "stepFree": false,
        "scrappedAt": "2025-10-07T11:00:00"
      }
    ]
  }
}
```
