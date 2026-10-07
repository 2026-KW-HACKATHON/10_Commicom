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
| Request | Body<br>`email` (필수) : 이메일 형식<br>`password` (필수) : 8~64자<br>`nickname` (필수) : 30자 이하<br>`role` (필수) : `RESIDENT`(주민) 또는 `OWNER`(사장님) |
| 로직 간단 설명 | 이메일 중복을 확인한 뒤 비밀번호를 BCrypt로 암호화해 회원을 저장한다. `ADMIN`으로는 가입할 수 없다. 가입만 하고 토큰은 발급하지 않으므로 이어서 로그인 API를 호출한다.<br><br>**result 필드**<br>`memberId` : 회원 ID<br>`email` : 이메일<br>`nickname` : 닉네임<br>`role` : 회원 유형 코드 (`RESIDENT` / `OWNER` / `ADMIN`)<br>`roleName` : 회원 유형 한글 이름 (주민 / 사장님 / 관리자) |
| 상태코드 | COMMON201 : 회원가입 성공<br>COMMON400 : 입력값 검증 실패 (`result`에 필드별 메시지)<br>MEMBER400 : 가입할 수 없는 회원 유형 (`ADMIN`)<br>MEMBER409 : 이미 가입된 이메일 |

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
| Request | Body<br>`email` (필수)<br>`password` (필수) |
| 로직 간단 설명 | 이메일로 회원을 찾고 비밀번호가 맞으면 Access Token(JWT)을 발급한다. 보안을 위해 이메일이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않고 같은 에러로 응답한다.<br><br>**result 필드**<br>`accessToken` : 인증 토큰. 이후 요청 헤더에 `Authorization: Bearer {accessToken}`로 사용<br>`tokenType` : 항상 `Bearer`<br>`expiresIn` : 토큰 유효시간(초)<br>`memberId` : 회원 ID<br>`nickname` : 닉네임<br>`role` : 회원 유형 코드 (화면 분기용: 주민/사장님) |
| 상태코드 | COMMON200 : 로그인 성공<br>COMMON400 : 이메일·비밀번호 누락<br>MEMBER401 : 이메일 또는 비밀번호가 올바르지 않음 |

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
| 로직 간단 설명 | 토큰에 담긴 회원 ID로 로그인한 회원의 정보를 조회한다. 앱 시작 시 로그인 상태 확인용으로 쓸 수 있다.<br><br>**result 필드**<br>`memberId` : 회원 ID<br>`email` : 이메일<br>`nickname` : 닉네임<br>`role` : 회원 유형 코드<br>`roleName` : 회원 유형 한글 이름 |
| 상태코드 | COMMON200 : 내 정보 조회 성공<br>COMMON401 : 토큰 없음·잘못됨·만료<br>MEMBER404 : 탈퇴 등으로 회원이 존재하지 않음 |

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
| 로직 간단 설명 | 지도 마커·목록에 쓸 가게 요약 정보를 조회한다. `category`가 있으면 해당 업종만, 없으면 전체를 반환한다.<br><br>**result 필드**<br>`count` : 조회된 가게 수<br>`stores` : 가게 요약 목록<br>`stores[].storeId` : 가게 ID (상세 조회에 사용)<br>`stores[].name` : 가게 이름<br>`stores[].category` : 업종 코드 (예: `CAFE_BAKERY_PUB`)<br>`stores[].categoryName` : 업종 한글 이름 (예: 카페·베이커리·주점)<br>`stores[].address` : 주소<br>`stores[].latitude` : 위도 (지도 마커 위치)<br>`stores[].longitude` : 경도 (지도 마커 위치)<br>`stores[].thumbnailUrl` : 대표 이미지 URL (없으면 `null`)<br>`stores[].stepFree` : 입구에 턱이 없으면 `true` |
| 상태코드 | COMMON200 : 가게 목록 조회 성공<br>COMMON400 : 존재하지 않는 업종 코드(category) |

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
| 로직 간단 설명 | 가게 목록 필터에 쓸 업종 대분류(코드·이름)를 화면 표시 순서대로 반환한다.<br><br>**result 필드** (배열)<br>`[].code` : 업종 코드. 가게 목록 조회의 `category` 값으로 사용<br>`[].name` : 업종 한글 이름 (화면 표시용) |
| 상태코드 | COMMON200 : 업종 목록 조회 성공 |

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
| Request | Path `storeId` (필수, Long) |
| 로직 간단 설명 | 가게 ID로 상세 정보(연락처, 운영시간, 소개, 접근성 정보)를 조회한다. 없으면 `STORE404`.<br><br>**result 필드**<br>`storeId` : 가게 ID<br>`name` : 가게 이름<br>`category` : 업종 코드 (예: `RESTAURANT`)<br>`categoryName` : 업종 한글 이름 (예: 음식점)<br>`address` : 주소<br>`latitude` : 위도<br>`longitude` : 경도<br>`phone` : 전화번호 (없으면 `null`)<br>`businessHours` : 운영시간, 자유 형식 문자열 (예: 매일 11:00-21:00)<br>`description` : 가게 소개<br>`thumbnailUrl` : 대표 이미지 URL (없으면 `null`)<br>`accessibility` : 접근성 정보<br>`accessibility.stepFree` : 입구에 턱이 없으면 `true`<br>`accessibility.elevator` : 엘리베이터가 있으면 `true` |
| 상태코드 | COMMON200 : 가게 상세 조회 성공<br>COMMON400 : storeId 가 숫자가 아님<br>STORE404 : 해당 ID의 가게가 없음 |

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
