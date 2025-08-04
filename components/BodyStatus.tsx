import React from 'react';
import type { BodyPart, BodyPartStatus } from '../types';

interface BodyStatusProps {
  bodyParts: Record<BodyPart, BodyPartStatus>;
  interactive?: boolean;
  onPartClick?: (part: BodyPart) => void;
}

const statusColors: Record<BodyPartStatus, string> = {
  'Khỏe Mạnh': 'rgba(74, 222, 128, 0.4)',    // green-400
  'Bị Thương': 'rgba(250, 204, 21, 0.6)',    // yellow-400
  'Nguy Kịch': 'rgba(239, 68, 68, 0.7)',     // red-500
  'Bị Cắt Đứt': 'rgba(107, 114, 128, 0.8)', // gray-500
};

const BodyPartComponent: React.FC<{
  part: BodyPart;
  d: string;
  fill: string;
  onClick?: () => void;
  interactive?: boolean;
}> = ({ part, d, fill, onClick, interactive }) => (
    <g 
        onClick={onClick} 
        className={interactive ? 'cursor-pointer transition-all duration-200 hover:stroke-yellow-400 hover:stroke-2' : ''}
        aria-label={interactive ? `Nhắm vào ${part}`: part}
    >
        <title>{part}</title>
        <path d={d} fill={fill} stroke="#9ca3af" strokeWidth="1" />
    </g>
);

const BodyStatus: React.FC<BodyStatusProps> = ({ bodyParts, interactive = false, onPartClick }) => {
  return (
    <div className="p-2 border border-gray-700 bg-black/20 rounded-md">
        <svg viewBox="0 0 100 130" className="w-full h-auto" aria-label="Sơ đồ trạng thái cơ thể">
            <title>Sơ đồ cơ thể</title>
            
            <g 
                onClick={() => onPartClick?.('head')}
                className={interactive ? 'cursor-pointer transition-all duration-200 hover:stroke-yellow-400 hover:stroke-2' : ''}
                aria-label={interactive ? `Nhắm vào đầu` : 'đầu'}
            >
                <title>Đầu</title>
                <circle cx="50" cy="25" r="15" fill={statusColors[bodyParts.head]} stroke="#9ca3af" strokeWidth="1" />
            </g>
            
            <BodyPartComponent part="torso" d="M 38,40 L 62,40 L 68,85 L 32,85 Z" fill={statusColors[bodyParts.torso]} onClick={() => onPartClick?.('torso')} interactive={interactive} />
            <BodyPartComponent part="leftArm" d="M 38,45 L 28,50 L 20,80 L 28,85 Z" fill={statusColors[bodyParts.leftArm]} onClick={() => onPartClick?.('leftArm')} interactive={interactive} />
            <BodyPartComponent part="rightArm" d="M 62,45 L 72,50 L 80,80 L 72,85 Z" fill={statusColors[bodyParts.rightArm]} onClick={() => onPartClick?.('rightArm')} interactive={interactive} />
            <BodyPartComponent part="leftLeg" d="M 32,85 L 48,85 L 40,125 L 25,120 Z" fill={statusColors[bodyParts.leftLeg]} onClick={() => onPartClick?.('leftLeg')} interactive={interactive} />
            <BodyPartComponent part="rightLeg" d="M 68,85 L 52,85 L 60,125 L 75,120 Z" fill={statusColors[bodyParts.rightLeg]} onClick={() => onPartClick?.('rightLeg')} interactive={interactive} />
        </svg>
    </div>
  );
};

export default BodyStatus;