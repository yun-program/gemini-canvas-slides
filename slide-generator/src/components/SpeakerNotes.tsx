import React from 'react';

interface SpeakerNotesProps {
  notes: string;
}

export const SpeakerNotes: React.FC<SpeakerNotesProps> = ({ notes }) => {
  return (
    <div className="bg-amber-50 rounded-lg shadow-lg p-6 max-w-4xl mx-auto border-l-4 border-amber-500">
      <div className="flex items-center mb-4">
        <svg
          className="w-6 h-6 text-amber-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-amber-900">発表者向けメモ</h2>
      </div>
      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
        {notes}
      </div>
    </div>
  );
};
