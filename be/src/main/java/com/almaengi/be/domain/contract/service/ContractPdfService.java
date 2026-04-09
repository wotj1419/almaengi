package com.almaengi.be.domain.contract.service;

import com.almaengi.be.domain.contract.entity.Contract;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.config.ContractProperties;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.xhtmlrenderer.pdf.ITextFontResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractPdfService {

    private final ContractProperties contractProperties;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH시 mm분");

    private TemplateEngine templateEngine;

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
     * 근로계약서 PDF를 생성하고 파일 경로를 반환한다.
     */
    public String generatePdf(Contract contract) {
        try {
            String html = renderHtml(contract);
            String filePath = savePdf(html, contract);
            log.info("계약서 PDF 생성 완료: {}", filePath);
            return filePath;
        } catch (Exception e) {
            log.error("계약서 PDF 생성 실패: contractId={}", contract.getId(), e);
            throw new BusinessException(ErrorCode.CONTRACT_PDF_GENERATION_FAILED);
        }
    }

    /**
     * Thymeleaf 템플릿을 렌더링하여 HTML 문자열을 반환한다.
     */
    private String renderHtml(Contract contract) {
        Context context = buildContext(contract);
        return templateEngine.process("contract-template", context);
    }

    /**
     * Thymeleaf 컨텍스트에 계약서 데이터를 바인딩한다.
     */
    private Context buildContext(Contract contract) {
        StoreEmployee se = contract.getStoreEmployee();
        Store store = se.getStore();
        User owner = store.getOwner();
        User employee = se.getUser();

        Context context = new Context();

        // 사업주 정보
        context.setVariable("employerName", owner.getName());
        context.setVariable("storeName", store.getName());
        context.setVariable("storeAddress", store.getAddress());
        context.setVariable("storePhone", store.getPhone() != null ? store.getPhone() : (owner.getPhone() != null ? owner.getPhone() : ""));

        // 근로자 정보
        context.setVariable("employeeName", employee.getName());
        context.setVariable("employeePhone", employee.getPhone() != null ? employee.getPhone() : "");
        context.setVariable("employeeAddress", contract.getEmployeeAddress());

        // 계약 내용
        context.setVariable("contractStartDate", contract.getContractStartDate().format(DATE_FORMATTER));
        context.setVariable("contractEndDate",
                contract.getContractEndDate() != null ? contract.getContractEndDate().format(DATE_FORMATTER) : null);
        context.setVariable("workplace", contract.getWorkplace());
        context.setVariable("jobDescription", contract.getJobDescription());
        context.setVariable("workStartTime", contract.getWorkStartTime().format(TIME_FORMATTER));
        context.setVariable("workEndTime", contract.getWorkEndTime().format(TIME_FORMATTER));
        context.setVariable("hasBreakTime", contract.getBreakStartTime() != null);

        context.setVariable("breakStartTime",
                contract.getBreakStartTime() != null ? contract.getBreakStartTime().format(TIME_FORMATTER) : null);
        context.setVariable("breakEndTime",
                contract.getBreakEndTime() != null ? contract.getBreakEndTime().format(TIME_FORMATTER) : null);
        context.setVariable("workDaysPerWeek", contract.getWorkDaysPerWeek());
        context.setVariable("weeklyHoliday", contract.getWeeklyHoliday());

        // 임금
        context.setVariable("wageTypeDescription", contract.getWageType().getDescription());
        context.setVariable("wageAmount", contract.getWageAmount());
        context.setVariable("hasBonus", contract.getHasBonus());
        context.setVariable("bonusAmount", contract.getBonusAmount() != null ? contract.getBonusAmount() : 0L);
        context.setVariable("hasOtherAllowance", contract.getHasOtherAllowance());
        context.setVariable("otherAllowanceDetails", contract.getOtherAllowanceDetails());
        context.setVariable("payDayDescription", contract.getPayDayDescription());
        context.setVariable("paymentMethod", contract.getPaymentMethod().name());

        // 사회보험
        context.setVariable("employmentInsurance", contract.getEmploymentInsurance());
        context.setVariable("industrialAccidentInsurance", contract.getIndustrialAccidentInsurance());
        context.setVariable("nationalPension", contract.getNationalPension());
        context.setVariable("healthInsurance", contract.getHealthInsurance());

        // 계약일자
        context.setVariable("contractDateFormatted", contract.getContractDate().format(DATE_FORMATTER));

        // 서명 (Base64 data URI)
        context.setVariable("ownerSignature", contract.getOwnerSignature());
        context.setVariable("employeeSignature", contract.getEmployeeSignature());

        // contracts 테이블 컬럼 전체 반영용 숨김 메타데이터 변수
        context.setVariable("contractId", contract.getId());
        context.setVariable("employeeId", se.getId());
        context.setVariable("contractStartDateRaw", contract.getContractStartDate());
        context.setVariable("contractEndDateRaw", contract.getContractEndDate());
        context.setVariable("workplaceRaw", contract.getWorkplace());
        context.setVariable("jobDescriptionRaw", contract.getJobDescription());
        context.setVariable("workStartTimeRaw", contract.getWorkStartTime());
        context.setVariable("workEndTimeRaw", contract.getWorkEndTime());
        context.setVariable("breakStartTimeRaw", contract.getBreakStartTime());
        context.setVariable("breakEndTimeRaw", contract.getBreakEndTime());
        context.setVariable("workDaysPerWeekRaw", contract.getWorkDaysPerWeek());
        context.setVariable("weeklyHolidayRaw", contract.getWeeklyHoliday());
        context.setVariable("wageTypeRaw", contract.getWageType() != null ? contract.getWageType().name() : null);
        context.setVariable("wageAmountRaw", contract.getWageAmount());
        context.setVariable("hasBonusRaw", contract.getHasBonus());
        context.setVariable("bonusAmountRaw", contract.getBonusAmount());
        context.setVariable("hasOtherAllowanceRaw", contract.getHasOtherAllowance());
        context.setVariable("otherAllowanceDetailsRaw", contract.getOtherAllowanceDetails());
        context.setVariable("payDayDescriptionRaw", contract.getPayDayDescription());
        context.setVariable("paymentMethodRaw", contract.getPaymentMethod() != null ? contract.getPaymentMethod().name() : null);
        context.setVariable("employmentInsuranceRaw", contract.getEmploymentInsurance());
        context.setVariable("industrialAccidentInsuranceRaw", contract.getIndustrialAccidentInsurance());
        context.setVariable("nationalPensionRaw", contract.getNationalPension());
        context.setVariable("healthInsuranceRaw", contract.getHealthInsurance());
        context.setVariable("contractDateRaw", contract.getContractDate());
        context.setVariable("employeeAddressRaw", contract.getEmployeeAddress());
        context.setVariable("statusRaw", contract.getStatus() != null ? contract.getStatus().name() : null);
        context.setVariable("ownerSignatureRaw", contract.getOwnerSignature());
        context.setVariable("ownerSignedAtRaw", contract.getOwnerSignedAt());
        context.setVariable("employeeSignatureRaw", contract.getEmployeeSignature());
        context.setVariable("employeeSignedAtRaw", contract.getEmployeeSignedAt());
        context.setVariable("pdfFilePathRaw", contract.getPdfFilePath());
        context.setVariable("versionRaw", contract.getVersion());
        context.setVariable("createdAtRaw", contract.getCreatedAt());
        context.setVariable("updatedAtRaw", contract.getUpdatedAt());

        return context;
    }

    /**
     * HTML을 PDF로 변환하고 파일시스템에 저장한다.
     */
    private String savePdf(String html, Contract contract) throws Exception {
        Long storeId = contract.getStoreEmployee().getStore().getId();
        Path directory = Paths.get(contractProperties.getStoragePath(), "stores", String.valueOf(storeId), "contract");
        Files.createDirectories(directory);

        String fileName = contract.getId() + ".pdf";
        Path filePath = directory.resolve(fileName);

        ITextRenderer renderer = new ITextRenderer();

        // 한글 폰트 등록
        String fontPath = getClass().getClassLoader().getResource("fonts/NanumGothic.ttf").toExternalForm();
        ITextFontResolver fontResolver = renderer.getFontResolver();
        fontResolver.addFont(fontPath, com.lowagie.text.pdf.BaseFont.IDENTITY_H, com.lowagie.text.pdf.BaseFont.EMBEDDED);

        // base URL 설정 (폰트, 이미지 등 상대 경로 해석용)
        String baseUrl = getClass().getClassLoader().getResource("").toExternalForm();
        renderer.setDocumentFromString(html, baseUrl);
        renderer.layout();

        try (OutputStream os = new FileOutputStream(filePath.toFile())) {
            renderer.createPDF(os);
        }

        return filePath.toString();
    }
}
