-- =========================================================
-- Schema v1.9 (PostgreSQL)
-- =========================================================

-- =========================
-- 1) users (사용자)
-- =========================
CREATE TABLE users (
                       user_id       BIGSERIAL    PRIMARY KEY,              -- 사용자 PK
                       login_type    VARCHAR(20)  NOT NULL,                 -- 로그인 타입
                       password      VARCHAR(200),                          -- 비밀번호
                       role          VARCHAR(20),                           -- 역할
                       name          VARCHAR(50)  NOT NULL,                 -- 이름
                       phone         VARCHAR(20),                           -- 연락처
                       email         VARCHAR(100) NOT NULL,                 -- 이메일
                       is_withdraw   BOOLEAN      NOT NULL DEFAULT FALSE,   -- 탈퇴여부
                       withdrawn_at  TIMESTAMPTZ,                           -- 탈퇴 일시
                       birth_date    DATE,                                  -- 생년월일
                       created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                       updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                       CONSTRAINT chk_users_password_for_local
                           CHECK (login_type <> 'LOCAL' OR password IS NOT NULL),
                       CONSTRAINT chk_users_withdraw_consistency
                           CHECK ((is_withdraw = FALSE AND withdrawn_at IS NULL) OR
                                  (is_withdraw = TRUE AND withdrawn_at IS NOT NULL))
);
COMMENT ON TABLE  users IS '사용자';
COMMENT ON COLUMN users.user_id      IS '사용자 PK';
COMMENT ON COLUMN users.login_type   IS '로그인 타입';
COMMENT ON COLUMN users.password     IS '비밀번호';
COMMENT ON COLUMN users.role         IS '역할';
COMMENT ON COLUMN users.name         IS '이름';
COMMENT ON COLUMN users.phone        IS '연락처';
COMMENT ON COLUMN users.email        IS '이메일';
COMMENT ON COLUMN users.is_withdraw  IS '탈퇴여부';
COMMENT ON COLUMN users.withdrawn_at IS '탈퇴 일시';
COMMENT ON COLUMN users.birth_date   IS '생년월일';
COMMENT ON COLUMN users.created_at   IS '생성일시';
COMMENT ON COLUMN users.updated_at   IS '수정일시';

CREATE UNIQUE INDEX uq_users_email_lower ON users ((lower(email)));


-- =========================
-- 2) stores (매장)
-- =========================
CREATE TABLE stores (
                        store_id             BIGSERIAL    PRIMARY KEY,       -- 매장 PK
                        owner_id             BIGINT       NOT NULL,          -- 소유자 PK
                        store_name           VARCHAR(100) NOT NULL,          -- 매장명
                        address              VARCHAR(255) NOT NULL,          -- 주소
                        phone                VARCHAR(20),                    -- 연락처
                        qr_code              VARCHAR(255),                   -- QR코드
                        latitude             DOUBLE PRECISION,                    -- 위도
                        longitude            DOUBLE PRECISION,                    -- 경도
                        is_over_5_employees  BOOLEAN      NOT NULL DEFAULT FALSE, -- 5인 이상 사업장 여부
                        is_closed            BOOLEAN      NOT NULL DEFAULT FALSE, -- 폐업 여부
                        created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                        updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 수정일시
                        CONSTRAINT fk_stores_owner
                            FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE RESTRICT
);
COMMENT ON TABLE  stores IS '매장';
COMMENT ON COLUMN stores.store_id            IS '매장 PK';
COMMENT ON COLUMN stores.owner_id            IS '소유자 PK';
COMMENT ON COLUMN stores.store_name          IS '매장명';
COMMENT ON COLUMN stores.address             IS '주소';
COMMENT ON COLUMN stores.phone               IS '연락처';
COMMENT ON COLUMN stores.qr_code             IS 'QR코드';
COMMENT ON COLUMN stores.latitude            IS '위도';
COMMENT ON COLUMN stores.longitude           IS '경도';
COMMENT ON COLUMN stores.is_over_5_employees IS '5인 이상 사업장 여부';
COMMENT ON COLUMN stores.is_closed           IS '폐업 여부';
COMMENT ON COLUMN stores.created_at          IS '생성일시';
COMMENT ON COLUMN stores.updated_at          IS '수정일시';


-- =========================
-- 3) store_employees (직원)
-- =========================
CREATE TABLE store_employees (
                                 employee_id          BIGSERIAL    PRIMARY KEY,       -- 직원 PK
                                 store_id             BIGINT       NOT NULL,          -- 매장 PK
                                 user_id              BIGINT       NOT NULL,          -- 사용자 PK
                                 status               VARCHAR(20)  NOT NULL DEFAULT 'INVITED', -- 재직 여부
                                 position             VARCHAR(50),                    -- 직급
                                 hourly_wage          INTEGER      NOT NULL CHECK (hourly_wage >= 0), -- 시급
                                 tax_type             VARCHAR(20)  NOT NULL DEFAULT 'NONE', -- 소득세 급여 방식
                                 worked_minutes       INTEGER      NOT NULL DEFAULT 0 CHECK (worked_minutes >= 0), -- 이번 주 일한 시간(m)
                                 will_working_minutes INTEGER      NOT NULL DEFAULT 0 CHECK (will_working_minutes >= 0), -- 이번 주 일할 시간(m)
                                 hire_date            DATE,                           -- 고용일
                                 dependents_count     INTEGER      NOT NULL DEFAULT 0 CHECK (dependents_count >= 0), -- 부양가족수
                                 include_holiday_pay  BOOLEAN      NOT NULL DEFAULT FALSE, -- 주휴수당 포함 여부
                                 created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                                 updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 수정일시
                                 CONSTRAINT fk_store_employees_store
                                     FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
                                 CONSTRAINT fk_store_employees_user
                                     FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
                                 CONSTRAINT uq_store_employees_store_user UNIQUE (store_id, user_id)
);
COMMENT ON TABLE  store_employees IS '직원';
COMMENT ON COLUMN store_employees.employee_id          IS '직원 PK';
COMMENT ON COLUMN store_employees.store_id             IS '매장 PK';
COMMENT ON COLUMN store_employees.user_id              IS '사용자 PK';
COMMENT ON COLUMN store_employees.status               IS '재직 여부';
COMMENT ON COLUMN store_employees.position             IS '직급';
COMMENT ON COLUMN store_employees.hourly_wage          IS '시급';
COMMENT ON COLUMN store_employees.tax_type             IS '소득세 급여 방식';
COMMENT ON COLUMN store_employees.worked_minutes       IS '이번 주 일한 시간(m)';
COMMENT ON COLUMN store_employees.will_working_minutes IS '이번 주 일할 시간(m)';
COMMENT ON COLUMN store_employees.hire_date            IS '고용일';
COMMENT ON COLUMN store_employees.dependents_count     IS '부양가족수';
COMMENT ON COLUMN store_employees.include_holiday_pay  IS '주휴수당 포함 여부';
COMMENT ON COLUMN store_employees.created_at           IS '생성일시';
COMMENT ON COLUMN store_employees.updated_at           IS '수정일시';


-- =========================
-- 4) work_schedules (근무 일정)
-- =========================
CREATE TABLE work_schedules (
                                schedule_id    BIGSERIAL   PRIMARY KEY,              -- 근무 일정 PK
                                employee_id    BIGINT      NOT NULL,                 -- 직원 PK
                                day_of_week    SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 요일
                                start_time     TIME        NOT NULL,                 -- 출근 시간
                                end_time       TIME        NOT NULL,                 -- 퇴근 시간
                                break_minutes  INTEGER     NOT NULL DEFAULT 0 CHECK (break_minutes >= 0), -- 휴게 시간(분)
                                created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),   -- 생성일시
                                updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),   -- 수정일시
                                CONSTRAINT fk_work_schedules_employee
                                    FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE,
                                CONSTRAINT chk_work_schedules_time_range
                                    CHECK (start_time <> end_time),
                                CONSTRAINT uq_work_schedules_slot UNIQUE (employee_id, day_of_week, start_time, end_time)
);
COMMENT ON TABLE  work_schedules IS '근무 일정';
COMMENT ON COLUMN work_schedules.schedule_id   IS '근무 일정 PK';
COMMENT ON COLUMN work_schedules.employee_id   IS '직원 PK';
COMMENT ON COLUMN work_schedules.day_of_week   IS '요일';
COMMENT ON COLUMN work_schedules.start_time    IS '출근 시간';
COMMENT ON COLUMN work_schedules.end_time      IS '퇴근 시간';
COMMENT ON COLUMN work_schedules.break_minutes IS '휴게 시간(분)';
COMMENT ON COLUMN work_schedules.created_at    IS '생성일시';
COMMENT ON COLUMN work_schedules.updated_at    IS '수정일시';


-- =========================
-- 5) attendances (출퇴근 관리)
-- =========================
CREATE TABLE attendances (
                             attendance_id        BIGSERIAL    PRIMARY KEY,       -- 출퇴근 관리 PK
                             employee_id          BIGINT       NOT NULL,          -- 직원 PK
                             target_date          DATE         NOT NULL,          -- 출근 일자
                             scheduled_start_time TIME,                           -- 예정 출근 시간
                             scheduled_end_time   TIME,                           -- 예정 퇴근 시간
                             clock_in             TIMESTAMPTZ,                    -- 출근 시간
                             clock_out            TIMESTAMPTZ,                    -- 퇴근 시간
                             status               VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED', -- 근태 상태
                             overtime             BOOLEAN,                        -- 연장근무 여부
                             break_minutes  INTEGER     NOT NULL DEFAULT 0 CHECK (break_minutes >= 0), -- 휴게 시간(분)
                             created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                             updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 수정일시
                             CONSTRAINT fk_attendances_employee
                                 FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE,
                             CONSTRAINT uq_attendances_employee_date UNIQUE (employee_id, target_date),
                             CONSTRAINT chk_attendances_clock_order
                                 CHECK (clock_out IS NULL OR (clock_in IS NOT NULL AND clock_out >= clock_in))
);
COMMENT ON TABLE  attendances IS '출퇴근 관리';
COMMENT ON COLUMN attendances.attendance_id        IS '출퇴근 관리 PK';
COMMENT ON COLUMN attendances.employee_id          IS '직원 PK';
COMMENT ON COLUMN attendances.target_date          IS '출근 일자';
COMMENT ON COLUMN attendances.scheduled_start_time IS '예정 출근 시간';
COMMENT ON COLUMN attendances.scheduled_end_time   IS '예정 퇴근 시간';
COMMENT ON COLUMN attendances.clock_in             IS '출근 시간';
COMMENT ON COLUMN attendances.clock_out            IS '퇴근 시간';
COMMENT ON COLUMN attendances.status               IS '근태 상태';
COMMENT ON COLUMN attendances.overtime             IS '연장근무 여부';
COMMENT ON COLUMN attendances.break_minutes        IS '휴게시간(분)';
COMMENT ON COLUMN attendances.created_at           IS '생성일시';
COMMENT ON COLUMN attendances.updated_at           IS '수정일시';


-- =========================
-- 6) payrolls (급여대장)
-- =========================
CREATE TABLE payrolls (
                          payroll_id         BIGSERIAL    PRIMARY KEY,         -- 급여대장 PK
                          employee_id        BIGINT       NOT NULL,            -- 직원 PK
                          target_month       DATE         NOT NULL,            -- 대상월
                          total_work_minutes INTEGER      NOT NULL DEFAULT 0 CHECK (total_work_minutes >= 0), -- 총 근무 시간(m)
                          night_work_minutes INTEGER      NOT NULL DEFAULT 0 CHECK (night_work_minutes >= 0), -- 야간 근무 시간(m)
                          basic_pay          BIGINT       NOT NULL DEFAULT 0 CHECK (basic_pay >= 0), -- 기본급
                          total_allowance    BIGINT       NOT NULL DEFAULT 0 CHECK (total_allowance >= 0), -- 총 가산 수당
                          total_deduction    BIGINT       NOT NULL DEFAULT 0 CHECK (total_deduction >= 0), -- 총 공제액
                          net_pay            BIGINT       NOT NULL DEFAULT 0 CHECK (net_pay >= 0), -- 실수령액
                          is_approved        BOOLEAN      NOT NULL DEFAULT FALSE, -- 최종 승인 여부
                          approved_at        TIMESTAMPTZ,                      -- 최종 승인 일시
                          created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                          updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 수정일시
                          CONSTRAINT fk_payrolls_employee
                              FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT,
                          CONSTRAINT uq_payrolls_employee_month UNIQUE (employee_id, target_month),
                          CONSTRAINT chk_payrolls_month_start
                              CHECK (target_month = date_trunc('MONTH', target_month)::date),
                          CONSTRAINT chk_payrolls_approved_consistency
                              CHECK ((is_approved = FALSE AND approved_at IS NULL) OR
                                     (is_approved = TRUE AND approved_at IS NOT NULL))
);
COMMENT ON TABLE  payrolls IS '급여대장';
COMMENT ON COLUMN payrolls.payroll_id         IS '급여대장 PK';
COMMENT ON COLUMN payrolls.employee_id        IS '직원 PK';
COMMENT ON COLUMN payrolls.target_month       IS '대상월';
COMMENT ON COLUMN payrolls.total_work_minutes IS '총 근무 시간(m)';
COMMENT ON COLUMN payrolls.night_work_minutes IS '야간 근무 시간(m)';
COMMENT ON COLUMN payrolls.basic_pay          IS '기본급';
COMMENT ON COLUMN payrolls.total_allowance    IS '총 가산 수당';
COMMENT ON COLUMN payrolls.total_deduction    IS '총 공제액';
COMMENT ON COLUMN payrolls.net_pay            IS '실수령액';
COMMENT ON COLUMN payrolls.is_approved        IS '최종 승인 여부';
COMMENT ON COLUMN payrolls.approved_at        IS '최종 승인 일시';
COMMENT ON COLUMN payrolls.created_at         IS '생성일시';
COMMENT ON COLUMN payrolls.updated_at         IS '수정일시';


-- =========================
-- 7) payroll_details (급여대장 상세)
-- =========================
CREATE TABLE payroll_details (
                                 detail_id            BIGSERIAL    PRIMARY KEY,       -- 급여대장 상세 PK
                                 payroll_id           BIGINT       NOT NULL,          -- 급여대장 PK
                                 detail_type          VARCHAR(20)  NOT NULL,          -- 항목 구분(지급 항목, 공제 항목)
                                 item_name            VARCHAR(50)  NOT NULL,          -- 항목 이름(예: 연장수당, 국민연금)
                                 amount               BIGINT       NOT NULL CHECK (amount >= 0), -- 금액
                                 calculation_formula  VARCHAR(255),                   -- 계산식
                                 work_minutes         INTEGER      NOT NULL DEFAULT 0 CHECK (work_minutes >= 0), -- 근무시간(m)
                                 created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                                 CONSTRAINT fk_payroll_details_payroll
                                     FOREIGN KEY (payroll_id) REFERENCES payrolls(payroll_id) ON DELETE CASCADE
);
COMMENT ON TABLE  payroll_details IS '급여대장 상세';
COMMENT ON COLUMN payroll_details.detail_id           IS '급여대장 상세 PK';
COMMENT ON COLUMN payroll_details.payroll_id          IS '급여대장 PK';
COMMENT ON COLUMN payroll_details.detail_type         IS '항목 구분(지급 항목, 공제 항목)';
COMMENT ON COLUMN payroll_details.item_name           IS '항목 이름(예: 연장수당, 국민연금)';
COMMENT ON COLUMN payroll_details.amount              IS '금액';
COMMENT ON COLUMN payroll_details.calculation_formula IS '계산식';
COMMENT ON COLUMN payroll_details.work_minutes        IS '근무시간(m)';
COMMENT ON COLUMN payroll_details.created_at          IS '생성일시';


-- =========================
-- 8) documents (문서함)
-- =========================
CREATE TABLE documents (
                           doc_id       BIGSERIAL    PRIMARY KEY,               -- 문서함 PK
                           user_id      BIGINT       NOT NULL,                  -- 회원 PK
                           doc_type     VARCHAR(50)  NOT NULL,                  -- 서류 종류
                           file_url     VARCHAR(255) NOT NULL,                  -- 문서 파일
                           expire_date  DATE,                                   -- 유효기간
                           status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', -- 문서 유효 상태
                           uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),    -- 업로드 일시
                           CONSTRAINT fk_documents_user
                               FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);
COMMENT ON TABLE  documents IS '문서함';
COMMENT ON COLUMN documents.doc_id      IS '문서함 PK';
COMMENT ON COLUMN documents.user_id     IS '회원 PK';
COMMENT ON COLUMN documents.doc_type    IS '서류 종류';
COMMENT ON COLUMN documents.file_url    IS '문서 파일';
COMMENT ON COLUMN documents.expire_date IS '유효기간';
COMMENT ON COLUMN documents.status      IS '문서 유효 상태';
COMMENT ON COLUMN documents.uploaded_at IS '업로드 일시';


-- =========================
-- 9) employee_documents (제출 문서함)
-- =========================
CREATE TABLE employee_documents (
                                    doc_id       BIGSERIAL    PRIMARY KEY,               -- 문서함 PK
                                    employee_id  BIGINT       NOT NULL,                  -- 직원 PK
                                    doc_type     VARCHAR(50)  NOT NULL,                  -- 문서 종류
                                    file_url     VARCHAR(255) NOT NULL,                  -- 문서 경로
                                    status       VARCHAR(20)  NOT NULL DEFAULT 'SUBMITTED', -- 문서 상태
                                    expire_date  DATE,                                   -- 만료일
                                    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),    -- 업로드 일시
                                    CONSTRAINT fk_employee_documents_employee
                                        FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE
);
COMMENT ON TABLE  employee_documents IS '제출 문서함';
COMMENT ON COLUMN employee_documents.doc_id      IS '문서함 PK';
COMMENT ON COLUMN employee_documents.employee_id IS '직원 PK';
COMMENT ON COLUMN employee_documents.doc_type    IS '문서 종류';
COMMENT ON COLUMN employee_documents.file_url    IS '문서 경로';
COMMENT ON COLUMN employee_documents.status      IS '문서 상태';
COMMENT ON COLUMN employee_documents.expire_date IS '만료일';
COMMENT ON COLUMN employee_documents.uploaded_at IS '업로드 일시';


-- =========================
-- 10) shift_auctions (경매)
-- =========================
CREATE TABLE shift_auctions (
                                auction_id   BIGSERIAL    PRIMARY KEY,               -- 경매 PK
                                store_id     BIGINT       NOT NULL,                  -- 매장 PK
                                target_date  DATE         NOT NULL,                  -- 근무일
                                deadline     TIMESTAMP,                              -- 마감 시간
                                start_time   TIME         NOT NULL,                  -- 출근 시간
                                end_time     TIME         NOT NULL,                  -- 퇴근 시간
                                max_wage     INTEGER      NOT NULL CHECK (max_wage >= 0), -- 상한선
                                min_wage     INTEGER      NOT NULL CHECK (min_wage >= 0), -- 하한선
                                status       VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS', -- 경매 상태
                                recruit_count INTEGER     NOT NULL DEFAULT 1,        -- 모집 인원 수
                                created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),    -- 생성일시
                                updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),    -- 수정일시
                                CONSTRAINT fk_shift_auctions_store
                                    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
                                CONSTRAINT chk_shift_auctions_time_range
                                    CHECK (start_time <> end_time),
                                CONSTRAINT chk_shift_auctions_wage_range CHECK (max_wage >= min_wage),
                                CONSTRAINT uq_shift_auctions_slot UNIQUE (store_id, target_date, start_time, end_time)
);
COMMENT ON TABLE  shift_auctions IS '경매';
COMMENT ON COLUMN shift_auctions.auction_id         IS '경매 PK';
COMMENT ON COLUMN shift_auctions.store_id           IS '매장 PK';
COMMENT ON COLUMN shift_auctions.target_date        IS '근무일';
COMMENT ON COLUMN shift_auctions.deadline           IS '마감 시간';
COMMENT ON COLUMN shift_auctions.start_time         IS '출근 시간';
COMMENT ON COLUMN shift_auctions.end_time           IS '퇴근 시간';
COMMENT ON COLUMN shift_auctions.max_wage           IS '상한선';
COMMENT ON COLUMN shift_auctions.min_wage           IS '하한선';
COMMENT ON COLUMN shift_auctions.status             IS '경매 상태';
COMMENT ON COLUMN shift_auctions.recruit_count      IS '모집 인원 수';
COMMENT ON COLUMN shift_auctions.created_at         IS '생성일시';
COMMENT ON COLUMN shift_auctions.updated_at         IS '수정일시';


-- =========================
-- 10.5) auction_winners (낙찰자)
-- =========================
CREATE TABLE auction_winners (
                                 winner_record_id  BIGSERIAL  PRIMARY KEY,            -- 낙찰자 PK
                                 auction_id        BIGINT     NOT NULL,               -- 경매 PK
                                 employee_id       BIGINT     NOT NULL,               -- 사용자 PK
                                 selected_at       TIMESTAMP  DEFAULT CURRENT_TIMESTAMP, -- 낙찰 일시
                                 FOREIGN KEY (auction_id)  REFERENCES shift_auctions(auction_id) ON DELETE CASCADE,
                                 FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE
);
COMMENT ON TABLE  auction_winners IS '낙찰자';
COMMENT ON COLUMN auction_winners.winner_record_id IS '낙찰자 PK';
COMMENT ON COLUMN auction_winners.auction_id       IS '경매 PK';
COMMENT ON COLUMN auction_winners.employee_id      IS '사용자 PK';
COMMENT ON COLUMN auction_winners.selected_at      IS '낙찰 일시';


-- =========================
-- 11) auction_bids (입찰)
-- =========================
CREATE TABLE auction_bids (
                              bid_id      BIGSERIAL    PRIMARY KEY,                -- 입찰 PK
                              auction_id  BIGINT       NOT NULL,                   -- 경매 PK
                              bidder_id   BIGINT       NOT NULL,                   -- 입찰자 PK
                              bid_wage    INTEGER      NOT NULL CHECK (bid_wage >= 0), -- 입찰액
                              bid_time    TIMESTAMPTZ  NOT NULL DEFAULT now(),     -- 입찰시간
                              CONSTRAINT fk_auction_bids_auction
                                  FOREIGN KEY (auction_id) REFERENCES shift_auctions(auction_id) ON DELETE CASCADE,
                              CONSTRAINT fk_auction_bids_bidder
                                  FOREIGN KEY (bidder_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT
);
COMMENT ON TABLE  auction_bids IS '입찰';
COMMENT ON COLUMN auction_bids.bid_id     IS '입찰 PK';
COMMENT ON COLUMN auction_bids.auction_id IS '경매 PK';
COMMENT ON COLUMN auction_bids.bidder_id  IS '입찰자 PK';
COMMENT ON COLUMN auction_bids.bid_wage   IS '입찰액';
COMMENT ON COLUMN auction_bids.bid_time   IS '입찰시간';


-- =========================
-- 12) notifications (알림)
-- =========================
CREATE TABLE notifications (
                               notification_id  BIGSERIAL    PRIMARY KEY,           -- 알림 PK
                               receiver_id      BIGINT       NOT NULL,              -- 수신자 PK
                               title            VARCHAR(100) NOT NULL,              -- 제목
                               body             TEXT         NOT NULL,              -- 내용
                               type             VARCHAR(20)  NOT NULL,              -- 알림타입
                               target_id        BIGINT,                             -- 이동용 ID
                               is_read          BOOLEAN      NOT NULL DEFAULT FALSE, -- 읽음 여부
                               created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 생성일시
                               modified_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 수정일시
                               CONSTRAINT fk_notifications_receiver
                                   FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);
COMMENT ON TABLE  notifications IS '알림';
COMMENT ON COLUMN notifications.notification_id IS '알림 PK';
COMMENT ON COLUMN notifications.receiver_id     IS '수신자 PK';
COMMENT ON COLUMN notifications.title           IS '제목';
COMMENT ON COLUMN notifications.body            IS '내용';
COMMENT ON COLUMN notifications.type            IS '알림타입';
COMMENT ON COLUMN notifications.target_id       IS '이동용 ID';
COMMENT ON COLUMN notifications.is_read         IS '읽음 여부';
COMMENT ON COLUMN notifications.created_at      IS '생성일시';
COMMENT ON COLUMN notifications.modified_at     IS '수정일시';


-- =========================
-- 14) contracts (근로계약서)
-- =========================
CREATE TABLE contracts (
                           contract_id                  BIGSERIAL    PRIMARY KEY,                      -- 근로계약서 PK
                           employee_id                  BIGINT       NOT NULL,                         -- 직원 PK (store_employees)
                           contract_start_date          DATE         NOT NULL,                         -- 계약 시작일
                           contract_end_date            DATE,                                          -- 계약 종료일 (NULL = 무기계약)
                           workplace                    VARCHAR(255) NOT NULL,                         -- 근무장소
                           job_description              VARCHAR(500) NOT NULL,                         -- 업무 내용
                           work_start_time              TIME         NOT NULL,                         -- 근무 시작 시간
                           work_end_time                TIME         NOT NULL,                         -- 근무 종료 시간
                           break_start_time             TIME,                                          -- 휴게 시작 시간 (없을 수 있음)
                           break_end_time               TIME,                                          -- 휴게 종료 시간 (없을 수 있음)
                           work_days_per_week           INTEGER      NOT NULL,                         -- 주당 근무일수
                           weekly_holiday               VARCHAR(50)  NOT NULL,                         -- 주휴일 (예: 일요일, 토요일·일요일)
                           wage_type                    VARCHAR(10)  NOT NULL,                         -- 임금 유형 (MONTHLY/DAILY/HOURLY)
                           wage_amount                  BIGINT       NOT NULL,                         -- 임금액 (원)
                           has_bonus                    BOOLEAN      NOT NULL,                         -- 상여금 유무
                           bonus_amount                 BIGINT,                                        -- 상여금액
                           has_other_allowance          BOOLEAN      NOT NULL,                         -- 기타급여 유무
                           other_allowance_details      VARCHAR(500),                                  -- 기타급여 내역
                           pay_day_description          VARCHAR(50)  NOT NULL,                         -- 임금지급일 (예: 매월 10일)
                           payment_method               VARCHAR(20)  NOT NULL,                         -- 지급방법 (DIRECT/BANK_TRANSFER)
                           employment_insurance         BOOLEAN      NOT NULL,                         -- 고용보험 적용
                           industrial_accident_insurance BOOLEAN     NOT NULL,                         -- 산재보험 적용
                           national_pension             BOOLEAN      NOT NULL,                         -- 국민연금 적용
                           health_insurance             BOOLEAN      NOT NULL,                         -- 건강보험 적용
                           contract_date                DATE         NOT NULL,                         -- 계약 체결일
                           employee_address             VARCHAR(255) NOT NULL,                         -- 근로자 주소
                           status                       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',         -- 상태 (DRAFT/OWNER_SIGNED/COMPLETED)
                           owner_signature              TEXT,                                          -- 사업주 서명 (Base64)
                           owner_signed_at              TIMESTAMPTZ,                                   -- 사업주 서명 일시
                           employee_signature           TEXT,                                          -- 근로자 서명 (Base64)
                           employee_signed_at           TIMESTAMPTZ,                                   -- 근로자 서명 일시
                           pdf_file_path                VARCHAR(500),                                  -- PDF 파일 경로
                           version                      BIGINT       NOT NULL DEFAULT 0,               -- 낙관적 잠금 버전
                           created_at                   TIMESTAMPTZ  NOT NULL DEFAULT now(),            -- 생성일시
                           updated_at                   TIMESTAMPTZ  NOT NULL DEFAULT now(),            -- 수정일시
                           CONSTRAINT fk_contracts_employee
                               FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT,
                           CONSTRAINT chk_contracts_work_days
                               CHECK (work_days_per_week BETWEEN 1 AND 7),
                           CONSTRAINT chk_contracts_wage_amount
                               CHECK (wage_amount >= 0),
                           CONSTRAINT chk_contracts_status
                               CHECK (status IN ('DRAFT', 'OWNER_SIGNED', 'COMPLETED'))
);
COMMENT ON TABLE  contracts IS '근로계약서';
COMMENT ON COLUMN contracts.contract_id                   IS '근로계약서 PK';
COMMENT ON COLUMN contracts.employee_id                   IS '직원 PK';
COMMENT ON COLUMN contracts.contract_start_date           IS '계약 시작일';
COMMENT ON COLUMN contracts.contract_end_date             IS '계약 종료일 (NULL=무기계약)';
COMMENT ON COLUMN contracts.workplace                     IS '근무장소';
COMMENT ON COLUMN contracts.job_description               IS '업무 내용';
COMMENT ON COLUMN contracts.work_start_time               IS '근무 시작 시간';
COMMENT ON COLUMN contracts.work_end_time                 IS '근무 종료 시간';
COMMENT ON COLUMN contracts.break_start_time              IS '휴게 시작 시간';
COMMENT ON COLUMN contracts.break_end_time                IS '휴게 종료 시간';
COMMENT ON COLUMN contracts.work_days_per_week            IS '주당 근무일수';
COMMENT ON COLUMN contracts.weekly_holiday                IS '주휴일';
COMMENT ON COLUMN contracts.wage_type                     IS '임금 유형 (MONTHLY/DAILY/HOURLY)';
COMMENT ON COLUMN contracts.wage_amount                   IS '임금액 (원)';
COMMENT ON COLUMN contracts.has_bonus                     IS '상여금 유무';
COMMENT ON COLUMN contracts.bonus_amount                  IS '상여금액';
COMMENT ON COLUMN contracts.has_other_allowance           IS '기타급여 유무';
COMMENT ON COLUMN contracts.other_allowance_details       IS '기타급여 내역';
COMMENT ON COLUMN contracts.pay_day_description           IS '임금지급일';
COMMENT ON COLUMN contracts.payment_method                IS '지급방법 (DIRECT/BANK_TRANSFER)';
COMMENT ON COLUMN contracts.employment_insurance          IS '고용보험 적용';
COMMENT ON COLUMN contracts.industrial_accident_insurance IS '산재보험 적용';
COMMENT ON COLUMN contracts.national_pension              IS '국민연금 적용';
COMMENT ON COLUMN contracts.health_insurance              IS '건강보험 적용';
COMMENT ON COLUMN contracts.contract_date                 IS '계약 체결일';
COMMENT ON COLUMN contracts.employee_address              IS '근로자 주소';
COMMENT ON COLUMN contracts.status                        IS '상태 (DRAFT/OWNER_SIGNED/COMPLETED)';
COMMENT ON COLUMN contracts.owner_signature               IS '사업주 서명 (Base64)';
COMMENT ON COLUMN contracts.owner_signed_at               IS '사업주 서명 일시';
COMMENT ON COLUMN contracts.employee_signature             IS '근로자 서명 (Base64)';
COMMENT ON COLUMN contracts.employee_signed_at            IS '근로자 서명 일시';
COMMENT ON COLUMN contracts.pdf_file_path                 IS 'PDF 파일 경로';
COMMENT ON COLUMN contracts.version                       IS '낙관적 잠금 버전';
COMMENT ON COLUMN contracts.created_at                    IS '생성일시';
COMMENT ON COLUMN contracts.updated_at                    IS '수정일시';


-- =========================
-- 15) store_tasks (할일 관리)
-- =========================
CREATE TABLE store_tasks (
                             task_id              BIGSERIAL    PRIMARY KEY,       -- 할일 PK
                             store_id             BIGINT       NOT NULL,          -- 매장 PK
                             assignee_employee_id BIGINT,                         -- 담당 직원 PK
                             creator_user_id      BIGINT,                         -- 생성자 PK
                             title                VARCHAR(120) NOT NULL,          -- 제목
                             description          VARCHAR(1000),                  -- 상세 내용
                             due_at               TIMESTAMPTZ,                    -- 마감 기한
                             status               VARCHAR(20)  NOT NULL DEFAULT 'TODO', -- 진행 상태
                             completed_at         TIMESTAMPTZ,                    -- 완료 일시
                             created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                             updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 수정일시
                             CONSTRAINT fk_store_tasks_store
                                 FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
                             CONSTRAINT fk_store_tasks_assignee
                                 FOREIGN KEY (assignee_employee_id) REFERENCES store_employees(employee_id) ON DELETE SET NULL,
                             CONSTRAINT fk_store_tasks_creator
                                 FOREIGN KEY (creator_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
                             CONSTRAINT chk_store_tasks_completed_consistency
                                 CHECK ((status <> 'DONE' AND completed_at IS NULL) OR
                                        (status = 'DONE' AND completed_at IS NOT NULL))
);
COMMENT ON TABLE  store_tasks IS '할일 관리';
COMMENT ON COLUMN store_tasks.task_id              IS '할일 PK';
COMMENT ON COLUMN store_tasks.store_id             IS '매장 PK';
COMMENT ON COLUMN store_tasks.assignee_employee_id IS '담당 직원 PK';
COMMENT ON COLUMN store_tasks.creator_user_id      IS '생성자 PK';
COMMENT ON COLUMN store_tasks.title                IS '제목';
COMMENT ON COLUMN store_tasks.description          IS '상세 내용';
COMMENT ON COLUMN store_tasks.due_at               IS '마감 기한';
COMMENT ON COLUMN store_tasks.status               IS '진행 상태';
COMMENT ON COLUMN store_tasks.completed_at         IS '완료 일시';
COMMENT ON COLUMN store_tasks.created_at           IS '생성일시';
COMMENT ON COLUMN store_tasks.updated_at           IS '수정일시';

-- =========================
-- 15.1) task_images (할일 관리 첨부 이미지)
-- =========================
CREATE TABLE task_images (
                             image_id     BIGSERIAL    PRIMARY KEY,              -- 이미지 PK
                             task_id      BIGINT       NOT NULL,                 -- 할일 관리 PK
                             image_url    VARCHAR(255) NOT NULL,                 -- 이미지 저장 경로
                             origin_name  VARCHAR(255),                          -- 원본 파일명
                             name         VARCHAR(255),                          -- 파일명 (저장된 파일명)
                             created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                             updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                             CONSTRAINT fk_task_images_task
                                 FOREIGN KEY (task_id) REFERENCES store_tasks(task_id) ON DELETE CASCADE
);

COMMENT ON TABLE  task_images IS '할일 관리 첨부 이미지';
COMMENT ON COLUMN task_images.image_id    IS '이미지 PK';
COMMENT ON COLUMN task_images.task_id     IS '할일 관리 PK';
COMMENT ON COLUMN task_images.image_url   IS '이미지 저장 경로';
COMMENT ON COLUMN task_images.origin_name IS '원본 파일명';
COMMENT ON COLUMN task_images.name        IS '파일명';
COMMENT ON COLUMN task_images.created_at  IS '생성일시';
COMMENT ON COLUMN task_images.updated_at  IS '수정일시';

-- 특정 할일의 이미지 목록을 빠르게 불러오기 위한 인덱스 추가
CREATE INDEX idx_task_images_task_id ON task_images(task_id);


-- =========================
-- 16) chat_rooms (채팅방)
-- =========================
CREATE TABLE chat_rooms (
    room_id          BIGSERIAL    PRIMARY KEY,                           -- 채팅방 PK
    store_id         BIGINT       NOT NULL,                              -- 매장 PK
    room_type        VARCHAR(20)  NOT NULL DEFAULT 'DM',                -- 방 타입 [DM, GROUP, STORE_ALL, BOT]
    name             VARCHAR(100),                                       -- 채팅방 이름
    created_by       BIGINT,                                             -- 생성자 사용자 PK
    last_message_id  BIGINT,                                             -- 마지막 메시지 PK
    last_message_at  TIMESTAMPTZ,                                        -- 마지막 메시지 시각
    sort_priority    INTEGER      NOT NULL DEFAULT 0,                    -- 정렬 우선순위 (BOT 상단 고정용)
    is_archived      BOOLEAN      NOT NULL DEFAULT FALSE,                -- 보관 여부
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),                -- 생성일시
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),                -- 수정일시
    CONSTRAINT fk_chat_rooms_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_rooms_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_chat_rooms_room_type
        CHECK (room_type IN ('DM', 'GROUP', 'STORE_ALL', 'BOT'))
);
COMMENT ON TABLE  chat_rooms IS '채팅방';
COMMENT ON COLUMN chat_rooms.room_id         IS '채팅방 PK';
COMMENT ON COLUMN chat_rooms.store_id        IS '매장 PK';
COMMENT ON COLUMN chat_rooms.room_type       IS '방 타입 [DM, GROUP, STORE_ALL, BOT]';
COMMENT ON COLUMN chat_rooms.name            IS '채팅방 이름';
COMMENT ON COLUMN chat_rooms.created_by      IS '생성자 사용자 PK';
COMMENT ON COLUMN chat_rooms.last_message_id IS '마지막 메시지 PK';
COMMENT ON COLUMN chat_rooms.last_message_at IS '마지막 메시지 시각';
COMMENT ON COLUMN chat_rooms.sort_priority   IS '정렬 우선순위 (BOT 상단 고정용)';
COMMENT ON COLUMN chat_rooms.is_archived     IS '보관 여부';
COMMENT ON COLUMN chat_rooms.created_at      IS '생성일시';
COMMENT ON COLUMN chat_rooms.updated_at      IS '수정일시';
-- =========================
-- 16.1) chat_room_members (채팅방 참여자)
-- =========================
CREATE TABLE chat_room_members (
    room_member_id        BIGSERIAL    PRIMARY KEY,                      -- 참여자 PK
    room_id               BIGINT       NOT NULL,                         -- 채팅방 PK
    user_id               BIGINT       NOT NULL,                         -- 사용자 PK
    member_role           VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',       -- 멤버 역할 [OWNER, MANAGER, MEMBER]
    joined_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),           -- 참여 일시
    left_at               TIMESTAMPTZ,                                   -- 퇴장 일시
    last_read_message_id  BIGINT,                                        -- 마지막 읽은 메시지 PK
    last_read_at          TIMESTAMPTZ,                                   -- 마지막 읽음 시각
    mute_until            TIMESTAMPTZ,                                   -- 알림 음소거 종료 시각
    CONSTRAINT fk_chat_room_members_room
        FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_room_members_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_chat_room_members UNIQUE (room_id, user_id),
    CONSTRAINT chk_chat_room_members_role
        CHECK (member_role IN ('OWNER', 'MANAGER', 'MEMBER'))
);
COMMENT ON TABLE  chat_room_members IS '채팅방 참여자';
COMMENT ON COLUMN chat_room_members.room_member_id       IS '참여자 PK';
COMMENT ON COLUMN chat_room_members.room_id              IS '채팅방 PK';
COMMENT ON COLUMN chat_room_members.user_id              IS '사용자 PK';
COMMENT ON COLUMN chat_room_members.member_role          IS '멤버 역할 [OWNER, MANAGER, MEMBER]';
COMMENT ON COLUMN chat_room_members.joined_at            IS '참여 일시';
COMMENT ON COLUMN chat_room_members.left_at              IS '퇴장 일시';
COMMENT ON COLUMN chat_room_members.last_read_message_id IS '마지막 읽은 메시지 PK';
COMMENT ON COLUMN chat_room_members.last_read_at         IS '마지막 읽음 시각';
COMMENT ON COLUMN chat_room_members.mute_until           IS '알림 음소거 종료 시각';
-- =========================
-- 16.2) chat_messages (채팅 메시지)
-- =========================
CREATE TABLE chat_messages (
    message_id    BIGSERIAL    PRIMARY KEY,                              -- 채팅 메시지 PK
    room_id       BIGINT       NOT NULL,                                 -- 채팅방 PK
    sender_id     BIGINT,                                                -- 송신자 PK (시스템 메시지는 NULL 허용)
    message_type  VARCHAR(20)  NOT NULL DEFAULT 'TEXT',                  -- 메시지 타입 [TEXT, SYSTEM, IMAGE, FILE]
    content       TEXT,                                                  -- 본문
    file_url      VARCHAR(255),                                          -- 파일 경로
    meta_json     JSONB,                                                 -- 첨부/부가 메타데이터
    sent_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),                   -- 발송 일시
    read_count    INTEGER      NOT NULL DEFAULT 0 CHECK (read_count >= 0), -- 읽은 사람 수
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,                   -- 삭제 여부
    deleted_at    TIMESTAMPTZ,                                           -- 삭제 일시
    CONSTRAINT fk_chat_messages_room
        FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_chat_messages_content
        CHECK (
            (message_type IN ('TEXT', 'SYSTEM') AND content IS NOT NULL) OR
            (message_type IN ('IMAGE', 'FILE') AND file_url IS NOT NULL)
        )
);
COMMENT ON TABLE  chat_messages IS '채팅 메시지';
COMMENT ON COLUMN chat_messages.message_id   IS '채팅 메시지 PK';
COMMENT ON COLUMN chat_messages.room_id      IS '채팅방 PK';
COMMENT ON COLUMN chat_messages.sender_id    IS '송신자 PK (시스템 메시지는 NULL 허용)';
COMMENT ON COLUMN chat_messages.message_type IS '메시지 타입 [TEXT, SYSTEM, IMAGE, FILE]';
COMMENT ON COLUMN chat_messages.content      IS '본문';
COMMENT ON COLUMN chat_messages.file_url     IS '파일 경로';
COMMENT ON COLUMN chat_messages.meta_json    IS '첨부/부가 메타데이터';
COMMENT ON COLUMN chat_messages.sent_at      IS '발송 일시';
COMMENT ON COLUMN chat_messages.read_count   IS '읽은 사람 수';
COMMENT ON COLUMN chat_messages.is_deleted   IS '삭제 여부';
COMMENT ON COLUMN chat_messages.deleted_at   IS '삭제 일시';
-- =========================
-- 16.3) chat_direct_pairs (DM 페어)
-- =========================
CREATE TABLE chat_direct_pairs (
    pair_id     BIGSERIAL    PRIMARY KEY,                                -- DM 페어 PK
    store_id    BIGINT       NOT NULL,                                   -- 매장 PK
    user1_id    BIGINT       NOT NULL,                                   -- 사용자1 PK(작은 값)
    user2_id    BIGINT       NOT NULL,                                   -- 사용자2 PK(큰 값)
    room_id     BIGINT       NOT NULL UNIQUE,                            -- DM 채팅방 PK
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),                     -- 생성일시
    CONSTRAINT fk_chat_direct_pairs_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_direct_pairs_user1
        FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_direct_pairs_user2
        FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_direct_pairs_room
        FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT chk_chat_direct_pairs_order
        CHECK (user1_id < user2_id),
    CONSTRAINT uq_chat_direct_pairs_store_users
        UNIQUE (store_id, user1_id, user2_id)
);
COMMENT ON TABLE  chat_direct_pairs IS 'DM 페어 매핑';
COMMENT ON COLUMN chat_direct_pairs.pair_id    IS 'DM 페어 PK';
COMMENT ON COLUMN chat_direct_pairs.store_id   IS '매장 PK';
COMMENT ON COLUMN chat_direct_pairs.user1_id   IS '사용자1 PK(작은 값)';
COMMENT ON COLUMN chat_direct_pairs.user2_id   IS '사용자2 PK(큰 값)';
COMMENT ON COLUMN chat_direct_pairs.room_id    IS 'DM 채팅방 PK';
COMMENT ON COLUMN chat_direct_pairs.created_at IS '생성일시';

-- =========================
-- 17) payout_transactions (송금 내역)
-- =========================
CREATE TABLE payout_transactions (
                                     payout_id       BIGSERIAL    PRIMARY KEY,            -- 송금대역 PK
                                     payroll_id      BIGINT       NOT NULL,               -- 급여대장 PK
                                     employee_id     BIGINT       NOT NULL,               -- 직원 PK
                                     amount          BIGINT       NOT NULL CHECK (amount >= 0), -- 지급 금액
                                     status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- 송금 진행 상태
                                     payment_method  VARCHAR(20)  NOT NULL DEFAULT 'bank_transfer', -- 지급 수단
                                     external_tx_id  VARCHAR(100),                        -- 영수증 번호
                                     paid_at         TIMESTAMPTZ,                         -- 지급 일시
                                     created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(), -- 생성일시
                                     CONSTRAINT fk_payout_transactions_payroll
                                         FOREIGN KEY (payroll_id) REFERENCES payrolls(payroll_id) ON DELETE RESTRICT,
                                     CONSTRAINT fk_payout_transactions_employee
                                         FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT,
                                     CONSTRAINT uq_payout_transactions_payroll UNIQUE (payroll_id),
                                     CONSTRAINT chk_payout_transactions_paid_consistency
                                         CHECK ((status <> 'COMPLETED' AND paid_at IS NULL) OR
                                                (status = 'COMPLETED' AND paid_at IS NOT NULL))
);
COMMENT ON TABLE  payout_transactions IS '송금 내역';
COMMENT ON COLUMN payout_transactions.payout_id      IS '송금대역 PK';
COMMENT ON COLUMN payout_transactions.payroll_id     IS '급여대장 PK';
COMMENT ON COLUMN payout_transactions.employee_id    IS '직원 PK';
COMMENT ON COLUMN payout_transactions.amount         IS '지급 금액';
COMMENT ON COLUMN payout_transactions.status         IS '송금 진행 상태';
COMMENT ON COLUMN payout_transactions.payment_method IS '지급 수단';
COMMENT ON COLUMN payout_transactions.external_tx_id IS '영수증 번호';
COMMENT ON COLUMN payout_transactions.paid_at        IS '지급 일시';
COMMENT ON COLUMN payout_transactions.created_at     IS '생성일시';


-- =========================
-- 20) tax_file_jobs (홈택스 문서 작업 현황)
-- =========================
CREATE TABLE tax_file_jobs (
                               job_id         BIGSERIAL    PRIMARY KEY,             -- 작업 PK
                               store_id       BIGINT       NOT NULL,                -- 매장 PK
                               target_month   DATE         NOT NULL,                -- 대상월
                               job_status     VARCHAR(20)  NOT NULL DEFAULT 'QUEUED', -- 진행 상태
                               file_path      VARCHAR(255),                         -- 파일경로
                               error_message  TEXT,                                 -- 에러 메시지
                               created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),  -- 생성일시
                               finished_at    TIMESTAMPTZ,                          -- 완료 일시
                               CONSTRAINT fk_tax_file_jobs_store
                                   FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
                               CONSTRAINT uq_tax_file_jobs_store_month UNIQUE (store_id, target_month),
                               CONSTRAINT chk_tax_file_jobs_month_start
                                   CHECK (target_month = date_trunc('MONTH', target_month)::date),
                               CONSTRAINT chk_tax_file_jobs_finished_consistency
                                   CHECK ((job_status IN ('QUEUED', 'RUNNING') AND finished_at IS NULL) OR
                                          (job_status IN ('COMPLETED', 'FAILED') AND finished_at IS NOT NULL))
);
COMMENT ON TABLE  tax_file_jobs IS '홈택스 문서 작업 현황';
COMMENT ON COLUMN tax_file_jobs.job_id        IS '작업 PK';
COMMENT ON COLUMN tax_file_jobs.store_id      IS '매장 PK';
COMMENT ON COLUMN tax_file_jobs.target_month  IS '대상월';
COMMENT ON COLUMN tax_file_jobs.job_status    IS '진행 상태';
COMMENT ON COLUMN tax_file_jobs.file_path     IS '파일경로';
COMMENT ON COLUMN tax_file_jobs.error_message IS '에러 메시지';
COMMENT ON COLUMN tax_file_jobs.created_at    IS '생성일시';
COMMENT ON COLUMN tax_file_jobs.finished_at   IS '완료 일시';


-- =========================================================
-- Indexes (performance)
-- =========================================================
CREATE INDEX idx_stores_owner_id                     ON stores(owner_id);
CREATE INDEX idx_store_employees_store_id            ON store_employees(store_id);
CREATE INDEX idx_store_employees_user_id             ON store_employees(user_id);
CREATE INDEX idx_store_employees_status              ON store_employees(status);
CREATE INDEX idx_work_schedules_employee_id          ON work_schedules(employee_id);
CREATE INDEX idx_attendances_status                  ON attendances(status);
CREATE INDEX idx_payroll_details_payroll_id          ON payroll_details(payroll_id);
CREATE INDEX idx_documents_user_id                   ON documents(user_id);
CREATE INDEX idx_employee_documents_employee_id      ON employee_documents(employee_id);
CREATE INDEX idx_shift_auctions_store_date_status    ON shift_auctions(store_id, target_date, status);
CREATE INDEX idx_auction_bids_auction_id             ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder_id              ON auction_bids(bidder_id);
CREATE INDEX idx_notifications_receiver_read_created ON notifications(receiver_id, is_read, created_at DESC);
CREATE INDEX idx_contracts_employee_status ON contracts(employee_id, status);
CREATE INDEX idx_store_tasks_store_status_due        ON store_tasks(store_id, status, due_at);
CREATE INDEX idx_payout_transactions_employee_status ON payout_transactions(employee_id, status);
CREATE INDEX idx_tax_file_jobs_store_status_created  ON tax_file_jobs(store_id, job_status, created_at DESC);


-- =========================
-- 21) boards (게시판 마스터)
-- =========================
CREATE TABLE boards (
                        board_id     BIGSERIAL    PRIMARY KEY,              -- 게시판 PK
                        store_id     BIGINT       NOT NULL,                 -- 매장 PK
                        name         VARCHAR(50)  NOT NULL,                 -- 게시판 이름
                        description  VARCHAR(255),                          -- 게시판 설명
                        board_type   VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',-- 게시판 성격 [NOTICE, NORMAL 등]
                        is_active    BOOLEAN      NOT NULL DEFAULT TRUE,    -- 활성화 여부
                        created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                        CONSTRAINT fk_boards_store
                            FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
                        CONSTRAINT uq_boards_store_name UNIQUE (store_id, name)
);
COMMENT ON TABLE  boards IS '게시판';
COMMENT ON COLUMN boards.board_id    IS '게시판 PK';
COMMENT ON COLUMN boards.store_id    IS '매장 PK';
COMMENT ON COLUMN boards.name        IS '게시판 이름';
COMMENT ON COLUMN boards.description IS '게시판 설명';
COMMENT ON COLUMN boards.board_type  IS '게시판 성격';
COMMENT ON COLUMN boards.is_active   IS '활성화 여부';
COMMENT ON COLUMN boards.created_at  IS '생성일시';
COMMENT ON COLUMN boards.updated_at  IS '수정일시';


-- =========================
-- 22) posts (게시글)
-- =========================
CREATE TABLE posts (
                       post_id      BIGSERIAL    PRIMARY KEY,              -- 게시글 PK
                       board_id     BIGINT       NOT NULL,                 -- 게시판 PK
                       writer_id    BIGINT,                                -- 작성자 PK (직원)
                       title        VARCHAR(255) NOT NULL,                 -- 제목
                       content      TEXT         NOT NULL,                 -- 본문
                       view_count   INTEGER      NOT NULL DEFAULT 0,       -- 조회수
                       is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,   -- 삭제여부
                       created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                       updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                       CONSTRAINT fk_posts_board
                           FOREIGN KEY (board_id) REFERENCES boards(board_id) ON DELETE CASCADE,
                       CONSTRAINT fk_posts_writer
                           FOREIGN KEY (writer_id) REFERENCES store_employees(employee_id) ON DELETE SET NULL
);
COMMENT ON TABLE  posts IS '게시글';
COMMENT ON COLUMN posts.post_id    IS '게시글 PK';
COMMENT ON COLUMN posts.board_id   IS '게시판 PK';
COMMENT ON COLUMN posts.writer_id  IS '작성자 PK';
COMMENT ON COLUMN posts.title      IS '제목';
COMMENT ON COLUMN posts.content    IS '본문';
COMMENT ON COLUMN posts.view_count IS '조회수';
COMMENT ON COLUMN posts.is_deleted IS '삭제여부';
COMMENT ON COLUMN posts.created_at IS '생성일시';
COMMENT ON COLUMN posts.updated_at IS '수정일시';


-- =========================
-- 23) post_images (게시글 첨부 이미지)
-- =========================
CREATE TABLE post_images (
                             image_id     BIGSERIAL    PRIMARY KEY,              -- 이미지 PK
                             post_id      BIGINT       NOT NULL,                 -- 게시글 PK
                             image_url    VARCHAR(255) NOT NULL,                 -- 이미지 저장 경로
                             origin_name  VARCHAR(255),                          -- 원본 파일명
                             name         VARCHAR(255),                          -- 파일명 (저장된 파일명)
                             created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                             updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                             CONSTRAINT fk_post_images_post
                                 FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);
COMMENT ON TABLE  post_images IS '게시글 첨부 이미지';
COMMENT ON COLUMN post_images.image_id    IS '이미지 PK';
COMMENT ON COLUMN post_images.post_id     IS '게시글 PK';
COMMENT ON COLUMN post_images.image_url   IS '이미지 저장 경로';
COMMENT ON COLUMN post_images.origin_name IS '원본 파일명';
COMMENT ON COLUMN post_images.name        IS '파일명';
COMMENT ON COLUMN post_images.created_at  IS '생성일시';
COMMENT ON COLUMN post_images.updated_at  IS '수정일시';


-- =========================
-- 24) post_comments (댓글)
-- =========================
CREATE TABLE post_comments (
                               comment_id        BIGSERIAL    PRIMARY KEY,              -- 댓글 PK
                               post_id           BIGINT       NOT NULL,                 -- 게시글 PK
                               writer_id         BIGINT,                                -- 작성자 PK (직원)
                               parent_comment_id BIGINT,                                -- 부모 댓글 PK (대댓글용)
                               content           TEXT         NOT NULL,                 -- 댓글 내용
                               is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,   -- 삭제여부
                               created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 생성일시
                               updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),   -- 수정일시
                               CONSTRAINT fk_post_comments_post
                                   FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
                               CONSTRAINT fk_post_comments_writer
                                   FOREIGN KEY (writer_id) REFERENCES store_employees(employee_id) ON DELETE SET NULL,
                               CONSTRAINT fk_post_comments_parent
                                   FOREIGN KEY (parent_comment_id) REFERENCES post_comments(comment_id) ON DELETE CASCADE
);
COMMENT ON TABLE  post_comments IS '댓글';
COMMENT ON COLUMN post_comments.comment_id        IS '댓글 PK';
COMMENT ON COLUMN post_comments.post_id           IS '게시글 PK';
COMMENT ON COLUMN post_comments.writer_id         IS '작성자 PK';
COMMENT ON COLUMN post_comments.parent_comment_id IS '부모 댓글 PK';
COMMENT ON COLUMN post_comments.content           IS '댓글 내용';
COMMENT ON COLUMN post_comments.is_deleted        IS '삭제여부';
COMMENT ON COLUMN post_comments.created_at        IS '생성일시';
COMMENT ON COLUMN post_comments.updated_at        IS '수정일시';


-- =========================================================
-- 게시판 관련 Indexes (조회 성능 최적화용)
-- =========================================================
CREATE INDEX idx_boards_store_id                  ON boards(store_id, is_active);
CREATE INDEX idx_posts_board_id_created           ON posts(board_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_post_images_post_id              ON post_images(post_id);
CREATE INDEX idx_post_comments_post_id_created    ON post_comments(post_id, created_at ASC) WHERE is_deleted = FALSE;

-- =========================================================
-- 채팅 관련 Indexes (조회 성능 최적화용)
-- =========================================================
CREATE INDEX idx_chat_rooms_store_priority_lastmsg ON chat_rooms(store_id, sort_priority DESC, last_message_at DESC);
CREATE INDEX idx_chat_room_members_user_active ON chat_room_members(user_id, left_at);
CREATE INDEX idx_chat_room_members_room_active ON chat_room_members(room_id, left_at);
CREATE INDEX idx_chat_messages_room_message_id ON chat_messages(room_id, message_id DESC);