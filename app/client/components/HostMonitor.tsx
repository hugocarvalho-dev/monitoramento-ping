import { Host } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Router, Wifi, WifiOff, AlertTriangle, Clock, Zap, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HostMonitorProps {
  host: Host;
  theme?: "light" | "dark";
  isDraggable?: boolean;
  onDoubleClick?: (host: Host) => void;
}

export function HostMonitor({ host, theme = "dark", isDraggable = false, onDoubleClick }: HostMonitorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: host.id, disabled: !isDraggable });
  const getStatusColor = (status: Host["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "disabled":
        return "bg-gray-400";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: Host["status"]) => {
    const baseClasses = "h-3 w-3";
    const colors = {
      online: theme === "dark" ? "text-green-400" : "text-green-600",
      offline: theme === "dark" ? "text-red-400" : "text-red-600",
      warning: theme === "dark" ? "text-yellow-400" : "text-yellow-600",
      disabled: theme === "dark" ? "text-gray-500" : "text-gray-400",
      default: theme === "dark" ? "text-gray-400" : "text-gray-600",
    };

    switch (status) {
      case "online":
        return <Wifi className={`${baseClasses} ${colors.online}`} />;
      case "disabled":
        return <WifiOff className={`${baseClasses} ${colors.disabled}`} />;
      case "offline":
        return <WifiOff className={`${baseClasses} ${colors.offline}`} />;
      case "warning":
        return <AlertTriangle className={`${baseClasses} ${colors.warning}`} />;
      default:
        return <WifiOff className={`${baseClasses} ${colors.default}`} />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLastSeenText = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes === 0) {
      return "Just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      onDoubleClick={() => host.status !== "disabled" && onDoubleClick?.(host)}
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg h-24",
        isDraggable && "cursor-grab active:cursor-grabbing",
        !isDraggable && onDoubleClick && "cursor-pointer",
        isDragging && "opacity-50 z-50",
        theme === "dark" &&
          host.status === "online" &&
          "border-green-600 bg-green-900/30",
        theme === "dark" &&
          host.status === "offline" &&
          "border-red-600 bg-red-900/30",
        theme === "dark" &&
          host.status === "warning" &&
          "border-yellow-600 bg-yellow-900/30",
        theme === "light" &&
          host.status === "online" &&
          "border-green-300 bg-green-50",
        theme === "light" &&
          host.status === "offline" &&
          "border-red-300 bg-red-50",
        theme === "light" &&
          host.status === "warning" &&
          "border-yellow-300 bg-yellow-50",
        theme === "dark" &&
          host.status === "disabled" &&
          "border-gray-600 bg-gray-900/30 opacity-60",
        theme === "light" &&
          host.status === "disabled" &&
          "border-gray-300 bg-gray-100 opacity-60",
      )}
    >
      <CardContent className="p-2 h-full">
        <div className="flex flex-col h-full">
          {/* Handle de drag e nome do host */}
          <div className="flex items-start gap-1 mb-1">
            {isDraggable && (
              <div
                {...listeners}
                className={`flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded ${
                  theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                }`}
                title="Arrastar para reordenar"
              >
                <GripVertical className="h-3 w-3" />
              </div>
            )}
            <CardTitle
              className={`text-xs font-semibold leading-tight line-clamp-2 flex-1 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}
              title={host.name}
              style={{ lineHeight: "1.2", minHeight: "28px" }}
            >
              {host.name}
            </CardTitle>
          </div>

          {/* IP */}
          <p
            className={`text-xs font-mono mb-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
            style={{ fontSize: "10px" }}
          >
            {host.ip}
          </p>

          {/* Status e Response Time */}
          <div className="flex items-center justify-between mb-1">
            <Badge
              variant={host.status === "online" ? "default" : "destructive"}
              className={cn(
                "text-xs px-1.5 py-0 h-4",
                theme === "dark" &&
                  host.status === "online" &&
                  "bg-green-800 text-green-100",
                theme === "dark" &&
                  host.status === "warning" &&
                  "bg-yellow-800 text-yellow-100",
                theme === "dark" &&
                  host.status === "disabled" &&
                  "bg-gray-700 text-gray-300",
                theme === "light" &&
                  host.status === "online" &&
                  "bg-green-700 text-green-100",
                theme === "light" &&
                  host.status === "warning" &&
                  "bg-yellow-700 text-yellow-100",
                theme === "light" &&
                  host.status === "disabled" &&
                  "bg-gray-500 text-gray-100",
              )}
            >
              {host.status === "online"
                ? "ON"
                : host.status === "warning"
                  ? "WARN"
                  : host.status === "disabled"
                    ? "OFF"
                    : "OFF"}
            </Badge>
            {host.responseTime && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <Zap className="h-2 w-2" />
                {host.responseTime}ms
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          <div
            className={`w-full rounded-full h-1 overflow-hidden mt-auto ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
            }`}
          >
            <div
              className={cn(
                "h-full transition-all duration-500",
                host.status === "online" && "bg-green-500",
                host.status === "offline" && "bg-red-500",
                host.status === "warning" && "bg-yellow-500",
                host.status === "disabled" && "bg-gray-400",
              )}
              style={{
                width:
                  host.status === "online"
                    ? "100%"
                    : host.status === "warning"
                      ? "70%"
                      : "20%",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
