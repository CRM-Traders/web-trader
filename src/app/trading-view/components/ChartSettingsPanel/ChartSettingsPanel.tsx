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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, LineChart, Activity } from "lucide-react";

interface ChartSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChartSettingsPanel({
  isOpen,
  onClose,
}: ChartSettingsPanelProps) {
  const [theme, setTheme] = useState("dark");
  const [gridVisible, setGridVisible] = useState(true);
  const [crosshairVisible, setCrosshairVisible] = useState(true);
  const [volumeVisible, setVolumeVisible] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chart Settings
          </CardTitle>
          <CardDescription>
            Customize your chart appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
              <TabsTrigger value="drawing">Drawing</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid">Show Grid</Label>
                  <Switch
                    id="grid"
                    checked={gridVisible}
                    onCheckedChange={setGridVisible}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="crosshair">Show Crosshair</Label>
                  <Switch
                    id="crosshair"
                    checked={crosshairVisible}
                    onCheckedChange={setCrosshairVisible}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="volume">Show Volume</Label>
                  <Switch
                    id="volume"
                    checked={volumeVisible}
                    onCheckedChange={setVolumeVisible}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Color Scheme</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded" />
                    <Label className="text-sm">Bull Candles</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <Label className="text-sm">Bear Candles</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="indicators" className="space-y-4">
              <div className="space-y-2">
                <Label>Moving Averages</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="sma20" />
                    <Label htmlFor="sma20">SMA 20</Label>
                    <Badge variant="outline">20</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="sma50" />
                    <Label htmlFor="sma50">SMA 50</Label>
                    <Badge variant="outline">50</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="ema12" />
                    <Label htmlFor="ema12">EMA 12</Label>
                    <Badge variant="outline">12</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Oscillators</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="rsi" />
                    <Label htmlFor="rsi">RSI</Label>
                    <Badge variant="outline">14</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="macd" />
                    <Label htmlFor="macd">MACD</Label>
                    <Badge variant="outline">12,26,9</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Bands & Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="bb" />
                    <Label htmlFor="bb">Bollinger Bands</Label>
                    <Badge variant="outline">20,2</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="drawing" className="space-y-4">
              <div className="space-y-2">
                <Label>Drawing Tools</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start bg-transparent"
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Trend Line
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start bg-transparent"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Horizontal Line
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Drawing Settings</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lineWidth">Line Width</Label>
                    <Input
                      id="lineWidth"
                      type="number"
                      defaultValue="2"
                      min="1"
                      max="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lineColor">Line Color</Label>
                    <Input id="lineColor" type="color" defaultValue="#ffffff" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>Apply Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
