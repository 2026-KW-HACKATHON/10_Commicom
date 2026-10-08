import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { OwnerLayout } from './OwnerLayout'
import { WelcomePage } from './WelcomePage'
import { CouponPage } from '@/pages/CouponPage'
import { MapPage } from '@/pages/MapPage'
import {
  CouponCreatePage,
  OwnerCouponsPage,
  OwnerHomePage,
  OwnerQuestsPage,
  OwnerRedeemPage,
  OwnerSettlementPage,
  ProPage,
  QuestStorePage,
} from '@/pages/OwnerPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PigeonHistoryPage, QuestPage, QuestScanPage, QuestVisitPage } from '@/pages/QuestPage'

export const router = createBrowserRouter([
  // 처음 실행: 손님 / 사장님 선택
  { path: '/welcome', element: <WelcomePage /> },
  {
    // 손님 모드
    element: <AppLayout />,
    children: [
      { path: '/', element: <PlaceholderPage title="숏폼" /> },
      { path: '/map', element: <MapPage />, handle: { title: '잇다 맵' } },
      // 지도에서 진입하는 하위 화면: /map 하위라 지도 탭이 활성 상태로 유지됨
      { path: '/map/stores/:storeId/shortform', element: <PlaceholderPage title="가게 홍보 영상" /> },
      { path: '/map/stores/:storeId', element: <PlaceholderPage title="가게 프로필" /> },
      { path: '/quest', element: <QuestPage />, handle: { title: '동네 퀘스트' } },
      // 퀘스트 하위 화면: /quest 하위라 퀘스트 탭이 활성 상태로 유지됨
      { path: '/quest/history', element: <PigeonHistoryPage />, handle: { title: '성장 기록' } },
      { path: '/quest/scan', element: <QuestScanPage />, handle: { title: '방문 인증' } },
      { path: '/quest/:questId/visit', element: <QuestVisitPage />, handle: { title: '방문 인증' } },
      { path: '/coupons', element: <CouponPage />, handle: { title: '내 쿠폰함' } },
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
      { index: true, element: <OwnerHomePage />, handle: { title: '우리 가게' } },
      { path: 'quests', element: <OwnerQuestsPage />, handle: { title: '퀘스트 등록' } },
      { path: 'coupons', element: <OwnerCouponsPage />, handle: { title: '쿠폰 관리' } },
      { path: 'coupons/new', element: <CouponCreatePage />, handle: { title: '쿠폰 발행' } },
      { path: 'redeem', element: <OwnerRedeemPage />, handle: { title: '쿠폰 사용 처리' } },
      { path: 'settlement', element: <OwnerSettlementPage />, handle: { title: '쿠폰 정산' } },
      { path: 'quest-store', element: <QuestStorePage />, handle: { title: '퀘스트 가게' } },
      { path: 'pro', element: <ProPage />, handle: { title: '잇다 PRO' } },
    ],
  },
])
