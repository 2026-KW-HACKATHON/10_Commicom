package com.commicom.itda.infra.storage;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 업로드 서비스.
 * TODO: S3 업로드 구현 필요 (현재 로컬 스텁)
 */
@Service
public class StorageService {

    /**
     * 파일을 업로드하고 접근 가능한 URL을 반환한다.
     *
     * @param file   업로드할 파일
     * @param folder S3 버킷 내 폴더명 (예: "profiles", "thumbnails")
     * @return 업로드된 파일의 URL
     */
    public String upload(MultipartFile file, String folder) {
        // TODO: S3 업로드 구현
        // String key = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        // s3Client.putObject(bucket, key, file.getInputStream(), ...);
        // return cloudFrontDomain + "/" + key;
        throw new UnsupportedOperationException("파일 업로드는 아직 구현되지 않았어요");
    }
}
