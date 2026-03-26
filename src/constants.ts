import { ShieldCheck, Zap, Eye, Sparkles } from 'lucide-react';

export const ABILITIES = [
  {
    id: 'streak-shield',
    name: 'Streak Shield',
    description: 'Protects your streak for 24 hours if you miss a day.',
    cost: 150,
    icon: ShieldCheck,
    color: 'text-blue-500 bg-blue-50',
  },
  {
    id: 'double-blessing',
    name: 'Double Blessing',
    description: 'Double XP for the next 3 lessons you complete.',
    cost: 250,
    icon: Zap,
    color: 'text-yellow-500 bg-yellow-50',
  },
  {
    id: 'prophetic-vision',
    name: 'Prophetic Vision',
    description: 'Reveals the correct answer for one difficult question.',
    cost: 100,
    icon: Eye,
    color: 'text-purple-500 bg-purple-50',
  },
  {
    id: 'instant-manna',
    name: 'Instant Manna',
    description: 'Instantly gain 50 XP to boost your level.',
    cost: 200,
    icon: Sparkles,
    color: 'text-primary-500 bg-primary-50',
  },
];
