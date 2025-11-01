import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Upload,
  Download,
  Undo,
  Redo,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Socket } from 'socket.io-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface LiveClassWhiteboardProps {
  batchId: string;
  socket: Socket;
  isTeacher: boolean;
  onClose: () => void;
}

type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'select';

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'White', value: '#FFFFFF' },
];

export const LiveClassWhiteboard: React.FC<LiveClassWhiteboardProps> = ({
  batchId,
  socket,
  isTeacher,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const { toast } = useToast();
  const isDrawingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 700,
      backgroundColor: '#ffffff',
      isDrawingMode: false,
    });

    // Enable selection for all users if teacher allows
    fabricCanvas.selection = true;

    setCanvas(fabricCanvas);

    // Save initial state
    const initialState = JSON.stringify(fabricCanvas.toJSON());
    setHistory([initialState]);
    setHistoryStep(0);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle tool change
  useEffect(() => {
    if (!canvas) return;

    // Reset drawing mode
    canvas.isDrawingMode = false;

    // Remove all event listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    switch (tool) {
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = brushSize * 3;
        break;

      case 'rectangle':
        setupShapeDrawing('rect');
        break;

      case 'circle':
        setupShapeDrawing('circle');
        break;

      case 'line':
        setupShapeDrawing('line');
        break;

      case 'text':
        setupTextTool();
        break;

      case 'select':
        canvas.selection = true;
        break;

      default:
        break;
    }
  }, [tool, canvas, color, brushSize]);

  // Setup shape drawing
  const setupShapeDrawing = (shapeType: 'rect' | 'circle' | 'line') => {
    if (!canvas) return;

    let shape: fabric.Object | null = null;
    let startX = 0;
    let startY = 0;

    canvas.on('mouse:down', (options) => {
      if (!isTeacher && !options.target) return;

      isDrawingRef.current = true;
      const pointer = canvas.getPointer(options.e);
      startX = pointer.x;
      startY = pointer.y;

      const commonProps = {
        left: startX,
        top: startY,
        stroke: color,
        strokeWidth: brushSize,
        fill: 'transparent',
        selectable: true,
      };

      if (shapeType === 'rect') {
        shape = new fabric.Rect({
          ...commonProps,
          width: 0,
          height: 0,
        });
      } else if (shapeType === 'circle') {
        shape = new fabric.Circle({
          ...commonProps,
          radius: 0,
        });
      } else if (shapeType === 'line') {
        shape = new fabric.Line([startX, startY, startX, startY], {
          ...commonProps,
        });
      }

      if (shape) {
        canvas.add(shape);
        canvas.renderAll();
      }
    });

    canvas.on('mouse:move', (options) => {
      if (!isDrawingRef.current || !shape) return;

      const pointer = canvas.getPointer(options.e);

      if (shapeType === 'rect' && shape instanceof fabric.Rect) {
        const width = pointer.x - startX;
        const height = pointer.y - startY;
        shape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startX,
          top: height < 0 ? pointer.y : startY,
        });
      } else if (shapeType === 'circle' && shape instanceof fabric.Circle) {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
        );
        shape.set({ radius });
      } else if (shapeType === 'line' && shape instanceof fabric.Line) {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;

      if (shape) {
        // Broadcast shape to other users
        broadcastCanvasState();
        saveState();
      }

      shape = null;
    });
  };

  // Setup text tool
  const setupTextTool = () => {
    if (!canvas) return;

    canvas.on('mouse:down', (options) => {
      if (!isTeacher && options.target) return;

      const pointer = canvas.getPointer(options.e);

      const text = new fabric.IText('Type here...', {
        left: pointer.x,
        top: pointer.y,
        fill: color,
        fontSize: brushSize * 8,
        fontFamily: 'Arial',
        selectable: true,
        editable: true,
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();

      // Broadcast to other users
      broadcastCanvasState();
      saveState();
    });
  };

  // Save canvas state to history
  const saveState = useCallback(() => {
    if (!canvas) return;

    const newState = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newState);

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryStep((prev) => prev + 1);
    }

    setHistory(newHistory);
  }, [canvas, history, historyStep]);

  // Undo
  const handleUndo = () => {
    if (!canvas || historyStep <= 0) return;

    setHistoryStep((prev) => prev - 1);
    const prevState = history[historyStep - 1];
    canvas.loadFromJSON(prevState, () => {
      canvas.renderAll();
      broadcastCanvasState();
    });
  };

  // Redo
  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;

    setHistoryStep((prev) => prev + 1);
    const nextState = history[historyStep + 1];
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      broadcastCanvasState();
    });
  };

  // Clear canvas
  const handleClear = () => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    saveState();
    broadcastCanvasState();

    toast({
      title: 'Whiteboard Cleared',
      description: 'The whiteboard has been cleared.',
    });
  };

  // Upload image to whiteboard
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;

      fabric.Image.fromURL(event.target.result as string, (img) => {
        // Scale image to fit canvas
        const maxWidth = canvas.width! * 0.8;
        const maxHeight = canvas.height! * 0.8;

        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1);

        img.scale(scale);
        img.set({
          left: canvas.width! / 2 - (img.width! * scale) / 2,
          top: canvas.height! / 2 - (img.height! * scale) / 2,
          selectable: true,
        });

        canvas.add(img);
        canvas.renderAll();
        saveState();
        broadcastCanvasState();

        toast({
          title: 'Image Uploaded',
          description: 'Image has been added to the whiteboard.',
        });
      });
    };

    reader.readAsDataURL(file);
  };

  // Save/Export whiteboard as image
  const handleSaveImage = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${batchId}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast({
      title: 'Whiteboard Saved',
      description: 'Whiteboard has been saved as an image.',
    });
  };

  // Broadcast canvas state to other users via Socket.IO
  const broadcastCanvasState = useCallback(() => {
    if (!canvas || !socket) return;

    const canvasJSON = canvas.toJSON();

    socket.emit('whiteboard-draw', {
      batchId,
      eventType: 'canvas-update',
      eventData: canvasJSON,
    });
  }, [canvas, socket, batchId]);

  // Listen for whiteboard events from other users
  useEffect(() => {
    if (!socket || !canvas) return;

    const handleWhiteboardEvent = (data: any) => {
      if (data.eventType === 'canvas-update') {
        canvas.loadFromJSON(data.eventData, () => {
          canvas.renderAll();
        });
      }
    };

    socket.on('whiteboard-event', handleWhiteboardEvent);

    return () => {
      socket.off('whiteboard-event', handleWhiteboardEvent);
    };
  }, [socket, canvas]);

  // Auto-save on path created (for drawing)
  useEffect(() => {
    if (!canvas) return;

    const handlePathCreated = () => {
      saveState();
      broadcastCanvasState();
    };

    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, [canvas, saveState, broadcastCanvasState]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 bg-gray-50">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Interactive Whiteboard</h3>
          {!isTeacher && (
            <span className="text-xs text-gray-500 ml-2">(View Only - Teacher controls)</span>
          )}
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-white flex-wrap">
        {/* Drawing Tools */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            onClick={() => setTool('select')}
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Select"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool('pen')}
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Pen"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool('eraser')}
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        {/* Shape Tools */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            onClick={() => setTool('rectangle')}
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool('circle')}
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool('line')}
            variant={tool === 'line' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool('text')}
            variant={tool === 'text' ? 'default' : 'outline'}
            size="sm"
            disabled={!isTeacher}
            title="Text"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        {/* Color Picker */}
        <div className="flex gap-1 border-r pr-2">
          <Select value={color} onValueChange={setColor} disabled={!isTeacher}>
            <SelectTrigger className="w-[120px] h-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: c.value }} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 border-r pr-2">
          <span className="text-sm text-gray-600">Size:</span>
          <div className="w-32">
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={1}
              max={20}
              step={1}
              disabled={!isTeacher}
            />
          </div>
          <span className="text-sm font-medium w-6">{brushSize}</span>
        </div>

        {/* History Controls */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            onClick={handleUndo}
            variant="outline"
            size="sm"
            disabled={!isTeacher || historyStep <= 0}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleRedo}
            variant="outline"
            size="sm"
            disabled={!isTeacher || historyStep >= history.length - 1}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* File Operations */}
        <div className="flex gap-1 border-r pr-2">
          <label htmlFor="whiteboard-upload">
            <Button variant="outline" size="sm" disabled={!isTeacher} title="Upload Image" asChild>
              <span>
                <Upload className="w-4 h-4" />
              </span>
            </Button>
          </label>
          <input
            id="whiteboard-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={!isTeacher}
          />
          <Button
            onClick={handleSaveImage}
            variant="outline"
            size="sm"
            title="Save as Image"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Clear */}
        <Button
          onClick={handleClear}
          variant="destructive"
          size="sm"
          disabled={!isTeacher}
          title="Clear Whiteboard"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <CardContent className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex items-center justify-center min-h-full">
          <canvas ref={canvasRef} className="border border-gray-300 shadow-lg bg-white" />
        </div>
      </CardContent>
    </Card>
  );
};
