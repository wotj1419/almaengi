package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.document.entity.EmployeeDocument;
import com.almaengi.be.domain.document.repository.EmployeeDocumentRepository;
import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import com.almaengi.be.domain.payroll.repository.PayrollDetailRepository;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.config.PayslipProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.xhtmlrenderer.pdf.ITextFontResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 급여명세서 PDF 생성 서비스입니다.
 * Payroll + PayrollDetail 데이터를 기반으로 HTML 템플릿을 렌더링하고
 * PDF로 변환하여 파일시스템에 저장합니다.
 *
 * 내부에서만 호출되며, 사용자가 직접 호출하는 API는 없습니다.
 * - 스케줄러에서 매장 전체 일괄 생성
 * - 근무기록 변경 승인 시 개별 재생성 (미래 구현)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayslipService {

    private static final String DOC_TYPE_PAYSLIP = "PAYSLIP";
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월");

    private final PayrollRepository payrollRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final PayslipProperties payslipProperties;

    private TemplateEngine templateEngine;

    /**
     * Thymeleaf 템플릿 엔진을 수동으로 초기화합니다.
     * ContractPdfService와 동일한 방식으로 standalone Thymeleaf를 사용합니다.
     */
    @PostConstruct
    void initTemplateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        templateEngine = new TemplateEngine();
        templateEngine.setTemplateResolver(resolver);
    }

    /**
     * 매장 전체 직원의 급여명세서를 일괄 생성합니다.
     * 스케줄러에서 호출됩니다.
     *
     * @param storeId     매장 ID
     * @param targetMonth 정산 대상 월 (1일로 정규화된 값)
     */
    @Transactional
    public void generateStorePayslips(Long storeId, LocalDate targetMonth) {
        List<Payroll> payrolls = payrollRepository
                .findAllByStoreIdAndTargetMonthWithEmployeeAndStore(storeId, targetMonth);

        if (payrolls.isEmpty()) {
            log.info("[PayslipService] 급여명세서 생성 대상 없음 - storeId: {}, targetMonth: {}",
                    storeId, targetMonth);
            return;
        }

        int successCount = 0;
        for (Payroll payroll : payrolls) {
            try {
                generatePayslip(payroll);
                successCount++;
            } catch (Exception e) {
                log.error("[PayslipService] 급여명세서 생성 실패 - payrollId: {}, employeeId: {}",
                        payroll.getId(), payroll.getEmployee().getId(), e);
            }
        }

        log.info("[PayslipService] 급여명세서 생성 완료 - storeId: {}, targetMonth: {}, 성공: {}/{}",
                storeId, targetMonth, successCount, payrolls.size());
    }

    /**
     * 단일 직원의 급여명세서 PDF를 생성합니다.
     * Payroll + PayrollDetail → HTML 렌더링 → PDF 변환 → 파일 저장 → Document upsert
     *
     * @param payroll 급여 엔티티 (employee, store가 fetch join된 상태)
     */
    @Transactional
    public void generatePayslip(Payroll payroll) {
        // 1. 상세 항목 조회
        List<PayrollDetail> details = payrollDetailRepository
                .findAllByPayrollIdOrdered(payroll.getId());

        // 2. 템플릿 데이터 구성
        Context context = buildTemplateContext(payroll, details);

        // 3. HTML 렌더링
        String html = templateEngine.process("payslip", context);

        // 4. HTML → PDF 변환 + 파일 저장
        String filePath = savePdf(html, payroll);

        // 5. Document 레코드 upsert
        upsertDocument(payroll, filePath);

        log.info("[PayslipService] 급여명세서 생성 - payrollId: {}, path: {}",
                payroll.getId(), filePath);
    }

    /**
     * 급여명세서 PDF 파일의 경로를 구성합니다.
     * 경로: {basePath}/stores/{storeId}/payslip/{yyyy}/{MM}/{employeeId}/{이름}_{yyyy-MM}_급여명세서.pdf
     */
    public String buildFilePath(Payroll payroll) {
        Store store = payroll.getEmployee().getStore();
        User user = payroll.getEmployee().getUser();
        LocalDate month = payroll.getTargetMonth();
        String fileName = user.getName() + "_" + month.toString().substring(0, 7) + "_급여명세서.pdf";

        return Paths.get(
                payslipProperties.getStoragePath(),
                "stores", store.getId().toString(),
                "payslip",
                String.valueOf(month.getYear()),
                String.format("%02d", month.getMonthValue()),
                String.valueOf(payroll.getEmployee().getId()),
                fileName
        ).toString();
    }

    /**
     * 급여명세서 PDF 바이트를 조회합니다.
     * 권한 검증(매장 사장님 또는 해당 알바생 본인) 후 파일을 읽어 반환합니다.
     *
     * @param userId    인증된 사용자 ID
     * @param payrollId 급여 ID
     * @return PDF 바이트 배열
     */
    public byte[] getPayslipPdf(Long userId, Long payrollId) {
        Payroll payroll = payrollRepository.findByIdWithEmployeeAndStoreAndOwner(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));

        StoreEmployee employee = payroll.getEmployee();
        Store store = employee.getStore();

        boolean isOwner = store.getOwner().getId().equals(userId);
        boolean isSelf = employee.getUser().getId().equals(userId);
        if (!isOwner && !isSelf) {
            throw new BusinessException(ErrorCode.PAYROLL_ACCESS_DENIED);
        }

        String filePath = buildFilePath(payroll);
        Path path = Paths.get(filePath);

        if (!Files.exists(path)) {
            throw new BusinessException(ErrorCode.PAYSLIP_NOT_FOUND);
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.PAYSLIP_NOT_FOUND);
        }
    }

    /**
     * 급여명세서 PDF 파일명을 반환합니다.
     */
    public String getPayslipFileName(Long payrollId) {
        Payroll payroll = payrollRepository.findByIdWithEmployeeAndStoreAndOwner(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));
        return Paths.get(buildFilePath(payroll)).getFileName().toString();
    }

    // ─── Private Methods ───

    /**
     * Thymeleaf 템플릿에 전달할 컨텍스트를 구성합니다.
     * 지급/공제 항목을 2컬럼으로 나란히 표시하기 위해 detailRows로 매핑합니다.
     */
    private Context buildTemplateContext(Payroll payroll, List<PayrollDetail> details) {
        Store store = payroll.getEmployee().getStore();
        User user = payroll.getEmployee().getUser();

        // 지급 항목 (BASE + ALLOWANCE), 공제 항목 (DEDUCTION) 분리
        List<PayrollDetail> payItems = details.stream()
                .filter(d -> d.getDetailType() == PayrollDetailType.BASE
                        || d.getDetailType() == PayrollDetailType.ALLOWANCE)
                .filter(d -> d.getAmount() > 0)
                .toList();

        List<PayrollDetail> deductItems = details.stream()
                .filter(d -> d.getDetailType() == PayrollDetailType.DEDUCTION)
                .filter(d -> d.getAmount() > 0)
                .toList();

        // 지급/공제를 나란히 표시할 row 데이터 구성 (더 긴 쪽 기준)
        int maxRows = Math.max(payItems.size(), deductItems.size());
        List<DetailRow> detailRows = new ArrayList<>();
        for (int i = 0; i < maxRows; i++) {
            DetailRow row = new DetailRow();
            if (i < payItems.size()) {
                row.payItemName = payItems.get(i).getItemName();
                row.payAmount = payItems.get(i).getAmount();
            }
            if (i < deductItems.size()) {
                row.deductItemName = deductItems.get(i).getItemName();
                row.deductAmount = deductItems.get(i).getAmount();
            }
            detailRows.add(row);
        }

        // 계산 방법: calculationFormula가 있는 항목만 (지급 항목 기준)
        List<CalculationRow> calculations = payItems.stream()
                .filter(d -> d.getCalculationFormula() != null)
                .map(d -> new CalculationRow(d.getItemName(), d.getCalculationFormula(), d.getAmount()))
                .toList();

        // 총 지급액 = 기본급 + 총 수당
        long totalPay = payroll.getBasicPay() + payroll.getTotalAllowance();

        Context context = new Context();
        context.setVariable("employeeName", user.getName());
        context.setVariable("storeName", store.getName());
        context.setVariable("targetMonth", payroll.getTargetMonth().format(DISPLAY_FORMATTER));
        context.setVariable("detailRows", detailRows);
        context.setVariable("totalPay", totalPay);
        context.setVariable("totalDeduction", payroll.getTotalDeduction());
        context.setVariable("netPay", payroll.getNetPay());
        context.setVariable("calculations", calculations);

        return context;
    }

    /**
     * HTML을 PDF로 변환하고 파일시스템에 저장합니다.
     * flying-saucer(ITextRenderer)를 사용하여 한글 폰트(NanumGothic)를 포함합니다.
     */
    private String savePdf(String html, Payroll payroll) {
        String filePath = buildFilePath(payroll);
        Path path = Paths.get(filePath);

        try {
            Files.createDirectories(path.getParent());

            ITextRenderer renderer = new ITextRenderer();

            // 한글 폰트 등록
            String fontPath = getClass().getClassLoader()
                    .getResource("fonts/NanumGothic.ttf").toExternalForm();
            ITextFontResolver fontResolver = renderer.getFontResolver();
            fontResolver.addFont(fontPath,
                    com.lowagie.text.pdf.BaseFont.IDENTITY_H,
                    com.lowagie.text.pdf.BaseFont.EMBEDDED);

            // base URL 설정 (상대 경로 해석용)
            String baseUrl = getClass().getClassLoader().getResource("").toExternalForm();
            renderer.setDocumentFromString(html, baseUrl);
            renderer.layout();

            try (OutputStream os = new FileOutputStream(path.toFile())) {
                renderer.createPDF(os);
            }

            return filePath;
        } catch (Exception e) {
            log.error("[PayslipService] PDF 생성/저장 실패 - path: {}", filePath, e);
            throw new BusinessException(ErrorCode.PAYSLIP_GENERATION_FAILED);
        }
    }

    /**
     * EmployeeDocument 레코드를 생성하거나 기존 레코드를 갱신합니다.
     * uploaded_at은 실제 업로드 시점(now())으로 설정됩니다.
     * 2월 급여명세서 → 3월 1일에 생성 → uploaded_at은 3월에 위치합니다.
     * 같은 직원의 같은 월 급여명세서가 이미 있으면 PDF만 덮어쓰기되므로 레코드는 유지합니다.
     */
    private void upsertDocument(Payroll payroll, String filePath) {
        StoreEmployee employee = payroll.getEmployee();
        Store store = employee.getStore();
        LocalDate targetMonth = payroll.getTargetMonth();

        // uploaded_at 범위: 정산 대상 월의 다음 달 (2월 급여 → 3월에 업로드됨)
        YearMonth uploadMonth = YearMonth.from(targetMonth).plusMonths(1);
        OffsetDateTime start = uploadMonth.atDay(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = uploadMonth.atEndOfMonth().atTime(23, 59, 59).atOffset(ZoneOffset.UTC);

        // 기존 문서가 없을 때만 신규 생성 (재생성 시 PDF 파일만 덮어쓰기됨)
        boolean exists = employeeDocumentRepository
                .findByEmployeeIdAndDocTypeAndUploadedAtBetween(
                        employee.getId(), DOC_TYPE_PAYSLIP, start, end)
                .isPresent();

        if (!exists) {
            employeeDocumentRepository.save(EmployeeDocument.builder()
                    .employee(employee)
                    .docType(DocType.PAYSLIP)
                    .fileUrl(filePath)
                    .build());
        }
    }

    // ─── Inner DTOs (템플릿 데이터용) ───

    /**
     * 지급/공제 항목을 2컬럼으로 나란히 표시하기 위한 row 데이터입니다.
     */
    public static class DetailRow {
        public String payItemName;
        public Long payAmount;
        public String deductItemName;
        public Long deductAmount;
    }

    /**
     * 계산 방법 테이블의 row 데이터입니다.
     */
    public static class CalculationRow {
        public String itemName;
        public String formula;
        public Long amount;

        public CalculationRow(String itemName, String formula, Long amount) {
            this.itemName = itemName;
            this.formula = formula;
            this.amount = amount;
        }
    }
}
