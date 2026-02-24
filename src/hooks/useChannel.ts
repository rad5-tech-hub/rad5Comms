'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../context/webSocketContext';

export function useChannel(
  channelId: string | undefined,
  onEvent: {
    onMessage?: (msg: any) => void;
    onEdited?: (messageId: string, text: string) => void;
    onDeleted?: (messageId: string) => void;
    onTyping?: (userId: string, isTyping: boolean) => void;
    onStatusUpdate?: (update: any) => void;
    onReaction?: (update: any) => void;
    onPollUpdate?: (update: any) => void;
  }
) {
  const { socket, isConnected } = useWebSocket();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!socket || !channelId || !isConnected) return;

    console.log('[useChannel] joining channel:', channelId);
    socket.emit('join_channel', { channelId });

    const onMessage = ({ message }: any) => {
      onEventRef.current.onMessage?.(message);
      socket.emit('messages_delivered', { channelId, messageIds: [message.id] });
    };
    const onEdited = ({ messageId, text }: any) => onEventRef.current.onEdited?.(messageId, text);
    const onDeleted = ({ messageId }: any) => onEventRef.current.onDeleted?.(messageId);
    const onTyping = ({ userId, isTyping }: any) => onEventRef.current.onTyping?.(userId, isTyping);
    const onStatusUpdate = (data: any) => onEventRef.current.onStatusUpdate?.(data);
    const onReaction = (data: any) => onEventRef.current.onReaction?.(data);
    const onPollUpdate = (data: any) => onEventRef.current.onPollUpdate?.(data);

    socket.on('new_message', onMessage);
    socket.on('message_edited', onEdited);
    socket.on('message_deleted', onDeleted);
    socket.on('typing', onTyping);
    socket.on('message_status_update', onStatusUpdate);
    socket.on('reaction_update', onReaction);
    socket.on('poll_update', onPollUpdate);

    return () => {
      socket.emit('leave_channel', { channelId });
      socket.off('new_message', onMessage);
      socket.off('message_edited', onEdited);
      socket.off('message_deleted', onDeleted);
      socket.off('typing', onTyping);
      socket.off('message_status_update', onStatusUpdate);
      socket.off('reaction_update', onReaction);
      socket.off('poll_update', onPollUpdate);
    };
  }, [socket, channelId, isConnected]); // isConnected triggers re-run after connect

  const sendTyping = useCallback(
    (isTyping: boolean) => socket?.emit('typing', { channelId, isTyping }),
    [socket, channelId]
  );

  const markRead = useCallback(
    (messageIds: string[]) => socket?.emit('messages_read', { channelId, messageIds }),
    [socket, channelId]
  );

  return { sendTyping, markRead };
}