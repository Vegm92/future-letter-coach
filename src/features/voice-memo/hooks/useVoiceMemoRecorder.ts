import { useState, useRef } from "react";

import { supabase } from '@/shared/config/client';

interface UseVoiceMemoRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  error: string | null;
  uploadAudio: () => Promise<string | null>;
}

export function useVoiceMemoRecorder(): UseVoiceMemoRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  const startRecording = () => {
    setError(null);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setIsPaused(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          audioBlobRef.current = audioBlob;
          setAudioUrl(URL.createObjectURL(audioBlob));
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        setIsPaused(false);
      })
      .catch(() => {
        setError("Could not access microphone.");
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setError(null);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    setIsPaused(false);
  };

  // Upload audio to Supabase Storage and return public URL
  const uploadAudio = async (): Promise<string | null> => {
    if (!audioBlobRef.current) return null;
    const fileName = `voice-memos/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.webm`;
    const { data, error } = await supabase.storage
      .from("voice-memos")
      .upload(fileName, audioBlobRef.current, { contentType: "audio/webm" });
    if (error) return null;
    const { data: publicUrlData } = supabase.storage
      .from("voice-memos")
      .getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  return {
    isRecording,
    isPaused,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
    uploadAudio,
  };
}
