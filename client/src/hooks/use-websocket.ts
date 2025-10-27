import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseWebSocketOptions {
  walletAddress: string;
  enabled?: boolean;
}

export function useWebSocket({ walletAddress, enabled = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled || !walletAddress) {
      return;
    }

    const connect = () => {
      try {
        // Construct WebSocket URL
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(walletAddress)}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case "transaction_update":
                // Invalidate transaction and stats queries to refetch
                queryClient.invalidateQueries({ queryKey: ['/api/transactions', walletAddress] });
                queryClient.invalidateQueries({ queryKey: ['/api/stats', walletAddress] });
                break;
              
              case "batch_executed":
                // Invalidate all queries when batch executes
                queryClient.invalidateQueries({ queryKey: ['/api/transactions', walletAddress] });
                queryClient.invalidateQueries({ queryKey: ['/api/stats', walletAddress] });
                break;
            }
          } catch (error) {
            console.error("WebSocket message parse error:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = (event) => {
          console.log("WebSocket disconnected", event.code, event.reason);
          setIsConnected(false);
          
          // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
          const backoff = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          // Attempt to reconnect with exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttemptsRef.current})...`);
            connect();
          }, backoff);
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
      }
    };

    connect();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [walletAddress, enabled, queryClient]);

  return { isConnected };
}
