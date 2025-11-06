'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Flashlight, 
  FlipHorizontal, 
  Download, 
  X, 
  Check, 
  RotateCcw,
  Zap,
  ZapOff,
  Grid3X3,
  Maximize2,
  FileText,
  Ruler,
  User
} from 'lucide-react';
import { TouchButton } from './MobileComponents';
import { usePWA } from './PWAProvider';

interface MobileScannerProps {
  onCapture: (imageData: string, type: ScanType) => void;
  onClose: () => void;
  defaultType?: ScanType;
}

type ScanType = 'document' | 'measurement' | 'id' | 'general';

interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment';
    width?: { ideal: number };
    height?: { ideal: number };
  };
}

export default function MobileScanner({ onCapture, onClose, defaultType = 'document' }: MobileScannerProps) {
  const { capabilities } = usePWA();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanType, setScanType] = useState<ScanType>(defaultType);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [currentCamera, setCurrentCamera] = useState<'front' | 'back'>('back');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize camera
  const initCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      setError(null);
      
      if (!capabilities.hasCamera) {
        throw new Error('Camera not available on this device');
      }

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: CameraConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        
        // Enable flash if available
        const track = newStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.torch && flashEnabled) {
          await track.applyConstraints({
            advanced: [{ torch: true } as any]
          });
        }
      }
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, [stream, capabilities.hasCamera, flashEnabled]);

  // Initialize camera on mount
  useEffect(() => {
    initCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle flash
  const toggleFlash = async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        const newFlashState = !flashEnabled;
        await track.applyConstraints({
          advanced: [{ torch: newFlashState } as any]
        });
        setFlashEnabled(newFlashState);
      }
    } catch (err) {
      console.error('Flash toggle failed:', err);
    }
  };

  // Switch camera
  const switchCamera = () => {
    const newCamera = currentCamera === 'front' ? 'back' : 'front';
    const facingMode = newCamera === 'front' ? 'user' : 'environment';
    setCurrentCamera(newCamera);
    initCamera(facingMode);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply scan type specific processing
    applyScanTypeProcessing(context, canvas);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    setIsCapturing(false);
  };

  // Apply scan type specific processing
  const applyScanTypeProcessing = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (scanType) {
      case 'document':
        // Enhance contrast and brightness for documents
        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast
          data[i] = Math.min(255, data[i] * 1.2);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
          data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Blue
        }
        break;
        
      case 'measurement':
        // Add measurement guides overlay
        drawMeasurementGuides(context, canvas);
        break;
        
      case 'id':
        // Enhance for ID documents
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale with high contrast
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          const enhanced = gray > 128 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7);
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }
        break;
    }

    context.putImageData(imageData, 0, 0);
  };

  // Draw measurement guides
  const drawMeasurementGuides = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    context.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);

    // Center cross
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    context.beginPath();
    context.moveTo(centerX - 50, centerY);
    context.lineTo(centerX + 50, centerY);
    context.moveTo(centerX, centerY - 50);
    context.lineTo(centerX, centerY + 50);
    context.stroke();

    // Corner markers
    const margin = 50;
    const size = 20;
    
    // Top-left
    context.beginPath();
    context.moveTo(margin, margin + size);
    context.lineTo(margin, margin);
    context.lineTo(margin + size, margin);
    context.stroke();

    // Top-right
    context.beginPath();
    context.moveTo(canvas.width - margin - size, margin);
    context.lineTo(canvas.width - margin, margin);
    context.lineTo(canvas.width - margin, margin + size);
    context.stroke();

    // Bottom-left
    context.beginPath();
    context.moveTo(margin, canvas.height - margin - size);
    context.lineTo(margin, canvas.height - margin);
    context.lineTo(margin + size, canvas.height - margin);
    context.stroke();

    // Bottom-right
    context.beginPath();
    context.moveTo(canvas.width - margin - size, canvas.height - margin);
    context.lineTo(canvas.width - margin, canvas.height - margin);
    context.lineTo(canvas.width - margin, canvas.height - margin - size);
    context.stroke();
  };

  // Confirm capture
  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage, scanType);
      onClose();
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const scanTypeConfig = {
    document: { icon: FileText, label: 'Document', color: 'text-blue-600' },
    measurement: { icon: Ruler, label: 'Measurement', color: 'text-green-600' },
    id: { icon: User, label: 'ID Card', color: 'text-purple-600' },
    general: { icon: Camera, label: 'General', color: 'text-gray-600' },
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <TouchButton onClick={onClose} variant="primary" fullWidth>
            Close
          </TouchButton>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Camera Preview */}
      <div className="relative w-full h-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Grid overlay */}
        {gridEnabled && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="33.33%" height="33.33%" patternUnits="objectBoundingBox">
                  <path d="M 33.33 0 L 33.33 33.33 M 0 33.33 L 33.33 33.33" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        )}

        {/* Scan type specific overlays */}
        {scanType === 'measurement' && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 h-0.5 bg-purple-500"></div>
              <div className="w-0.5 h-12 bg-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            {/* Corner guides */}
            <div className="absolute top-12 left-12 w-6 h-6 border-l-2 border-t-2 border-purple-500"></div>
            <div className="absolute top-12 right-12 w-6 h-6 border-r-2 border-t-2 border-purple-500"></div>
            <div className="absolute bottom-12 left-12 w-6 h-6 border-l-2 border-b-2 border-purple-500"></div>
            <div className="absolute bottom-12 right-12 w-6 h-6 border-r-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Captured image preview */}
        {capturedImage && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            {/* Close button */}
            <TouchButton
              onClick={onClose}
              variant="secondary"
              size="sm"
              className="bg-black/30 text-white border-white/20"
            >
              <X className="w-5 h-5" />
            </TouchButton>

            {/* Scan type selector */}
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
              {Object.entries(scanTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setScanType(type as ScanType)}
                  className={`p-2 rounded-lg transition-colors ${
                    scanType === type 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <config.icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* Utility controls */}
            <div className="flex items-center gap-2">
              <TouchButton
                onClick={toggleFullscreen}
                variant="secondary"
                size="sm"
                className="bg-black/30 text-white border-white/20"
              >
                <Maximize2 className="w-5 h-5" />
              </TouchButton>
              
              <TouchButton
                onClick={() => setGridEnabled(!gridEnabled)}
                variant="secondary"
                size="sm"
                className={`border-white/20 ${
                  gridEnabled ? 'bg-white/20 text-white' : 'bg-black/30 text-white/60'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </TouchButton>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          {!capturedImage ? (
            // Camera controls
            <div className="flex items-center justify-between">
              {/* Flash toggle */}
              <TouchButton
                onClick={toggleFlash}
                variant="secondary"
                size="sm"
                className={`border-white/20 ${
                  flashEnabled ? 'bg-yellow-500 text-white' : 'bg-black/30 text-white'
                }`}
              >
                {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
              </TouchButton>

              {/* Capture button */}
              <TouchButton
                onClick={capturePhoto}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/20 hover:bg-gray-100 disabled:opacity-50"
              >
                {isCapturing ? (
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                )}
              </TouchButton>

              {/* Camera switch */}
              <TouchButton
                onClick={switchCamera}
                variant="secondary"
                size="sm"
                className="bg-black/30 text-white border-white/20"
              >
                <FlipHorizontal className="w-5 h-5" />
              </TouchButton>
            </div>
          ) : (
            // Confirmation controls
            <div className="flex items-center justify-center gap-6">
              <TouchButton
                onClick={retakePhoto}
                variant="secondary"
                className="bg-black/30 text-white border-white/20 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </TouchButton>

              <TouchButton
                onClick={confirmCapture}
                variant="success"
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use Photo
              </TouchButton>
            </div>
          )}
        </div>

        {/* Scan type indicator */}
        <div className="absolute top-20 left-4 bg-black/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            {React.createElement(scanTypeConfig[scanType].icon, { className: 'w-4 h-4' })}
            <span className="text-sm font-medium">{scanTypeConfig[scanType].label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}