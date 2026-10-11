import pigeonStar from '@/assets/event/pigeon-star.png'
import pigeonPhoto from '@/assets/generation/pigeon-uploaded.png'
import pigeonCouponNew from '@/assets/owner/pigeon-coupon-new.png'
import pigeonTicket from '@/assets/owner/pigeon-coupon.png'
import pigeonPro from '@/assets/owner/pigeon-pro.png'
import pigeonQr from '@/assets/owner/pigeon-qr.png'
import pigeonEdit from '@/assets/owner/pigeon-video-edit.png'
import pigeonMap from '@/assets/quest/pigeon-gps.png'
import pigeonLv1 from '@/assets/quest/pigeon-lv-01.png'
import pigeonCouponBox from '@/assets/user/pigeon-coupon-box.png'
import pigeonQuest from '@/assets/user/pigeon-quest.png'

/** 이벤트 목록 (상세 화면은 id 별 컴포넌트) */
export const EVENTS = [
  {
    id: 'early-owner',
    title: '초기 사장님 10명 이벤트',
    summary: '비둘기 보상 쿠폰을 처음 발행하면 PRO + 퀘스트 가게 1개월 무료',
    image: pigeonStar,
  },
] as const

export type EventId = (typeof EVENTS)[number]['id']

export interface NoticeLine {
  /** 기능에 맞는 비둘기 일러스트 */
  image: string
  title: string
  desc: string
}

export interface NoticeSection {
  heading: string
  lines: NoticeLine[]
}

export interface Notice {
  id: string
  title: string
  /** YYYY-MM-DD */
  date: string
  image: string
  pinned?: boolean
  intro: string
  sections: NoticeSection[]
  outro?: string
}

export const NOTICES: Notice[] = [
  {
    id: 'launch',
    title: '잇다가 새로 출시됐어요!',
    date: '2026-10-12',
    image: pigeonLv1,
    pinned: true,
    intro:
      '우리 동네 가게와 이웃을 잇는 동네 상권 앱, 잇다가 문을 열었어요. 지금은 월계1동에서 먼저 시작해요. 잇다에서 할 수 있는 일을 소개할게요.',
    sections: [
      {
        heading: '손님이라면',
        lines: [
          { image: pigeonPhoto, title: '피드', desc: '동네 가게 사장님이 올린 홍보 게시물을 위로 넘기며 구경하고, 마음에 들면 스크랩해요' },
          { image: pigeonMap, title: '지도', desc: '내 주변 가게를 핀으로 확인하고, 업종별로 골라 보거나 이름으로 검색해요' },
          { image: pigeonQuest, title: '퀘스트 · 비둘기', desc: '퀘스트를 하고 먹이를 모아 비둘기를 Lv.10까지 키워요. 레벨업할 때마다 먹이나 쿠폰을 뽑아요' },
          { image: pigeonCouponBox, title: '쿠폰', desc: '가게 쿠폰을 받아 두고, 결제할 때 사용 코드를 보여 주면 할인돼요' },
        ],
      },
      {
        heading: '사장님이라면',
        lines: [
          { image: pigeonEdit, title: 'AI 홍보 게시물', desc: '가게 사진과 자랑할 점만 넣으면 AI가 피드에 올릴 게시물을 만들어 줘요' },
          { image: pigeonCouponNew, title: '쿠폰 발행 · 사용 처리 · 정산', desc: '우리 가게 쿠폰을 만들고, 손님이 보여 준 코드로 사용 처리해요' },
          { image: pigeonQr, title: '퀘스트 가게', desc: '방문 인증 퀘스트로 동네 손님이 직접 찾아오게 해요' },
          { image: pigeonPro, title: '잇다 PRO', desc: '피드 우선 노출, 게시물 재수정, 원본 다운로드' },
        ],
      },
      {
        heading: '함께 알아 두세요',
        lines: [
          { image: pigeonTicket, title: '레벨업 쿠폰 · 교환권', desc: '비둘기 레벨업 쿠폰은 사장님들이 내놓은 쿠폰 중에서 나가요. 아직 쿠폰이 없으면 교환권을 드리고, 3주 안에 쿠폰으로 바꿀 수 있어요' },
          { image: pigeonStar, title: '초기 사장님 10명 이벤트', desc: '지금 진행 중이에요. 이벤트 탭에서 확인해 보세요' },
        ],
      },
    ],
    outro: '써 보시다가 불편한 점이나 바라는 기능이 있으면 언제든 알려 주세요. 잇다가 동네를 더 가깝게 이어 볼게요!',
  },
]

export function noticeDateText(date: string) {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}
