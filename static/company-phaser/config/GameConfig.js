/**
 * Game Configuration
 * 게임 전역 설정 및 상수 정의
 */

export const TILE_CONFIG = {
    // 아이소메트릭 타일 크기 (2:1 비율)
    WIDTH: 64,
    HEIGHT: 32,
    
    // 스프라이트시트 타일 크기 (원본)
    SPRITE_SIZE: 32,
    
    // 스케일 (스프라이트 확대율)
    SCALE: 2
};

export const ROOM_CONFIG = {
    // 방 크기 (타일 단위)
    WIDTH: 14,
    HEIGHT: 10,
    
    // 벽 높이 (픽셀)
    WALL_HEIGHT: 96,
    
    // 카펫 영역
    CARPET: {
        startX: 4,
        startY: 3,
        width: 6,
        height: 4
    },
    
    // 테이블 위치
    TABLE: {
        x: 4,
        y: 3,
        gridWidth: 5,
        gridHeight: 3
    }
};

export const COLORS = {
    // 배경
    BACKGROUND: 0x1a1a2e,
    
    // 바닥 타일
    FLOOR: {
        LIGHT: 0xE8E4DC,
        DARK: 0xDFDBD3
    },
    
    // 카펫
    CARPET: {
        MAIN: 0x8B9DC3,
        BORDER: 0x7A8CB2
    },
    
    // 벽
    WALL: {
        BACK: 0xF5F5F0,
        SIDE: 0xE8E8E0,
        TRIM: 0xD8D8D0
    },
    
    // 테이블
    TABLE: {
        TOP: 0xD4A574,
        SIDE_LIGHT: 0xBE9468,
        SIDE_DARK: 0xA67C52
    },
    
    // 의자
    CHAIR: {
        SEAT: 0x4A5568,
        BACK: 0x3D4452,
        FRAME: 0x2D3748
    }
};

export const DEPTH_LAYERS = {
    FLOOR: 0,
    CARPET: 10,
    WALL: 100,
    FURNITURE: 200,
    AVATAR: 300,
    EFFECTS: 400,
    UI: 500
};

export const CHAIR_POSITIONS = [
    // 테이블 상단 (gy- 방향을 바라봄 = NE)
    { gx: 5, gy: 2, facing: 'SE' },
    { gx: 6, gy: 2, facing: 'SE' },
    { gx: 7, gy: 2, facing: 'SE' },
    
    // 테이블 하단 (gy+ 방향을 바라봄 = SW)
    { gx: 5, gy: 7, facing: 'NW' },
    { gx: 6, gy: 7, facing: 'NW' },
    { gx: 7, gy: 7, facing: 'NW' },
    
    // 테이블 좌측 (gx- 방향을 바라봄 = NW)
    { gx: 3, gy: 4, facing: 'NE' },
    { gx: 3, gy: 5, facing: 'NE' },
    
    // 테이블 우측 (gx+ 방향을 바라봄 = SE)
    { gx: 10, gy: 4, facing: 'SW' },
    { gx: 10, gy: 5, facing: 'SW' },
    
    // 보스석 (우측 상단 모서리)
    { gx: 11, gy: 2, facing: 'SW', isBoss: true }
];

// 카메라 설정
export const CAMERA_CONFIG = {
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 2.5,
    DEFAULT_ZOOM: 1.2,
    SCROLL_SPEED: 0.1,
    DRAG_ENABLED: true
};

// 애니메이션 설정
export const ANIMATION_CONFIG = {
    MOVE_DURATION: 300,
    FADE_DURATION: 200,
    BOUNCE_EASING: 'Cubic.easeOut'
};
