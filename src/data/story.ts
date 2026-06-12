// ============================================================
// 올케어치과 — 페이블 스토리 레이어 (환자 = 주인공)
// 증상(불편) → 공감 카피 → 맞춤 챕터(진료/의료진/케이스/FAQ) 분기
// §B 의료광고법: 효과 보장·과장 없음, 안내·공감 톤만 사용
// ============================================================

export type StoryBranch = {
  id: string
  chip: string            // 선택 칩 라벨 (환자 1인칭)
  icon: string
  empathy: string         // 공감 한 줄 (불편을 읽어주는 문장)
  guide: string           // 안내 문장 (과장 없는 다음 걸음)
  treatment: string       // 연결 진료 slug
  treatmentName: string
  doctor: string          // 담당 의료진 slug
  doctorName: string
  faq: { q: string; a: string }
}

export const STORY_BRANCHES: StoryBranch[] = [
  {
    id: 'pain',
    chip: '이가 시리고 아파요',
    icon: 'bolt',
    empathy: '차가운 물 한 모금에 멈칫하는 순간이 잦아졌다면, 치아가 보내는 신호일 수 있습니다.',
    guide: '충치의 깊이를 정확히 진단해 필요한 만큼만 치료하는 것이 자연치아를 오래 쓰는 길입니다.',
    treatment: 'conservative',
    treatmentName: '충치·신경치료',
    doctor: 'doctor-integrated',
    doctorName: '통합치의학과 전문의',
    faq: { q: '충치는 작아도 꼭 치료해야 하나요?', a: '작은 충치일 때 치료하는 것이 가장 유리합니다. 방치하면 신경까지 진행돼 치료 범위가 크게 늘어납니다.' },
  },
  {
    id: 'missing',
    chip: '이가 빠졌거나 흔들려요',
    icon: 'tooth',
    empathy: '빈자리를 혀끝으로 자꾸 확인하게 되는 마음, 미루고 싶지만 신경 쓰이는 그 자리를 압니다.',
    guide: '구강악안면외과 전문의가 뼈·신경 상태를 입체적으로 진단한 뒤, 무리 없는 계획부터 세웁니다.',
    treatment: 'implant',
    treatmentName: '임플란트',
    doctor: 'kwon-minsu',
    doctorName: '권민수 대표원장',
    faq: { q: '뼈가 없다고 다른 곳에서 거절당했어요.', a: '뼈가 부족한 경우에도 골이식이나 상악동 거상 등으로 식립을 검토할 수 있습니다. 영상 진단으로 가능 여부를 함께 살펴봅니다.' },
  },
  {
    id: 'crooked',
    chip: '치아가 가지런하지 않아요',
    icon: 'teeth',
    empathy: '사진 찍을 때 입을 다물게 되는 습관, 웃음을 아끼게 만드는 이유가 되곤 합니다.',
    guide: '골격·배열·습관 중 원인이 무엇인지부터 진단하고, 일상에 맞는 장치를 함께 고릅니다.',
    treatment: 'ortho',
    treatmentName: '치아교정',
    doctor: 'kwon-minsu',
    doctorName: '권민수 대표원장',
    faq: { q: '성인인데 교정이 너무 늦진 않았나요?', a: '교정에 나이 제한은 없습니다. 잇몸이 건강하다면 성인도 충분히 가능하며, 잇몸 상태를 함께 관리하며 진행합니다.' },
  },
  {
    id: 'front',
    chip: '앞니 모양·색이 신경 쓰여요',
    icon: 'wand-magic-sparkles',
    empathy: '거울 앞에서 유독 오래 머무는 시선. 보이는 부위일수록 자연스러움이 더 중요해집니다.',
    guide: '보철과 전문의와 원내 기공실이 색·형태·잇몸선을 함께 설계해, 티 나지 않는 어울림을 추구합니다.',
    treatment: 'esthetic',
    treatmentName: '심미보철',
    doctor: 'doctor-prostho',
    doctorName: '보철과 전문의',
    faq: { q: '보철이 너무 하얘서 부자연스러울까 걱정돼요.', a: '주변 치아와 어울리는 색을 선택하는 것이 원칙입니다. 본래 얼굴에 자연스럽게 녹아드는 색을 함께 정합니다.' },
  },
  {
    id: 'jaw',
    chip: '턱에서 소리가 나요',
    icon: 'face-grimace',
    empathy: '하품할 때 "딱" 하는 소리, 아침마다 뻐근한 턱. 무심코 지나치기 쉬운 불편입니다.',
    guide: '원인(습관·자세·스트레스)을 먼저 찾고, 생활 교정부터 장치 치료까지 단계적으로 접근합니다.',
    treatment: 'tmj',
    treatmentName: '턱관절 치료',
    doctor: 'kwon-minsu',
    doctorName: '권민수 대표원장',
    faq: { q: '턱에서 소리가 나는데 꼭 치료해야 하나요?', a: '통증이나 개구장애가 없다면 경과를 지켜볼 수 있습니다. 통증이 함께 있다면 진단을 받아보시는 것이 좋습니다.' },
  },
  {
    id: 'wisdom',
    chip: '사랑니가 걱정돼요',
    icon: 'user-doctor',
    empathy: '"언젠가 빼야 한다"는 말만 들은 채 미뤄둔 숙제. 막연한 두려움이 더 큰 법입니다.',
    guide: '매복 정도와 신경과의 거리를 영상으로 먼저 확인합니다. 외과 전문의가 안전을 우선해 진행합니다.',
    treatment: 'surgery',
    treatmentName: '구강외과·사랑니',
    doctor: 'kwon-minsu',
    doctorName: '권민수 대표원장',
    faq: { q: '사랑니는 꼭 빼야 하나요?', a: '바르게 나서 기능하고 관리가 잘 되면 둘 수 있으나, 충치·염증·매복이 있으면 발치를 권합니다.' },
  },
  {
    id: 'gum',
    chip: '잇몸에서 피가 나요',
    icon: 'shield-heart',
    empathy: '양치할 때 비치는 붉은 기. 아프지 않다고 괜찮은 것은 아닐 수 있습니다.',
    guide: '잇몸 질환은 소리 없이 진행됩니다. 정기 점검과 단계에 맞는 치료로 토대를 지킵니다.',
    treatment: 'gum',
    treatmentName: '잇몸치료',
    doctor: 'doctor-integrated',
    doctorName: '통합치의학과 전문의',
    faq: { q: '잇몸에서 피가 나는데 괜찮나요?', a: '칫솔질 시 출혈은 잇몸 염증의 신호일 수 있어 점검을 받는 것이 좋습니다.' },
  },
  {
    id: 'fear',
    chip: '치과가 무서워요',
    icon: 'bed',
    empathy: '치과 문 앞에서 돌아선 적이 있다면 — 그 두려움도 저희가 진료해야 할 대상입니다.',
    guide: '수면진료 세팅을 갖추고, 컨디션을 먼저 확인한 뒤 통증을 최소화하는 방향으로 설계합니다. (적용 여부는 상담으로 결정)',
    treatment: 'sleep',
    treatmentName: '수면진료',
    doctor: 'kwon-minsu',
    doctorName: '권민수 대표원장',
    faq: { q: '수면진료는 누구나 받을 수 있나요?', a: '대부분 가능하지만 전신 상태에 따라 제한될 수 있어, 상담을 통해 적용 가능 여부를 반드시 판단합니다.' },
  },
]

// 메인 챕터 레일 (스크롤스파이 내비게이션)
export const HOME_CHAPTERS = [
  { id: 'prologue', no: 'P', label: 'Prologue' },
  { id: 'your-story', no: '00', label: '당신의 이야기' },
  { id: 'ch-empathy', no: '01', label: '공감' },
  { id: 'ch-meeting', no: '02', label: '만남' },
  { id: 'ch-people', no: '03', label: '사람들' },
  { id: 'ch-recovery', no: '04', label: '회복' },
  { id: 'ch-daily', no: '05', label: '일상' },
  { id: 'epilogue', no: 'E', label: 'Epilogue' },
]
