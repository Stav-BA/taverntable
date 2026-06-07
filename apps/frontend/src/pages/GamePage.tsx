import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocket } from '@/hooks/useSocket';
import GameTable from '@/components/GameTable/GameTable';

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const storedSessionId = useSessionStore((s) => s.sessionId);
  const player = useSessionStore((s) => s.player);

  // Redirect if no session
  useEffect(() => {
    if (!player || (!storedSessionId && !sessionId)) {
      navigate('/', { replace: true });
    }
  }, [player, storedSessionId, sessionId, navigate]);

  // Initialise socket connection
  useSocket();

  if (!player) return null;

  return <GameTable />;
}
