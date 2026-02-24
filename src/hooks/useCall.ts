/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useCall.ts
'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../context/webSocketContext';

export function useCall(onEvent: {
  onIncoming?: (call: { callId: string; callerId: string; type: 'audio' | 'video'; channelId?: string }) => void;
  onAccepted?: (callId: string, acceptedBy: string) => void;
  onRejected?: (callId: string, reason: string) => void;
  onEnded?: (callId: string, endedBy: string, reason?: string) => void;
  onOffer?: (callId: string, offer: RTCSessionDescriptionInit, callerId: string) => void;
  onAnswer?: (callId: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (callId: string, candidate: RTCIceCandidateInit, from: string) => void;
  onMediaToggled?: (callId: string, userId: string, mediaType: 'audio' | 'video', enabled: boolean) => void;
}) {
  const { socket } = useWebSocket();
  const activeCallId = useRef<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('call_incoming', onEvent.onIncoming ?? (() => {}));
    socket.on('call_accepted', ({ callId, acceptedBy }: any) => onEvent.onAccepted?.(callId, acceptedBy));
    socket.on('call_rejected', ({ callId, reason }: any) => onEvent.onRejected?.(callId, reason));
    socket.on('call_ended', ({ callId, endedBy, reason }: any) => {
      activeCallId.current = null;
      onEvent.onEnded?.(callId, endedBy, reason);
    });
    socket.on('call_offer', ({ callId, offer, callerId }: any) => onEvent.onOffer?.(callId, offer, callerId));
    socket.on('call_answer', ({ callId, answer }: any) => onEvent.onAnswer?.(callId, answer));
    socket.on('ice_candidate', ({ callId, candidate, from }: any) => onEvent.onIceCandidate?.(callId, candidate, from));
    socket.on('call_media_toggled', ({ callId, userId, mediaType, enabled }: any) =>
      onEvent.onMediaToggled?.(callId, userId, mediaType, enabled));

    return () => {
      socket.off('call_incoming');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('call_offer');
      socket.off('call_answer');
      socket.off('ice_candidate');
      socket.off('call_media_toggled');
    };
  }, [socket]);

  const initiateCall = useCallback((receiverId: string, type: 'audio' | 'video', channelId?: string) => {
    socket?.emit('call_initiate', { receiverId, type, channelId });
    socket?.once('call_initiated', ({ callId }: any) => { activeCallId.current = callId; });
  }, [socket]);

  const acceptCall = useCallback((callId: string) => {
    activeCallId.current = callId;
    socket?.emit('call_accept', { callId });
  }, [socket]);

  const rejectCall = useCallback((callId: string, reason?: string) => {
    socket?.emit('call_reject', { callId, reason });
  }, [socket]);

  const endCall = useCallback(() => {
    if (activeCallId.current) {
      socket?.emit('call_end', { callId: activeCallId.current });
      activeCallId.current = null;
    }
  }, [socket]);

  const sendOffer = useCallback((offer: RTCSessionDescriptionInit) => {
    socket?.emit('call_offer', { callId: activeCallId.current, offer });
  }, [socket]);

  const sendAnswer = useCallback((answer: RTCSessionDescriptionInit) => {
    socket?.emit('call_answer', { callId: activeCallId.current, answer });
  }, [socket]);

  const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit) => {
    socket?.emit('ice_candidate', { callId: activeCallId.current, candidate });
  }, [socket]);

  const toggleMedia = useCallback((mediaType: 'audio' | 'video', enabled: boolean) => {
    socket?.emit('call_toggle_media', { callId: activeCallId.current, mediaType, enabled });
  }, [socket]);

  return { initiateCall, acceptCall, rejectCall, endCall, sendOffer, sendAnswer, sendIceCandidate, toggleMedia };
}
