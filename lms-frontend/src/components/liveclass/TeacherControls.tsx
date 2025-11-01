import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  UserX,
  MicOff,
  MessageSquareOff,
  Spotlight,
  Settings,
  PhoneOff,
  Volume2,
  VolumeX,
  Users,
} from 'lucide-react';

interface TeacherControlsProps {
  batchId: string;
  socket: Socket;
  participants: Array<{ userId: string; userName: string; isMuted?: boolean }>;
  onEndClass: () => void;
}

export const TeacherControls: React.FC<TeacherControlsProps> = ({
  batchId,
  socket,
  participants,
  onEndClass,
}) => {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [handsEnabled, setHandsEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const { toast } = useToast();

  const removeStudent = (userId: string) => {
    if (!socket) return;

    socket.emit('remove-student', {
      batchId,
      userId,
    });

    toast({
      title: 'Student Removed',
      description: 'The student has been removed from the class',
    });
  };

  const muteStudent = (userId: string) => {
    if (!socket) return;

    socket.emit('mute-student', {
      batchId,
      userId,
    });

    toast({
      title: 'Student Muted',
      description: 'The student has been muted',
    });
  };

  const muteAll = () => {
    if (!socket) return;

    socket.emit('mute-all', { batchId });

    toast({
      title: 'All Muted',
      description: 'All students have been muted',
    });
  };

  const unmuteAll = () => {
    if (!socket) return;

    socket.emit('unmute-all', { batchId });

    toast({
      title: 'All Unmuted',
      description: 'All students have been unmuted',
    });
  };

  const spotlightStudent = (userId: string) => {
    if (!socket) return;

    socket.emit('spotlight-student', {
      batchId,
      userId,
    });

    toast({
      title: 'Student Spotlighted',
      description: 'The student is now in spotlight mode',
    });
  };

  const toggleChat = () => {
    if (!socket) return;

    const newState = !chatEnabled;
    setChatEnabled(newState);

    socket.emit('toggle-chat', {
      batchId,
      enabled: newState,
    });

    toast({
      title: newState ? 'Chat Enabled' : 'Chat Disabled',
      description: newState
        ? 'Students can now send messages'
        : 'Students cannot send messages',
    });
  };

  const toggleRecording = () => {
    if (!socket) return;

    const newState = !recordingEnabled;
    setRecordingEnabled(newState);

    socket.emit('toggle-recording', {
      batchId,
      enabled: newState,
    });

    toast({
      title: newState ? 'Recording Started' : 'Recording Stopped',
      description: newState
        ? 'Class is now being recorded'
        : 'Recording has been stopped',
    });
  };

  const confirmEndClass = () => {
    setShowEndDialog(false);
    onEndClass();
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={muteAll} variant="outline" size="sm" className="w-full">
              <MicOff className="w-4 h-4 mr-2" />
              Mute All
            </Button>
            <Button onClick={unmuteAll} variant="outline" size="sm" className="w-full">
              <Volume2 className="w-4 h-4 mr-2" />
              Unmute All
            </Button>
            <Button onClick={toggleChat} variant="outline" size="sm" className="w-full">
              {chatEnabled ? (
                <MessageSquareOff className="w-4 h-4 mr-2" />
              ) : (
                <Volume2 className="w-4 h-4 mr-2" />
              )}
              {chatEnabled ? 'Disable' : 'Enable'} Chat
            </Button>
            <Button
              onClick={() => setShowSettingsDialog(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>

          <Button
            onClick={() => setShowEndDialog(true)}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Class
          </Button>
        </CardContent>
      </Card>

      {/* Student Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Manage Students ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.userId} value={p.userId}>
                  {p.userName}
                  {p.isMuted && ' (Muted)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStudent && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                onClick={() => muteStudent(selectedStudent)}
                variant="outline"
                size="sm"
              >
                <MicOff className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => spotlightStudent(selectedStudent)}
                variant="outline"
                size="sm"
              >
                <Spotlight className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => removeStudent(selectedStudent)}
                variant="destructive"
                size="sm"
              >
                <UserX className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* End Class Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Class?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this class? All participants will be disconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmEndClass}>
              End Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Class Settings</DialogTitle>
            <DialogDescription>Configure class features and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="chat-enabled">Student Chat</Label>
              <Switch
                id="chat-enabled"
                checked={chatEnabled}
                onCheckedChange={toggleChat}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="hands-enabled">Raise Hand</Label>
              <Switch
                id="hands-enabled"
                checked={handsEnabled}
                onCheckedChange={setHandsEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reactions-enabled">Reactions</Label>
              <Switch
                id="reactions-enabled"
                checked={reactionsEnabled}
                onCheckedChange={setReactionsEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recording-enabled">Recording</Label>
              <Switch
                id="recording-enabled"
                checked={recordingEnabled}
                onCheckedChange={toggleRecording}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
