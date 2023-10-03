---
title: 'SQL 이해하기'
date: 2023-10-03
description: 'SQL 전반적으로 이해하기'
thumbnail: './thumbnail.png'
---

## 1. SQL(Structured Query Language) 이란?

- SQL 은 관계형 데이터베이스 **관리 시스템(RDBMS)의 데이터를 관리하기 위해 설계된 특수 프로그래밍 언어**이다.
- 관계형 데이터베이스 관리 시스템에서 자료의 검색과 관리, 데이터베이스 스키마 생성과 수정, 데이터베이스 객체 접근 조정 관리를 위해 고안되었다.
- 많은 수의 데이터베이스 관련 프로그램들이 SQL을 표준으로 채택하고 있다.

### 1-1. SQL 실행 순서

1. **SQL** :쿼리 실행
2. **Syntax Check** : 문법 체크
3. **Semantic Check** : 객체 및 권한 유무 체크
4. **Library Cache Check** : Cache에서 쿼리 저장 유무 검사 → 저장되어 있다면 Soft Parse로 Library Cache에 저장된 쿼리 바로 사용 → 저장되어 있지 않으면 Hard Parse로 다음 단계로 넘어간다.
5. **Optimization** : 최적화한 쿼리 실행 계획을 만드는 단계
6. **Raw Source Generation** : 위 단계에서 생성된 실행 계획을 실행할수 있게 포멧팅
7. **Execution** : 실행

### 1-2. SQL 문법 종류

데이터베이스 언어 SQL 문법의 종류는 다음 3가지로 구별된다.

| 분류                 | 설명                       | 종류                        |
| -------------------- | -------------------------- | --------------------------- |
| DDL(정의어)          | 테이블의 구조를 정의함     | CREATE,ALTER,TRUNCATE,DROP  |
| DML(조작어)          | 데이터 조회/삽입/삭제/변경 | SELECT,INSERT,UPDATE,DELETE |
| DCL(제어어)          | 데이터베이스에 접근 권한   | GRANT,REVOKE                |
| TCL(트랜잭션 제어어) | 트랜잭션 제어 명령어       | COMMIT,ROLLBACK,SAVE POINT  |

## 2. DDL (Data Definition Language) 데이터 정의 언어

### 2-1. DDL 이란?

테이블과 컬럼을 정의하는 명령어로 **생성, 수정, 삭제 등의 데이터 전체 골격을 결정하는 역할**을 담당한다.

### 2-2. DDL 특징

DDL은 명령어를 입력하는 순간 작업이 **즉시 반영**되기 때문에 사용할 때 주의해야 한다.

### 2-3. DDL 종류

👉🏻 **CREATE : 테이블 생성**

```sql
CREATE TABLE 테이블명
(
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
)

CREATE INDEX 인덱스명 ON 테이블명(컬럼명)
```

👉🏻 **ALTER : 테이블 구조를 수정**

```sql
// 추가
ALTER TABLE 테이블명
ADD name VARCHAR(50)

// 타입 변경
ALTER TABLE 테이블명
MODIFY name VARCHAR(20)

// 이름 변경
ALTER TABLE 테이블명
RENAME COLUMN name TO new_name

// 컬럼 삭제
ALTER TABLE 테이블명
DROP COLUMN name

```

👉🏻 **DROP : 테이블 삭제**

```sql
// 테이블 삭제
DROP TABLE 테이블명

// 인덱스 삭제
DROP INDEX idx ON 테이블명

// 뷰 삭제
DROP VIEW 뷰이름

// 데이터베이스 삭제
DROP DATABASE 데이터베이스이름

// 함수 삭제
DROP FUNCTION 함수이름

// 저장 프로시저 삭제
DROP PROCEDURE 프로시저 이름

// 다른 객체 의존시 삭제 방지
DROP TABLE 테이블명 RESTRICT
```

👉🏻 **TRUNCATE : 테이블 초기화**

```sql
TRUNCATE TABLE 테이블명
```

## 3. DML (Data Manipulation Language) 데이터 조작 언어

### 3-1. DML이란?

데이터베이스의 내부 데이터를 관리하기 위한 언어이다. **데이터를 조회,추가,변경,삭제 등의 작업을 수행하기 위해 사용**된다.

### 3-2. DML 특징

- DML은 적는 **즉시 반영이 되지 않는다**. 다시 말해, DML에 의한 데이터 변동은 영구적인 변경이 아니기 때문에 **ROLLBACK으로 다시 되돌릴 수 있다.**
- DML은 Target 테이블을 메모리 버퍼 위에 올려두고 변경을 수행하기 때문에, **실시간으로 테이블에 반영되지 않는다**. Commit 명령어를 통해 **Transaction 종료 후 해당 변경 사항이 테이블에 반영**된다.

### 3-3. DML 종류

```sql
// SELECT
SELECT name,number
FROM 테이블명
WHERE 조건

// INSERT
INSERT INTO 테이블명 (name, phone_number)
VALUES ('danwoo',01011111111)

// UPDATE
UPDATE 테이블명
SET email = 'danwoo@naver.com'
WHERE name = 'danwoo' AND phone = 01011111111

// DELETE
DELETE FROM 테이블명
WHERE name = 'danwoo' AND phone = 01011111111
```

## 4. DCL (Data Control Language) 데이터 제어 언어

### 4-1. DCL이란?

데이터를 관리 목적으로 보안, **무결성, 회복, 병행 제어 등을 정의하는데 사용**한다. DCL을 사용하면 데이터베이스에 접근하여 읽거나 쓰는 것을 제한할 수 있는 권한을 부여하거나 박탈할 수 있고 **트랜잭션을 명시하거나 조작할 수 있다**.

### 4-2. DCL 특징

**불법적인 사용자로부터 데이터를 보호하기 위한 데이터 보안의 역할을 수행**하며, 데이터의 정확성을 위한 무결성을 유지하기도 한다. 마지막으로 **시스템 장애에 대비한 회복과 병행수행을 제어**한다.

### 4-3. DCL 종류

| 명령어 | 내용                 |
| ------ | -------------------- |
| GRANT  | 권한을 정의할때 사용 |
| REVOKE | 권한을 삭제할때 사용 |

👉🏻 GRANT : 권한 부여 (그온투)

- GRANT [권한종류] ON [대상] TO [계정명] IDENTIFIED BY [암호] [WITH GRANT OPTION]
- FLUSH PRIVILEGES
- 모든 권한을 가진 계정
  - GRANT SELECT ON test.\* id@localhost IDENTIFIED BY ‘A’
- 특정 데이터베이스에 조회권한을 가진 계정 생성
  - GRANT SELECT ON test.\* TO id@localhost IDENTIFIED BY ‘A’

👉🏻 REVOKE : 권한 해제

- REVOKE insert,update,create ON [DB명.테이블명] TO [계정명]
- 전체 권한 해제
  - REVOKE ALL ON [DB명.테이블명] TO [계정명]
  - REVOKE 권한 ON [테이블명] FROM [계정명] (CASCADE CONSTRAINS)
  - CASCADE CONSTRAINTS : 옵션으로 부여된 사용자들의 권한까지 취소

### 4-4. DDL 대상

👉🏻 도메인

하나의 속성이 가질 . 수있는 원자 값들의 집합

👉🏻 스키마

데이터베이스의 구조, 제약조건 등의 정보를 담고 있는 기본적 구조

👉🏻 테이블

데이터 저장 공간

👉🏻 뷰

가상의 테이블

👉🏻 인덱스

검색을 빠르게 하기 위한 데이터 구조

## 5. TCL (Transaction Control Language) 트랜잭션 제어 언어

### 5-1. TCL이란?

DCL과 비슷한 맥락이지만 데이터를 제어하는 언어가 아닌 **트랜잭션을 제어할때 사용**한다. 논리적인 작업 단위를 묶어 DML에 의해 조작된 결과를 트랜잭션 별로 제어한다.

### 5-2. 트랜잭션(Transaction)이란?

**데이터베이스의 상태를 변화시키기 위해 수행하는 작업의 단위를 말한다**. 보통 DBMS 성능을 초당 트랜잭션이 몇개가 실행되었는지로 측정한다. MySQL의 입력하는 모든 명령어들은 각각 하나의 트랜잭션이라고 할 수 있다.

### 5-3. 트랜잭션(Transaction)의 특징

👉🏻 **원자성(Atomicity)**

원자성은 트랜잭션이 데이터베이스에 **모두 반영되던가 아니면 전혀 반영되지 않아야 한다**는 것이다.

👉🏻 **일관성(Consistency)**

일관성은 트랙잭션의 **작업 처리 결과가 항상 일관성있어야 한다**는 것이다.

👉🏻 **독립성(Isolation)**

하나의 트랜잭션은 다른 트랜잭션에 끼어들 수 없고 마찬가지로 **독립적임을 의미**한다.

👉🏻 **지속성(Dutability)**

트랜잭션이 성공적으로 완료되었을 경우, **결과는 영구적으로 반영**되어야 한다는 점이다.

### 5-4. 트랜잭션(Transaction)의 상태

👉🏻 **Active** : Transaction이 현재 **실행 중인** 상태

👉🏻 **Failed** : Transaction이 실행되다 **오류가 발생해서 중단**된 상태

👉🏻 **Aborted** : Transaction이 비정상 종료되어 **Rollback이 수행**된 상태

👉🏻 **Partially Committed** : Transaction의 연산이 마지막까지 실행되고 **Commit이 되기 직전** 상태

👉🏻 **Committed** : Transaction이 성공적으로 종료되어 **Commit연산을 실행한 후**의 상태

### 5-5. 트랜잭션(Transaction)의 Commit과 Rollback

👉🏻 **Commit**

Commit은 **모든 작업들을 항상 처리하겠다고 확정하는 명령**이다. **해당 처리 과정을 DB에 영구 저장하겠다는 의미**로 Commit을 수행하면 하나의 트랜잭션 과정이 종료된다. Commit하기 전에는 다른 사용자가 트랜잭션 내용을 확인할 . 수없다. 또한, 변경된 행은 잠금이 설정되어 있어서 다른 사용자가 변경할 수 없다.

👉🏻 **Rollback**

Rollback은 **작업 중 문제가 발생되어 트랜잭션 처리 과정에서 발생한 변경사항을 취소하는 명령**어이다.

해당 명령을 트랜잭션에게 하달하면 트랜잭션은 **Commit 되기 이전의 데이터로 돌아가 변경에 대해 취소**한다.

### 5-6. TCL종류

| 명령어     | 내용                                                            |
| ---------- | --------------------------------------------------------------- |
| COMMIT     | 모든 작업을 정상적으로 처리하겠다는 명령어                      |
| ROLLBACK   | 모든 작업을 다시 돌려 놓겠다는 명령어                           |
| SAVE POINT | Commit 전에 특정 시점까지만 반영하거나 Rollback 하겠다는 명령어 |

### 5-7. 병행제어 기법 종류

👉🏻 **로킹(Locking)**

일관성과 무결성을 유지하기 위한 트랜잭션의 순차적 진행보장 직렬화 기법

👉🏻 **낙관적 검증**

일단 트랜잭션을 수행하고, 트랜잭션 종료 . 시검증을 수행

👉🏻 **타임스탬프 순서**

타임 스탬프를 부여해 부여된 시간에 따라 트랜잭션 수행

👉🏻 **다중버전 동시성 제어(MVCC)**

타임 스탬프를 비교해 직렬가능성이 보장되는 적절한 버전을 선택해 접근
