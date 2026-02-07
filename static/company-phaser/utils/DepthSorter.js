/**
 * Depth Sorter
 * 아이소메트릭 객체들의 깊이 정렬을 관리하는 유틸리티 클래스
 */

import { calculateDepth } from './IsometricUtils.js';

export class DepthSorter {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this._needsSort = false;
    }
    
    /**
     * 정렬 대상 객체 추가
     * @param {Phaser.GameObjects.GameObject} obj - 게임 오브젝트
     * @param {number} gx - 그리드 X 좌표
     * @param {number} gy - 그리드 Y 좌표
     * @param {number} layerOffset - 레이어 오프셋 (같은 타일 내 순서)
     */
    add(obj, gx, gy, layerOffset = 0) {
        obj._isoGx = gx;
        obj._isoGy = gy;
        obj._isoLayerOffset = layerOffset;
        this.objects.push(obj);
        this._needsSort = true;
    }
    
    /**
     * 객체 제거
     */
    remove(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }
    
    /**
     * 객체의 그리드 위치 업데이트
     */
    updatePosition(obj, gx, gy) {
        obj._isoGx = gx;
        obj._isoGy = gy;
        this._needsSort = true;
    }
    
    /**
     * 깊이 정렬 수행
     */
    sort() {
        if (!this._needsSort) return;
        
        // 깊이 계산 및 적용
        for (const obj of this.objects) {
            const depth = calculateDepth(
                obj._isoGx,
                obj._isoGy,
                obj._isoLayerOffset
            );
            obj.setDepth(depth);
        }
        
        this._needsSort = false;
    }
    
    /**
     * 정렬 필요 표시
     */
    markDirty() {
        this._needsSort = true;
    }
    
    /**
     * 모든 객체 제거
     */
    clear() {
        this.objects = [];
    }
}
