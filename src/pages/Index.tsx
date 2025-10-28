import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface CoinParticle {
  id: number;
  x: number;
  y: number;
}

interface Upgrade {
  id: number;
  name: string;
  icon: string;
  cost: number;
  level: number;
  profit: number;
  description: string;
  category: string;
}

const SAVE_URL = 'https://functions.poehali.dev/5d436866-eba4-4739-ac24-24eb94289ae5';
const LOAD_URL = 'https://functions.poehali.dev/1a8d7f0c-f42c-453d-9a1c-b20d078cbd1d';
const CLAIM_DAILY_URL = 'https://functions.poehali.dev/df6cfa2a-e96f-485c-9999-5c98cb45f221';

interface DailyReward {
  canClaim: boolean;
  timeLeft: number;
  streak: number;
  nextReward: number;
}

export default function Index() {
  const [playerId] = useState(() => {
    let id = localStorage.getItem('player_id');
    if (!id) {
      id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('player_id', id);
    }
    return id;
  });
  
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy, setMaxEnergy] = useState(1000);
  const [profitPerHour, setProfitPerHour] = useState(0);
  const [level, setLevel] = useState(1);
  const [particles, setParticles] = useState<CoinParticle[]>([]);
  const [tapPower, setTapPower] = useState(1);
  const [activeTab, setActiveTab] = useState('exchange');
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: 1, name: 'Markets', icon: '📊', cost: 1000, level: 0, profit: 126, description: 'Trade on crypto markets', category: 'PR&Team' },
    { id: 2, name: 'CEO', icon: '👔', cost: 2000, level: 0, profit: 250, description: 'Hire a professional CEO', category: 'PR&Team' },
    { id: 3, name: 'Support team', icon: '🎧', cost: 1500, level: 0, profit: 180, description: 'Build customer support', category: 'PR&Team' },
    { id: 4, name: 'Bitcoin', icon: '₿', cost: 5000, level: 0, profit: 500, description: 'Invest in Bitcoin', category: 'Markets' },
    { id: 5, name: 'Ethereum', icon: '◈', cost: 4000, level: 0, profit: 400, description: 'Invest in Ethereum', category: 'Markets' },
    { id: 6, name: 'Hamster YouTube', icon: '📺', cost: 3000, level: 0, profit: 300, description: 'Start YouTube channel', category: 'PR&Team' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyReward, setDailyReward] = useState<DailyReward>({
    canClaim: true,
    timeLeft: 0,
    streak: 0,
    nextReward: 5000
  });
  const [showDailyModal, setShowDailyModal] = useState(false);

  const saveProgress = useCallback(async () => {
    try {
      await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          coins,
          energy,
          max_energy: maxEnergy,
          profit_per_hour: profitPerHour,
          level,
          tap_power: tapPower,
          upgrades,
          tasks: []
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [playerId, coins, energy, maxEnergy, profitPerHour, level, tapPower, upgrades]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(`${LOAD_URL}?player_id=${playerId}`);
        const result = await response.json();
        
        if (result.found && result.data) {
          setCoins(result.data.coins);
          setEnergy(result.data.energy);
          setMaxEnergy(result.data.max_energy);
          setProfitPerHour(result.data.profit_per_hour);
          setLevel(result.data.level);
          setTapPower(result.data.tap_power);
          if (result.data.upgrades && result.data.upgrades.length > 0) {
            setUpgrades(result.data.upgrades);
          }
          
          const lastReward = result.data.last_daily_reward;
          const streak = result.data.daily_streak || 0;
          if (lastReward) {
            const lastRewardTime = new Date(lastReward).getTime();
            const now = Date.now();
            const timeSince = now - lastRewardTime;
            const canClaim = timeSince >= 24 * 60 * 60 * 1000;
            const timeLeft = canClaim ? 0 : 24 * 60 * 60 * 1000 - timeSince;
            
            setDailyReward({
              canClaim,
              timeLeft: Math.max(0, timeLeft),
              streak,
              nextReward: 5000 + Math.min(streak, 6) * 1000
            });
          } else {
            setDailyReward({
              canClaim: true,
              timeLeft: 0,
              streak: 0,
              nextReward: 5000
            });
          }
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgress();
  }, [playerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 3, maxEnergy));
    }, 100);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  useEffect(() => {
    if (!isLoading) {
      const saveInterval = setInterval(() => {
        saveProgress();
      }, 5000);
      return () => clearInterval(saveInterval);
    }
  }, [isLoading, saveProgress]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy >= tapPower) {
      setCoins((prev) => prev + tapPower);
      setEnergy((prev) => prev - tapPower);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newParticle = {
        id: Date.now() + Math.random(),
        x,
        y,
      };

      setParticles((prev) => [...prev, newParticle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1000);
    }
  };



  const dailyTasks = [
    { 
      id: 1, 
      title: 'Daily reward', 
      reward: dailyReward.nextReward, 
      icon: '🎁', 
      completed: !dailyReward.canClaim,
      canClaim: dailyReward.canClaim,
      timeLeft: dailyReward.timeLeft,
      streak: dailyReward.streak
    },
    { id: 2, title: 'Daily cipher', reward: 1000000, icon: '🔐', completed: false },
    { id: 3, title: 'Daily combo', reward: 5000000, icon: '🎯', completed: false },
  ];

  const taskList = [
    { id: 1, title: 'Join our TG channel', reward: 5000, icon: '✈️', completed: false },
    { id: 2, title: 'Follow X (Twitter)', reward: 5000, icon: '🐦', completed: false },
    { id: 3, title: 'Invite 3 friends', reward: 25000, icon: '👥', completed: false },
  ];

  const handleUpgrade = (upgradeId: number) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || coins < upgrade.cost) return;
    
    setCoins(prev => prev - upgrade.cost);
    setProfitPerHour(prev => prev + upgrade.profit);
    setUpgrades(prev => prev.map(u => 
      u.id === upgradeId 
        ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.5) }
        : u
    ));
    saveProgress();
  };

  const handleClaimDaily = async () => {
    if (!dailyReward.canClaim) return;
    
    try {
      const response = await fetch(CLAIM_DAILY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCoins(result.new_coins);
        setDailyReward({
          canClaim: false,
          timeLeft: 24 * 60 * 60 * 1000,
          streak: result.new_streak,
          nextReward: 5000 + Math.min(result.new_streak, 6) * 1000
        });
        setShowDailyModal(false);
      }
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
    }
  };

  useEffect(() => {
    if (dailyReward.timeLeft > 0) {
      const interval = setInterval(() => {
        setDailyReward(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1000),
          canClaim: prev.timeLeft <= 1000
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [dailyReward.timeLeft]);

  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center text-5xl animate-pulse">
            🐹
          </div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container max-w-lg mx-auto">
        {activeTab === 'exchange' && (
          <div className="px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl">
                  🐹
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CEO (lvl {level})</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <Icon name="Settings" size={18} />
              </Button>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Icon name="Coins" className="text-primary" size={32} />
                <h1 className="text-5xl font-bold">{coins.toLocaleString()}</h1>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Icon name="TrendingUp" size={16} />
                <span className="text-sm">Profit per hour: +{profitPerHour.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="relative w-72 h-72 cursor-pointer tap-animation select-none"
                onClick={handleTap}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl pulse-glow" />
                
                <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-8 border-yellow-300/30">
                  <div className="text-9xl filter drop-shadow-2xl">🐹</div>
                </div>

                {particles.map((particle) => (
                  <div
                    key={particle.id}
                    className="absolute coin-particle text-3xl font-bold text-primary pointer-events-none"
                    style={{
                      left: `${particle.x}px`,
                      top: `${particle.y}px`,
                    }}
                  >
                    +{tapPower}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon name="Zap" className="text-primary" size={18} />
                  <span className="font-semibold">{energy} / {maxEnergy}</span>
                </div>
              </div>
              <Progress value={(energy / maxEnergy) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" className="flex flex-col h-auto py-3 gap-1">
                <Icon name="Zap" size={20} />
                <span className="text-xs">Boost</span>
              </Button>
              <Button variant="secondary" className="flex flex-col h-auto py-3 gap-1">
                <Icon name="Users" size={20} />
                <span className="text-xs">Free</span>
              </Button>
              <Button variant="secondary" className="flex flex-col h-auto py-3 gap-1">
                <Icon name="Gift" size={20} />
                <span className="text-xs">Free</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'mine' && (
          <div className="px-4 py-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Mine</h2>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="TrendingUp" size={16} />
                <span>+{profitPerHour}/h</span>
              </div>
            </div>

            <div className="grid gap-2">
              {upgrades.map((upgrade) => (
                <Card key={upgrade.id} className="bg-card border-border p-3 hover:bg-card/80 transition-colors">
                  <button
                    onClick={() => handleUpgrade(upgrade.id)}
                    className="w-full text-left"
                    disabled={coins < upgrade.cost}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        {upgrade.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{upgrade.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Profit per hour</span>
                          <div className="flex items-center gap-1">
                            <Icon name="Coins" size={12} className="text-primary" />
                            <span className="text-xs font-semibold">+{upgrade.profit}</span>
                          </div>
                        </div>
                        {upgrade.level > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">lvl {upgrade.level}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Icon name="Coins" size={16} className="text-primary" />
                          <span className={`font-bold text-sm ${coins >= upgrade.cost ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {upgrade.cost.toLocaleString()}
                          </span>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="px-4 py-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Invite friends!</h2>
              <p className="text-muted-foreground text-sm">You and your friend will receive bonuses</p>
            </div>

            <div className="grid gap-3">
              <Card className="bg-card border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                    🎁
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Invite a friend</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="Coins" size={14} className="text-primary" />
                      <span className="text-sm text-primary font-semibold">+5,000</span>
                      <span className="text-xs text-muted-foreground">for you and your friend</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                    🎖️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Invite with Telegram Premium</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="Coins" size={14} className="text-primary" />
                      <span className="text-sm text-primary font-semibold">+25,000</span>
                      <span className="text-xs text-muted-foreground">for you and your friend</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">List of your friends (0)</h3>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">You haven't invited anyone yet</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Invite a friend
              </Button>
              <Button variant="outline" className="w-full font-semibold">
                Copy link
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'earn' && (
          <div className="px-4 py-6 space-y-6">
            <h2 className="text-2xl font-bold">Earn more coins</h2>

            <div>
              <h3 className="font-semibold mb-3">Daily tasks</h3>
              <div className="grid gap-2">
                {dailyTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="bg-card border-border p-4 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => task.id === 1 && setShowDailyModal(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                        {task.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon name="Coins" size={14} className="text-primary" />
                          <span className="text-sm text-primary font-semibold">+{task.reward.toLocaleString()}</span>
                        </div>
                        {task.id === 1 && task.streak && task.streak > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Streak: {task.streak} days 🔥</p>
                        )}
                        {task.id === 1 && !task.canClaim && task.timeLeft && task.timeLeft > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{formatTimeLeft(task.timeLeft)}</p>
                        )}
                      </div>
                      {task.id === 1 && task.canClaim ? (
                        <Button size="sm" className="bg-primary">Claim</Button>
                      ) : (
                        <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Tasks list</h3>
              <div className="grid gap-2">
                {taskList.map((task) => (
                  <Card key={task.id} className="bg-card border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                        {task.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon name="Coins" size={14} className="text-primary" />
                          <span className="text-sm text-primary font-semibold">+{task.reward.toLocaleString()}</span>
                        </div>
                      </div>
                      <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'airdrop' && (
          <div className="px-4 py-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center text-5xl">
                🪂
              </div>
              <h2 className="text-2xl font-bold">Airdrop Tasks</h2>
              <p className="text-muted-foreground">Complete tasks to participate in the Airdrop</p>
            </div>

            <Card className="bg-card border-border p-6">
              <div className="text-center space-y-4">
                <Icon name="Lock" size={48} className="mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Airdrop tasks will be available soon</p>
              </div>
            </Card>
          </div>
        )}

        {showDailyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-card border-border p-6 max-w-sm w-full space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                  🎁
                </div>
                <h2 className="text-2xl font-bold mb-2">Daily Reward</h2>
                {dailyReward.canClaim ? (
                  <>
                    <p className="text-muted-foreground mb-4">Claim your daily reward!</p>
                    <div className="bg-secondary rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center gap-2">
                        <Icon name="Coins" size={24} className="text-primary" />
                        <span className="text-3xl font-bold">+{dailyReward.nextReward.toLocaleString()}</span>
                      </div>
                      {dailyReward.streak > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Streak: {dailyReward.streak} days 🔥
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setShowDailyModal(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleClaimDaily}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Claim
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">Come back later!</p>
                    <div className="bg-secondary rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground">Next reward in:</p>
                      <p className="text-2xl font-bold mt-1">{formatTimeLeft(dailyReward.timeLeft)}</p>
                      {dailyReward.streak > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Current streak: {dailyReward.streak} days 🔥
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowDailyModal(false)}
                      variant="outline"
                      className="w-full"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="container max-w-lg mx-auto">
            <div className="grid grid-cols-5 h-20">
              <button
                onClick={() => setActiveTab('exchange')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'exchange' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Coins" size={24} />
                <span className="text-xs font-medium">Exchange</span>
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'mine' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Pickaxe" size={24} />
                <span className="text-xs font-medium">Mine</span>
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'friends' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Users" size={24} />
                <span className="text-xs font-medium">Friends</span>
              </button>
              <button
                onClick={() => setActiveTab('earn')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'earn' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="CircleDollarSign" size={24} />
                <span className="text-xs font-medium">Earn</span>
              </button>
              <button
                onClick={() => setActiveTab('airdrop')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'airdrop' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Plane" size={24} />
                <span className="text-xs font-medium">Airdrop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}