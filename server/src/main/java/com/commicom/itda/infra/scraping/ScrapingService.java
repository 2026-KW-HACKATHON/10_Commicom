package com.commicom.itda.infra.scraping;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 네이버 플레이스에서 가게 메뉴·리뷰 정보를 스크래핑한다.
 * Playwright가 없거나 스크래핑 실패 시 빈 문자열을 반환하고 생성 파이프라인은 계속 진행된다.
 */
@Slf4j
@Service
public class ScrapingService {

    /**
     * 가게명과 주소로 네이버 플레이스를 검색해 메뉴 정보를 가져온다.
     *
     * @return 추출한 메뉴 텍스트, 실패 시 빈 문자열
     */
    public String scrapeMenuInfo(String storeName, String address) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions().setHeadless(true));

            String query = URLEncoder.encode(storeName + " " + simplifyAddress(address),
                    StandardCharsets.UTF_8);
            String searchUrl = "https://search.naver.com/search.naver?query=" + query;

            Page page = browser.newPage();
            page.navigate(searchUrl);
            page.waitForTimeout(2000);

            // 플레이스 카드의 메뉴 정보 추출
            String menuText = extractMenuFromPage(page, storeName);
            log.info("스크래핑 완료 - {}: {}자", storeName, menuText.length());
            return menuText;

        } catch (Exception e) {
            log.warn("스크래핑 실패 (무시하고 계속): {} - {}", storeName, e.getMessage());
            return "";
        }
    }

    private String extractMenuFromPage(Page page, String storeName) {
        StringBuilder result = new StringBuilder();
        try {
            // 네이버 플레이스 메뉴 셀렉터 (변경될 수 있음)
            var menuItems = page.querySelectorAll(".place_section_content .txt");
            for (var item : menuItems) {
                String text = item.innerText().trim();
                if (!text.isBlank()) {
                    result.append(text).append(", ");
                    if (result.length() > 300) break;
                }
            }
        } catch (Exception e) {
            log.debug("메뉴 파싱 오류: {}", e.getMessage());
        }
        return result.toString().trim();
    }

    private String simplifyAddress(String address) {
        if (address == null) return "";
        // "서울 노원구 월계동 ..." → "서울 노원구 월계동"
        String[] parts = address.split(" ");
        return parts.length >= 3 ? parts[0] + " " + parts[1] + " " + parts[2] : address;
    }
}
