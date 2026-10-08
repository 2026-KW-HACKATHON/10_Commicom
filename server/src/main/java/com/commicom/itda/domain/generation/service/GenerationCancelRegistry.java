package com.commicom.itda.domain.generation.service;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 사장님이 취소한 생성 요청 id.
 * 파이프라인이 이미지를 만드는 동안 그 생성 행을 붙잡고 있어 DB 상태를 바로 바꾸지 않고 여기에 표시만 해 둠 →
 * 파이프라인이 시작·이미지 생성 직후에 확인해 결과를 저장하지 않고 FAILED(취소)로 끝냄. 서버를 다시 켜면 비워짐
 */
@Component
public class GenerationCancelRegistry {

    private final Set<Long> canceled = ConcurrentHashMap.newKeySet();

    public void cancel(Long generationId) {
        canceled.add(generationId);
    }

    public boolean isCanceled(Long generationId) {
        return canceled.contains(generationId);
    }

    public void clear(Long generationId) {
        canceled.remove(generationId);
    }
}
