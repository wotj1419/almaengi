package com.almaengi.be.domain.store.service;

import com.almaengi.be.domain.store.dto.WorkScheduleRequestDto;
import com.almaengi.be.domain.store.dto.WorkScheduleResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.repository.WorkScheduleRepository;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkScheduleService {
    private final WorkScheduleRepository workScheduleRepository;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;

    // 직원 주간 스케줄 등록
    @Transactional
    public WorkScheduleResponseDto.ScheduleInfo addSchedule(Long userId, Long storeId, Long employeeId, WorkScheduleRequestDto.Create request) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);

        StoreEmployee employee = getEmployeeOrThrow(employeeId);

        LocalTime startTime = LocalTime.parse(request.getStartTime());
        LocalTime endTime = LocalTime.parse(request.getEndTime());

        if(workScheduleRepository.existsTimeOverlapping(employeeId, request.getDayOfWeek(), startTime, endTime))
            throw new BusinessException(ErrorCode.DUPLICATE_SCHEDULE);

        WorkSchedule schedule = WorkSchedule.builder()
                .employee(employee)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(startTime)
                .endTime(endTime)
                .breakMinutes(request.getBreakMinutes() != null ? request.getBreakMinutes() : 0)
                .build();
        WorkSchedule response = workScheduleRepository.save(schedule);

        return WorkScheduleResponseDto.ScheduleInfo.from(response);
    }

    // 직원 주간 스케줄 복수 등록
    @Transactional
    public WorkScheduleResponseDto.BulkResult addSchedules(Long userId, Long storeId, Long employeeId, WorkScheduleRequestDto.CreateBulk requests) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);
        StoreEmployee employee = getEmployeeOrThrow(employeeId);

        List<WorkScheduleResponseDto.ScheduleInfo> created = new ArrayList<>();
        List<String> conflicts = new ArrayList<>();

        for(WorkScheduleRequestDto.Create request : requests.getSchedules()) {
            LocalTime startTime = LocalTime.parse(request.getStartTime());
            LocalTime endTime = LocalTime.parse(request.getEndTime());

            if(workScheduleRepository.existsTimeOverlapping(employeeId, request.getDayOfWeek(), startTime, endTime)) {
                conflicts.add(request.getDayOfWeek().getLabel() + "요일" + startTime + " ~ " + endTime);
            } else {
                WorkSchedule schedule = WorkSchedule.builder()
                        .employee(employee)
                        .dayOfWeek(request.getDayOfWeek())
                        .startTime(startTime)
                        .endTime(endTime)
                        .breakMinutes(request.getBreakMinutes() != null ? request.getBreakMinutes() : 0)
                        .build();
                WorkSchedule response = workScheduleRepository.save(schedule);
                created.add(WorkScheduleResponseDto.ScheduleInfo.from(schedule));
            }
        }

        return WorkScheduleResponseDto.BulkResult.builder()
                .created(created)
                .conflicts(conflicts)
                .build();
    }

    // 특정 직원 주간 스케줄 조회(고정 근무에 대함)
    // 이번 달 실제 근무 목록은 AttendanceService에서 조회해야함.
    public List<WorkScheduleResponseDto.ScheduleInfo> getSchedules(Long userId, Long storeId, Long employeeId) {
        Store store = getStoreOrThrow(storeId);
        StoreEmployee employee = getEmployeeOrThrow(employeeId);

        // 사장님 혹은 직원 본인이 아니면 조회 불가
        boolean isOwner = store.getOwner().getId().equals(userId);
        boolean isSelf = employee.getUser().getId().equals(userId);
        if(!isOwner && !isSelf)
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);

        return workScheduleRepository.findByEmployeeId(employeeId).stream()
                .map(WorkScheduleResponseDto.ScheduleInfo::from)
                .toList();
    }

    // 매장 전체 직원의 주간 스케줄(고정 스케줄) 조회
    public List<WorkScheduleResponseDto.ScheduleInfo> getStoreSchedules(Long userId, Long storeId) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);

        return workScheduleRepository.findByEmployee_StoreId(storeId).stream()
                .sorted(Comparator
                        .comparing((WorkSchedule ws) -> ws.getDayOfWeek().getValue())
                        .thenComparing((WorkSchedule::getStartTime))
                        .thenComparing(ws -> ws.getEmployee().getId()))
                .map(WorkScheduleResponseDto.ScheduleInfo::from)
                .toList();
    }

    // 매장 전체 직원의 특정 요일 스케줄(고정 스케줄) 조회
    public List<WorkScheduleResponseDto.ScheduleInfo> getStoreSchedulesByDay(Long userId, Long storeId, DayOfWeek dayOfWeek) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);

        return workScheduleRepository.findByEmployee_StoreIdAndDayOfWeek(storeId, dayOfWeek).stream()
                .sorted(Comparator
                        .comparing(WorkSchedule::getStartTime)
                        .thenComparing(ws -> ws.getEmployee().getId()))
                .map(WorkScheduleResponseDto.ScheduleInfo::from)
                .toList();
    }

    // 주간 스케줄 수정
    @Transactional
    public WorkScheduleResponseDto.ScheduleInfo updateSchedule(Long userId, Long storeId, Long scheduleId, WorkScheduleRequestDto.Update request) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);
        WorkSchedule schedule = getWorkScheduleOrThrow(scheduleId);

        LocalTime startTime = request.getStartTime() != null ? LocalTime.parse(request.getStartTime()) : null;
        LocalTime endTime = request.getEndTime() != null ? LocalTime.parse(request.getEndTime()) : null;
        if(startTime != null && endTime != null
                && workScheduleRepository.existsTimeOverlapping(schedule.getEmployee().getId(), request.getDayOfWeek(), startTime, endTime))
            throw new BusinessException(ErrorCode.DUPLICATE_SCHEDULE);

        schedule.update(request.getDayOfWeek(), startTime, endTime, request.getBreakMinutes());

        return WorkScheduleResponseDto.ScheduleInfo.from(schedule);
    }

    // 주간 스케줄 삭제
    @Transactional
    public void deleteSchedule(Long userId, Long storeId, Long scheduleId) {
        Store store = getStoreOrThrow(storeId);
        validateOwner(store, userId);

        WorkSchedule schedule = getWorkScheduleOrThrow(scheduleId);
        workScheduleRepository.delete(schedule);
    }


    // ========== PRIVATE 헬퍼 메서드 ========== //
    private Store getStoreOrThrow(Long storeId) {
        return storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }
    private StoreEmployee getEmployeeOrThrow(Long employeeId) {
        return storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));
    }
    private void validateOwner(Store store, Long userId) {
        if(!store.getOwner().getId().equals(userId))
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
    }
    private WorkSchedule getWorkScheduleOrThrow(Long scheduleId) {
        return workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCHEDULE_NOT_FOUND));
    }
}
