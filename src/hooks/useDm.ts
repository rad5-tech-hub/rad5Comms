'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../context/webSocketContext';

export function useDm(
  dmId: string | undefined,
  onEvent: {
    onMessage?: (msg: any) => void;
    onEdited?: (messageId: string, text: string) => void;
    onDeleted?: (messageId: string) => void;
    onTyping?: (userId: string, isTyping: boolean) => void;
    onStatusUpdate?: (update: any) => void;
    onReaction?: (update: any) => void;
  }
) {
  const { socket, isConnected } = useWebSocket();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!socket || !dmId || !isConnected) return;

    console.log('[useDm] joining dm:', dmId);
    socket.emit('join_dm', { dmId });

    const onMessage = ({ message }: any) => {
      onEventRef.current.onMessage?.(message);
      socket.emit('dm_messages_delivered', { dmId, messageIds: [message.id] });
    };
    const onEdited = ({ messageId, text }: any) => onEventRef.current.onEdited?.(messageId, text);
    const onDeleted = ({ messageId }: any) => onEventRef.current.onDeleted?.(messageId);
    const onTyping = ({ userId, isTyping }: any) => onEventRef.current.onTyping?.(userId, isTyping);
    const onStatusUpdate = (data: any) => onEventRef.current.onStatusUpdate?.(data);
    const onReaction = (data: any) => onEventRef.current.onReaction?.(data);

    socket.on('new_dm_message', onMessage);
    socket.on('dm_message_edited', onEdited);
    socket.on('dm_message_deleted', onDeleted);
    socket.on('dm_typing', onTyping);
    socket.on('dm_message_status_update', onStatusUpdate);
    socket.on('dm_reaction_update', onReaction);

    return () => {
      socket.emit('leave_dm', { dmId });
      socket.off('new_dm_message', onMessage);
      socket.off('dm_message_edited', onEdited);
      socket.off('dm_message_deleted', onDeleted);
      socket.off('dm_typing', onTyping);
      socket.off('dm_message_status_update', onStatusUpdate);
      socket.off('dm_reaction_update', onReaction);
    };
  }, [socket, dmId, isConnected]); // isConnected triggers re-run after connect

  const sendTyping = useCallback(
    (isTyping: boolean) => socket?.emit('dm_typing', { dmId, isTyping }),
    [socket, dmId]
  );

  const markRead = useCallback(
    (messageIds: string[]) => socket?.emit('dm_messages_read', { dmId, messageIds }),
    [socket, dmId]
  );

  return { sendTyping, markRead };
}