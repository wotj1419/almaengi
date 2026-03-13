-- =========================================================
-- Schema v1.6 (PostgreSQL)
-- =========================================================

-- 1) users
CREATE TABLE users (
                       user_id BIGSERIAL PRIMARY KEY,
                       login_type VARCHAR(20) NOT NULL
                           CHECK (login_type IN ('LOCAL', 'KAKAO', 'NAVER', 'GOOGLE')),
                       password VARCHAR(200),
                       role VARCHAR(20)                                                    -- nullable: 소셜 신규 유저 역할 미선택 허용
                           CHECK (role IN ('OWNER', 'EMPLOYEE')),                          -- null은 CHECK 통과 (SQL 표준)
                       name VARCHAR(50) NOT NULL,
                       phone VARCHAR(20),
                       email VARCHAR(100) NOT NULL,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       is_withdraw BOOLEAN NOT NULL DEFAULT FALSE,
                       withdrawn_at TIMESTAMPTZ,
                       birth_date DATE,
                       CONSTRAINT chk_users_password_for_local
                           CHECK (login_type <> 'LOCAL' OR password IS NOT NULL),
                       CONSTRAINT chk_users_withdraw_consistency
                           CHECK ((is_withdraw = FALSE AND withdrawn_at IS NULL) OR
                                  (is_withdraw = TRUE AND withdrawn_at IS NOT NULL))
);
CREATE UNIQUE INDEX uq_users_email_lower ON users ((lower(email)));

-- 2) stores
CREATE TABLE stores (
                        store_id BIGSERIAL PRIMARY KEY,
                        owner_id BIGINT NOT NULL,
                        store_name VARCHAR(100) NOT NULL,
                        address VARCHAR(255) NOT NULL,
                        phone VARCHAR(20),
                        qr_code VARCHAR(255),
                        is_over_5_employees BOOLEAN NOT NULL DEFAULT FALSE,
                        is_closed BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        CONSTRAINT fk_stores_owner
                            FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 3) store_employees
CREATE TABLE store_employees (
                                 employee_id BIGSERIAL PRIMARY KEY,
                                 store_id BIGINT NOT NULL,
                                 user_id BIGINT NOT NULL,
                                 status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                                     CHECK (status IN ('INVITED', 'ACTIVE', 'INACTIVE', 'TERMINATED', 'BEST')),
                                 position VARCHAR(50),
                                 hourly_wage INTEGER NOT NULL CHECK (hourly_wage >= 0),
                                 tax_type VARCHAR(20) NOT NULL DEFAULT 'INCOME_3_3'
                                     CHECK (tax_type IN ('INCOME_3_3', 'FOUR_INSURANCE')),           -- is_4insurances 제거, tax_type으로 통합
                                 worked_minutes INTEGER NOT NULL DEFAULT 0 CHECK (worked_minutes >= 0),
                                 will_working_minutes INTEGER NOT NULL DEFAULT 0 CHECK (will_working_minutes >= 0),
                                 hire_date DATE,
                                 dependents_count INTEGER NOT NULL DEFAULT 0 CHECK (dependents_count >= 0),
                                 include_holiday_pay BOOLEAN NOT NULL DEFAULT FALSE,
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                 CONSTRAINT fk_store_employees_store
                                     FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
                                 CONSTRAINT fk_store_employees_user
                                     FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
                                 CONSTRAINT uq_store_employees_store_user UNIQUE (store_id, user_id)
);

-- 4) work_schedules
CREATE TABLE work_schedules (
                                schedule_id BIGSERIAL PRIMARY KEY,
                                employee_id BIGINT NOT NULL,
                                day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                                start_time TIME NOT NULL,
                                end_time TIME NOT NULL,
                                break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
                                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                CONSTRAINT fk_work_schedules_employee
                                    FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE,
                                CONSTRAINT chk_work_schedules_time_range
                                    CHECK (start_time <> end_time),                                 -- 야간근무(22:00~06:00) 허용, 동일 시간만 방지
                                CONSTRAINT uq_work_schedules_slot UNIQUE (employee_id, day_of_week, start_time, end_time)
);

-- 5) attendances
CREATE TABLE attendances (
                             attendance_id BIGSERIAL PRIMARY KEY,
                             employee_id BIGINT NOT NULL,
                             target_date DATE NOT NULL,
                             scheduled_start_time TIME,
                             scheduled_end_time TIME,
                             clock_in TIMESTAMPTZ,
                             clock_out TIMESTAMPTZ,
                             status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
                                 CHECK (status IN ('SCHEDULED', 'PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT', 'OFF')),
                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             CONSTRAINT fk_attendances_employee
                                 FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE,
                             CONSTRAINT uq_attendances_employee_date UNIQUE (employee_id, target_date),
                             CONSTRAINT chk_attendances_clock_order
                                 CHECK (clock_out IS NULL OR (clock_in IS NOT NULL AND clock_out >= clock_in))
);

-- 6) payrolls
CREATE TABLE payrolls (
                          payroll_id BIGSERIAL PRIMARY KEY,
                          employee_id BIGINT NOT NULL,
                          target_month DATE NOT NULL,
                          total_work_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_work_minutes >= 0),
                          night_work_minutes INTEGER NOT NULL DEFAULT 0 CHECK (night_work_minutes >= 0),
                          basic_pay BIGINT NOT NULL DEFAULT 0 CHECK (basic_pay >= 0),
                          total_allowance BIGINT NOT NULL DEFAULT 0 CHECK (total_allowance >= 0),
                          total_deduction BIGINT NOT NULL DEFAULT 0 CHECK (total_deduction >= 0),
                          net_pay BIGINT NOT NULL DEFAULT 0 CHECK (net_pay >= 0),
                          is_approved BOOLEAN NOT NULL DEFAULT FALSE,
                          approved_at TIMESTAMPTZ,
                          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                          CONSTRAINT fk_payrolls_employee
                              FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT,
                          CONSTRAINT uq_payrolls_employee_month UNIQUE (employee_id, target_month),
                          CONSTRAINT chk_payrolls_month_start
                              CHECK (target_month = date_trunc('MONTH', target_month)::date),
    CONSTRAINT chk_payrolls_approved_consistency
        CHECK ((is_approved = FALSE AND approved_at IS NULL) OR
               (is_approved = TRUE AND approved_at IS NOT NULL))
);

-- 7) payroll_details
CREATE TABLE payroll_details (
                                 detail_id BIGSERIAL PRIMARY KEY,
                                 payroll_id BIGINT NOT NULL,
                                 detail_type VARCHAR(20) NOT NULL
                                     CHECK (detail_type IN ('BASE', 'ALLOWANCE', 'DEDUCTION', 'OTHER')),
                                 item_name VARCHAR(50) NOT NULL,
                                 amount BIGINT NOT NULL CHECK (amount >= 0),
                                 calculation_formula VARCHAR(255),
                                 work_minutes INTEGER NOT NULL DEFAULT 0 CHECK (work_minutes >= 0),
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                 CONSTRAINT fk_payroll_details_payroll
                                     FOREIGN KEY (payroll_id) REFERENCES payrolls(payroll_id) ON DELETE CASCADE
);

-- 8) documents (user document vault)
CREATE TABLE documents (
                           doc_id BIGSERIAL PRIMARY KEY,
                           user_id BIGINT NOT NULL,
                           doc_type VARCHAR(50) NOT NULL,
                           file_url VARCHAR(255) NOT NULL,
                           expire_date DATE,
                           status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                               CHECK (status IN ('ACTIVE', 'EXPIRED', 'DELETED')),
                           uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                           CONSTRAINT fk_documents_user
                               FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 9) employee_documents
CREATE TABLE employee_documents (
                                    doc_id BIGSERIAL PRIMARY KEY,
                                    employee_id BIGINT NOT NULL,
                                    doc_type VARCHAR(50) NOT NULL,
                                    file_url VARCHAR(255) NOT NULL,
                                    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
                                        CHECK (status IN ('REQUESTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED')),
                                    expire_date DATE,
                                    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                    CONSTRAINT fk_employee_documents_employee
                                        FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE
);

-- 10) shift_auctions
CREATE TABLE shift_auctions (
                                auction_id BIGSERIAL PRIMARY KEY,
                                store_id BIGINT NOT NULL,
    -- winner_id BIGINT,
                                target_date DATE NOT NULL,
                                deadline TIMESTAMP,           -- [NEW] 경매 마감 일시
                                start_time TIME NOT NULL,
                                end_time TIME NOT NULL,
                                max_wage INTEGER NOT NULL CHECK (max_wage >= 0),
                                min_wage INTEGER NOT NULL CHECK (min_wage >= 0),
                                status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                                    CHECK (status IN ('OPEN', 'AWARDED', 'CLOSED', 'CANCELLED')),
                                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                CONSTRAINT fk_shift_auctions_store
                                    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
    -- CONSTRAINT fk_shift_auctions_winner
    --     FOREIGN KEY (winner_id) REFERENCES store_employees(employee_id) ON DELETE SET NULL,
                                CONSTRAINT chk_shift_auctions_time_range
                                    CHECK (start_time <> end_time),                                 -- 야간근무 허용, 동일 시간만 방지
                                CONSTRAINT chk_shift_auctions_wage_range CHECK (max_wage >= min_wage),
                                CONSTRAINT uq_shift_auctions_slot UNIQUE (store_id, target_date, start_time, end_time)
);

-- 10.5) auction_winners
CREATE TABLE auction_winners (
                                 winner_record_id BIGSERIAL PRIMARY KEY,
                                 auction_id BIGINT NOT NULL,
                                 employee_id BIGINT NOT NULL,
                                 selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 낙찰 확정 시점
                                 FOREIGN KEY (auction_id) REFERENCES shift_auctions(auction_id) ON DELETE CASCADE,
                                 FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE CASCADE
);

-- 11) auction_bids
CREATE TABLE auction_bids (
                              bid_id BIGSERIAL PRIMARY KEY,
                              auction_id BIGINT NOT NULL,
                              bidder_id BIGINT NOT NULL,
                              bid_wage INTEGER NOT NULL CHECK (bid_wage >= 0),
                              bid_time TIMESTAMPTZ NOT NULL DEFAULT now(),
                              CONSTRAINT fk_auction_bids_auction
                                  FOREIGN KEY (auction_id) REFERENCES shift_auctions(auction_id) ON DELETE CASCADE,
                              CONSTRAINT fk_auction_bids_bidder
                                  FOREIGN KEY (bidder_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT
);

-- 12) notifications
CREATE TABLE notifications (
                               notification_id BIGSERIAL PRIMARY KEY,
                               receiver_id BIGINT NOT NULL,
                               title VARCHAR(100) NOT NULL,
                               body TEXT NOT NULL,
                               type VARCHAR(20) NOT NULL,
                               target_id BIGINT,
                               is_read BOOLEAN NOT NULL DEFAULT FALSE,
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT fk_notifications_receiver
                                   FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 14) employment_contracts (e-contract)
CREATE TABLE employment_contracts (
                                      contract_id BIGSERIAL PRIMARY KEY,
                                      store_id BIGINT NOT NULL,
                                      employee_id BIGINT NOT NULL,
                                      contract_title VARCHAR(100) NOT NULL,
                                      contract_body TEXT NOT NULL,
                                      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                                          CHECK (status IN ('DRAFT', 'WAITING_EMPLOYEE', 'COMPLETED', 'CANCELLED')),
                                      signed_owner_at TIMESTAMPTZ,
                                      signed_employee_at TIMESTAMPTZ,
                                      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                      CONSTRAINT fk_employment_contracts_store
                                          FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
                                      CONSTRAINT fk_employment_contracts_employee
                                          FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT
);

CREATE TABLE contract_signatures (
                                     signature_id BIGSERIAL PRIMARY KEY,
                                     contract_id BIGINT NOT NULL,
                                     signed_by_user_id BIGINT NOT NULL,
                                     signer_role VARCHAR(20) NOT NULL CHECK (signer_role IN ('OWNER', 'EMPLOYEE')),
                                     signature_image_url VARCHAR(255) NOT NULL,
                                     signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                     CONSTRAINT fk_contract_signatures_contract
                                         FOREIGN KEY (contract_id) REFERENCES employment_contracts(contract_id) ON DELETE CASCADE,
                                     CONSTRAINT fk_contract_signatures_user
                                         FOREIGN KEY (signed_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
                                     CONSTRAINT uq_contract_signatures_role UNIQUE (contract_id, signer_role)
);

-- 15) store_tasks (to-do management)
CREATE TABLE store_tasks (
                             task_id BIGSERIAL PRIMARY KEY,
                             store_id BIGINT NOT NULL,
                             assignee_employee_id BIGINT,
                             creator_user_id BIGINT,
                             title VARCHAR(120) NOT NULL,
                             description VARCHAR(1000),
                             due_at TIMESTAMPTZ,
                             status VARCHAR(20) NOT NULL DEFAULT 'TODO'
                                 CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
                             completed_at TIMESTAMPTZ,
                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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

-- 16) chat
CREATE TABLE chat_rooms (
                            room_id BIGSERIAL PRIMARY KEY,
                            store_id BIGINT,
                            room_type VARCHAR(20) NOT NULL DEFAULT 'DM'
                                CHECK (room_type IN ('DM', 'GROUP', 'STORE')),
                            name VARCHAR(100),
                            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                            CONSTRAINT fk_chat_rooms_store
                                FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

CREATE TABLE chat_room_members (
                                   room_member_id BIGSERIAL PRIMARY KEY,
                                   room_id BIGINT NOT NULL,
                                   user_id BIGINT NOT NULL,
                                   joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                   left_at TIMESTAMPTZ,
                                   CONSTRAINT fk_chat_room_members_room
                                       FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
                                   CONSTRAINT fk_chat_room_members_user
                                       FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                   CONSTRAINT uq_chat_room_members UNIQUE (room_id, user_id) -- 재입장 시 left_at = NULL로 업데이트 (새 row 생성 X)
);

CREATE TABLE chat_messages (
                               message_id BIGSERIAL PRIMARY KEY,
                               room_id BIGINT NOT NULL,
                               sender_id BIGINT,
                               message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT'
                                   CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
                               content TEXT,
                               file_url VARCHAR(255),
                               sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                               read_count INTEGER NOT NULL DEFAULT 0 CHECK (read_count >= 0),
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

-- 17) payout_transactions (payroll transfer history)
CREATE TABLE payout_transactions (
                                     payout_id BIGSERIAL PRIMARY KEY,
                                     payroll_id BIGINT NOT NULL,
                                     employee_id BIGINT NOT NULL,
                                     amount BIGINT NOT NULL CHECK (amount >= 0),
                                     status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                                         CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
                                     payment_method VARCHAR(20) NOT NULL DEFAULT 'bank_transfer',
                                     external_tx_id VARCHAR(100),
                                     paid_at TIMESTAMPTZ,
                                     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                     CONSTRAINT fk_payout_transactions_payroll
                                         FOREIGN KEY (payroll_id) REFERENCES payrolls(payroll_id) ON DELETE RESTRICT,
                                     CONSTRAINT fk_payout_transactions_employee
                                         FOREIGN KEY (employee_id) REFERENCES store_employees(employee_id) ON DELETE RESTRICT,
                                     CONSTRAINT uq_payout_transactions_payroll UNIQUE (payroll_id),
                                     CONSTRAINT chk_payout_transactions_paid_consistency
                                         CHECK ((status <> 'COMPLETED' AND paid_at IS NULL) OR
                                                (status = 'COMPLETED' AND paid_at IS NOT NULL))
);

-- 20) tax_file_jobs (hometax file generation batch)
CREATE TABLE tax_file_jobs (
                               job_id BIGSERIAL PRIMARY KEY,
                               store_id BIGINT NOT NULL,
                               target_month DATE NOT NULL,
                               job_status VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                                   CHECK (job_status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
                               file_path VARCHAR(255),
                               error_message TEXT,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                               finished_at TIMESTAMPTZ,                                            -- completed, failed 모두 기록 (종료 시각)
                               CONSTRAINT fk_tax_file_jobs_store
                                   FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
                               CONSTRAINT uq_tax_file_jobs_store_month UNIQUE (store_id, target_month),
                               CONSTRAINT chk_tax_file_jobs_month_start
                                   CHECK (target_month = date_trunc('MONTH', target_month)::date),
    CONSTRAINT chk_tax_file_jobs_finished_consistency
        CHECK ((job_status IN ('QUEUED', 'RUNNING') AND finished_at IS NULL) OR
               (job_status IN ('COMPLETED', 'FAILED') AND finished_at IS NOT NULL))
);

-- =========================================================
-- Indexes (performance)
-- =========================================================
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_store_employees_store_id ON store_employees(store_id);
CREATE INDEX idx_store_employees_user_id ON store_employees(user_id);
CREATE INDEX idx_store_employees_status ON store_employees(status);
CREATE INDEX idx_work_schedules_employee_id ON work_schedules(employee_id);
-- idx_attendances_employee_date 삭제: uq_attendances_employee_date UNIQUE가 동일 인덱스 자동 생성
CREATE INDEX idx_attendances_status ON attendances(status);
-- idx_payrolls_employee_month 삭제: uq_payrolls_employee_month UNIQUE가 동일 인덱스 자동 생성
CREATE INDEX idx_payroll_details_payroll_id ON payroll_details(payroll_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_shift_auctions_store_date_status ON shift_auctions(store_id, target_date, status);
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder_id ON auction_bids(bidder_id);
CREATE INDEX idx_notifications_receiver_read_created
    ON notifications(receiver_id, is_read, created_at DESC);
CREATE INDEX idx_employment_contracts_store_employee
    ON employment_contracts(store_id, employee_id, status);
CREATE INDEX idx_store_tasks_store_status_due
    ON store_tasks(store_id, status, due_at);
CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room_sent ON chat_messages(room_id, sent_at DESC);
CREATE INDEX idx_payout_transactions_employee_status
    ON payout_transactions(employee_id, status);
CREATE INDEX idx_tax_file_jobs_store_status_created
    ON tax_file_jobs(store_id, job_status, created_at DESC);
