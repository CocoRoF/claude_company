/**
 * Office Scene
 * 메인 오피스 씬 - 바닥, 벽, 가구, 아바타 렌더링
 */

import { 
    TILE_CONFIG, ROOM_CONFIG, COLORS, DEPTH_LAYERS,
    CHAIR_POSITIONS, CAMERA_CONFIG 
} from '../config/GameConfig.js';
import { 
    gridToScreen, calculateDepth, getDiamondPath,
    screenToGrid 
} from '../utils/IsometricUtils.js';
import { DepthSorter } from '../utils/DepthSorter.js';

export class OfficeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OfficeScene' });
        
        // 레이어 컨테이너
        this.worldContainer = null;
        this.floorLayer = null;
        this.wallLayer = null;
        this.objectLayer = null;
        this.effectsLayer = null;
        this.uiLayer = null;
        
        // 카메라 상태
        this.cameraZoom = CAMERA_CONFIG.DEFAULT_ZOOM;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.cameraStart = { x: 0, y: 0 };
        
        // 깊이 정렬
        this.depthSorter = null;
        
        // 아바타
        this.avatars = new Map();
        this.seatAssignments = new Map();
        
        // 픽셀아트 스프라이트시트 (동적 생성)
        this.sprites = {};
    }
    
    preload() {
        // 스프라이트시트가 있다면 여기서 로드
        // 지금은 Graphics로 픽셀아트 스타일 직접 생성
    }
    
    create() {
        console.log('OfficeScene created');
        
        // 레이어 초기화
        this._initLayers();
        
        // 깊이 정렬 초기화
        this.depthSorter = new DepthSorter(this);
        
        // 스프라이트 텍스처 생성 (픽셀아트 스타일)
        this._generatePixelArtTextures();
        
        // 방 렌더링
        this._renderFloor();
        this._renderCarpet();
        this._renderWalls();
        this._renderWindows();
        
        // 가구 렌더링
        this._renderTable();
        this._renderChairs();
        
        // 카메라 설정
        this._setupCamera();
        
        // 입력 처리
        this._setupInput();
        
        // 초기 깊이 정렬
        this.depthSorter.sort();
        
        // 씬 준비 완료 이벤트
        this.game.events.emit('ready');
    }
    
    update(time, delta) {
        // 깊이 정렬 업데이트
        this.depthSorter.sort();
        
        // 아바타 애니메이션 업데이트
        this._updateAvatars(delta);
    }
    
    /**
     * 레이어 초기화
     */
    _initLayers() {
        // 메인 월드 컨테이너 (카메라 변환 적용)
        this.worldContainer = this.add.container(0, 0);
        
        // 각 레이어 생성
        this.floorLayer = this.add.container(0, 0);
        this.carpetLayer = this.add.container(0, 0);
        this.wallLayer = this.add.container(0, 0);
        this.objectLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);
        this.uiLayer = this.add.container(0, 0);
        
        // 월드 컨테이너에 레이어 추가
        this.worldContainer.add([
            this.floorLayer,
            this.carpetLayer,
            this.wallLayer,
            this.objectLayer,
            this.effectsLayer
        ]);
        
        // 레이어 깊이 설정
        this.floorLayer.setDepth(DEPTH_LAYERS.FLOOR);
        this.carpetLayer.setDepth(DEPTH_LAYERS.CARPET);
        this.wallLayer.setDepth(DEPTH_LAYERS.WALL);
        this.objectLayer.setDepth(DEPTH_LAYERS.FURNITURE);
        this.effectsLayer.setDepth(DEPTH_LAYERS.EFFECTS);
        this.uiLayer.setDepth(DEPTH_LAYERS.UI);
    }
    
    /**
     * 픽셀아트 스타일 텍스처 동적 생성
     */
    _generatePixelArtTextures() {
        // 바닥 타일 텍스처 생성
        this._createFloorTileTexture('tile_light', COLORS.FLOOR.LIGHT);
        this._createFloorTileTexture('tile_dark', COLORS.FLOOR.DARK);
        this._createFloorTileTexture('carpet_main', COLORS.CARPET.MAIN);
        this._createFloorTileTexture('carpet_border', COLORS.CARPET.BORDER);
    }
    
    /**
     * 바닥 타일 텍스처 생성 (픽셀아트 스타일)
     */
    _createFloorTileTexture(key, color) {
        const tileW = TILE_CONFIG.WIDTH;
        const tileH = TILE_CONFIG.HEIGHT;
        
        const graphics = this.add.graphics();
        
        // 메인 다이아몬드
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(tileW / 2, 0);
        graphics.lineTo(tileW, tileH / 2);
        graphics.lineTo(tileW / 2, tileH);
        graphics.lineTo(0, tileH / 2);
        graphics.closePath();
        graphics.fillPath();
        
        // 픽셀아트 스타일 그리드 라인 (디더링)
        graphics.lineStyle(1, 0x000000, 0.1);
        graphics.beginPath();
        graphics.moveTo(tileW / 2, 0);
        graphics.lineTo(tileW, tileH / 2);
        graphics.lineTo(tileW / 2, tileH);
        graphics.lineTo(0, tileH / 2);
        graphics.closePath();
        graphics.strokePath();
        
        // 하이라이트 (상단 엣지)
        const highlightColor = Phaser.Display.Color.ValueToColor(color).lighten(15).color;
        graphics.lineStyle(1, highlightColor, 0.5);
        graphics.beginPath();
        graphics.moveTo(tileW / 2, 1);
        graphics.lineTo(tileW - 1, tileH / 2);
        graphics.strokePath();
        
        // 텍스처 생성
        graphics.generateTexture(key, tileW, tileH);
        graphics.destroy();
    }
    
    /**
     * 바닥 렌더링
     */
    _renderFloor() {
        const roomW = ROOM_CONFIG.WIDTH;
        const roomH = ROOM_CONFIG.HEIGHT;
        
        for (let gx = 0; gx < roomW; gx++) {
            for (let gy = 0; gy < roomH; gy++) {
                const screenPos = gridToScreen(gx, gy);
                const isCheckerDark = (gx + gy) % 2 === 1;
                const textureKey = isCheckerDark ? 'tile_dark' : 'tile_light';
                
                const tile = this.add.image(screenPos.x, screenPos.y, textureKey);
                tile.setOrigin(0.5, 0.5);
                tile.setDepth(DEPTH_LAYERS.FLOOR);
                
                this.floorLayer.add(tile);
            }
        }
    }
    
    /**
     * 카펫 렌더링
     */
    _renderCarpet() {
        const carpet = ROOM_CONFIG.CARPET;
        
        for (let gx = carpet.startX; gx < carpet.startX + carpet.width; gx++) {
            for (let gy = carpet.startY; gy < carpet.startY + carpet.height; gy++) {
                const screenPos = gridToScreen(gx, gy);
                
                // 가장자리 확인
                const isBorder = 
                    gx === carpet.startX || 
                    gx === carpet.startX + carpet.width - 1 ||
                    gy === carpet.startY || 
                    gy === carpet.startY + carpet.height - 1;
                
                const textureKey = isBorder ? 'carpet_border' : 'carpet_main';
                
                const tile = this.add.image(screenPos.x, screenPos.y, textureKey);
                tile.setOrigin(0.5, 0.5);
                tile.setDepth(DEPTH_LAYERS.CARPET);
                tile.setAlpha(0.8);
                
                this.carpetLayer.add(tile);
            }
        }
    }
    
    /**
     * 벽 렌더링
     */
    _renderWalls() {
        const roomW = ROOM_CONFIG.WIDTH;
        const roomH = ROOM_CONFIG.HEIGHT;
        const wallH = ROOM_CONFIG.WALL_HEIGHT;
        
        // 뒷벽 (gx 방향으로 gy=0 라인)
        this._renderBackWall(roomW, wallH);
        
        // 옆벽 (gy 방향으로 gx=0 라인)
        this._renderSideWall(roomH, wallH);
    }
    
    /**
     * 뒷벽 렌더링 (gy=0 라인)
     */
    _renderBackWall(length, wallHeight) {
        const graphics = this.add.graphics();
        const pal = COLORS.WALL;
        
        for (let i = 0; i < length; i++) {
            const pos = gridToScreen(i, 0);
            const nextPos = gridToScreen(i + 1, 0);
            
            // 타일 상단 모서리
            const x1 = pos.x;
            const y1 = pos.y - TILE_CONFIG.HEIGHT / 2;
            const x2 = nextPos.x;
            const y2 = nextPos.y - TILE_CONFIG.HEIGHT / 2;
            
            // 벽 메인 면
            graphics.fillStyle(pal.BACK, 1);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x1, y1);
            graphics.closePath();
            graphics.fillPath();
            
            // 상단 트림
            graphics.fillStyle(pal.TRIM, 0.8);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight + 4);
            graphics.lineTo(x1, y1 - wallHeight + 4);
            graphics.closePath();
            graphics.fillPath();
            
            // 하단 몰딩
            graphics.fillStyle(pal.TRIM, 0.6);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - 5);
            graphics.lineTo(x2, y2 - 5);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x1, y1);
            graphics.closePath();
            graphics.fillPath();
            
            // 픽셀아트 스타일 세로 라인 (벽 패널 구분)
            if (i % 2 === 0) {
                graphics.lineStyle(1, pal.SIDE, 0.3);
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                graphics.beginPath();
                graphics.moveTo(midX, midY - wallHeight + 4);
                graphics.lineTo(midX, midY - 5);
                graphics.strokePath();
            }
        }
        
        graphics.setDepth(DEPTH_LAYERS.WALL);
        this.wallLayer.add(graphics);
    }
    
    /**
     * 옆벽 렌더링 (gx=0 라인)
     */
    _renderSideWall(length, wallHeight) {
        const graphics = this.add.graphics();
        const pal = COLORS.WALL;
        
        for (let j = 0; j < length; j++) {
            const pos = gridToScreen(0, j);
            const nextPos = gridToScreen(0, j + 1);
            
            // 타일 상단 모서리
            const x1 = pos.x;
            const y1 = pos.y - TILE_CONFIG.HEIGHT / 2;
            const x2 = nextPos.x;
            const y2 = nextPos.y - TILE_CONFIG.HEIGHT / 2;
            
            // 벽 메인 면 (약간 어둡게)
            graphics.fillStyle(pal.SIDE, 1);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x1, y1);
            graphics.closePath();
            graphics.fillPath();
            
            // 상단 트림
            graphics.fillStyle(pal.TRIM, 0.8);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight);
            graphics.lineTo(x2, y2 - wallHeight + 4);
            graphics.lineTo(x1, y1 - wallHeight + 4);
            graphics.closePath();
            graphics.fillPath();
            
            // 하단 몰딩
            graphics.fillStyle(pal.TRIM, 0.6);
            graphics.beginPath();
            graphics.moveTo(x1, y1 - 5);
            graphics.lineTo(x2, y2 - 5);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x1, y1);
            graphics.closePath();
            graphics.fillPath();
        }
        
        graphics.setDepth(DEPTH_LAYERS.WALL);
        this.wallLayer.add(graphics);
    }
    
    /**
     * 창문 렌더링
     */
    _renderWindows() {
        // 뒷벽 창문 (y=0)
        this._createWindow(3, 0, 'back');
        this._createWindow(7, 0, 'back');
        this._createWindow(11, 0, 'back');
        
        // 옆벽 창문 (x=0)
        this._createWindow(0, 2, 'side');
        this._createWindow(0, 6, 'side');
    }
    
    /**
     * 창문 생성
     */
    _createWindow(gx, gy, wallType) {
        const graphics = this.add.graphics();
        const pos = gridToScreen(gx, gy);
        
        const wallHeight = ROOM_CONFIG.WALL_HEIGHT;
        const windowWidth = TILE_CONFIG.WIDTH * 0.6;
        const windowHeight = 30;
        const windowBottom = 25;
        
        let cx, cy;
        
        if (wallType === 'back') {
            cx = pos.x;
            cy = pos.y - TILE_CONFIG.HEIGHT / 2 - windowBottom - windowHeight / 2;
        } else {
            cx = pos.x;
            cy = pos.y - TILE_CONFIG.HEIGHT / 2 - windowBottom - windowHeight / 2;
        }
        
        // 창문 프레임
        const frameColor = 0x9DB4C0;
        graphics.fillStyle(frameColor, 1);
        
        if (wallType === 'back') {
            // 아이소메트릭 창문 (평행사변형)
            const skewX = TILE_CONFIG.WIDTH / 4;
            graphics.beginPath();
            graphics.moveTo(cx - windowWidth/2 + skewX/2, cy - windowHeight/2);
            graphics.lineTo(cx + windowWidth/2 + skewX/2, cy - windowHeight/2);
            graphics.lineTo(cx + windowWidth/2 - skewX/2, cy + windowHeight/2);
            graphics.lineTo(cx - windowWidth/2 - skewX/2, cy + windowHeight/2);
            graphics.closePath();
            graphics.fillPath();
            
            // 유리 (하늘색)
            graphics.fillStyle(0xADD8E6, 0.7);
            const inset = 2;
            graphics.beginPath();
            graphics.moveTo(cx - windowWidth/2 + skewX/2 + inset, cy - windowHeight/2 + inset);
            graphics.lineTo(cx + windowWidth/2 + skewX/2 - inset, cy - windowHeight/2 + inset);
            graphics.lineTo(cx + windowWidth/2 - skewX/2 - inset, cy + windowHeight/2 - inset);
            graphics.lineTo(cx - windowWidth/2 - skewX/2 + inset, cy + windowHeight/2 - inset);
            graphics.closePath();
            graphics.fillPath();
            
            // 창살
            graphics.lineStyle(1, frameColor, 0.8);
            graphics.beginPath();
            graphics.moveTo(cx, cy - windowHeight/2 + inset);
            graphics.lineTo(cx, cy + windowHeight/2 - inset);
            graphics.strokePath();
            
        } else {
            // 옆벽 창문
            const skewY = TILE_CONFIG.HEIGHT / 4;
            graphics.beginPath();
            graphics.moveTo(cx - windowWidth/2, cy - windowHeight/2 + skewY/2);
            graphics.lineTo(cx + windowWidth/2, cy - windowHeight/2 - skewY/2);
            graphics.lineTo(cx + windowWidth/2, cy + windowHeight/2 - skewY/2);
            graphics.lineTo(cx - windowWidth/2, cy + windowHeight/2 + skewY/2);
            graphics.closePath();
            graphics.fillPath();
            
            // 유리
            graphics.fillStyle(0xADD8E6, 0.7);
            const inset = 2;
            graphics.beginPath();
            graphics.moveTo(cx - windowWidth/2 + inset, cy - windowHeight/2 + skewY/2 + inset);
            graphics.lineTo(cx + windowWidth/2 - inset, cy - windowHeight/2 - skewY/2 + inset);
            graphics.lineTo(cx + windowWidth/2 - inset, cy + windowHeight/2 - skewY/2 - inset);
            graphics.lineTo(cx - windowWidth/2 + inset, cy + windowHeight/2 + skewY/2 - inset);
            graphics.closePath();
            graphics.fillPath();
        }
        
        graphics.setDepth(DEPTH_LAYERS.WALL + 50);
        this.wallLayer.add(graphics);
    }
    
    /**
     * 테이블 렌더링
     */
    _renderTable() {
        const table = ROOM_CONFIG.TABLE;
        const tableGfx = this._createConferenceTable(
            table.x, table.y, 
            table.gridWidth, table.gridHeight
        );
        this.objectLayer.add(tableGfx);
        
        // 깊이 정렬에 추가
        const centerGx = table.x + table.gridWidth / 2;
        const centerGy = table.y + table.gridHeight / 2;
        this.depthSorter.add(tableGfx, centerGx, centerGy, 10);
    }
    
    /**
     * 회의 테이블 생성
     */
    _createConferenceTable(startGx, startGy, width, height) {
        const graphics = this.add.graphics();
        
        const tableHeight = 18;
        const topThickness = 5;
        
        // 테이블 영역 계산
        const topLeft = gridToScreen(startGx, startGy);
        const topRight = gridToScreen(startGx + width, startGy);
        const bottomLeft = gridToScreen(startGx, startGy + height);
        const bottomRight = gridToScreen(startGx + width, startGy + height);
        
        // 테이블 다리 위치
        const legInset = 0.5;
        const legPositions = [
            { gx: startGx + legInset, gy: startGy + legInset },
            { gx: startGx + width - legInset, gy: startGy + legInset },
            { gx: startGx + legInset, gy: startGy + height - legInset },
            { gx: startGx + width - legInset, gy: startGy + height - legInset }
        ];
        
        // 다리 그리기
        for (const leg of legPositions) {
            this._drawTableLeg(graphics, leg.gx, leg.gy, tableHeight - topThickness);
        }
        
        // 테이블 상판 좌측면 (어두움)
        const palSide = COLORS.TABLE;
        graphics.fillStyle(palSide.SIDE_DARK, 1);
        graphics.beginPath();
        graphics.moveTo(topLeft.x, topLeft.y - tableHeight);
        graphics.lineTo(bottomLeft.x, bottomLeft.y - tableHeight);
        graphics.lineTo(bottomLeft.x, bottomLeft.y - tableHeight + topThickness);
        graphics.lineTo(topLeft.x, topLeft.y - tableHeight + topThickness);
        graphics.closePath();
        graphics.fillPath();
        
        // 테이블 상판 우측면 (밝음)
        graphics.fillStyle(palSide.SIDE_LIGHT, 1);
        graphics.beginPath();
        graphics.moveTo(bottomLeft.x, bottomLeft.y - tableHeight);
        graphics.lineTo(bottomRight.x, bottomRight.y - tableHeight);
        graphics.lineTo(bottomRight.x, bottomRight.y - tableHeight + topThickness);
        graphics.lineTo(bottomLeft.x, bottomLeft.y - tableHeight + topThickness);
        graphics.closePath();
        graphics.fillPath();
        
        // 테이블 상판 (상단면 - 메인 색상)
        graphics.fillStyle(palSide.TOP, 1);
        graphics.beginPath();
        graphics.moveTo(topLeft.x, topLeft.y - tableHeight);
        graphics.lineTo(topRight.x, topRight.y - tableHeight);
        graphics.lineTo(bottomRight.x, bottomRight.y - tableHeight);
        graphics.lineTo(bottomLeft.x, bottomLeft.y - tableHeight);
        graphics.closePath();
        graphics.fillPath();
        
        // 상판 하이라이트
        graphics.lineStyle(1, 0xFFFFFF, 0.2);
        graphics.beginPath();
        graphics.moveTo(topLeft.x + 2, topLeft.y - tableHeight);
        graphics.lineTo(topRight.x - 2, topRight.y - tableHeight);
        graphics.strokePath();
        
        // 상판 우드 그레인 (픽셀아트 스타일)
        graphics.lineStyle(1, palSide.SIDE_DARK, 0.15);
        const grainCount = 5;
        for (let i = 1; i < grainCount; i++) {
            const t = i / grainCount;
            const fromX = Phaser.Math.Interpolation.Linear([topLeft.x, bottomLeft.x], t);
            const fromY = Phaser.Math.Interpolation.Linear([topLeft.y, bottomLeft.y], t) - tableHeight;
            const toX = Phaser.Math.Interpolation.Linear([topRight.x, bottomRight.x], t);
            const toY = Phaser.Math.Interpolation.Linear([topRight.y, bottomRight.y], t) - tableHeight;
            
            graphics.beginPath();
            graphics.moveTo(fromX, fromY);
            graphics.lineTo(toX, toY);
            graphics.strokePath();
        }
        
        const depth = calculateDepth(startGx + width/2, startGy + height/2, 20);
        graphics.setDepth(depth);
        
        return graphics;
    }
    
    /**
     * 테이블 다리 그리기
     */
    _drawTableLeg(graphics, gx, gy, legHeight) {
        const pos = gridToScreen(gx, gy);
        const legW = 6;
        const legD = 4;
        
        // 그림자
        graphics.fillStyle(0x000000, 0.15);
        graphics.fillEllipse(pos.x, pos.y + 2, legW + 2, legD + 1);
        
        // 다리 좌측면
        graphics.fillStyle(0x3A3A3A, 1);
        graphics.beginPath();
        graphics.moveTo(pos.x - legW/2, pos.y - legHeight);
        graphics.lineTo(pos.x, pos.y - legHeight + legD/2);
        graphics.lineTo(pos.x, pos.y + legD/2);
        graphics.lineTo(pos.x - legW/2, pos.y);
        graphics.closePath();
        graphics.fillPath();
        
        // 다리 우측면
        graphics.fillStyle(0x4A4A4A, 1);
        graphics.beginPath();
        graphics.moveTo(pos.x + legW/2, pos.y - legHeight);
        graphics.lineTo(pos.x, pos.y - legHeight + legD/2);
        graphics.lineTo(pos.x, pos.y + legD/2);
        graphics.lineTo(pos.x + legW/2, pos.y);
        graphics.closePath();
        graphics.fillPath();
        
        // 다리 상단
        graphics.fillStyle(0x5A5A5A, 1);
        graphics.beginPath();
        graphics.moveTo(pos.x, pos.y - legHeight - legD/2);
        graphics.lineTo(pos.x + legW/2, pos.y - legHeight);
        graphics.lineTo(pos.x, pos.y - legHeight + legD/2);
        graphics.lineTo(pos.x - legW/2, pos.y - legHeight);
        graphics.closePath();
        graphics.fillPath();
    }
    
    /**
     * 의자 렌더링
     */
    _renderChairs() {
        for (const chairPos of CHAIR_POSITIONS) {
            const chair = this._createChair(
                chairPos.gx, 
                chairPos.gy, 
                chairPos.facing,
                chairPos.isBoss
            );
            this.objectLayer.add(chair);
            this.depthSorter.add(chair, chairPos.gx, chairPos.gy, 5);
        }
    }
    
    /**
     * 의자 생성
     */
    _createChair(gx, gy, facing = 'SE', isBoss = false) {
        const graphics = this.add.graphics();
        const pos = gridToScreen(gx, gy);
        
        const seatHeight = 10;
        const seatW = TILE_CONFIG.WIDTH * 0.45;
        const seatD = TILE_CONFIG.HEIGHT * 0.45;
        const seatThickness = 3;
        const backrestHeight = 16;
        
        // 색상 (보스석은 빨간색)
        const seatColor = isBoss ? 0xB91C1C : COLORS.CHAIR.SEAT;
        const backColor = isBoss ? 0x991B1B : COLORS.CHAIR.BACK;
        const frameColor = COLORS.CHAIR.FRAME;
        
        // 그림자
        graphics.fillStyle(0x000000, 0.12);
        graphics.fillEllipse(pos.x + 2, pos.y + 2, seatW * 0.7, seatD * 0.5);
        
        // 다리/기둥
        this._drawChairBase(graphics, pos.x, pos.y, seatHeight);
        
        // 좌석 그리기
        this._drawChairSeat(graphics, pos.x, pos.y - seatHeight, seatW, seatD, seatThickness, seatColor);
        
        // 등받이 그리기 (방향에 따라)
        this._drawChairBackrest(graphics, pos.x, pos.y - seatHeight - seatThickness/2, 
            seatW, seatD, backrestHeight, facing, backColor);
        
        const depth = calculateDepth(gx, gy, 15);
        graphics.setDepth(depth);
        
        return graphics;
    }
    
    /**
     * 의자 베이스 (기둥 + 바퀴) 그리기
     */
    _drawChairBase(graphics, cx, cy, height) {
        const stemW = 4;
        
        // 중앙 기둥
        graphics.fillStyle(0x2D3748, 1);
        graphics.fillRect(cx - stemW/2, cy - height, stemW, height);
        
        // 기둥 하이라이트
        graphics.fillStyle(0xFFFFFF, 0.1);
        graphics.fillRect(cx - stemW/2, cy - height, 1, height);
        
        // 바퀴 베이스
        graphics.fillStyle(0x1A202C, 1);
        graphics.fillEllipse(cx, cy, stemW * 2, stemW);
    }
    
    /**
     * 의자 좌석 그리기
     */
    _drawChairSeat(graphics, cx, cy, width, depth, thickness, color) {
        // 좌석 상단면
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(cx, cy - depth/2);
        graphics.lineTo(cx + width/2, cy);
        graphics.lineTo(cx, cy + depth/2);
        graphics.lineTo(cx - width/2, cy);
        graphics.closePath();
        graphics.fillPath();
        
        // 좌석 측면 (앞)
        const frontColor = Phaser.Display.Color.ValueToColor(color).darken(15).color;
        graphics.fillStyle(frontColor, 1);
        graphics.beginPath();
        graphics.moveTo(cx, cy + depth/2);
        graphics.lineTo(cx + width/2, cy);
        graphics.lineTo(cx + width/2, cy + thickness);
        graphics.lineTo(cx, cy + depth/2 + thickness);
        graphics.closePath();
        graphics.fillPath();
        
        // 좌석 측면 (사이드)
        const sideColor = Phaser.Display.Color.ValueToColor(color).darken(25).color;
        graphics.fillStyle(sideColor, 1);
        graphics.beginPath();
        graphics.moveTo(cx, cy + depth/2);
        graphics.lineTo(cx - width/2, cy);
        graphics.lineTo(cx - width/2, cy + thickness);
        graphics.lineTo(cx, cy + depth/2 + thickness);
        graphics.closePath();
        graphics.fillPath();
        
        // 쿠션 패턴 (픽셀 스타일)
        graphics.lineStyle(1, 0x000000, 0.1);
        graphics.strokeEllipse(cx, cy, width * 0.4, depth * 0.3);
    }
    
    /**
     * 의자 등받이 그리기
     */
    _drawChairBackrest(graphics, cx, cy, seatWidth, seatDepth, height, facing, color) {
        const backW = seatWidth * 0.8;
        const backD = 3;
        
        // 방향에 따른 등받이 위치 오프셋
        let offsetX = 0, offsetY = 0;
        let rotated = false;
        
        switch (facing) {
            case 'SE':
                offsetY = -seatDepth / 2;
                break;
            case 'SW':
                offsetX = -seatWidth / 2;
                rotated = true;
                break;
            case 'NW':
                offsetY = seatDepth / 2;
                break;
            case 'NE':
                offsetX = seatWidth / 2;
                rotated = true;
                break;
        }
        
        const bx = cx + offsetX;
        const by = cy + offsetY;
        
        if (rotated) {
            // 등받이 전면
            graphics.fillStyle(color, 1);
            graphics.beginPath();
            graphics.moveTo(bx, by - height);
            graphics.lineTo(bx, by);
            graphics.lineTo(bx - backD, by + backW * 0.2);
            graphics.lineTo(bx - backD, by - height + backW * 0.2);
            graphics.closePath();
            graphics.fillPath();
            
            // 등받이 측면
            const sideColor = Phaser.Display.Color.ValueToColor(color).darken(20).color;
            graphics.fillStyle(sideColor, 1);
            graphics.fillRect(bx - backD, by - height + backW * 0.2, backD, height);
        } else {
            // 등받이 전면
            graphics.fillStyle(color, 1);
            graphics.beginPath();
            graphics.moveTo(bx - backW/2, by - height);
            graphics.lineTo(bx + backW/2, by - height);
            graphics.lineTo(bx + backW/2, by);
            graphics.lineTo(bx - backW/2, by);
            graphics.closePath();
            graphics.fillPath();
            
            // 등받이 두께
            const sideColor = Phaser.Display.Color.ValueToColor(color).darken(20).color;
            graphics.fillStyle(sideColor, 1);
            graphics.beginPath();
            graphics.moveTo(bx + backW/2, by - height);
            graphics.lineTo(bx + backW/2 + backD, by - height + 2);
            graphics.lineTo(bx + backW/2 + backD, by + 2);
            graphics.lineTo(bx + backW/2, by);
            graphics.closePath();
            graphics.fillPath();
        }
        
        // 등받이 상단
        const topColor = Phaser.Display.Color.ValueToColor(color).lighten(10).color;
        graphics.fillStyle(topColor, 1);
        if (!rotated) {
            graphics.fillRect(bx - backW/2, by - height - 2, backW + backD, 3);
        }
    }
    
    /**
     * 카메라 설정
     */
    _setupCamera() {
        const roomCenterGx = ROOM_CONFIG.WIDTH / 2;
        const roomCenterGy = ROOM_CONFIG.HEIGHT / 2;
        const roomCenter = gridToScreen(roomCenterGx, roomCenterGy);
        
        // 월드 컨테이너를 화면 중앙으로 이동
        const centerX = this.cameras.main.width / 2 - roomCenter.x;
        const centerY = this.cameras.main.height / 2 - roomCenter.y - 30;
        
        this.worldContainer.x = centerX;
        this.worldContainer.y = centerY;
        
        // 초기 줌 적용
        this.worldContainer.setScale(this.cameraZoom);
    }
    
    /**
     * 입력 설정
     */
    _setupInput() {
        // 마우스 휠 줌
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            this._zoom(zoomFactor, pointer.x, pointer.y);
        });
        
        // 드래그 패닝
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
                this.isDragging = true;
                this.dragStart = { x: pointer.x, y: pointer.y };
                this.cameraStart = { x: this.worldContainer.x, y: this.worldContainer.y };
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const dx = pointer.x - this.dragStart.x;
                const dy = pointer.y - this.dragStart.y;
                this.worldContainer.x = this.cameraStart.x + dx;
                this.worldContainer.y = this.cameraStart.y + dy;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
        
        // 화면 크기 변경 대응
        this.scale.on('resize', this._handleResize, this);
    }
    
    /**
     * 줌 처리
     */
    _zoom(factor, pivotX, pivotY) {
        const oldZoom = this.cameraZoom;
        this.cameraZoom = Phaser.Math.Clamp(
            this.cameraZoom * factor,
            CAMERA_CONFIG.MIN_ZOOM,
            CAMERA_CONFIG.MAX_ZOOM
        );
        
        const zoomRatio = this.cameraZoom / oldZoom;
        
        // 마우스 위치를 중심으로 줌
        const newX = pivotX - (pivotX - this.worldContainer.x) * zoomRatio;
        const newY = pivotY - (pivotY - this.worldContainer.y) * zoomRatio;
        
        this.worldContainer.setScale(this.cameraZoom);
        this.worldContainer.x = newX;
        this.worldContainer.y = newY;
    }
    
    /**
     * 리사이즈 핸들러
     */
    _handleResize(gameSize) {
        // 카메라 재설정이 필요한 경우 여기서 처리
    }
    
    /**
     * 아바타 업데이트
     */
    _updateAvatars(delta) {
        // 아바타 애니메이션 업데이트 (나중에 구현)
    }
    
    // ==================== 외부 API ====================
    
    zoomIn() {
        const center = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };
        this._zoom(1.2, center.x, center.y);
    }
    
    zoomOut() {
        const center = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };
        this._zoom(0.8, center.x, center.y);
    }
    
    resetView() {
        this._setupCamera();
    }
    
    addAvatar(sessionId, options = {}) {
        // 아바타 추가 구현 (나중에)
        console.log('Adding avatar:', sessionId);
    }
    
    removeAvatar(sessionId) {
        // 아바타 제거 구현 (나중에)
        console.log('Removing avatar:', sessionId);
    }
    
    updateAvatarStatus(sessionId, status) {
        // 아바타 상태 업데이트 (나중에)
    }
    
    syncAvatars(sessions) {
        // 세션 동기화 (나중에)
    }
}
