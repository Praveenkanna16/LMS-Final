import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Zap, Trophy, GitBranch, Users2, BookOpen } from 'lucide-react';
import codeEditorImage from '@/assets/code-editor-preview.jpg';

const features = [
  {
    icon: Code2,
    title: 'Interactive Code Editor',
    description: 'Practice coding in a real browser-based IDE with instant feedback and execution',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Get real-time code analysis and automated tests to validate your solutions',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    description: 'Earn XP, badges, and climb leaderboards as you master new skills',
  },
  {
    icon: GitBranch,
    title: 'Real-World Projects',
    description: 'Build production-ready applications with version control and code reviews',
  },
  {
    icon: Users2,
    title: 'Community Support',
    description: 'Connect with peers, join study groups, and learn from expert mentors',
  },
  {
    icon: BookOpen,
    title: 'Personalized Paths',
    description: 'AI-powered recommendations tailored to your skill level and career goals',
  },
];

export const Features = () => {
  return (
    <section className='py-20 px-4 bg-secondary/30'>
      <div className='container mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold mb-4'>Learn By Doing</h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Our platform combines the best learning methodologies with cutting-edge technology
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className='border-primary/20'>
                <CardHeader>
                  <div className='w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4'>
                    <Icon className='w-6 h-6 text-primary-foreground' />
                  </div>
                  <CardTitle className='text-xl'>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Code editor showcase */}
        <Card className='overflow-hidden border-primary/30 bg-gradient-to-br from-card to-card/50'>
          <div className='grid md:grid-cols-2 gap-8 p-8'>
            <div className='flex flex-col justify-center space-y-4'>
              <h3 className='text-3xl font-bold'>Code in Your Browser</h3>
              <p className='text-muted-foreground'>
                No setup required. Write, test, and deploy code directly in our powerful
                browser-based IDE. Get instant feedback, automated tests, and real-time
                collaboration.
              </p>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-accent' />
                  <span>Syntax highlighting & IntelliSense</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-accent' />
                  <span>Integrated terminal & debugging</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-accent' />
                  <span>Live preview & hot reload</span>
                </li>
              </ul>
            </div>

            <div className='relative rounded-lg overflow-hidden border border-primary/20'>
              <img
                src={codeEditorImage}
                alt='Code editor interface'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-background/80 to-transparent' />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
