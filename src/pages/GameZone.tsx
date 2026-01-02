import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { 
  Brain, ArrowLeft, Gamepad2, Zap, Trophy, Timer, 
  RotateCcw, Play, Pause, CheckCircle, XCircle, Sparkles,
  Target, Clock, Award, TrendingUp
} from "lucide-react";

type GameType = 'memory' | 'speed-math' | 'pattern' | 'reaction';

interface GameScore {
  type: GameType;
  score: number;
  time: number;
}

const GAMES = [
  {
    type: 'memory' as GameType,
    title: 'Memory Match',
    description: 'Find matching pairs to train your memory',
    icon: Brain,
    color: 'primary',
    difficulty: 'Medium',
  },
  {
    type: 'speed-math' as GameType,
    title: 'Speed Math',
    description: 'Solve math problems as fast as you can',
    icon: Zap,
    color: 'secondary',
    difficulty: 'Easy',
  },
  {
    type: 'pattern' as GameType,
    title: 'Pattern Recognition',
    description: 'Find the pattern and predict the next item',
    icon: Target,
    color: 'primary',
    difficulty: 'Hard',
  },
  {
    type: 'reaction' as GameType,
    title: 'Reaction Time',
    description: 'Test your reflexes and reaction speed',
    icon: Timer,
    color: 'secondary',
    difficulty: 'Easy',
  },
];

// Memory Game Component
const MemoryGame = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [cards, setCards] = useState<{ id: number; value: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const emojis = ['🧠', '⚡', '🎯', '🏆', '📚', '✨', '🔥', '💡'];

  const initGame = useCallback(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({ id, value, flipped: false, matched: false }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      if (cards[first].value === cards[second].value) {
        setCards(prev => prev.map((card, i) => 
          i === first || i === second ? { ...card, matched: true } : card
        ));
        setMatches(m => m + 1);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second ? { ...card, flipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(m => m + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (matches === 8 && gameStarted) {
      const score = Math.max(100 - (moves - 8) * 5, 10);
      setTimeout(() => onComplete(score), 500);
    }
  }, [matches, moves, gameStarted, onComplete]);

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].flipped || cards[index].matched) return;
    setCards(prev => prev.map((card, i) => i === index ? { ...card, flipped: true } : card));
    setFlippedCards(prev => [...prev, index]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Moves: <span className="text-primary font-bold">{moves}</span></span>
        <span className="text-muted-foreground">Matches: <span className="text-secondary font-bold">{matches}/8</span></span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(index)}
            className={`aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl cursor-pointer transition-all ${
              card.flipped || card.matched
                ? 'bg-primary/20 border-primary/50'
                : 'bg-card/50 border-border/50 hover:bg-card'
            } border`}
          >
            {card.flipped || card.matched ? card.value : '?'}
          </motion.div>
        ))}
      </div>
      <Button onClick={initGame} variant="outline" size="sm" className="w-full">
        <RotateCcw className="w-4 h-4 mr-2" /> Restart
      </Button>
    </div>
  );
};

// Speed Math Game Component
const SpeedMathGame = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);

  const generateQuestion = useCallback(() => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 1;
    let b = Math.floor(Math.random() * 12) + 1;
    let answer: number;

    if (op === '-' && b > a) [a, b] = [b, a];
    
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '×': answer = a * b; break;
      default: answer = a + b;
    }

    setQuestion({ a, b, op, answer });
    setUserAnswer('');
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameActive(false);
          onComplete(score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive, score, onComplete]);

  const handleSubmit = () => {
    if (parseInt(userAnswer) === question.answer) {
      setScore(s => s + 10);
    }
    generateQuestion();
  };

  const handleKeyPress = (num: string) => {
    if (num === 'C') {
      setUserAnswer('');
    } else if (num === '⏎') {
      handleSubmit();
    } else {
      setUserAnswer(prev => prev + num);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="text-muted-foreground">Time: <span className={`font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-secondary'}`}>{timeLeft}s</span></span>
      </div>
      <Progress value={(timeLeft / 30) * 100} className="h-2" />
      
      <div className="text-center py-6">
        <div className="text-3xl sm:text-4xl font-display mb-4">
          {question.a} {question.op} {question.b} = ?
        </div>
        <div className="text-4xl font-bold text-primary min-h-[48px]">
          {userAnswer || '_'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⏎'].map(num => (
          <Button
            key={num}
            onClick={() => handleKeyPress(num)}
            variant={num === '⏎' ? 'default' : num === 'C' ? 'destructive' : 'outline'}
            className="h-12 text-lg font-bold"
          >
            {num}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Pattern Recognition Game Component
const PatternGame = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generatePattern = useCallback(() => {
    const patterns = [
      // Arithmetic sequence
      () => {
        const start = Math.floor(Math.random() * 10) + 1;
        const diff = Math.floor(Math.random() * 5) + 1;
        const seq = Array.from({ length: 4 }, (_, i) => start + i * diff);
        return { seq, next: start + 4 * diff };
      },
      // Geometric sequence
      () => {
        const start = Math.floor(Math.random() * 3) + 2;
        const ratio = 2;
        const seq = Array.from({ length: 4 }, (_, i) => start * Math.pow(ratio, i));
        return { seq, next: start * Math.pow(ratio, 4) };
      },
      // Square numbers
      () => {
        const start = Math.floor(Math.random() * 3) + 1;
        const seq = Array.from({ length: 4 }, (_, i) => Math.pow(start + i, 2));
        return { seq, next: Math.pow(start + 4, 2) };
      },
    ];

    const { seq, next } = patterns[Math.floor(Math.random() * patterns.length)]();
    setSequence(seq);
    setAnswer(next);
    
    const wrongOptions = [next + 1, next - 1, next + 2].filter(n => n !== next && n > 0);
    const allOptions = [next, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setFeedback(null);
  }, []);

  useEffect(() => {
    generatePattern();
  }, [generatePattern]);

  const handleAnswer = (selected: number) => {
    if (selected === answer) {
      setScore(s => s + 20);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (round >= 5) {
        onComplete(score + (selected === answer ? 20 : 0));
      } else {
        setRound(r => r + 1);
        generatePattern();
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="text-muted-foreground">Round: <span className="text-secondary font-bold">{round}/5</span></span>
      </div>
      
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">What comes next?</p>
        <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
          {sequence.map((num, i) => (
            <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-lg sm:text-xl font-bold">
              {num}
            </div>
          ))}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-secondary/20 border border-secondary/50 flex items-center justify-center text-lg sm:text-xl font-bold text-secondary">
            ?
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
          <Button
            key={opt}
            onClick={() => handleAnswer(opt)}
            disabled={feedback !== null}
            variant="outline"
            className={`h-14 text-xl font-bold ${
              feedback && opt === answer ? 'bg-green-500/20 border-green-500' : 
              feedback === 'wrong' && opt !== answer ? 'opacity-50' : ''
            }`}
          >
            {opt}
          </Button>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-center text-lg font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-destructive'}`}
          >
            {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reaction Time Game Component
const ReactionGame = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [state, setState] = useState<'waiting' | 'ready' | 'go' | 'done'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [tooSoon, setTooSoon] = useState(false);

  const startRound = useCallback(() => {
    setState('ready');
    setTooSoon(false);
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    
    const timeout = setTimeout(() => {
      setState('go');
      setStartTime(Date.now());
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const handleClick = () => {
    if (state === 'waiting') {
      startRound();
    } else if (state === 'ready') {
      setTooSoon(true);
      setState('waiting');
    } else if (state === 'go') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setAttempts(prev => [...prev, time]);
      setState('done');
    } else if (state === 'done') {
      if (attempts.length >= 5) {
        const avg = attempts.reduce((a, b) => a + b, 0) / attempts.length;
        const score = Math.max(100 - Math.floor(avg / 5), 10);
        onComplete(score);
      } else {
        startRound();
      }
    }
  };

  const getAverageTime = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Attempts: <span className="text-primary font-bold">{attempts.length}/5</span></span>
        <span className="text-muted-foreground">Avg: <span className="text-secondary font-bold">{getAverageTime()}ms</span></span>
      </div>
      
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className={`aspect-video rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
          state === 'waiting' ? 'bg-primary/20 border-primary/50' :
          state === 'ready' ? 'bg-destructive/20 border-destructive/50' :
          state === 'go' ? 'bg-green-500/30 border-green-500' :
          'bg-secondary/20 border-secondary/50'
        } border-2`}
      >
        <div className="text-center">
          {state === 'waiting' && (
            <div>
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-primary" />
              <p className="text-sm sm:text-base">Click to Start</p>
            </div>
          )}
          {state === 'ready' && (
            <div>
              <Timer className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-destructive animate-pulse" />
              <p className="text-sm sm:text-base text-destructive">Wait for green...</p>
            </div>
          )}
          {state === 'go' && (
            <div>
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-green-500" />
              <p className="text-lg sm:text-xl font-bold text-green-500">CLICK NOW!</p>
            </div>
          )}
          {state === 'done' && (
            <div>
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-secondary" />
              <p className="text-2xl sm:text-3xl font-bold text-secondary">{reactionTime}ms</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {attempts.length >= 5 ? 'Click to see results' : 'Click to continue'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {tooSoon && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-destructive text-sm"
        >
          Too soon! Wait for the green signal.
        </motion.p>
      )}

      {attempts.length > 0 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {attempts.map((time, i) => (
            <span key={i} className="px-2 py-1 text-xs rounded bg-card/50 border border-border/50">
              {time}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const GameZone = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [lastScore, setLastScore] = useState<GameScore | null>(null);
  const [highScores, setHighScores] = useState<Record<GameType, number>>({
    'memory': 0,
    'speed-math': 0,
    'pattern': 0,
    'reaction': 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
      // Load high scores from localStorage
      const saved = localStorage.getItem('gameZoneHighScores');
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleGameComplete = (score: number) => {
    if (!activeGame) return;
    
    const newScore: GameScore = {
      type: activeGame,
      score,
      time: Date.now(),
    };
    setLastScore(newScore);

    // Update high score
    if (score > highScores[activeGame]) {
      const newHighScores = { ...highScores, [activeGame]: score };
      setHighScores(newHighScores);
      localStorage.setItem('gameZoneHighScores', JSON.stringify(newHighScores));
    }

    setActiveGame(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <Gamepad2 className="w-5 h-5 sm:w-7 sm:h-7 text-secondary shrink-0" />
                <h1 className="text-base sm:text-xl font-display gradient-text truncate">Game Zone</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {activeGame ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={() => setActiveGame(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h2 className="font-display text-lg gradient-text">
                  {GAMES.find(g => g.type === activeGame)?.title}
                </h2>
              </div>

              <Card className="glass-card max-w-md mx-auto">
                <CardContent className="p-4 sm:p-6">
                  {activeGame === 'memory' && <MemoryGame onComplete={handleGameComplete} />}
                  {activeGame === 'speed-math' && <SpeedMathGame onComplete={handleGameComplete} />}
                  {activeGame === 'pattern' && <PatternGame onComplete={handleGameComplete} />}
                  {activeGame === 'reaction' && <ReactionGame onComplete={handleGameComplete} />}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Welcome */}
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-display mb-1">
                  Brain <span className="gradient-text">Training</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sharpen your mind with fun games
                </p>
              </div>

              {/* Last Score */}
              {lastScore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 sm:mb-6"
                >
                  <Card className="glass-card border-secondary/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Last Game</p>
                        <p className="font-display text-sm">
                          {GAMES.find(g => g.type === lastScore.type)?.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display text-secondary">{lastScore.score}</div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Games Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {GAMES.map((game, index) => {
                  const Icon = game.icon;
                  return (
                    <motion.div
                      key={game.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`glass-card border-${game.color}/20 hover:border-${game.color}/50 transition-all hover:shadow-glow-${game.color === 'primary' ? 'cyan' : 'purple'} cursor-pointer group`}
                        onClick={() => setActiveGame(game.type)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 rounded-lg bg-${game.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-5 h-5 text-${game.color}`} />
                            </div>
                            {highScores[game.type] > 0 && (
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Best</div>
                                <div className={`font-display text-${game.color}`}>{highScores[game.type]}</div>
                              </div>
                            )}
                          </div>
                          <CardTitle className="font-display text-sm sm:text-base mt-3 group-hover:text-primary transition-colors">
                            {game.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {game.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 text-xs rounded bg-${game.color}/10 text-${game.color}`}>
                              {game.difficulty}
                            </span>
                            <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 sm:mt-8"
              >
                <h3 className="text-sm font-display mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-secondary" />
                  Your Stats
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {GAMES.map(game => {
                    const Icon = game.icon;
                    return (
                      <Card key={game.type} className="glass-card border-border/30">
                        <CardContent className="p-3 text-center">
                          <Icon className={`w-5 h-5 mx-auto mb-1 text-${game.color}`} />
                          <div className="font-display text-lg">{highScores[game.type]}</div>
                          <p className="text-[10px] text-muted-foreground truncate">{game.title}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameZone;
