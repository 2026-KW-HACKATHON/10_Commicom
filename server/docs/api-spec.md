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
- 로그인 없이 쓸 수 있는 API: 회원가입, 로그인, 이메일 인증번호 받기·확인, 이메일·닉네임 중복 확인, 가게·업종 조회(`GET /api/stores/**`)
- 그 외 API는 모두 로그인이 필요하며, 토큰이 없으면 `COMMON401`

로컬(H2) 샘플 계정 (비밀번호 모두 `password1234`)

| email | 유형 |
| --- | --- |
| `owner@test.com` | 사장님(OWNER) |
| `resident@test.com` | 주민(RESIDENT) |
| `newowner@test.com` | 사장님(OWNER), 가게 미등록 — 로그인하면 가게 등록 화면 |

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
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String)<br>`profileImageUrl` (String \| null) |
| 로직 간단 설명 | 이메일·닉네임 중복과 **이메일 인증 완료 여부**를 확인한 뒤 비밀번호를 BCrypt로 암호화해 회원을 저장한다. 먼저 [이메일 인증번호 받기](#이메일-인증번호-받기) → [확인](#이메일-인증번호-확인)을 마쳐야 하며, 인증은 30분 동안 유효하다. `ADMIN`으로는 가입할 수 없다. 가입만 하고 토큰은 발급하지 않으므로 이어서 로그인 API를 호출한다.<br><br>**result 필드**<br>`memberId`: 생성된 회원 ID<br>`email`: 가입한 이메일<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드 (`RESIDENT` / `OWNER` / `ADMIN`)<br>`roleName`: 회원 유형 한글 이름 (주민 / 사장님 / 관리자)<br>`profileImageUrl`: 프로필 이미지 URL (없으면 `null`) |
| 상태코드 | COMMON201: 회원가입 성공<br>COMMON400: 입력값 검증 실패 (`result`에 필드별 메시지)<br>MEMBER400: 가입할 수 없는 회원 유형 (`ADMIN`)<br>MEMBER400_2: 이메일 인증을 하지 않았거나 인증이 만료됨<br>MEMBER409: 이미 가입된 이메일<br>MEMBER409_2: 이미 사용 중인 닉네임 |

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

### 이메일 중복 확인

| 항목 | 내용 |
| --- | --- |
| API명 | 이메일 중복 확인 |
| HTTP Method | `GET` |
| API Path | `/api/members/check-email` |
| Header | 없음 |
| Request | Query `email` (필수) |
| Response | `available` (Boolean) |
| 로직 간단 설명 | 가입 전에 이메일을 쓸 수 있는지 확인한다. `available=true`면 사용 가능. |
| 상태코드 | COMMON200: 조회 성공 |

### 닉네임 중복 확인

| 항목 | 내용 |
| --- | --- |
| API명 | 닉네임 중복 확인 |
| HTTP Method | `GET` |
| API Path | `/api/members/check-nickname` |
| Header | `Authorization: Bearer {accessToken}` (선택) |
| Request | Query `nickname` (필수) |
| Response | `available` (Boolean) |
| 로직 간단 설명 | 닉네임을 쓸 수 있는지 확인한다. 로그인한 상태로 부르면 **내 현재 닉네임은 사용 가능**으로 본다(닉네임 수정 화면). 사장님은 가게명을 닉네임으로 쓴다. |
| 상태코드 | COMMON200: 조회 성공 |

### 이메일 인증번호 받기

| 항목 | 내용 |
| --- | --- |
| API명 | 이메일 인증번호 받기 |
| HTTP Method | `POST` |
| API Path | `/api/members/email-verifications` |
| Header | `Content-Type: application/json` |
| Request | Body<br>`email` (필수): 이메일 형식 |
| Response | `expiresInSeconds` (Long): 인증번호 유효 시간 (300)<br>`resendAfterSeconds` (Long): 다시 받기까지 기다릴 시간 (60)<br>`devCode` (String, 로컬 개발에서만): 메일 서버가 없을 때 인증번호 |
| 로직 간단 설명 | 6자리 인증번호를 메일로 보낸다. 메일 서버는 `server/.env`의 `MAIL_HOST`·`MAIL_PORT`·`MAIL_USERNAME`·`MAIL_PASSWORD`(·`MAIL_FROM`)로 설정(SMTP). `MAIL_HOST`가 비어 있으면 메일을 보내지 않고 서버 로그에 남기며, `local` 프로필에서는 응답 `devCode`로도 준다(운영에선 절대 안 줌). 인증 정보는 서버 메모리에 보관하므로 서버를 다시 켜면 진행 중인 인증은 사라진다. |
| 상태코드 | COMMON200: 발송 성공<br>COMMON400: 이메일 형식 오류<br>MEMBER409: 이미 가입된 이메일<br>EMAIL429_2: 60초 안에 다시 요청<br>EMAIL500: 메일 발송 실패 |

### 이메일 인증번호 확인

| 항목 | 내용 |
| --- | --- |
| API명 | 이메일 인증번호 확인 |
| HTTP Method | `POST` |
| API Path | `/api/members/email-verifications/confirm` |
| Header | `Content-Type: application/json` |
| Request | Body<br>`email` (필수)<br>`code` (필수): 숫자 6자리 |
| Response | 없음 (`result` 생략) |
| 로직 간단 설명 | 인증번호가 맞으면 30분 동안 이 이메일로 가입할 수 있다. 같은 인증번호로 5번까지 틀릴 수 있고, 넘으면 다시 받아야 한다. |
| 상태코드 | COMMON200: 인증 성공<br>COMMON400: 형식 오류 (6자리 숫자 아님)<br>EMAIL400: 인증번호 불일치<br>EMAIL400_2: 인증번호 만료 또는 받은 적 없음<br>EMAIL429: 틀린 횟수 초과 |

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
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String)<br>`profileImageUrl` (String \| null) |
| 로직 간단 설명 | 토큰에 담긴 회원 ID로 로그인한 회원의 정보를 조회한다. 앱 시작 시 로그인 상태 확인용으로 쓸 수 있다.<br><br>**result 필드**<br>`memberId`: 회원 ID<br>`email`: 이메일<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드 (`RESIDENT` / `OWNER` / `ADMIN`)<br>`roleName`: 회원 유형 한글 이름 (주민 / 사장님 / 관리자)<br>`profileImageUrl`: 프로필 이미지 URL (없으면 `null`) |
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

### 회원 프로필 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 회원 프로필 조회 |
| HTTP Method | `GET` |
| API Path | `/api/members/{memberId}/profile` |
| Header | 없음 |
| Request | Path `memberId` (필수, Long) |
| Response | `memberId` (Long)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String)<br>`profileImageUrl` (String \| null) |
| 로직 간단 설명 | 다른 회원의 공개 프로필을 조회한다. 이메일을 포함하지 않는다. 클라이언트는 응답의 `memberId`와 내 `memberId`를 비교해 본인 프로필 여부를 판단하고, 본인이면 닉네임 수정·이미지 수정·탈퇴 버튼을 노출한다.<br><br>**result 필드**<br>`memberId`: 회원 ID<br>`nickname`: 닉네임<br>`role`: 회원 유형 코드<br>`roleName`: 회원 유형 한글 이름<br>`profileImageUrl`: 프로필 이미지 URL (없으면 `null`) |
| 상태코드 | COMMON200: 조회 성공<br>MEMBER404: 존재하지 않는 회원 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "memberId": 1,
    "nickname": "샘플사장님",
    "role": "OWNER",
    "roleName": "사장님",
    "profileImageUrl": null
  }
}
```

### 닉네임 수정

| 항목 | 내용 |
| --- | --- |
| API명 | 닉네임 수정 |
| HTTP Method | `PATCH` |
| API Path | `/api/members/me/nickname` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: application/json` |
| Request | Body<br>`nickname` (필수): 30자 이하 |
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String)<br>`profileImageUrl` (String \| null) |
| 로직 간단 설명 | 로그인한 회원의 닉네임을 변경한다. 변경된 정보 전체를 반환한다.<br><br>**result 필드**<br>회원가입·내 정보 조회의 result 필드와 동일 |
| 상태코드 | COMMON200: 수정 성공<br>COMMON400: 닉네임 미입력 또는 30자 초과<br>COMMON401: 토큰 없음·만료<br>MEMBER409_2: 다른 회원이 쓰는 닉네임 |

Request 예시

```json
{
  "nickname": "새닉네임"
}
```

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다.",
  "result": {
    "memberId": 1,
    "email": "owner@test.com",
    "nickname": "새닉네임",
    "role": "OWNER",
    "roleName": "사장님",
    "profileImageUrl": null
  }
}
```

### 비밀번호 변경

| 항목 | 내용 |
| --- | --- |
| API명 | 비밀번호 변경 |
| HTTP Method | `PATCH` |
| API Path | `/api/members/me/password` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: application/json` |
| Request | Body<br>`currentPassword` (필수): 지금 비밀번호<br>`newPassword` (필수): 8~64자 |
| Response | 없음 (`result` 생략) |
| 로직 간단 설명 | 현재 비밀번호가 맞는지 확인한 뒤 새 비밀번호를 BCrypt로 암호화해 저장한다. 이미 발급된 토큰은 만료 전까지 그대로 쓸 수 있다. 현재 비밀번호가 틀려도 로그아웃되지 않도록 401이 아닌 400으로 응답한다. |
| 상태코드 | COMMON200: 변경 성공<br>COMMON400: 입력값 검증 실패 (`result`에 필드별 메시지)<br>COMMON401: 토큰 없음·만료<br>MEMBER400_3: 현재 비밀번호가 맞지 않음<br>MEMBER400_4: 새 비밀번호가 지금과 같음<br>MEMBER404: 회원 없음 |

Request 예시

```json
{
  "currentPassword": "password1234",
  "newPassword": "newpass5678"
}
```

### 프로필 이미지 수정

| 항목 | 내용 |
| --- | --- |
| API명 | 프로필 이미지 수정 |
| HTTP Method | `PATCH` |
| API Path | `/api/members/me/profile-image` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: multipart/form-data` |
| Request | Form `image` (필수): 이미지 파일 (최대 20MB) |
| Response | `memberId` (Long)<br>`email` (String)<br>`nickname` (String)<br>`role` (String)<br>`roleName` (String)<br>`profileImageUrl` (String) |
| 로직 간단 설명 | 프로필 이미지를 업로드하고 URL을 저장한다. 파일은 S3에 업로드된 뒤 CloudFront URL로 반환된다. (현재 스토리지 구현 필요)<br><br>**result 필드**<br>회원가입·내 정보 조회의 result 필드와 동일. `profileImageUrl`에 업로드된 이미지 URL이 담긴다. |
| 상태코드 | COMMON200: 수정 성공<br>COMMON400: 파일 미첨부<br>COMMON401: 토큰 없음·만료 |

### 회원 탈퇴

| 항목 | 내용 |
| --- | --- |
| API명 | 회원 탈퇴 |
| HTTP Method | `DELETE` |
| API Path | `/api/members/me` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | 없음 |
| Response | 없음 (`result` 생략) |
| 로직 간단 설명 | 회원을 탈퇴한다. 회원이 보유한 스크랩 및 게시물 생성 요청 데이터를 먼저 삭제한 뒤 회원 데이터를 삭제한다. 탈퇴 후에는 토큰이 만료되기 전까지 요청이 가능하므로 클라이언트에서 토큰을 즉시 제거해야 한다. |
| 상태코드 | COMMON200: 탈퇴 성공<br>COMMON401: 토큰 없음·만료 |

Response 예시 (200)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공적으로 요청을 처리했습니다."
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

### 내 가게 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 내 가게 조회 |
| HTTP Method | `GET` |
| API Path | `/api/stores/me` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | 없음 |
| Response | 가게 상세 조회와 동일 |
| 로직 간단 설명 | 로그인한 사장님이 등록한 가게를 조회한다. 사장님 1명당 가게 1곳. 아직 등록하지 않았으면(손님 계정 포함) `STORE404_2` → 클라이언트는 가게 등록 화면을 보여 준다. |
| 상태코드 | COMMON200: 조회 성공<br>COMMON401: 토큰 없음·만료<br>STORE404_2: 등록한 가게가 없음 |

### 가게 등록 (사장님)

| 항목 | 내용 |
| --- | --- |
| API명 | 가게 등록 |
| HTTP Method | `POST` |
| API Path | `/api/stores` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: multipart/form-data` |
| Request | Part `data` (필수, `application/json`): `name` (String, 필수, 100자 이하), `category` (String, 필수, [업종 코드](#업종-코드)), `address` (String, 필수, 도로명 + 상세주소), `latitude` (Double, 필수), `longitude` (Double, 필수)<br>Part `image` (선택): 대표 사진 |
| Response | 가게 상세 조회와 동일 |
| 로직 간단 설명 | 사장님 계정이 자기 가게를 등록한다. 좌표는 클라이언트가 카카오 지도 Geocoder로 도로명 주소를 변환해 보낸다. 사진은 S3(`stores/`)에 올리고 `thumbnailUrl`에 담는다. 가입 직후 바로 호출한다 (가게명 = 사장님 닉네임). |
| 상태코드 | COMMON200: 등록 성공<br>COMMON400: 입력값 오류<br>COMMON401: 토큰 없음·만료<br>STORE403: 사장님 계정이 아님<br>STORE409: 이미 등록한 가게가 있음 |

### 가게 정보 수정 (사장님)

| 항목 | 내용 |
| --- | --- |
| API명 | 가게 정보 수정 |
| HTTP Method | `PATCH` |
| API Path | `/api/stores/{storeId}` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | Body (JSON, 보낸 항목만 수정): `name` (String), `category` (String), `address` (String), `latitude` (Double), `longitude` (Double). 주소를 바꾸면 좌표도 같이 보낸다 |
| Response | 가게 상세 조회와 동일 |
| 로직 간단 설명 | 내 가게만 수정할 수 있다. 사장님은 가게 이름이 곧 닉네임이라 `name`을 바꾸면 회원 닉네임도 같이 바뀐다 (다른 회원 닉네임과 겹치면 `MEMBER409_2`). |
| 상태코드 | COMMON200: 수정 성공<br>COMMON400: 입력값 오류 (빈 이름·주소)<br>COMMON401: 토큰 없음·만료<br>STORE403_2: 내 가게가 아님<br>STORE404: 가게 없음<br>MEMBER409_2: 이름(닉네임) 중복 |

### 가게 대표 사진 수정 (사장님)

| 항목 | 내용 |
| --- | --- |
| API명 | 가게 대표 사진 수정 |
| HTTP Method | `PATCH` |
| API Path | `/api/stores/{storeId}/image` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: multipart/form-data` |
| Request | Form `image` (필수): 이미지 파일 |
| Response | 가게 상세 조회와 동일 |
| 로직 간단 설명 | 사진을 S3(`stores/`)에 올리고 `thumbnailUrl`을 바꾼다. 내 가게만 가능. |
| 상태코드 | COMMON200: 수정 성공<br>COMMON400: 파일 미첨부<br>COMMON401: 토큰 없음·만료<br>STORE403_2: 내 가게가 아님<br>STORE404: 가게 없음 |

> **DB 변경 (배포 서버 `ddl-auto: validate`라 직접 반영 필요)**
> `store` 테이블에 사장님 연결 컬럼(`owner_id`) 추가. 회원 탈퇴 시 가게는 남기고 `owner_id`만 `NULL`로 바꾼다.
> SQL: [`docs/sql/2026-10-09-store-owner-quest-pigeon.sql`](sql/2026-10-09-store-owner-quest-pigeon.sql) (퀘스트·비둘기·쿠폰 테이블 포함)


---

## Quest

> 날짜 기준은 KST. 퀘스트로 받은 먹이는 비둘기 **보유 먹이(feedBalance)** 에 쌓이고, 레벨업은 [먹이 주기] 때 일어난다.
> 퀘스트 고정 데이터(기본 3개 + 템플릿 12개)는 서버 시작 때 자동으로 채운다.

| API | Method · Path | 인증 | 설명 |
| --- | --- | --- | --- |
| 퀘스트 목록 | `GET /api/quests` | 선택 | 로그인 전이면 진행도 0. 기본(BASIC)은 항상, "동네 가게 N곳 방문"은 퀘스트 가게가 1곳 이상일 때, 템플릿 퀘스트는 참여 가게(등록 기간 중)가 1곳 이상일 때만 보인다. 템플릿 목표는 `min(2, 참여 가게 수)` |
| 방문 인증 | `POST /api/quests/{questId}/visits` | 필수 | Body `storeId, latitude, longitude, qrToken`. 퀘스트 가게 + 반경 100m + 오늘의 가게 QR. 방문마다 먹이 1개, 완료하면 보너스 `rewardFeed` |
| 기본 퀘스트 진행 | `POST /api/quests/events` | 필수 | Body `type` (`SHORTFORM_VIEW`: 게시물 2초 이상 시청, `STORE_VIEW`: 가게 상세 열기), `targetId` (게시물·가게 id). 같은 대상은 한 번만 센다. 응답 `completedQuests[]`(새로 완료한 퀘스트), `feedBalance` |
| 퀘스트 가게 상태 | `GET /api/stores/{storeId}/quest-subscription` | 없음 | `status`: `ACTIVE` / `EXPIRED` / `NONE`, `startedAt`, `expiresAt` |
| 퀘스트 가게 등록 | `POST /api/stores/{storeId}/quest-subscription` | 사장님 | 30일 (해커톤: 결제 모의 처리). 만료됐으면 다시 30일 |
| 템플릿 목록 | `GET /api/stores/{storeId}/quest-templates` | 사장님 | `templates[]`: `templateKey, title, description, targetCount, rewardFeed, participantCount, joined` |
| 템플릿 참여 / 취소 | `POST` · `DELETE /api/stores/{storeId}/quest-templates/{templateKey}` | 사장님 | 참여는 퀘스트 가게로 등록돼 있어야 함 |
| 오늘의 방문 QR | `GET /api/stores/{storeId}/quest-qr` | 사장님 | `qrToken`(8자리, 가게·날짜별 HMAC), `expiresAt`(오늘 23:59:59). 가게 QR에는 `/quest/scan?storeId&qrToken` 주소를 담는다 |

방문 인증 Response 예시 (200)

```json
{
  "visitId": 1,
  "feedGained": 1,
  "quest": { "questId": 9, "currentCount": 1, "targetCount": 1, "completed": true, "bonusFeed": 2 },
  "pigeon": { "levelBefore": 2, "levelAfter": 2, "currentFeed": 1, "requiredFeed": 5, "levelName": null },
  "levelUps": [],
  "feedBalance": 4
}
```

| 상태코드 | 의미 |
| --- | --- |
| QUEST400 | 가게 반경 100m 밖 (`result.distanceM`에 거리) |
| QUEST400_2 | QR 값이 틀렸거나 지난 날짜 |
| QUEST400_3 | 없는 템플릿 키 |
| QUEST403 | 퀘스트 가게가 아님 (등록 안 했거나 만료) |
| QUEST403_2 | 이 템플릿 퀘스트에 참여하지 않은 가게 |
| QUEST404 | 퀘스트 없음 (보이지 않는 퀘스트 포함) |
| QUEST409 | 오늘 이미 이 가게에서 인증함 (한 가게는 하루 한 번) |
| QUEST409_2 | 이미 완료한 퀘스트 |
| QUEST409_3 | 이 퀘스트에서 이미 인정된 가게 |
| QUEST409_4 | 이미 퀘스트 가게로 등록됨 |
| QUEST409_5 / QUEST409_6 | 이미 참여 중 / 참여하지 않음 |
| STORE403_2 | 내 가게가 아님 (사장님 API) |

---

## Pigeon

> 회원 1명당 지금 키우는 비둘기 1마리. **알(Lv.0)** 로 시작 → 먹이 1개로 **부화**(종류 6가지 중 랜덤: `KOREAN` 한식 / `JAPANESE` 일식 / `CHINESE` 중식 / `WESTERN` 양식 / `MART` 마트 / `CAFE` 카페) → Lv.10 → **졸업**하면 앨범에 남고 새 알(다음 기수).
> 먹이는 보유 먹이에 쌓이고 `POST /api/pigeon/feed`로 먹여야 레벨업. 최고 레벨이어도 무료·광고 먹이는 받아서 모아 둘 수 있고, 졸업해도 보유 먹이는 이어진다.
> 레벨업마다 뽑기: 쿠폰 / 먹이 1개 / 먹이 2개. 쿠폰은 사장님들이 비둘기 보상으로 내놓은 쿠폰 풀에서 지급하고, 풀이 비면 먹이 2개(Lv.10은 0개).

| API | Method · Path | 설명 |
| --- | --- | --- |
| 내 비둘기 | `GET /api/pigeon` | `level(0=알), maxLevel(10), levelName(null), currentFeed, requiredFeed(최고 레벨이면 null), isEgg, isMaxLevel, feedBalance, breed(알이면 null), breedName, generation(몇 번째 비둘기), startedAt, today{dailyFeedClaimed, adFeedCount, adFeedLimit(3)}` |
| 하루 무료 먹이 | `POST /api/pigeon/feeds/daily` | 하루 1번 먹이 1개 |
| 광고 보상 먹이 | `POST /api/pigeon/feeds/ad` | Body `adTransactionId`. 하루 3번, 같은 거래 id는 한 번만 |
| 먹이 주기 | `POST /api/pigeon/feed` | Body `amount`(1 이상). 알이면 먹이 1개로 부화(`hatched{breed, breedName}`, 뽑기 없음), 그 뒤로는 필요 먹이를 채울 때마다 레벨업 + 뽑기 (한 번에 여러 레벨 가능). 응답 `fed, pigeon, hatched(부화 안 했으면 null), levelUps[], feedBalance` |
| 졸업 | `POST /api/pigeon/graduate` | Lv.10 일 때만. 앨범에 남기고 새 알을 줌. 응답 `graduated{generation, breed, breedName, startedAt, graduatedAt, days, rewardCouponCount}, pigeon(새 알)` |
| 비둘기 앨범 | `GET /api/pigeon/album` | 졸업한 비둘기 최근 순. `graduates[]` (졸업 응답의 graduated 와 같은 모양) |
| 레벨업 기록 | `GET /api/pigeon/history?page&size` | 최근 순, size 최대 50. `history[]{historyId, generation, fromLevel, toLevel, reward{type, feedAmount, userCoupon}, createdAt}` |

레벨 표 (현재 레벨 → 다음 레벨)

| 레벨업 | 필요 먹이 | 쿠폰 | 먹이 1개 | 먹이 2개 |
| --- | --- | --- | --- | --- |
| 알→1 (부화) | 1 | - | - | - |
| 1→2 | 3 | 1% | 70% | 29% |
| 2→3 | 5 | 1.5% | 70% | 28.5% |
| 3→4 | 8 | 2% | 70% | 28% |
| 4→5 | 11 | 20% | 70% | 10% |
| 5→6 | 14 | 4% | 70% | 26% |
| 6→7 | 17 | 4.5% | 70% | 25.5% |
| 7→8 | 20 | 5% | 70% | 25% |
| 8→9 | 25 | 7.5% | 70% | 22.5% |
| 9→10 | 30 | 99% | 0.7% | 0.3% |

| 상태코드 | 의미 |
| --- | --- |
| PIGEON409 | 오늘 무료 먹이를 이미 받음 |
| PIGEON409_2 | 이미 처리한 광고 거래 |
| PIGEON409_3 | 최고 레벨이라 먹일 수 없음 (졸업하면 새 알) |
| PIGEON409_4 | 보유 먹이 부족 |
| PIGEON409_5 | Lv.10 이 아니라 졸업할 수 없음 |
| PIGEON429 | 오늘 광고 보상 3번을 다 받음 |

> **로컬(local 프로필) 전용 테스트 API** — 운영 서버엔 없음
> `POST /api/dev/pigeon/feed {amount}`: 보유 먹이 추가 · `GET /api/dev/quest-qr/{storeId}`: 가게의 오늘 QR 값.
> 로컬은 `quest.gps-bypass: true`라 GPS 거리 검사를 건너뛴다 (운영은 `QUEST_GPS_BYPASS` 환경변수, 기본 false).


---

## Coupon

> 사장님이 직접 발행 (할인은 사장님 부담). 손님이 쓰면 건당 수수료 **100원**을 정산에 남긴다.
> `useAsPigeonReward: true`인 쿠폰은 비둘기 레벨업 뽑기의 쿠폰 보상 풀에 들어간다 (아직 안 가진 쿠폰을 먼저 줌).
> 지도 `GET /api/stores`의 `availableCouponCount` = 지금 받을 수 있는(ACTIVE·남은 수량 있음) 쿠폰 수.

| API | Method · Path | 인증 | 설명 |
| --- | --- | --- | --- |
| 쿠폰 발행 | `POST /api/stores/{storeId}/coupons` | 사장님 | Body `title`(1~30자), `discountType`(`AMOUNT`/`RATE`), `discountValue`(정액 100원 이상 / 정률 10~80%), `minOrderAmount`(선택, 0 이상), `totalQuantity`(1~1,000), `validDays`(1~30), `useAsPigeonReward`(선택). 응답 `couponId, status, createdAt` |
| 내 가게 쿠폰 목록 | `GET /api/stores/{storeId}/coupons?status=` | 사장님 | `coupons[]`: `couponId, title, discountType, discountValue, minOrderAmount, totalQuantity, issuedCount, usedCount, remainingQuantity, useAsPigeonReward, status(ACTIVE/STOPPED/SOLD_OUT), createdAt` |
| 발행 중지 | `PATCH /api/stores/{storeId}/coupons/{couponId}` | 사장님 | Body `{ "status": "STOPPED" }`. 이미 받은 쿠폰은 기한까지 쓸 수 있음 |
| 받을 수 있는 쿠폰 | `GET /api/stores/{storeId}/coupons/available` | 선택 | `coupons[]`: `couponId, title, discountType, discountValue, minOrderAmount, validDays, remainingQuantity, alreadyDownloaded`(로그인 전이면 false) |
| 쿠폰 받기 | `POST /api/coupons/{couponId}/downloads` | 필수 | 같은 쿠폰은 한 번만. 응답 `userCouponId, redeemCode(6자리), expiresAt(받은 날 + validDays 23:59:59)` |
| 내 쿠폰함 | `GET /api/coupons/me?status=&page=&size=` | 필수 | status `AVAILABLE`/`USED`/`EXPIRED`. 쓸 수 있는 쿠폰은 기한 임박 순, 나머지는 최근 순. `coupons[]`: `userCouponId, storeId, storeName, title, discountType, discountValue, minOrderAmount, source(DOWNLOAD/PIGEON_REWARD/QUEST_REWARD), redeemCode, status, expiresAt, usedAt` |
| 사용 처리 | `POST /api/coupons/redeem` | 사장님 | Body `redeemCode` (대소문자 무관). 내 가게 쿠폰만. 응답 `userCouponId, title, discountType, discountValue, minOrderAmount, fee, redeemedAt` |
| 정산 | `GET /api/stores/{storeId}/coupon-settlements?month=YYYY-MM` | 사장님 | KST 기준 그 달. `month, usedCount, totalDiscount, totalFee, items[]{userCouponId, title, discountValue, fee, redeemedAt}` |

| 상태코드 | 의미 |
| --- | --- |
| COUPON400 | 정액 할인 100원 미만 |
| COUPON400_2 | 정률 할인 10~80% 밖 |
| COUPON403 | 다른 가게 쿠폰 (사용 처리) |
| COUPON404 / COUPON404_2 | 쿠폰 없음 / 코드에 해당하는 쿠폰 없음 |
| COUPON409 | 이미 받은 쿠폰 |
| COUPON409_2 | 이미 사용된 쿠폰 |
| COUPON409_3 | 이미 중지·소진된 쿠폰 (중지 요청) |
| COUPON410 / COUPON410_2 | 수량 소진 / 기한 지남 |
| STORE403_2 | 내 가게가 아님 · STORE404_2: 사용 처리하는 사장님에게 등록한 가게가 없음 |

> **로컬 샘플:** 월계 분식 "떡볶이 10% 할인"(비둘기 보상), 광운 카페 "아메리카노 1,000원 할인"(비둘기 보상), 골목 베이커리 "소금빵 500원 할인".
> 샘플 주민(resident@test.com)이 광운 카페 쿠폰 코드 **QK7M2P**를 가지고 있어 샘플 사장님으로 사용 처리를 해 볼 수 있다.

---

## PRO

> 사장님 가게 단위 월 구독 (30일). 해커톤: 결제는 모의 처리하고, 만료일에 자동 결제도 하지 않는다 (만료되면 다시 가입).
> 혜택: 게시물 피드 우선 노출(서버가 정렬), 영상 재수정·원본 다운로드(클라이언트가 `status`로 버튼을 연다).

| API | Method · Path | 인증 | 설명 |
| --- | --- | --- | --- |
| PRO 구독 상태 | `GET /api/stores/{storeId}/pro` | 사장님 | `storeId, status(ACTIVE/EXPIRED/NONE), startedAt, expiresAt, autoRenew`. 가입한 적 없으면 `NONE` (날짜는 `null`) |
| PRO 가입 | `POST /api/stores/{storeId}/pro` | 사장님 | 오늘부터 30일 (만료일 23:59:59 KST). 만료됐으면 다시 30일. 응답은 상태 조회와 같음 |
| 해지 예약·취소 | `PATCH /api/stores/{storeId}/pro` | 사장님 | Body `autoRenew` (Boolean, 필수). `false` = 해지 예약(만료일까지 이용), `true` = 해지 취소 |

Response 예시 (200)

```json
{
  "storeId": 2,
  "status": "ACTIVE",
  "startedAt": "2026-10-09T00:00:00+09:00",
  "expiresAt": "2026-11-08T23:59:59+09:00",
  "autoRenew": true
}
```

| 상태코드 | 의미 |
| --- | --- |
| PRO409 | 이미 PRO 이용 중 (가입) |
| PRO409_2 | 이용 중인 PRO가 없음 (해지 예약·취소) |
| STORE403_2 | 내 가게가 아님 |
| STORE404 | 가게 없음 |

> **DB 변경:** [`docs/sql/2026-10-09-pro-subscription.sql`](sql/2026-10-09-pro-subscription.sql) (`pro_subscription` 테이블)

---

## Shortform

> 게시물은 AI가 가게 정보로 만드는 가게 홍보 게시물입니다. 앱 화면에서는 "게시물", API·코드 이름은 그대로 `shortform`을 씁니다.
> 생성 흐름은 AI 이미지(Bedrock SDXL)로 바뀌었습니다 (dev `Feat: Replace video pipeline with AI image feed`). 게시물 응답은 **`imageUrl`(게시물 사진)·`title`·`createdAt`** 이고, 아래 표의 `videoUrl`·`thumbnailUrl`·`script`·`duration`은 더 이상 오지 않습니다. 피드 목록에는 PRO 우선 노출 `promoted`가 더 붙습니다.
> 생성 요청은 `storeId`, `menuInfo`에 더해 참고할 사진 `menuImageUrl`(선택)을 받고, 생성 상태 응답에도 `imageUrl`이 옵니다.
> **게시물 소개 글**: 생성 요청의 `appeal`(사장님이 적은 가게 어필, 200자 이내, 앱에선 필수)을 Bedrock Claude가 1~2문장으로 다듬어 게시물 `caption`에 저장합니다 (없는 사실은 지어내지 않음, AI 실패 시 어필 그대로). 피드·상세 응답에 `caption`이 붙습니다. 예) "가게가 넓고 고기가 맛있어요" → "넓고 편안한 자리에서 즐기는 육즙 가득한 고기 한 판! 🥩". DB: [`docs/sql/2026-10-09-shortform-caption.sql`](sql/2026-10-09-shortform-caption.sql)
> **게시물 사진 여러 장 (옆으로 넘겨 보기)**: 게시물 = AI 사진 1장 + 사장님 사진 최대 4장. 피드·상세 응답에 `imageUrls`(첫 장 = `imageUrl`, 최대 5장)가 붙습니다.
> 1. `POST /api/stores/{storeId}/photos` (multipart `photos` 여러 개, **사장님 본인 가게만** — 아니면 `STORE403_2`) → S3 주소 목록
> 2. `POST /api/generation`에 `photoUrls`(최대 4개, 넘으면 `COMMON400`)로 보냄. 이 가게 사진 폴더(`stores/{storeId}/`)에 올라간 주소만 저장하고 나머지는 버림
> 3. DB: [`docs/sql/2026-10-09-shortform-photo.sql`](sql/2026-10-09-shortform-photo.sql) (`shortform_photo` 테이블)

#### 게시물 관리 (사장님)

> AI로 만든 게시물은 **비공개**로 생기고(`published=false`), 사장님이 결과를 보고 [업로드]해야 손님 피드(`GET /api/shortforms`)에 보입니다. 단건 조회(`GET /api/shortforms/{id}`)는 공개 전에도 됩니다(만들기 결과 확인용).
> 게시물 생성(`POST /api/generation`)도 **내 가게만** 됩니다 (아니면 `STORE403_2`). DB: [`docs/sql/2026-10-09-shortform-publish.sql`](sql/2026-10-09-shortform-publish.sql)

| API | Method · Path | 설명 |
| --- | --- | --- |
| 게시물 공개 ([업로드]) | `POST /api/shortforms/{shortformId}/publish` | 손님 피드에 보이게. 응답은 단건 조회와 같음 |
| 게시물 삭제 | `DELETE /api/shortforms/{shortformId}` | 손님 스크랩·사장님 사진도 같이 지움. 생성 기록은 연결만 끊음 |
| 재수정본으로 교체 (PRO) | `PUT /api/shortforms/{shortformId}/replace` | Body `shortformId`(새 버전). 새 버전을 공개하고 옛 게시물은 지움. 옛 게시물 스크랩은 새 버전으로 옮김 |
| 생성 취소 | `POST /api/generation/{generationId}/cancel` | 만드는 중(PENDING·PROCESSING)일 때만. 결과를 저장하지 않고 FAILED(`사장님이 생성을 취소했어요`). 취소한 요청은 끝나기 전이라도 새 생성 요청을 막지 않음 |

| 상태코드 | 의미 |
| --- | --- |
| SHORTFORM403 | 내 가게 게시물이 아님 |
| SHORTFORM404 | 게시물 없음 (공개 전 게시물은 스크랩도 404) |
| SHORTFORM400 | 교체: 같은 가게의 다른 게시물이 아님 |
| GENERATION403 | 생성 취소: 내가 요청한 생성이 아님 |
| GENERATION409_2 | 생성 취소: 이미 끝난 생성 |
| STORE403_2 | 생성 요청: 내 가게가 아님 |
> 생성 흐름: 생성 요청(`POST /api/generation`) → 비동기 처리 → 상태 폴링(`GET /api/generation/{id}`) → 완료 후 게시물 조회

### 게시물 피드 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 게시물 피드 조회 |
| HTTP Method | `GET` |
| API Path | `/api/shortforms` |
| Header | 없음 |
| Request | Query `storeId` (선택, Long): 특정 가게의 게시물만 조회<br>Query `page` (선택, Int, 기본값 0): 페이지 번호 (0부터 시작)<br>Query `size` (선택, Int, 기본값 10): 페이지 크기 |
| Response | `totalCount` (Int)<br>`page` (Int)<br>`size` (Int)<br>`hasNext` (Boolean)<br>`shortforms` (Array)<br>`shortforms[].shortformId` (Long)<br>`shortforms[].storeId` (Long)<br>`shortforms[].storeName` (String)<br>`shortforms[].videoUrl` (String)<br>`shortforms[].thumbnailUrl` (String \| null)<br>`shortforms[].title` (String)<br>`shortforms[].duration` (Int)<br>`shortforms[].createdAt` (String)<br>`shortforms[].promoted` (Boolean) |
| 로직 간단 설명 | 전체 게시물을 페이지네이션하여 반환한다. **PRO 이용 중인 가게 영상이 먼저**, 그 안에서는 최신순 ([PRO](#pro)). `storeId`가 있으면 해당 가게의 게시물만 반환한다. 피드 화면에서 스와이프로 영상을 넘길 때 다음 배치를 미리 요청하는 방식으로 사용한다.<br><br>**result 필드**<br>`totalCount`: 조건에 맞는 전체 게시물 수<br>`page`: 현재 페이지 번호 (0부터 시작)<br>`size`: 요청된 페이지 크기<br>`hasNext`: 다음 페이지 존재 여부<br>`shortforms[].shortformId`: 게시물 ID<br>`shortforms[].storeId`: 가게 ID (가게 상세로 이동 시 사용)<br>`shortforms[].storeName`: 가게 이름<br>`shortforms[].videoUrl`: 재생할 영상 파일 URL<br>`shortforms[].thumbnailUrl`: 로딩 전 표시할 썸네일 이미지 URL (없으면 `null`)<br>`shortforms[].title`: 게시물 제목<br>`shortforms[].duration`: 영상 길이 (초 단위)<br>`shortforms[].createdAt`: 생성 일시 (ISO 8601, 예: `2025-10-08T14:30:00`)<br>`shortforms[].promoted`: PRO 가게 영상이면 `true` (추천 배지) |
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

### 게시물 단건 조회

| 항목 | 내용 |
| --- | --- |
| API명 | 게시물 단건 조회 |
| HTTP Method | `GET` |
| API Path | `/api/shortforms/{shortformId}` |
| Header | 없음 |
| Request | Path `shortformId` (필수, Long) |
| Response | `shortformId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`storeCategory` (String)<br>`storeCategoryName` (String)<br>`videoUrl` (String)<br>`thumbnailUrl` (String \| null)<br>`title` (String)<br>`script` (String)<br>`duration` (Int)<br>`createdAt` (String) |
| 로직 간단 설명 | 게시물 ID로 상세 정보를 조회한다. 영상 URL과 AI가 생성한 나레이션 스크립트, 연결된 가게 정보를 포함한다. 자막 표시나 가게 상세 이동에 활용한다.<br><br>**result 필드**<br>`shortformId`: 게시물 ID<br>`storeId`: 가게 ID<br>`storeName`: 가게 이름<br>`storeCategory`: 업종 코드 (예: `RESTAURANT`)<br>`storeCategoryName`: 업종 한글 이름 (예: 음식점)<br>`videoUrl`: 재생할 영상 파일 URL<br>`thumbnailUrl`: 썸네일 이미지 URL (없으면 `null`)<br>`title`: 게시물 제목<br>`script`: AI가 생성한 나레이션 스크립트 전문 (자막 표시용)<br>`duration`: 영상 길이 (초 단위)<br>`createdAt`: 생성 일시 (ISO 8601) |
| 상태코드 | COMMON200: 조회 성공<br>SHORTFORM404: 해당 게시물 없음 |

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
  "message": "게시물을 찾을 수 없어요"
}
```

---

## Generation

> AI 게시물 생성은 비동기로 처리됩니다. 요청 후 `generationId`를 받아 상태 폴링으로 완료 여부를 확인하세요.
> `status` 값: `PENDING`(대기 중) → `PROCESSING`(생성 중) → `COMPLETED`(완료) / `FAILED`(실패)

### AI 게시물 생성 요청

| 항목 | 내용 |
| --- | --- |
| API명 | AI 게시물 생성 요청 |
| HTTP Method | `POST` |
| API Path | `/api/generation` |
| Header | `Authorization: Bearer {accessToken}` (필수)<br>`Content-Type: application/json` |
| Request | Body<br>`storeId` (필수, Long): 게시물을 생성할 가게 ID |
| Response | `generationId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`status` (String)<br>`requestedAt` (String) |
| 로직 간단 설명 | 특정 가게에 대한 AI 게시물 생성을 요청한다. 내부적으로 가게 정보 스크래핑 → AI 스크립트 생성 → TTS 음성 합성 → 영상 합성 순으로 비동기 처리된다. 완료까지 수십 초가 소요되므로 클라이언트는 상태 조회 API를 폴링해야 한다. 동일 가게에 이미 진행 중인 요청이 있으면 409로 거절한다.<br><br>**result 필드**<br>`generationId`: 생성 요청 ID (상태 조회 API에 사용)<br>`storeId`: 요청한 가게 ID<br>`storeName`: 요청한 가게 이름<br>`status`: 요청 직후 항상 `PENDING`<br>`requestedAt`: 요청 일시 (ISO 8601) |
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

### AI 게시물 생성 상태 조회

| 항목 | 내용 |
| --- | --- |
| API명 | AI 게시물 생성 상태 조회 |
| HTTP Method | `GET` |
| API Path | `/api/generation/{generationId}` |
| Header | `Authorization: Bearer {accessToken}` (필수) |
| Request | Path `generationId` (필수, Long) |
| Response | `generationId` (Long)<br>`storeId` (Long)<br>`storeName` (String)<br>`status` (String)<br>`shortformId` (Long \| null)<br>`errorMessage` (String \| null)<br>`requestedAt` (String) |
| 로직 간단 설명 | 생성 요청 ID로 AI 게시물 생성 진행 상태를 조회한다. 클라이언트는 `COMPLETED` 또는 `FAILED`가 될 때까지 폴링(예: 3초 간격)한다. `COMPLETED`이면 `shortformId`로 게시물을 바로 조회할 수 있다.<br><br>**result 필드**<br>`generationId`: 생성 요청 ID<br>`storeId`: 가게 ID<br>`storeName`: 가게 이름<br>`status`: 현재 상태 (`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED`)<br>`shortformId`: 생성 완료된 게시물 ID. `COMPLETED`일 때만 값이 있고 그 외엔 `null`<br>`errorMessage`: 실패 사유 메시지. `FAILED`일 때만 값이 있고 그 외엔 `null`<br>`requestedAt`: 최초 요청 일시 (ISO 8601) |
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
> 게시물 영상 스크랩(피드의 🔖)은 [게시물 스크랩](#게시물-스크랩)을 쓰세요. 가게 스크랩과 따로 저장됩니다.

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

### 게시물 스크랩

> 피드에서 🔖를 누른 게시물 영상을 저장한다. 앱의 "메뉴 > 스크랩한 영상" 화면에서 쓴다. 로그인 필요.

| API | Method · Path | 설명 |
| --- | --- | --- |
| 게시물 스크랩 추가 | `POST /api/scraps/shortforms` | Body `shortformId` (Long, 필수). 응답 `scrapId, shortformId, storeId, storeName, imageUrl, title, createdAt(게시물 생성 일시), scrappedAt` (201) |
| 게시물 스크랩 취소 | `DELETE /api/scraps/shortforms/{shortformId}` | `result` 생략 |
| 내 게시물 스크랩 목록 | `GET /api/scraps/shortforms` | `count`, `shortforms[]` (추가 응답과 같은 모양). 스크랩한 순서 최신순 |

| 상태코드 | 의미 |
| --- | --- |
| COMMON400 | `shortformId` 누락 |
| COMMON401 | 토큰 없음·만료 |
| SHORTFORM404 | 게시물 없음 |
| SCRAP409_2 | 이미 스크랩한 영상 |
| SCRAP404_2 | 스크랩하지 않은 영상 |

> **DB 변경:** [`docs/sql/2026-10-09-shortform-scrap.sql`](sql/2026-10-09-shortform-scrap.sql) (`shortform_scrap` 테이블). 회원 탈퇴 시 함께 삭제된다. 게시물을 삭제하는 API를 만들 때는 `ShortformScrapRepository.deleteAllByShortform`으로 그 게시물의 스크랩을 먼저 지워야 한다.
