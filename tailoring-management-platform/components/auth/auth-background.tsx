'use client';

export function AuthBackground() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="60" height="60" viewBox="0 0 60 60" className="h-full w-full">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="m 60 0 l 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="m 0 60 l 60 0" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-gray-400" />
        </svg>
      </div>
    </div>
  );
}