import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Zap, Users, Cpu, Sparkles } from 'lucide-react';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'ai' | null;

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<number | null>(null);

  const checkWinner = useCallback((squares: Board): { winner: Player; line: number[] | null } => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return { winner: null, line: null };
  }, []);

  const minimax = useCallback((squares: Board, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
    const { winner } = checkWinner(squares);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (squares.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const evaluation = minimax(squares, depth + 1, false, alpha, beta);
          squares[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const evaluation = minimax(squares, depth + 1, true, alpha, beta);
          squares[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }, [checkWinner]);

  const getBestMove = useCallback((squares: Board): number => {
    let bestScore = -Infinity;
    let bestMove = 0;
    
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false, -Infinity, Infinity);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }, [minimax]);

  const handleClick = useCallback((index: number) => {
    if (board[index] || winner || isDraw || isThinking) return;
    if (gameMode === 'ai' && currentPlayer === 'O') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setLastMove(index);

    const { winner: newWinner, line } = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setWinningLine(line);
      setScores(prev => ({ ...prev, [newWinner]: prev[newWinner as 'X' | 'O'] + 1 }));
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, winner, isDraw, isThinking, gameMode, checkWinner]);

  // AI move
  useEffect(() => {
    if (gameMode !== 'ai' || currentPlayer !== 'O' || winner || isDraw) return;

    setIsThinking(true);
    const timeout = setTimeout(() => {
      const move = getBestMove([...board]);
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);
      setLastMove(move);

      const { winner: newWinner, line } = checkWinner(newBoard);
      if (newWinner) {
        setWinner(newWinner);
        setWinningLine(line);
        setScores(prev => ({ ...prev, O: prev.O + 1 }));
      } else if (newBoard.every(cell => cell !== null)) {
        setIsDraw(true);
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        setCurrentPlayer('X');
      }
      setIsThinking(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [currentPlayer, gameMode, winner, isDraw, board, getBestMove, checkWinner]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setIsDraw(false);
    setLastMove(null);
  };

  const resetAll = () => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
    setGameMode(null);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);
    const isLastMove = lastMove === index;

    return (
      <button
        key={index}
        onClick={() => handleClick(index)}
        disabled={!!board[index] || !!winner || isDraw || isThinking}
        className={`
          relative aspect-square rounded-2xl
          transition-all duration-300 ease-out
          ${!value && !winner && !isDraw && !isThinking ? 'hover:bg-white/10 hover:scale-[1.02] cursor-pointer' : ''}
          ${isWinningCell ? 'animate-pulse' : ''}
          ${isLastMove && value ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f]' : ''}
          ${isLastMove && value === 'X' ? 'ring-cyan-400' : ''}
          ${isLastMove && value === 'O' ? 'ring-fuchsia-400' : ''}
          backdrop-blur-sm
          border border-white/10
          bg-gradient-to-br from-white/5 to-transparent
          group
        `}
        style={{
          boxShadow: isWinningCell 
            ? value === 'X' 
              ? '0 0 40px rgba(34, 211, 238, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)'
              : '0 0 40px rgba(232, 121, 249, 0.4), inset 0 0 30px rgba(232, 121, 249, 0.1)'
            : 'inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Hover glow effect */}
        {!value && !winner && !isDraw && !isThinking && (
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10" />
        )}
        
        {/* X Symbol */}
        {value === 'X' && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              <line
                x1="20" y1="20" x2="80" y2="80"
                stroke="url(#xGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="animate-draw-line"
              />
              <line
                x1="80" y1="20" x2="20" y2="80"
                stroke="url(#xGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="animate-draw-line"
                style={{ animationDelay: '0.1s' }}
              />
              <defs>
                <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}

        {/* O Symbol */}
        {value === 'O' && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 drop-shadow-[0_0_20px_rgba(232,121,249,0.6)]">
              <circle
                cx="50" cy="50" r="30"
                fill="none"
                stroke="url(#oGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="animate-draw-circle"
              />
              <defs>
                <linearGradient id="oGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e879f9" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </button>
    );
  };

  // Mode selection screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-fuchsia-500/5 rounded-full blur-[80px]" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 bg-clip-text text-transparent drop-shadow-2xl"
              style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>
              TIC TAC TOE
            </h1>
            <p className="text-white/40 text-lg tracking-[0.3em] uppercase"
              style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}>
              Wähle deinen Spielmodus
            </p>
          </div>

          {/* Mode buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '200ms' }}>
            <button
              onClick={() => setGameMode('pvp')}
              className="group relative px-10 py-8 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,0.3)]"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="block text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>
                2 SPIELER
              </span>
              <span className="text-cyan-400/60 text-sm tracking-wider">Spiele gegen einen Freund</span>
            </button>

            <button
              onClick={() => setGameMode('ai')}
              className="group relative px-10 py-8 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 border border-fuchsia-500/30 hover:border-fuchsia-400/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(232,121,249,0.3)]"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Cpu className="w-12 h-12 text-fuchsia-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="block text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>
                VS KI
              </span>
              <span className="text-fuchsia-400/60 text-sm tracking-wider">Fordere die KI heraus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 
          className="text-4xl md:text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 bg-clip-text text-transparent"
          style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}
        >
          TIC TAC TOE
        </h1>
        <p className="text-white/30 text-sm tracking-[0.2em] uppercase" style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}>
          {gameMode === 'ai' ? 'Du vs KI' : 'Spieler vs Spieler'}
        </p>
      </div>

      {/* Score board */}
      <div className="relative z-10 flex items-center gap-4 md:gap-8 mb-8 animate-in fade-in slide-in-from-top-6 duration-500" style={{ animationDelay: '100ms' }}>
        <div className={`text-center px-6 py-3 rounded-xl transition-all duration-300 ${currentPlayer === 'X' && !winner && !isDraw ? 'bg-cyan-500/20 ring-2 ring-cyan-400/50 scale-105' : 'bg-white/5'}`}>
          <div className="text-3xl font-bold text-cyan-400" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>{scores.X}</div>
          <div className="text-xs text-white/40 tracking-wider mt-1">{gameMode === 'ai' ? 'DU' : 'X'}</div>
        </div>
        
        <div className="text-center px-4 py-2">
          <div className="text-xl font-medium text-white/30" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>{scores.draws}</div>
          <div className="text-xs text-white/20 tracking-wider mt-1">DRAW</div>
        </div>

        <div className={`text-center px-6 py-3 rounded-xl transition-all duration-300 ${currentPlayer === 'O' && !winner && !isDraw ? 'bg-fuchsia-500/20 ring-2 ring-fuchsia-400/50 scale-105' : 'bg-white/5'}`}>
          <div className="text-3xl font-bold text-fuchsia-400" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>{scores.O}</div>
          <div className="text-xs text-white/40 tracking-wider mt-1">{gameMode === 'ai' ? 'KI' : 'O'}</div>
        </div>
      </div>

      {/* Game status */}
      <div className="relative z-10 h-12 flex items-center justify-center mb-6 animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
        {winner && (
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 animate-in zoom-in-95 duration-300">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-amber-400" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>
              {winner === 'X' ? (gameMode === 'ai' ? 'DU GEWINNST!' : 'X GEWINNT!') : (gameMode === 'ai' ? 'KI GEWINNT!' : 'O GEWINNT!')}
            </span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
        )}
        {isDraw && (
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 border border-white/20 animate-in zoom-in-95 duration-300">
            <Zap className="w-5 h-5 text-white/60" />
            <span className="text-lg font-bold text-white/80" style={{ fontFamily: '"Orbitron", system-ui, sans-serif' }}>
              UNENTSCHIEDEN!
            </span>
          </div>
        )}
        {!winner && !isDraw && (
          <div className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
            isThinking 
              ? 'bg-fuchsia-500/20 border border-fuchsia-500/30' 
              : currentPlayer === 'X' 
                ? 'bg-cyan-500/20 border border-cyan-500/30' 
                : 'bg-fuchsia-500/20 border border-fuchsia-500/30'
          }`}>
            {isThinking ? (
              <>
                <div className="w-4 h-4 border-2 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-fuchsia-400 font-medium" style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}>KI denkt...</span>
              </>
            ) : (
              <>
                <span className={`text-sm font-medium ${currentPlayer === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}`} style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}>
                  {currentPlayer === 'X' ? (gameMode === 'ai' ? 'Du bist dran' : 'Spieler X') : (gameMode === 'ai' ? 'KI ist dran' : 'Spieler O')}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Game board */}
      <div 
        className="relative z-10 grid grid-cols-3 gap-3 md:gap-4 p-4 md:p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl animate-in zoom-in-95 duration-500"
        style={{ 
          animationDelay: '300ms',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fuchsia-500/30 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fuchsia-500/30 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-3xl" />

        {board.map((_, index) => renderCell(index))}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
        <Button
          onClick={resetGame}
          variant="outline"
          className="px-6 py-5 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Neue Runde
        </Button>
        <Button
          onClick={resetAll}
          variant="outline"
          className="px-6 py-5 rounded-xl bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
          style={{ fontFamily: '"Rajdhani", system-ui, sans-serif' }}
        >
          Zurück
        </Button>
      </div>

      {/* CSS for animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

        .animate-draw-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawLine 0.4s ease-out forwards;
        }

        .animate-draw-circle {
          stroke-dasharray: 189;
          stroke-dashoffset: 189;
          animation: drawCircle 0.5s ease-out forwards;
        }

        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Cell size */
        .grid > button {
          width: clamp(80px, 22vw, 120px);
          height: clamp(80px, 22vw, 120px);
        }
      `}</style>
    </div>
  );
}

