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
