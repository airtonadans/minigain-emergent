import React from 'react';

export const Card = ({ title, value, color = 'text-gray-900', helpText }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex-1 text-center relative group">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {helpText && (
      <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {helpText}
      </div>
    )}
  </div>
);
