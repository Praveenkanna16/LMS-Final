import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Database, Palette, Server } from 'lucide-react';

const paths = [
  {
    icon: Code,
    title: 'Frontend Developer',
    description: 'HTML, CSS, JavaScript, React, TypeScript',
    courses: '12 courses',
    duration: '3 months',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Server,
    title: 'Backend Developer',
    description: 'Node.js, Express, databases, APIs, authentication',
    courses: '15 courses',
    duration: '4 months',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Database,
    title: 'Full-Stack Developer',
    description: 'Complete web development from frontend to backend',
    courses: '24 courses',
    duration: '6 months',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Palette,
    title: 'UI/UX Developer',
    description: 'Design systems, animations, accessibility, user experience',
    courses: '10 courses',
    duration: '2 months',
    gradient: 'from-orange-500 to-red-500',
  },
];

export const LearningPaths = () => {
  return (
    <section className='py-20 px-4 bg-background'>
      <div className='container mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold mb-4'>Choose Your Path</h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Structured learning paths designed to take you from beginner to job-ready developer
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6 max-w-5xl mx-auto'>
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <Card key={index} className='group relative overflow-hidden border-primary/20'>
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${path.gradient}`}
                />

                <CardHeader>
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${path.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className='w-7 h-7 text-white' />
                  </div>
                  <CardTitle className='text-2xl group-hover:text-primary transition-colors'>
                    {path.title}
                  </CardTitle>
                  <CardDescription className='text-base'>{path.description}</CardDescription>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <div className='flex gap-6 text-sm text-muted-foreground'>
                    <div>
                      <span className='font-semibold text-foreground'>{path.courses}</span>
                    </div>
                    <div>
                      <span className='font-semibold text-foreground'>{path.duration}</span> to
                      complete
                    </div>
                  </div>

                  <Button variant='ghost' className='w-full group/btn'>
                    View Path
                    <ArrowRight className='w-4 h-4 group-hover/btn:translate-x-1 transition-transform' />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
