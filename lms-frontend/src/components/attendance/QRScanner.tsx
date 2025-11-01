import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scan, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onSuccess?: () => void;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    attendance: {
      id: string;
      status: string;
      markedAt: string;
    };
  };
}

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedToken, setScannedToken] = useState<string>('');
  const [manualEntry, setManualEntry] = useState(false);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get user's location
  const getLocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          resolve(coords);
        },
        error => {
          reject(new Error(`Unable to retrieve location: ${error.message}`));
        }
      );
    });
  };

  // Mark attendance via QR code
  const markAttendance = async (token: string) => {
    try {
      setIsSubmitting(true);

      // Get location first
      const locationData = await getLocation();

      const response = await fetch('/api/attendance/qr/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          token,
          location: locationData,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message ?? 'Attendance marked successfully',
        });
        setScannedToken('');
        setManualEntry(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.message ?? 'Failed to mark attendance');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    if (scannedToken.trim()) {
      void markAttendance(scannedToken);
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid token',
        variant: 'destructive',
      });
    }
  };

  // Initialize QR scanner (would use html5-qrcode library in production)
  const startScanning = async () => {
    setIsScanning(true);
    
    // Request location permission first
    try {
      await getLocation();
      toast({
        title: 'Location Access',
        description: 'Location permission granted',
      });
      
      // In production, you would initialize html5-qrcode here
      // For now, we'll show manual entry option
      setManualEntry(true);
    } catch (error) {
      toast({
        title: 'Location Required',
        description: error instanceof Error ? error.message : 'Location permission is required for attendance',
        variant: 'destructive',
      });
      setIsScanning(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !manualEntry ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Scan className="h-24 w-24 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Scan the QR code displayed by your teacher to mark attendance
            </p>
            <Button
              onClick={() => {
                void startScanning();
              }}
              className="w-full"
              size="lg"
            >
              <Scan className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera view placeholder */}
            {isScanning && !manualEntry && (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Camera view would appear here</p>
              </div>
            )}

            {/* Location status */}
            {location && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Location detected</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </AlertDescription>
              </Alert>
            )}

            {/* Manual entry option */}
            {manualEntry && (
              <div className="space-y-3">
                <label htmlFor="token" className="text-sm font-medium">
                  Enter QR Token
                </label>
                <input
                  id="token"
                  type="text"
                  placeholder="Enter token from QR code"
                  value={scannedToken}
                  onChange={e => {
                    setScannedToken(e.target.value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setManualEntry(false);
                      setIsScanning(false);
                      setScannedToken('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={isSubmitting || !scannedToken.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}

            {/* Error states */}
            {!location && isScanning && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Location access is required to mark attendance
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
