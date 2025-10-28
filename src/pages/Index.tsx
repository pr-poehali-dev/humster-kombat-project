import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface CoinParticle {
  id: number;
  x: number;
  y: number;
}

export default function Index() {
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy] = useState(1000);
  const [level, setLevel] = useState(1);
  const [particles, setParticles] = useState<CoinParticle[]>([]);
  const [tapPower, setTapPower] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, 100);
    return () => clearInterval(interval);
  }, [maxEnergy]);

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

  const upgrades = [
    { id: 1, name: 'Мультитап', cost: 100, level: 0, bonus: '+1 монета за тап' },
    { id: 2, name: 'Энергия', cost: 200, level: 0, bonus: '+500 лимит энергии' },
    { id: 3, name: 'Скорость', cost: 300, level: 0, bonus: 'x2 восстановление' },
  ];

  const tasks = [
    { id: 1, title: 'Первый тап', reward: 50, completed: coins > 0 },
    { id: 2, title: '100 монет', reward: 100, completed: coins >= 100 },
    { id: 3, title: '1000 монет', reward: 500, completed: coins >= 1000 },
  ];

  const leaderboard = [
    { rank: 1, name: 'Игрок1', coins: 15000 },
    { rank: 2, name: 'Игрок2', coins: 12000 },
    { rank: 3, name: 'Игрок3', coins: 10000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1F2C] via-[#2D1B4E] to-[#1A1F2C] text-white">
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#F97316] to-[#D946EF] bg-clip-text text-transparent">
              Hamster Kombat
            </h1>
            <p className="text-sm text-muted-foreground">Уровень {level}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Icon name="Coins" className="text-[#F97316]" size={28} />
              {coins.toLocaleString()}
            </div>
          </div>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsContent value="home" className="space-y-6">
            <Card className="relative bg-gradient-to-br from-[#2D1B4E] to-[#1A1F2C] border-[#8B5CF6] overflow-hidden">
              <div className="p-6">
                <div
                  className="relative flex items-center justify-center h-80 cursor-pointer tap-animation"
                  onClick={handleTap}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/20 to-[#D946EF]/20 rounded-full blur-3xl pulse-glow" />
                  
                  <div className="relative w-64 h-64 bg-gradient-to-br from-[#F97316] to-[#D946EF] rounded-full flex items-center justify-center shadow-2xl shadow-[#8B5CF6]/50">
                    <div className="text-8xl">🐹</div>
                  </div>

                  {particles.map((particle) => (
                    <div
                      key={particle.id}
                      className="absolute coin-particle text-2xl font-bold text-[#F97316] pointer-events-none"
                      style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                      }}
                    >
                      +{tapPower}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Zap" className="text-[#F97316]" size={16} />
                      <span className="font-semibold">{energy} / {maxEnergy}</span>
                    </div>
                    <span className="text-muted-foreground">Энергия</span>
                  </div>
                  <Progress value={(energy / maxEnergy) * 100} className="h-3" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="upgrade" className="space-y-4">
            <h2 className="text-2xl font-bold">Прокачка</h2>
            {upgrades.map((upgrade) => (
              <Card key={upgrade.id} className="bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{upgrade.name}</h3>
                    <p className="text-sm text-muted-foreground">{upgrade.bonus}</p>
                    <p className="text-xs text-muted-foreground mt-1">Уровень {upgrade.level}</p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-[#F97316] to-[#D946EF]"
                    disabled={coins < upgrade.cost}
                  >
                    <Icon name="Coins" size={16} className="mr-1" />
                    {upgrade.cost}
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <h2 className="text-2xl font-bold">Задания</h2>
            {tasks.map((task) => (
              <Card key={task.id} className="bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      task.completed ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {task.completed && <Icon name="Check" size={16} />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">+{task.reward} монет</p>
                    </div>
                  </div>
                  {task.completed && (
                    <Button size="sm" className="bg-[#8B5CF6]">Забрать</Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <h2 className="text-2xl font-bold">Лидерборд</h2>
            {leaderboard.map((player) => (
              <Card key={player.rank} className="bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      player.rank === 1 ? 'bg-[#F97316]' : player.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">{player.coins.toLocaleString()} монет</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="shop" className="space-y-4">
            <h2 className="text-2xl font-bold">Магазин</h2>
            <Card className="bg-card border-border p-4">
              <div className="text-center py-8">
                <Icon name="ShoppingBag" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Скоро здесь появятся крутые товары!</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <h2 className="text-2xl font-bold">Профиль</h2>
            <Card className="bg-card border-border p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#F97316] to-[#D946EF] rounded-full mx-auto mb-4 flex items-center justify-center text-5xl">
                  🐹
                </div>
                <h3 className="text-xl font-bold mb-2">Игрок</h3>
                <p className="text-muted-foreground mb-6">Уровень {level}</p>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-muted-foreground">Всего монет</p>
                    <p className="text-2xl font-bold">{coins.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Энергия</p>
                    <p className="text-2xl font-bold">{energy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Сила тапа</p>
                    <p className="text-2xl font-bold">{tapPower}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Уровень</p>
                    <p className="text-2xl font-bold">{level}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur-sm fixed bottom-0 left-0 right-0 h-16 rounded-none border-t border-border">
            <TabsTrigger value="home" className="flex flex-col gap-1">
              <Icon name="Home" size={20} />
              <span className="text-xs">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="flex flex-col gap-1">
              <Icon name="TrendingUp" size={20} />
              <span className="text-xs">Прокачка</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex flex-col gap-1">
              <Icon name="ListChecks" size={20} />
              <span className="text-xs">Задания</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex flex-col gap-1">
              <Icon name="Trophy" size={20} />
              <span className="text-xs">Топ</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex flex-col gap-1">
              <Icon name="ShoppingBag" size={20} />
              <span className="text-xs">Магазин</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col gap-1">
              <Icon name="User" size={20} />
              <span className="text-xs">Профиль</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
