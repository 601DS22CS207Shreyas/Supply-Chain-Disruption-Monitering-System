package com.supplychain.client;

import com.supplychain.enums.EventSeverity;
import com.supplychain.enums.EventType;
import com.supplychain.model.DisruptionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NewsApiClient {

    @Value("${newsapi.base-url}")
    private String baseUrl;

    @Value("${newsapi.api-key}")
    private String apiKey;

    @Value("${newsapi.fetch-query}")
    private String fetchQuery;

    private final WebClient.Builder webClientBuilder;

    public List<DisruptionEvent> fetchDisruptionEvents() {
        try {
            WebClient client = webClientBuilder.baseUrl(baseUrl).build();

            Map<?, ?> response = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/everything")
                            .queryParam("q", fetchQuery)
                            .queryParam("language", "en")
                            .queryParam("sortBy", "publishedAt")
                            .queryParam("pageSize", "20")
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return parseNewsArticles(response);

        } catch (Exception e) {
            log.error("Failed to fetch news from NewsAPI: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<DisruptionEvent> parseNewsArticles(Map<?, ?> response) {
        List<DisruptionEvent> events = new ArrayList<>();
        if (response == null || response.get("articles") == null) return events;

        List<Map<String, Object>> articles = (List<Map<String, Object>>) response.get("articles");
        for (Map<String, Object> article : articles) {
            String title = (String) article.get("title");
            String description = (String) article.get("description");
            String url = (String) article.get("url");
            String publishedAt = (String) article.get("publishedAt");
            Map<String, Object> source = (Map<String, Object>) article.get("source");

            if (title == null || title.isBlank()) continue;

            DisruptionEvent event = DisruptionEvent.builder()
                    .title(title)
                    .description(description != null ? description : "")
                    .eventType(classifyEventType(title + " " + description))
                    .severity(classifySeverity(title + " " + description))
                    .location(extractLocation(title + " " + description))
                    .impactRadiusKm(200.0)  // default radius; refine with NLP later
                    .eventDate(publishedAt != null ? LocalDate.parse(publishedAt.substring(0, 10)) : LocalDate.now())
                    .sourceUrl(url)
                    .sourceName(source != null ? (String) source.get("name") : "Unknown")
                    .isActive(true)
                    .build();
            events.add(event);
        }
        return events;
    }

    // Simple keyword-based classification — upgrade with NLP/LLM later
    private EventType classifyEventType(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("strike") || lower.contains("union") || lower.contains("worker")) return EventType.LABOR_STRIKE;
        if (lower.contains("cyclone") || lower.contains("flood") || lower.contains("earthquake") || lower.contains("hurricane")) return EventType.NATURAL_DISASTER;
        if (lower.contains("accident") || lower.contains("collision") || lower.contains("crash")) return EventType.ACCIDENT;
        if (lower.contains("port") || lower.contains("congestion") || lower.contains("closure")) return EventType.INFRASTRUCTURE;
        if (lower.contains("storm") || lower.contains("fog") || lower.contains("weather")) return EventType.WEATHER;
        if (lower.contains("sanction") || lower.contains("border") || lower.contains("war")) return EventType.GEOPOLITICAL;
        return EventType.OTHER;
    }

    private EventSeverity classifySeverity(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("severe") || lower.contains("catastrophic") || lower.contains("critical")) return EventSeverity.CRITICAL;
        if (lower.contains("major") || lower.contains("significant") || lower.contains("large")) return EventSeverity.HIGH;
        if (lower.contains("moderate") || lower.contains("disruption")) return EventSeverity.MEDIUM;
        return EventSeverity.LOW;
    }

    private String extractLocation(String text) {
        // Placeholder — in a production system, use NER (spaCy or LLM) to extract location
        return "Location under analysis";
    }
}

