import React from 'react';
import type { Enemy, BodyPart } from '../types';
import BodyStatus from './BodyStatus';
import StatDisplay from './StatDisplay';

interface EnemyDisplayProps {
  enemy: Enemy;
  onTargetPart: (enemyId: string, part: BodyPart) => void;
}

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy, onTargetPart }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-700 bg-red-900/10 rounded-lg">
      <div className="w-full sm:w-1/3">
        <BodyStatus 
            bodyParts={enemy.bodyParts} 
            interactive={true}
            onPartClick={(part) => onTargetPart(enemy.id, part)}
        />
      </div>
      <div className="w-full sm:w-2/3 flex flex-col">
        <h4 className="text-lg font-bold text-red-400">{enemy.name}</h4>
        <p className="text-sm text-gray-400 italic mb-2">{enemy.description}</p>
        <StatDisplay
          label="HP"
          value={enemy.stats.hp}
          maxValue={enemy.stats.maxHp}
          color="bg-red-500"
          className="mb-3"
        />
        <div className="mt-auto flex flex-col gap-2">
          {enemy.statusEffects && enemy.statusEffects.length > 0 && (
            <div className="bg-black/40 p-2 rounded border border-gray-600">
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Hiệu Ứng Trạng Thái</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {enemy.statusEffects.map((effect, index) => (
                  <span key={index} className="text-xs bg-red-900/70 text-red-200 px-2 py-1 rounded-md">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-black/40 p-2 rounded border border-gray-600">
            <p className="text-xs text-yellow-400/80 font-bold uppercase tracking-wider">Hành động sắp tới</p>
            <p className="text-yellow-300 italic">{enemy.telegraphedAction}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnemyDisplay;