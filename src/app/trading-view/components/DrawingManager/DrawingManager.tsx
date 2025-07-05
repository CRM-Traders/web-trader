"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Settings,
} from "lucide-react";

interface DrawingObject {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  lineWidth: number;
  style: "solid" | "dashed" | "dotted";
  points: Array<{ x: number; y: number; time?: string; price?: number }>;
  text?: string;
  created: Date;
}

interface DrawingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  drawings: DrawingObject[];
  onUpdateDrawing: (id: string, updates: Partial<DrawingObject>) => void;
  onDeleteDrawing: (id: string) => void;
  onDuplicateDrawing: (id: string) => void;
  onClearAll: () => void;
}

export function DrawingManager({
  isOpen,
  onClose,
  drawings,
  onUpdateDrawing,
  onDeleteDrawing,
  onDuplicateDrawing,
  onClearAll,
}: DrawingManagerProps) {
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredDrawings = drawings.filter((drawing) => {
    if (filter === "all") return true;
    if (filter === "visible") return drawing.visible;
    if (filter === "hidden") return !drawing.visible;
    if (filter === "locked") return drawing.locked;
    return drawing.type === filter;
  });

  const handleToggleVisibility = (id: string) => {
    const drawing = drawings.find((d) => d.id === id);
    if (drawing) {
      onUpdateDrawing(id, { visible: !drawing.visible });
    }
  };

  const handleToggleLock = (id: string) => {
    const drawing = drawings.find((d) => d.id === id);
    if (drawing) {
      onUpdateDrawing(id, { locked: !drawing.locked });
    }
  };

  const handleColorChange = (id: string, color: string) => {
    onUpdateDrawing(id, { color });
  };

  const handleLineWidthChange = (id: string, lineWidth: number) => {
    onUpdateDrawing(id, { lineWidth });
  };

  const handleStyleChange = (
    id: string,
    style: "solid" | "dashed" | "dotted"
  ) => {
    onUpdateDrawing(id, { style });
  };

  if (!isOpen) return null;

  const selectedDrawingObj = drawings.find((d) => d.id === selectedDrawing);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle>Drawing Manager</CardTitle>
          <CardDescription>
            Manage your chart drawings and annotations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 h-[60vh]">
            {/* Drawings List */}
            <div className="col-span-8 border-r">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter drawings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Drawings</SelectItem>
                        <SelectItem value="visible">Visible Only</SelectItem>
                        <SelectItem value="hidden">Hidden Only</SelectItem>
                        <SelectItem value="locked">Locked Only</SelectItem>
                        <Separator />
                        <SelectItem value="line">Lines</SelectItem>
                        <SelectItem value="rectangle">Shapes</SelectItem>
                        <SelectItem value="text">Text & Notes</SelectItem>
                        <SelectItem value="fib-retracement">
                          Fibonacci
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Badge variant="outline">
                      {filteredDrawings.length} items
                    </Badge>
                  </div>

                  <Button variant="destructive" size="sm" onClick={onClearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(60vh-120px)]">
                {filteredDrawings.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p>No drawings found</p>
                      <p className="text-sm">
                        Start drawing on the chart to see them here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredDrawings.map((drawing) => (
                      <div
                        key={drawing.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                          selectedDrawing === drawing.id
                            ? "bg-muted border-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedDrawing(drawing.id)}
                      >
                        <div
                          className="w-4 h-4 rounded border-2"
                          style={{
                            backgroundColor: drawing.color,
                            borderColor: drawing.color,
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {drawing.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {drawing.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {drawing.created.toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(drawing.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {drawing.visible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(drawing.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {drawing.locked ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateDrawing(drawing.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDrawing(drawing.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Properties Panel */}
            <div className="col-span-4">
              <div className="p-4 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Properties
                </h3>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto h-[calc(60vh-60px)]">
                {selectedDrawingObj ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="drawing-name">Name</Label>
                      <Input
                        id="drawing-name"
                        value={selectedDrawingObj.name}
                        onChange={(e) =>
                          onUpdateDrawing(selectedDrawing!, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drawing-color">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="drawing-color"
                          type="color"
                          value={selectedDrawingObj.color}
                          onChange={(e) =>
                            handleColorChange(selectedDrawing!, e.target.value)
                          }
                          className="w-16 h-10"
                        />
                        <Input
                          value={selectedDrawingObj.color}
                          onChange={(e) =>
                            handleColorChange(selectedDrawing!, e.target.value)
                          }
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="line-width">Line Width</Label>
                      <Select
                        value={selectedDrawingObj.lineWidth.toString()}
                        onValueChange={(value) =>
                          handleLineWidthChange(
                            selectedDrawing!,
                            Number.parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1px</SelectItem>
                          <SelectItem value="2">2px</SelectItem>
                          <SelectItem value="3">3px</SelectItem>
                          <SelectItem value="4">4px</SelectItem>
                          <SelectItem value="5">5px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="line-style">Line Style</Label>
                      <Select
                        value={selectedDrawingObj.style}
                        onValueChange={(value: "solid" | "dashed" | "dotted") =>
                          handleStyleChange(selectedDrawing!, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Visibility & Lock</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            selectedDrawingObj.visible ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleToggleVisibility(selectedDrawing!)
                          }
                          className="flex-1"
                        >
                          {selectedDrawingObj.visible ? (
                            <Eye className="h-4 w-4 mr-2" />
                          ) : (
                            <EyeOff className="h-4 w-4 mr-2" />
                          )}
                          {selectedDrawingObj.visible ? "Visible" : "Hidden"}
                        </Button>

                        <Button
                          variant={
                            selectedDrawingObj.locked ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleToggleLock(selectedDrawing!)}
                          className="flex-1"
                        >
                          {selectedDrawingObj.locked ? (
                            <Lock className="h-4 w-4 mr-2" />
                          ) : (
                            <Unlock className="h-4 w-4 mr-2" />
                          )}
                          {selectedDrawingObj.locked ? "Locked" : "Unlocked"}
                        </Button>
                      </div>
                    </div>

                    {selectedDrawingObj.text && (
                      <div className="space-y-2">
                        <Label htmlFor="drawing-text">Text</Label>
                        <Input
                          id="drawing-text"
                          value={selectedDrawingObj.text}
                          onChange={(e) =>
                            onUpdateDrawing(selectedDrawing!, {
                              text: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDuplicateDrawing(selectedDrawing!)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            onDeleteDrawing(selectedDrawing!);
                            setSelectedDrawing(null);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Select a drawing to edit its properties</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
