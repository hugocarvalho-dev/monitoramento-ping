import { useEffect, useRef } from 'react';
import { Host } from '@shared/api';
import { useToast } from '@/hooks/use-toast';

// Sons usando Web Audio API
const createAudioContext = () => {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

const playPositiveSound = () => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som positivo: sequência de notas ascendentes
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Erro ao tocar som positivo:', error);
  }
};

const playNegativeSound = () => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som negativo: sequência de notas descendentes
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2); // C5

    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.warn('Erro ao tocar som negativo:', error);
  }
};

interface UseStatusNotificationsProps {
  hosts: Host[];
  enabled?: boolean;
}

export function useStatusNotifications({ hosts, enabled = true }: UseStatusNotificationsProps) {
  const { toast } = useToast();
  const previousHostsRef = useRef<Map<string, Host['status']>>(new Map());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled || hosts.length === 0) return;

    // Na primeira carga, apenas armazenar os status iniciais
    if (isFirstLoadRef.current) {
      const hostStatusMap = new Map();
      hosts.forEach(host => {
        hostStatusMap.set(host.id, host.status);
      });
      previousHostsRef.current = hostStatusMap;
      isFirstLoadRef.current = false;
      return;
    }

    // Verificar mudanças de status
    const previousHosts = previousHostsRef.current;
    const changedHosts: Array<{ host: Host; previousStatus: Host['status'] }> = [];

    hosts.forEach(host => {
      // Ignorar dispositivos desativados para notificações
      if (host.status === "disabled") {
        return;
      }

      const previousStatus = previousHosts.get(host.id);

      if (previousStatus && previousStatus !== host.status && previousStatus !== "disabled") {
        changedHosts.push({ host, previousStatus });
      }
    });

    // Processar mudanças
    if (changedHosts.length > 0) {
      console.log(`Detectadas ${changedHosts.length} mudanças de status`);

      // Evitar spam de notificações - agrupar por tipo
      const onlineChanges = changedHosts.filter(({ host, previousStatus }) =>
        previousStatus !== 'online' && host.status === 'online'
      );

      const offlineChanges = changedHosts.filter(({ host, previousStatus }) =>
        previousStatus !== 'offline' && host.status === 'offline'
      );

      // Notificar mudanças para online (apenas dispositivos ativos)
      if (onlineChanges.length > 0) {
        playPositiveSound();

        if (onlineChanges.length === 1) {
          const { host } = onlineChanges[0];
          toast({
            title: "✅ Host Online",
            description: `${host.name} (${host.ip}) está online`,
            duration: 10000,
            className: "bg-green-50 border-green-200 text-green-800",
          });
        } else {
          toast({
            title: "✅ Hosts Online",
            description: `${onlineChanges.length} hosts ficaram online`,
            duration: 10000,
            className: "bg-green-50 border-green-200 text-green-800",
          });
        }
      }

      // Notificar mudanças para offline (apenas dispositivos ativos)
      if (offlineChanges.length > 0) {
        playNegativeSound();

        if (offlineChanges.length === 1) {
          const { host } = offlineChanges[0];
          toast({
            title: "❌ Host Offline",
            description: `${host.name} (${host.ip}) ficou offline`,
            duration: 10000,
            className: "bg-red-50 border-red-200 text-red-800",
          });
        } else {
          toast({
            title: "❌ Hosts Offline",
            description: `${offlineChanges.length} hosts ficaram offline`,
            duration: 10000,
            className: "bg-red-50 border-red-200 text-red-800",
          });
        }
      }
    }

    // Atualizar referência dos status anteriores
    const newHostStatusMap = new Map();
    hosts.forEach(host => {
      newHostStatusMap.set(host.id, host.status);
    });
    previousHostsRef.current = newHostStatusMap;

  }, [hosts, enabled, toast]);

  return {
    // Função para resetar quando API externa fica indisponível
    resetNotifications: () => {
      console.log('Resetando sistema de notificações');
      isFirstLoadRef.current = true;
      previousHostsRef.current.clear();
    }
  };
}
