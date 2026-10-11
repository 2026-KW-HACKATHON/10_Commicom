/**
 * 사진을 정사각형으로 잘라 작게 줄인 data URL (프로필 사진 미리보기·목업 저장용).
 * 서버에는 원본 File을 보내고, 화면·목업에는 이걸 씀.
 */
export function squareThumbnail(file: File, size = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('사진을 읽지 못했어요'))
    }
    img.src = url
  })
}

/** 이보다 작은 JPEG·WebP 는 그대로 올림 */
const UPLOAD_KEEP_BYTES = 1024 * 1024

/**
 * 올리기 전에 사진을 줄인 File (긴 변 maxSide, JPEG).
 * 화면 요청은 Vercel 함수를 거치는데 본문이 4.5MB 를 넘으면 막혀서(413) 휴대폰 원본 사진은 그대로 못 올림.
 * 읽지 못하는 파일이면 원본 그대로
 */
export function shrinkForUpload(file: File, maxSide = 2000): Promise<File> {
  if (file.size <= UPLOAD_KEEP_BYTES && /image\/(jpeg|webp)/.test(file.type)) return Promise.resolve(file)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      // 투명한 PNG 가 JPEG 로 바뀌며 검게 되지 않게
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => resolve(blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}
