package com.commicom.itda.infra.video;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

public interface VideoClipGenerator {
    /** imageUrls[i] + prompts[i] 쌍을 동시에 제출, 모두 완료될 때까지 대기 */
    List<File> generateParallel(List<String> imageUrls, List<String> prompts, Path workDir) throws Exception;
}
