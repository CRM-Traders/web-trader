"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Crosshair,
  Minus,
  TrendingUp,
  Type,
  Square,
  Circle,
  Triangle,
  Ruler,
  Clock,
  Target,
  Zap,
  RotateCcw,
  Trash2,
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  Waves,
  Activity,
  BarChart3,
  PieChart,
  Hexagon,
  Pentagon,
  Star,
  Heart,
  Bookmark,
  Flag,
} from "lucide-react";

interface DrawingTool {
  id: string;
  name: string;
  icon: any;
  category: string;
  shortcut?: string;
  active?: boolean;
}

interface DrawingToolbarProps {
  onToolSelect: (toolId: string) => void;
  activeTool: string;
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function DrawingToolbar({
  onToolSelect,
  activeTool,
  onClearAll,
  onUndo,
  onRedo,
}: DrawingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const drawingTools: DrawingTool[] = [
    // Cursor & Selection
    {
      id: "cursor",
      name: "Cursor",
      icon: MousePointer2,
      category: "selection",
      shortcut: "Esc",
    },
    {
      id: "crosshair",
      name: "Crosshair",
      icon: Crosshair,
      category: "selection",
      shortcut: "Alt+C",
    },

    // Lines
    {
      id: "line",
      name: "Trend Line",
      icon: TrendingUp,
      category: "lines",
      shortcut: "Alt+T",
    },
    {
      id: "horizontal",
      name: "Horizontal Line",
      icon: Minus,
      category: "lines",
      shortcut: "Alt+H",
    },
    {
      id: "vertical",
      name: "Vertical Line",
      icon: ArrowUp,
      category: "lines",
      shortcut: "Alt+V",
    },
    {
      id: "ray",
      name: "Ray",
      icon: ArrowRight,
      category: "lines",
      shortcut: "Alt+R",
    },
    {
      id: "extended",
      name: "Extended Line",
      icon: ArrowLeft,
      category: "lines",
    },
    {
      id: "parallel",
      name: "Parallel Channel",
      icon: Activity,
      category: "lines",
    },

    // Shapes
    {
      id: "rectangle",
      name: "Rectangle",
      icon: Square,
      category: "shapes",
      shortcut: "Alt+S",
    },
    {
      id: "circle",
      name: "Circle",
      icon: Circle,
      category: "shapes",
      shortcut: "Alt+O",
    },
    { id: "triangle", name: "Triangle", icon: Triangle, category: "shapes" },
    { id: "polygon", name: "Polygon", icon: Hexagon, category: "shapes" },
    { id: "ellipse", name: "Ellipse", icon: Pentagon, category: "shapes" },

    // Fibonacci Tools
    {
      id: "fib-retracement",
      name: "Fibonacci Retracement",
      icon: Waves,
      category: "fibonacci",
    },
    {
      id: "fib-extension",
      name: "Fibonacci Extension",
      icon: BarChart3,
      category: "fibonacci",
    },
    {
      id: "fib-fan",
      name: "Fibonacci Fan",
      icon: PieChart,
      category: "fibonacci",
    },
    {
      id: "fib-arc",
      name: "Fibonacci Arc",
      icon: Target,
      category: "fibonacci",
    },

    // Gann Tools
    { id: "gann-line", name: "Gann Line", icon: TrendingUp, category: "gann" },
    { id: "gann-fan", name: "Gann Fan", icon: Activity, category: "gann" },
    { id: "gann-box", name: "Gann Box", icon: Square, category: "gann" },

    // Text & Annotations
    {
      id: "text",
      name: "Text",
      icon: Type,
      category: "annotations",
      shortcut: "Alt+T",
    },
    { id: "note", name: "Note", icon: Bookmark, category: "annotations" },
    { id: "callout", name: "Callout", icon: Flag, category: "annotations" },
    { id: "arrow", name: "Arrow", icon: ArrowRight, category: "annotations" },

    // Measurement
    { id: "ruler", name: "Ruler", icon: Ruler, category: "measurement" },
    {
      id: "price-range",
      name: "Price Range",
      icon: BarChart3,
      category: "measurement",
    },
    {
      id: "date-range",
      name: "Date Range",
      icon: Clock,
      category: "measurement",
    },

    // Advanced
    { id: "pitchfork", name: "Pitchfork", icon: Zap, category: "advanced" },
    {
      id: "regression",
      name: "Linear Regression",
      icon: TrendingUp,
      category: "advanced",
    },
    { id: "brush", name: "Brush", icon: Heart, category: "advanced" },
    {
      id: "highlighter",
      name: "Highlighter",
      icon: Star,
      category: "advanced",
    },
  ];

  const categories = [
    {
      id: "selection",
      name: "Selection",
      tools: drawingTools.filter((t) => t.category === "selection"),
    },
    {
      id: "lines",
      name: "Lines",
      tools: drawingTools.filter((t) => t.category === "lines"),
    },
    {
      id: "shapes",
      name: "Shapes",
      tools: drawingTools.filter((t) => t.category === "shapes"),
    },
    {
      id: "fibonacci",
      name: "Fibonacci",
      tools: drawingTools.filter((t) => t.category === "fibonacci"),
    },
    {
      id: "gann",
      name: "Gann",
      tools: drawingTools.filter((t) => t.category === "gann"),
    },
    {
      id: "annotations",
      name: "Text & Notes",
      tools: drawingTools.filter((t) => t.category === "annotations"),
    },
    {
      id: "measurement",
      name: "Measurement",
      tools: drawingTools.filter((t) => t.category === "measurement"),
    },
    {
      id: "advanced",
      name: "Advanced",
      tools: drawingTools.filter((t) => t.category === "advanced"),
    },
  ];

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
  };

  return (
    <TooltipProvider>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-background border rounded-lg shadow-lg p-1 max-h-[80vh] overflow-y-auto">
          {/* Header with expand/collapse */}
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-xs font-medium">Drawing Tools</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? "−" : "+"}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-1 p-1 border-b">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Clear All</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Drawing Tools */}
          <div className="flex flex-col gap-1 p-1">
            {categories.map((category) => (
              <div key={category.id}>
                {isExpanded && (
                  <div className="px-2 py-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      {category.name}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {category.tools
                    .slice(0, isExpanded ? undefined : 2)
                    .map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeTool === tool.id;

                      return (
                        <Tooltip key={tool.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleToolSelect(tool.id)}
                              className={`h-8 w-8 p-0 relative ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : ""
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {isActive && (
                                <div className="absolute -right-1 -top-1">
                                  <Badge
                                    variant="secondary"
                                    className="h-3 w-3 p-0 text-xs"
                                  >
                                    ●
                                  </Badge>
                                </div>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="text-center">
                              <p className="font-medium">{tool.name}</p>
                              {tool.shortcut && (
                                <p className="text-xs text-muted-foreground">
                                  {tool.shortcut}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                </div>

                {!isExpanded && category.tools.length > 2 && (
                  <div className="px-2 py-1">
                    <span className="text-xs text-muted-foreground">
                      +{category.tools.length - 2} more
                    </span>
                  </div>
                )}

                {isExpanded && <Separator className="my-2" />}
              </div>
            ))}
          </div>

          {/* Active Tool Info */}
          {activeTool && activeTool !== "cursor" && (
            <div className="border-t p-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Active: </span>
                <span className="font-medium">
                  {drawingTools.find((t) => t.id === activeTool)?.name ||
                    "Unknown"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
