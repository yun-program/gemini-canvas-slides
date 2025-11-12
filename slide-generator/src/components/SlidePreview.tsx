import React from 'react';
import type { Slide } from '../types';

interface SlidePreviewProps {
  slide: Slide;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slide }) => {
  return (
    <div className="bg-white rounded-lg shadow-2xl p-12 aspect-[16/9] flex flex-col justify-center max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Title */}
        <h1 className="text-5xl font-bold text-gray-900 border-b-4 border-blue-600 pb-4">
          {slide.title}
        </h1>

        {/* Summary */}
        <p className="text-xl text-gray-700 leading-relaxed">
          {slide.summary}
        </p>

        {/* Bullet Points */}
        <ul className="space-y-4 pl-6">
          {slide.bulletPoints.map((point, index) => (
            <li
              key={index}
              className="text-lg text-gray-800 flex items-start"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold mr-4 flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="flex-1 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
