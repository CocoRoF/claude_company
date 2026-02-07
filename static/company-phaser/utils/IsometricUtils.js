/**
 * Isometric Utilities
 * 아이소메트릭 좌표 변환 및 헬퍼 함수
 */

import { TILE_CONFIG, DEPTH_LAYERS } from '../config/GameConfig.js';

/**
 * 그리드 좌표를 화면 좌표로 변환
 * @param {number} gx - 그리드 X 좌표
 * @param {number} gy - 그리드 Y 좌표
 * @returns {{x: number, y: number}} 화면 좌표
 */
export function gridToScreen(gx, gy) {
    const tileW = TILE_CONFIG.WIDTH;
    const tileH = TILE_CONFIG.HEIGHT;
    
    return {
        x: (gx - gy) * (tileW / 2),
        y: (gx + gy) * (tileH / 2)
    };
}

/**
 * 화면 좌표를 그리드 좌표로 변환
 * @param {number} screenX - 화면 X 좌표
 * @param {number} screenY - 화면 Y 좌표
 * @returns {{gx: number, gy: number}} 그리드 좌표 (실수)
 */
export function screenToGrid(screenX, screenY) {
    const tileW = TILE_CONFIG.WIDTH;
    const tileH = TILE_CONFIG.HEIGHT;
    
    return {
        gx: (screenX / (tileW / 2) + screenY / (tileH / 2)) / 2,
        gy: (screenY / (tileH / 2) - screenX / (tileW / 2)) / 2
    };
}

/**
 * 아이소메트릭 타일의 네 모서리 좌표 계산
 * @param {number} gx - 그리드 X 좌표
 * @param {number} gy - 그리드 Y 좌표
 * @returns {Object} 네 모서리 좌표
 */
export function getTileCorners(gx, gy) {
    const center = gridToScreen(gx, gy);
    const halfW = TILE_CONFIG.WIDTH / 2;
    const halfH = TILE_CONFIG.HEIGHT / 2;
    
    return {
        top: { x: center.x, y: center.y - halfH },      // 북쪽
        right: { x: center.x + halfW, y: center.y },    // 동쪽
        bottom: { x: center.x, y: center.y + halfH },   // 남쪽
        left: { x: center.x - halfW, y: center.y }      // 서쪽
    };
}

/**
 * 깊이 정렬을 위한 Z-index 계산
 * @param {number} gx - 그리드 X 좌표
 * @param {number} gy - 그리드 Y 좌표
 * @param {number} layer - 레이어 오프셋 (0-999)
 * @returns {number} Z-index 값 (높을수록 위에 렌더링)
 */
export function calculateDepth(gx, gy, layer = 0) {
    // 더 남쪽(gx+gy가 큼)에 있는 객체가 더 위에 렌더링됨
    return (gx + gy) * 100 + layer;
}

/**
 * 아이소메트릭 다이아몬드 경로 생성
 * @param {number} cx - 중심 X
 * @param {number} cy - 중심 Y
 * @param {number} width - 다이아몬드 너비
 * @param {number} height - 다이아몬드 높이
 * @returns {number[]} 폴리곤 포인트 배열
 */
export function getDiamondPath(cx, cy, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;
    
    return [
        cx, cy - halfH,      // top
        cx + halfW, cy,      // right
        cx, cy + halfH,      // bottom
        cx - halfW, cy       // left
    ];
}

/**
 * 방향에 따른 오프셋 계산 (의자 등받이 위치 등)
 */
export const DIRECTION_OFFSETS = {
    'NE': { gx: 0, gy: -1 },   // 우상단을 바라봄
    'SE': { gx: 1, gy: 0 },    // 우하단을 바라봄
    'SW': { gx: 0, gy: 1 },    // 좌하단을 바라봄
    'NW': { gx: -1, gy: 0 }    // 좌상단을 바라봄
};

/**
 * 두 그리드 좌표 사이의 맨해튼 거리 계산
 */
export function manhattanDistance(gx1, gy1, gx2, gy2) {
    return Math.abs(gx1 - gx2) + Math.abs(gy1 - gy2);
}

/**
 * 그리드 좌표가 유효한지 확인
 */
export function isValidGrid(gx, gy, roomWidth, roomHeight) {
    return gx >= 0 && gx < roomWidth && gy >= 0 && gy < roomHeight;
}

/**
 * 픽셀아트 스프라이트 설정 (최근접 이웃 필터링)
 */
export function setupPixelArtSprite(sprite) {
    if (sprite.texture) {
        sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    return sprite;
}

/**
 * 아이소메트릭 박스의 여섯 면 그리기용 정점 계산
 * @param {number} width - 박스 너비 (gx 방향 타일 수)
 * @param {number} depth - 박스 깊이 (gy 방향 타일 수)
 * @param {number} height - 박스 높이 (픽셀)
 * @returns {Object} 각 면의 정점 좌표
 */
export function getBoxVertices(width, depth, height) {
    const tileW = TILE_CONFIG.WIDTH;
    const tileH = TILE_CONFIG.HEIGHT;
    
    // 박스의 8개 정점 계산
    const w = width * tileW / 2;
    const d = depth * tileH / 2;
    
    return {
        // 상단면 (아이소메트릭 다이아몬드)
        top: [
            { x: 0, y: -d - height },           // 북쪽
            { x: w, y: -height },               // 동쪽
            { x: 0, y: d - height },            // 남쪽
            { x: -w, y: -height }               // 서쪽
        ],
        // 좌측면 (서쪽-남쪽)
        left: [
            { x: -w, y: -height },              // 상단 서쪽
            { x: 0, y: d - height },            // 상단 남쪽
            { x: 0, y: d },                     // 하단 남쪽
            { x: -w, y: 0 }                     // 하단 서쪽
        ],
        // 우측면 (동쪽-남쪽)
        right: [
            { x: w, y: -height },               // 상단 동쪽
            { x: w, y: 0 },                     // 하단 동쪽
            { x: 0, y: d },                     // 하단 남쪽
            { x: 0, y: d - height }             // 상단 남쪽
        ]
    };
}
