import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { OwnerLayout } from './OwnerLayout'
import { WelcomePage } from './WelcomePage'
import { CouponPage } from '@/pages/CouponPage'
import { LoginPage, MyProfilePage, SignupPage } from '@/pages/AuthPage'
import { CreatePage, RevisePage } from '@/pages/CreatePage'
import { FeedPage, ScrapPage, StoreShortformPage } from '@/pages/FeedPage'
import { MapPage, StoreProfilePage } from '@/pages/MapPage'
import {
  CouponCreatePage,
  OwnerCouponsPage,
  OwnerHomePage,
  OwnerProfilePage,
  OwnerQuestsPage,
  OwnerRedeemPage,
  OwnerVideosPage,
  ProPage,
  QuestStorePage,
} from '@/pages/OwnerPage'
import { PigeonAlbumPage, PigeonHistoryPage, QuestPage, QuestScanPage, QuestVisitPage } from '@/pages/QuestPage'

export const router = createBrowserRouter([
  // 처음 실행: 손님 / 사장님 선택
  { path: '/welcome', element: <WelcomePage /> },
  // + 버튼: 숏폼 만들기 (화면 전체를 쓰는 단계별 흐름이라 레이아웃 밖)
  { path: '/create', element: <CreatePage /> },
  // 로그인·회원가입 (Figma 4:189, 3:319~)
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  // 내 영상 → 올린 영상 재수정 (PRO). 숏폼 만들기처럼 화면 전체를 쓰는 흐름
  { path: '/owner/videos/:shortformId/edit', element: <RevisePage /> },
  {
    // 손님 모드
    element: <AppLayout />,
    children: [
      { path: '/', element: <FeedPage />, handle: { immersive: true, overlayNav: true } },
      // 지도를 크게: 상단 바 없이 버튼만 지도 위에 띄움
      { path: '/map', element: <MapPage />, handle: { immersive: true } },
      // 지도에서 진입하는 하위 화면: /map 하위라 지도 탭이 활성 상태로 유지됨
      { path: '/map/stores/:storeId/shortform', element: <StoreShortformPage />, handle: { immersive: true, overlayNav: true } },
      { path: '/map/stores/:storeId', element: <StoreProfilePage />, handle: { title: '가게 프로필' } },
      // 상단 바 없이 ≡ · + 버튼만 띄우고 그 사이에 동네 이름
      { path: '/quest', element: <QuestPage />, handle: { immersive: true } },
      // 퀘스트 하위 화면: /quest 하위라 퀘스트 탭이 활성 상태로 유지됨
      { path: '/quest/history', element: <PigeonHistoryPage />, handle: { title: '성장 기록' } },
      { path: '/quest/album', element: <PigeonAlbumPage />, handle: { title: '비둘기 앨범' } },
      { path: '/quest/scan', element: <QuestScanPage />, handle: { title: '방문 인증' } },
      { path: '/quest/:questId/visit', element: <QuestVisitPage />, handle: { title: '방문 인증' } },
      { path: '/coupons', element: <CouponPage />, handle: { title: '내 쿠폰함' } },
      { path: '/scraps', element: <ScrapPage />, handle: { title: '스크랩' } },
      { path: '/profile', element: <MyProfilePage />, handle: { title: '프로필' } },
      // 예전 주소 호환
      { path: '/challenge', element: <Navigate to="/quest" replace /> },
      { path: '/quest/reward', element: <Navigate to="/quest" replace /> },
    ],
  },
  {
    // 사장님 모드
    path: '/owner',
    element: <OwnerLayout />,
    children: [
      // 우상단 + 는 할 일이 있는 탭에만: 쿠폰 = 쿠폰 발행. 피드 만들기는 제작 탭으로
      { index: true, element: <OwnerHomePage />, handle: { title: '우리 가게', action: null } },
      { path: 'quests', element: <OwnerQuestsPage />, handle: { title: '퀘스트 등록', action: null } },
      // 쿠폰 관리 / 정산 (?view=settlement)
      { path: 'coupons', element: <OwnerCouponsPage />, handle: { title: '쿠폰', action: { label: '쿠폰 발행', to: '/owner/coupons/new' } } },
      { path: 'coupons/new', element: <CouponCreatePage />, handle: { title: '쿠폰 발행' } },
      { path: 'redeem', element: <OwnerRedeemPage />, handle: { title: '쿠폰 사용 처리', action: null } },
      { path: 'create', element: <OwnerVideosPage />, handle: { title: '피드 제작', action: null } },
      { path: 'quest-store', element: <QuestStorePage />, handle: { title: '퀘스트 가게' } },
      { path: 'pro', element: <ProPage />, handle: { title: '잇다 PRO' } },
      // 예전 주소 호환 (정산은 쿠폰 탭 안으로, 내 영상은 제작 탭으로)
      { path: 'settlement', element: <Navigate to="/owner/coupons?view=settlement" replace /> },
      { path: 'videos', element: <Navigate to="/owner/create" replace /> },
      { path: 'profile', element: <OwnerProfilePage />, handle: { title: '프로필' } },
    ],
  },
])
