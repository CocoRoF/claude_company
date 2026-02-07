/**
 * Main Entry Point
 * Phaser 3 게임 초기화 및 설정
 */

import { OfficeScene } from './scenes/OfficeScene.js';
import { CAMERA_CONFIG, COLORS } from './config/GameConfig.js';

// Phaser 게임 설정
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: COLORS.BACKGROUND,
    pixelArt: true,  // 픽셀아트 모드 (최근접 이웃 필터링)
    roundPixels: true,
    antialias: false,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    scene: [OfficeScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    render: {
        pixelArt: true,
        antialias: false
    }
};

/**
 * CompanyGameManager
 * 게임 인스턴스 관리 및 외부 API 제공
 */
class CompanyGameManager {
    constructor() {
        this.game = null;
        this.scene = null;
        this._onReadyCallbacks = [];
    }
    
    /**
     * 게임 초기화 및 시작
     * @param {string|HTMLElement} container - 게임을 마운트할 컨테이너
     */
    init(container) {
        if (this.game) {
            console.warn('Game already initialized');
            return;
        }
        
        // 컨테이너 설정
        if (typeof container === 'string') {
            gameConfig.parent = container;
        } else if (container instanceof HTMLElement) {
            gameConfig.parent = container;
        }
        
        // Phaser 게임 생성
        this.game = new Phaser.Game(gameConfig);
        
        // 씬 준비 대기
        this.game.events.once('ready', () => {
            this.scene = this.game.scene.getScene('OfficeScene');
            this._onReadyCallbacks.forEach(cb => cb(this));
        });
        
        return this;
    }
    
    /**
     * 게임 준비 완료 시 콜백
     */
    onReady(callback) {
        if (this.scene) {
            callback(this);
        } else {
            this._onReadyCallbacks.push(callback);
        }
        return this;
    }
    
    /**
     * 게임 파괴
     */
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            this.scene = null;
        }
    }
    
    /**
     * 줌 조절
     */
    zoomIn() {
        if (this.scene) {
            this.scene.zoomIn();
        }
    }
    
    zoomOut() {
        if (this.scene) {
            this.scene.zoomOut();
        }
    }
    
    resetView() {
        if (this.scene) {
            this.scene.resetView();
        }
    }
    
    /**
     * 아바타(워커) 추가/제거
     */
    addWorker(sessionId, options = {}) {
        if (this.scene) {
            return this.scene.addAvatar(sessionId, options);
        }
    }
    
    removeWorker(sessionId) {
        if (this.scene) {
            this.scene.removeAvatar(sessionId);
        }
    }
    
    /**
     * 워커 상태 업데이트
     */
    updateWorker(sessionId, status) {
        if (this.scene) {
            this.scene.updateAvatarStatus(sessionId, status);
        }
    }
    
    /**
     * 모든 워커 동기화
     */
    syncWorkers(sessions) {
        if (this.scene) {
            this.scene.syncAvatars(sessions);
        }
    }
}

// 글로벌 인스턴스 생성
const gameManager = new CompanyGameManager();

// 글로벌 접근 제공
window.CompanyGame = gameManager;

export { CompanyGameManager, gameManager };
