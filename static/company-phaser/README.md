# Company Office - Phaser 3 Edition

고급 픽셀아트 16bit 스타일의 아이소메트릭 오피스 시뮬레이션

## 기술 스택
- **Phaser 3**: 2D 게임 엔진
- **아이소메트릭 시스템**: 커스텀 2:1 아이소메트릭 좌표계
- **픽셀아트 스프라이트**: 16bit 레트로 스타일

## 구조
```
company-phaser/
├── index.html          # 독립 테스트 페이지
├── main.js             # Phaser 게임 초기화
├── config/
│   └── GameConfig.js   # 게임 설정
├── scenes/
│   └── OfficeScene.js  # 메인 오피스 씬
├── entities/
│   ├── Floor.js        # 바닥 타일
│   ├── Wall.js         # 벽면
│   ├── Table.js        # 회의 테이블
│   └── Chair.js        # 의자
├── sprites/
│   └── office-tileset.png  # 스프라이트시트
├── utils/
│   ├── IsometricUtils.js   # 좌표 변환
│   └── DepthSorter.js      # 깊이 정렬
└── assets/
    └── sprites/        # 이미지 에셋
```

## 좌표계
- 2:1 아이소메트릭 (타일 64x32px)
- X축(gx++): 우하단 (↘)
- Y축(gy++): 좌하단 (↙)
